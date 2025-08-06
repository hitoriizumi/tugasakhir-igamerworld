<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderNote;
use App\Models\Product;
use App\Models\Cart;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use App\Models\OrderDelivery;
use App\Models\Notification;
use App\Http\Controllers\NotificationController;

class OrderController extends Controller
{
    // Role validasi hanya untuk pelanggan
    private function authorizeCustomer()
    {
        if (auth()->user()->role_id !== 3) {
            abort(403, 'Hanya pelanggan yang dapat mengakses fitur ini.');
        }
    }

    // Role validasi hanya untuk admin & superadmin (view only untuk superadmin)
    private function authorizeAdminOrSuperadmin()
    {
        if (!in_array(auth()->user()->role_id, [1, 2])) {
            abort(403, 'Hanya admin atau superadmin yang dapat mengakses fitur ini.');
        }
    }

    private function authorizeAdmin()
    {
        $user = auth()->user();
        if (!$user || $user->role_id !== 2) {
            abort(403, 'Hanya admin yang dapat mengakses fitur ini.');
        }
    }

    // Checkout Produk Biasa
    public function checkout(Request $request)
    {
        $this->authorizeCustomer();

        $validated = $request->validate([
            'shipping_address_id' => 'required|exists:shipping_addresses,id',
            'courier_id' => 'required|exists:couriers,id',
            'payment_method_id' => 'required|exists:payment_methods,id',
            'note' => 'nullable|string',
            'cart_ids' => 'required|array|min:1',
            'cart_ids.*' => 'exists:carts,id',
        ]);

        DB::beginTransaction();

        try {
            $user = auth()->user();
            $carts = Cart::whereIn('id', $validated['cart_ids'])
                        ->where('user_id', $user->id)
                        ->with('product')
                        ->get();

            if ($carts->isEmpty()) {
                return response()->json(['message' => 'Keranjang kosong atau tidak valid.'], 422);
            }

            $total = 0;
            foreach ($carts as $cart) {
                $product = $cart->product;

                if (!$product) {
                    throw new \Exception("Produk tidak ditemukan.");
                }

                if ($product->status_stock === 'out_of_stock') {
                    throw new \Exception("Produk {$product->name} sedang habis dan tidak dapat dipesan.");
                }

                if ($product->status_stock === 'ready_stock' && $product->stock < $cart->quantity) {
                    throw new \Exception("Stok produk {$product->name} tidak mencukupi.");
                }

                $total += $product->price * $cart->quantity;
            }

            $order = Order::create([
                'user_id' => $user->id,
                'shipping_address_id' => $validated['shipping_address_id'],
                'courier_id' => $validated['courier_id'],
                'payment_method_id' => $validated['payment_method_id'],
                'order_type' => 'product',
                'invoice_number' => 'INV/' . date('Ymd') . '/' . strtoupper(Str::random(6)),
                'total_price' => $total,
                'order_status' => 'menunggu_verifikasi',
                'payment_status' => 'belum_bayar',
            ]);

            OrderDelivery::create([
                'order_id' => $order->id,
                'pickup_method' => 'kirim', // default untuk produk biasa
            ]);

            foreach ($carts as $cart) {
                $product = $cart->product;

                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $product->id,
                    'quantity' => $cart->quantity,
                    'price' => $product->price,
                    'subtotal' => $product->price * $cart->quantity,
                ]);

                $product->decrement('stock', $cart->quantity);
            }

            if (!empty($validated['note'])) {
                OrderNote::create([
                    'order_id' => $order->id,
                    'user_id' => $user->id,
                    'note' => $validated['note'],
                ]);
            }

            Cart::whereIn('id', $validated['cart_ids'])->delete();

            $admins = \App\Models\User::where('role_id', 2)->get();

            foreach ($admins as $admin) {
                Notification::create([
                    'user_id' => $admin->id,
                    'order_id' => $order->id,
                    'message' => 'Pesanan baru dari ' . $user->name . ' telah masuk.',
                    'link_to' => NotificationController::generateFrontendLink('order_product_detail', 'admin', $order->id),
                ]);
            }

            DB::commit();
            return response()->json(['message' => 'Checkout berhasil.', 'data' => $order], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Checkout gagal.', 'error' => $e->getMessage()], 500);
        }
    }

    // CUSTOMER
    // Produk Biasa
    public function indexByCustomerProduct()
    {
        $this->authorizeCustomer();

        $orders = Order::with(['orderItems.product', 'courier', 'paymentMethod', 'shippingAddress', 'orderNotes.user', 'orderDelivery',])
            ->where('user_id', auth()->id())
            ->where('order_type', 'product')
            ->orderByDesc('created_at')
            ->get();

        return response()->json(['data' => $orders]);
    }

    public function showByCustomerProduct($id)
    {
    $this->authorizeCustomer();

    $order = Order::with(['orderItems.product', 'courier', 'paymentMethod', 'shippingAddress', 'orderNotes.user', 'orderDelivery'])
        ->where('id', $id)
        ->where('user_id', auth()->id())
        ->where('order_type', 'product')
        ->first();

    if (!$order) {
        return response()->json(['message' => 'Pesanan tidak ditemukan.'], 404);
    }

    return response()->json(['data' => $order]);
    }

    // Perakitan PC
    public function indexByCustomerCustomPC()
    {
        $this->authorizeCustomer();

        $orders = Order::with([
            'customPCOrder.custom_pc_components.product',
            'courier',
            'paymentMethod',
            'shippingAddress',
            'orderNotes.user',
            'orderDelivery'
        ])
        ->where('user_id', auth()->id())
        ->where('order_type', 'custom_pc')
        ->orderByDesc('created_at')
        ->get();

        return response()->json(['data' => $orders]);
    }

    // 🔍 Pelanggan: Detail pesanan perakitan PC
    public function showByCustomerCustomPC($id)
    {
        $this->authorizeCustomer();

        $order = Order::with([
            'customPCOrder.custom_pc_components.product',
            'courier',
            'paymentMethod',
            'shippingAddress',
            'orderNotes.user',
            'orderDelivery'
        ])
        ->where('id', $id)
        ->where('user_id', auth()->id())
        ->where('order_type', 'custom_pc')
        ->first();

        if (!$order) {
            return response()->json(['message' => 'Pesanan tidak ditemukan.'], 404);
        }

        return response()->json(['data' => $order]);
    }

    // ADMIN DAN SUPERADMIN
    // Produk Biasa
    public function indexForAdminProduct()
    {
        $this->authorizeAdminOrSuperadmin();

        $orders = Order::with(['user', 'orderItems.product', 'courier', 'paymentMethod', 'shippingAddress', 'orderNotes.user', 'orderDelivery'])
            ->where('order_type', 'product')
            ->orderByDesc('created_at')
            ->get();

        return response()->json(['data' => $orders]);
    }

    public function showForAdminProduct($id)
    {
        $this->authorizeAdminOrSuperadmin();

        $order = Order::with(['user', 'orderItems.product', 'courier', 'paymentMethod', 'shippingAddress', 'orderNotes.user', 'orderDelivery'])
            ->where('id', $id)
            ->where('order_type', 'product')
            ->first();

        if (!$order) {
            return response()->json(['message' => 'Pesanan tidak ditemukan.'], 404);
        }

        return response()->json(['data' => $order]);
    }

    // Perakitan PC
    public function indexForAdminCustomPC()
    {
        $this->authorizeAdminOrSuperadmin();

        $orders = Order::with([
            'user',
            'customPCOrder.custom_pc_components.product',
            'courier',
            'paymentMethod',
            'shippingAddress',
            'orderNotes.user',
            'orderDelivery'
        ])
        ->where('order_type', 'custom_pc')
        ->orderByDesc('created_at')
        ->get();

        return response()->json(['data' => $orders]);
    }

    // 🔍 Admin/Superadmin: Detail pesanan perakitan PC
    public function showForAdminCustomPC($id)
    {
        $this->authorizeAdminOrSuperadmin();

        $order = Order::with([
            'user',
            'customPCOrder.custom_pc_components.product',
            'courier',
            'paymentMethod',
            'shippingAddress',
            'orderNotes.user',
            'orderDelivery'
        ])
        ->where('id', $id)
        ->where('order_type', 'custom_pc')
        ->first();

        if (!$order) {
            return response()->json(['message' => 'Pesanan tidak ditemukan.'], 404);
        }

        return response()->json(['data' => $order]);
    }

    public function updateStatus(Request $request, $id)
    {
        $this->authorizeAdmin();

        $validated = $request->validate([
            'status' => 'required|in:menunggu_pembayaran,dibatalkan',
            'shipping_cost' => 'nullable|numeric|min:0',
            'note' => 'nullable|string'
        ]);

        $order = Order::with([
            'orderDelivery',
            'orderItems',
            'customPCOrder.custom_pc_components.product'
        ])->findOrFail($id);

        $update = ['order_status' => $validated['status']];

        if (isset($validated['shipping_cost'])) {
            $delivery = $order->orderDelivery;
            if ($delivery) {
                $delivery->shipping_cost = $validated['shipping_cost'];
                $delivery->save();
            }

            // Hitung ulang total price
            $subtotal = 0;

            if ($order->order_type === 'product') {
                $subtotal = $order->orderItems->sum('subtotal');
            } elseif ($order->order_type === 'custom_pc') {
                foreach ($order->customPCOrder->custom_pc_components as $component) {
                    $subtotal += $component->product->price * $component->quantity;
                }

                // Tambahkan biaya rakit (jika ada)
                $subtotal += $order->customPCOrder->build_fee ?? 0;
            }

            $update['total_price'] = $subtotal + $validated['shipping_cost'];
        }

        $order->update($update);

        if ($validated['status'] === 'menunggu_pembayaran') {
            Notification::create([
                'user_id' => $order->user_id,
                'order_id' => $order->id,
                'message' => 'Pesanan kamu telah disetujui oleh admin dan menunggu pembayaran.',
                'link_to' => NotificationController::generateFrontendLink('payment_product', 'customer', $order->id),
            ]);
        }

        if (!empty($validated['note'])) {
            OrderNote::create([
                'order_id' => $order->id,
                'user_id' => auth()->id(),
                'note' => $validated['note']
            ]);
        }

        return response()->json(['message' => 'Status pesanan berhasil diperbarui.']);
    }

    public function cancelOrder(Request $request, $id)
    {
        $this->authorizeCustomer();

        $request->validate([
            'note' => 'nullable|string|max:1000',
        ]);

        $order = Order::where('id', $id)
            ->where('user_id', auth()->id())
            ->first();

        if (!$order) {
            return response()->json(['message' => 'Pesanan tidak ditemukan.'], 404);
        }

        if (!in_array($order->order_status, ['menunggu_verifikasi', 'menunggu_pembayaran'])) {
            return response()->json(['message' => 'Pesanan tidak bisa dibatalkan pada status ini.'], 422);
        }

        $order->order_status = 'dibatalkan';
        $order->save();

        $admins = \App\Models\User::where('role_id', 2)->get();
        $customer = auth()->user();

        foreach ($admins as $admin) {
            Notification::create([
                'user_id' => $admin->id,
                'order_id' => $order->id,
                'message' => 'Pelanggan ' . $customer->name . ' membatalkan pesanan #' . $order->invoice_number . '.',
                'link_to' => NotificationController::generateFrontendLink('order_product_detail', 'admin', $order->id),
            ]);
        }

        if ($request->filled('note')) {
            OrderNote::create([
                'order_id' => $order->id,
                'user_id' => auth()->id(),
                'note' => $request->note,
            ]);
        }

        return response()->json(['message' => 'Pesanan berhasil dibatalkan.']);
    }

    public function approveAllPendingProductOrders()
    {
        $this->authorizeAdmin(); // hanya admin bisa akses

        DB::beginTransaction();

        try {
            $orders = Order::where('order_status', 'menunggu_verifikasi')
                ->where('order_type', 'product')
                ->get();

            if ($orders->isEmpty()) {
                return response()->json(['message' => 'Tidak ada pesanan produk yang menunggu verifikasi.'], 200);
            }

            foreach ($orders as $order) {
                $order->order_status = 'menunggu_pembayaran';
                $order->save();

                Notification::create([
                    'user_id' => $order->user_id,
                    'order_id' => $order->id,
                    'message' => 'Pesanan kamu telah disetujui oleh admin dan menunggu pembayaran.',
                    'link_to' => NotificationController::generateFrontendLink('payment_product', 'customer', $order->id),
                ]);
            }

            DB::commit();
            return response()->json(['message' => 'Semua pesanan produk berhasil disetujui.'], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Terjadi kesalahan saat menyetujui pesanan.', 'error' => $e->getMessage()], 500);
        }
    }

}
