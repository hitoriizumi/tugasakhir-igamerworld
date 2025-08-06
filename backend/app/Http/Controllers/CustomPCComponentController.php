<?php

namespace App\Http\Controllers;

use App\Models\CustomPCComponent;
use App\Models\CustomPCOrder;
use App\Models\Product;
use Illuminate\Http\Request;

class CustomPCComponentController extends Controller
{
    private function authorizeCustomer()
    {
        if (auth()->user()->role_id !== 3) {
            abort(403, 'Hanya pelanggan yang dapat mengakses fitur ini.');
        }
    }

    // Simpan komponen rakitan dan update total order
    public function store(Request $request, $customPcOrderId)
    {
        $this->authorizeCustomer();

        $customOrder = CustomPCOrder::with('order')->findOrFail($customPcOrderId);
        $order = $customOrder->order;
        $user = auth()->user();

        if ($order->user_id !== $user->id) {
            abort(403, 'Anda tidak memiliki akses ke pesanan ini.');
        }

        $validated = $request->validate([
            'components' => 'required|array|min:1',
            'components.*.product_id' => 'required|exists:products,id',
            'components.*.quantity' => 'required|integer|min:1',
            'components.*.component_type' => 'required|string'
        ]);

        $requiredTypes = ['motherboard', 'processor', 'ram', 'storage', 'psu'];
        $selectedTypes = collect($validated['components'])->pluck('component_type')->unique();

        foreach ($requiredTypes as $type) {
            if (!$selectedTypes->contains($type)) {
                return response()->json([
                    'message' => "Komponen wajib belum lengkap: $type belum dipilih."
                ], 422);
            }
        }

        $componentData = [];
        $componentIds = [];

        $totalProductPrice = 0;

        foreach ($validated['components'] as $comp) {
            $product = Product::with('subcategory.category')->findOrFail($comp['product_id']);

            if (optional($product->subcategory->category)->name !== 'Komponen') {
                return response()->json([
                    'message' => "Produk {$product->name} bukan termasuk kategori Komponen."
                ], 422);
            }

            $subtotal = $product->price * $comp['quantity'];
            $totalProductPrice += $subtotal;

            $componentData[] = [
                'product_id' => $product->id,
                'quantity' => $comp['quantity'],
                'component_type' => $comp['component_type']
            ];
            $componentIds[] = $product->id;
        }

        // Validasi kompatibilitas antar komponen
        foreach ($componentIds as $i => $idA) {
            foreach ($componentIds as $j => $idB) {
                if ($i !== $j) {
                    $isCompatible = \App\Models\ProductCompatibility::where('product_id', $idA)
                        ->where('compatible_product_id', $idB)
                        ->exists();

                    if (!$isCompatible) {
                        return response()->json([
                            'message' => "Produk ID $idA dan $idB tidak kompatibel."
                        ], 422);
                    }
                }
            }
        }

        // Hapus data lama
        $customOrder->components()->delete();

        // Simpan baru
        foreach ($componentData as $component) {
            CustomPCComponent::create([
                'custom_pc_order_id' => $customPcOrderId,
                'product_id' => $component['product_id'],
                'quantity' => $component['quantity'],
                'component_type' => $component['component_type'],
            ]);
        }

        // Update total
        $buildFee = $customOrder->build_by_store ? $customOrder->build_fee : 0;
        $order->update([
            'total_price' => $totalProductPrice + $buildFee
        ]);

        return response()->json([
            'message' => 'Komponen rakitan berhasil disimpan dan total pesanan diperbarui.',
            'total_price' => $order->total_price
        ]);
    }

    // ✅ Lihat komponen rakitan
    public function show($customPcOrderId)
    {
        $customOrder = CustomPCOrder::with('components.product.subcategory.category')->findOrFail($customPcOrderId);

        return response()->json([
            'data' => $customOrder->components
        ]);
    }
}
