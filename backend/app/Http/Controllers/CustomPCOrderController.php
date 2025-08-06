<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\CustomPCOrder;
use App\Models\CustomPCComponent;
use App\Models\Product;
use App\Models\OrderDelivery;
use App\Models\OrderNote;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use App\Models\Notification;
use App\Models\User;

class CustomPCOrderController extends Controller
{
    private function authorizeCustomer()
    {
        if (auth()->user()->role_id !== 3) {
            abort(403, 'Hanya pelanggan yang dapat melakukan aksi ini.');
        }
    }

    // ✅ Checkout perakitan PC oleh pelanggan
    public function store(Request $request)
    {
        $this->authorizeCustomer();

        $request->validate([
            'shipping_address_id' => $request->pickup_method === 'kirim' ? 'required|exists:shipping_addresses,id' : 'nullable',
            'courier_id' => $request->pickup_method === 'kirim' ? 'required|exists:couriers,id' : 'nullable',
            'payment_method_id' => 'required|exists:payment_methods,id',
            'components' => 'required|array|min:1',
            'components.*.product_id' => 'required|exists:products,id',
            'components.*.quantity' => 'required|integer|min:1',
            'build_by_store' => 'required|boolean',
            'pickup_method' => 'required|in:ambil,kirim',
            'note' => 'nullable|string'
        ]);

        $user = auth()->user();

        DB::beginTransaction();

        try {
            $totalPrice = 0;
            $buildFee = $request->build_by_store ? 150000 : 0;

            $productIds = collect($request->components)->pluck('product_id');
            $products = Product::with('subcategory.category')->whereIn('id', $productIds)->get();

            if ($products->count() !== count($productIds)) {
                throw new \Exception("Beberapa produk tidak ditemukan.");
            }

            // ✅ Validasi komponen wajib
            $requiredSubcategories = [
                'Motherboard',
                'Processor',
                'RAM',
                'Storage (SSD / HDD)',
                'PSU',
                'Casing'

            ];
            $selectedSubcategories = $products->pluck('subcategory.name')->unique();

            foreach ($requiredSubcategories as $required) {
                if (!$selectedSubcategories->contains($required)) {
                    throw new \Exception("Komponen wajib \"$required\" belum dipilih.");
                }
            }

            // ✅ Validasi VGA jika CPU tidak punya iGPU
            $processor = $products->firstWhere('subcategory.name', 'Processor');
            $hasIGPU = $processor && $processor->has_igpu;

            if (!$hasIGPU) {
                $hasGPU = $products->contains(fn($p) => $p->subcategory->name === 'GPU');
                if (!$hasGPU) {
                    throw new \Exception("GPU wajib dipilih karena processor tidak memiliki grafik bawaan.");
                }
            }

            // ✅ Validasi kategori, stok, dan harga
            foreach ($request->components as $item) {
                $product = $products->firstWhere('id', $item['product_id']);

                if ($product->subcategory->category->name !== 'Komponen') {
                    throw new \Exception("Produk {$product->name} bukan bagian dari kategori Komponen.");
                }

                if ($product->status_stock === 'out_of_stock') {
                    throw new \Exception("Produk {$product->name} sedang habis.");
                }

                if ($product->status_stock === 'ready_stock' && $product->stock < $item['quantity']) {
                    throw new \Exception("Stok produk {$product->name} tidak mencukupi.");
                }

                $totalPrice += $product->price * $item['quantity'];
            }

            // ✅ Validasi kompatibilitas antar semua produk
            $productIdArray = $productIds->values()->all();
            $compatibilities = DB::table('product_compatibilities')
                ->whereIn('product_id', $productIdArray)
                ->orWhereIn('compatible_with_id', $productIdArray)
                ->get();

            for ($i = 0; $i < count($productIdArray); $i++) {
                for ($j = $i + 1; $j < count($productIdArray); $j++) {
                    $id1 = $productIdArray[$i];
                    $id2 = $productIdArray[$j];

                    $match = $compatibilities->first(fn ($row) =>
                        ($row->product_id == $id1 && $row->compatible_with_id == $id2) ||
                        ($row->product_id == $id2 && $row->compatible_with_id == $id1)
                    );

                    if (!$match) {
                        $name1 = $products->firstWhere('id', $id1)?->name ?? "Produk ID $id1";
                        $name2 = $products->firstWhere('id', $id2)?->name ?? "Produk ID $id2";

                        throw new \Exception("Produk \"$name1\" tidak kompatibel dengan \"$name2\".");
                    }
                }
            }

            // ✅ Total harga + build fee
            $totalPrice += $buildFee;

            $order = Order::create([
                'user_id' => $user->id,
                'shipping_address_id' => $request->pickup_method === 'kirim' ? $request->shipping_address_id : null,
                'courier_id' => $request->courier_id,
                'payment_method_id' => $request->payment_method_id,
                'invoice_number' => 'INV/' . date('Ymd') . '/' . strtoupper(Str::random(6)),
                'total_price' => $totalPrice,
                'order_type' => 'custom_pc',
                'order_status' => 'menunggu_verifikasi',
                'payment_status' => 'belum_bayar',
                'pickup_method' => $request->pickup_method,
            ]);

            $customOrder = CustomPCOrder::create([
                'order_id' => $order->id,
                'build_by_store' => $request->build_by_store,
                'build_fee' => $buildFee,
            ]);

            foreach ($request->components as $item) {
                CustomPCComponent::create([
                    'custom_pc_order_id' => $customOrder->id,
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                ]);

                $product = $products->firstWhere('id', $item['product_id']);
                if ($product->status_stock === 'ready_stock') {
                    $product->decrement('stock', $item['quantity']);
                }
            }

            OrderDelivery::create([
                'order_id' => $order->id,
                'pickup_method' => $request->pickup_method,
            ]);

            if (!empty($request->note)) {
                OrderNote::create([
                    'order_id' => $order->id,
                    'user_id' => $user->id,
                    'note' => $request->note,
                ]);
            }

            // ✅ Kirim notifikasi ke semua admin
            $admins = User::where('role_id', 2)->get();

            foreach ($admins as $admin) {
                Notification::create([
                    'user_id' => $admin->id,
                    'order_id' => $order->id,
                    'message' => 'Pesanan rakitan PC baru dari ' . $user->name . ' telah masuk.',
                    'link_to' => '/admin/orders/custom/' . $order->id,
                ]);
            }

            DB::commit();

            return response()->json([
                'message' => 'Checkout perakitan PC berhasil.',
                'order_id' => $order->id,
                'invoice_number' => $order->invoice_number,
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Checkout gagal.',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
