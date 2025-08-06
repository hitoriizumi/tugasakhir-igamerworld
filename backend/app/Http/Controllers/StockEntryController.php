<?php

namespace App\Http\Controllers;

use App\Models\StockEntry;
use App\Models\Product;
use Illuminate\Http\Request;

class StockEntryController extends Controller
{
    // 🔐 Hanya admin & superadmin yang boleh
    private function authorizeAdminOrSuperadmin()
    {
        $user = auth()->user();
        if (!in_array($user->role_id, [1, 2])) {
            abort(403, 'Hanya admin atau superadmin yang dapat mengakses fitur ini.');
        }
    }

    // 📄 Menampilkan daftar histori stok untuk 1 produk
    public function index($product_id)
    {
        $this->authorizeAdminOrSuperadmin();

        $entries = StockEntry::with('user')
            ->where('product_id', $product_id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['data' => $entries]);
    }

    // 📝 Menambahkan entri stok (masuk atau keluar)
    public function store(Request $request)
    {
        $this->authorizeAdminOrSuperadmin();

        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'type' => 'required|in:in,out',
            'quantity' => 'required|integer|min:1',
            'note' => 'nullable|string',
        ]);

        $product = Product::findOrFail($validated['product_id']);
        $currentStock = $product->stock;
        $newStock = $currentStock;

        if ($validated['type'] === 'in') {
            $newStock += $validated['quantity'];
        } else {
            if ($validated['quantity'] > $currentStock) {
                return response()->json([
                    'message' => 'Stok tidak cukup untuk pengurangan ini.'
                ], 422);
            }
            $newStock -= $validated['quantity'];
        }

        // Simpan histori
        $entry = StockEntry::create([
            'product_id' => $validated['product_id'],
            'user_id' => auth()->id(),
            'type' => $validated['type'],
            'quantity' => $validated['quantity'],
            'note' => $validated['note'] ?? null,
        ]);

        // Update produk
        $product->stock = $newStock;
        // if ($newStock > 0) {
        //     $product->status_stock = 'ready_stock';
        // } elseif ($product->status_stock !== 'pre_order') {
        //     $product->status_stock = 'out_of_stock';
        // }
        // Update status_stock secara eksplisit
        if ($newStock > 0) {
            $product->status_stock = 'ready_stock';
        } elseif ($product->status_stock === 'ready_stock') {
            $product->status_stock = 'out_of_stock';
        }
        $product->save();

        return response()->json([
            'message' => 'Stok berhasil diperbarui.',
            'entry' => $entry,
            'product' => $product,
        ]);
    }

    public function destroy($id)
    {
        $this->authorizeAdminOrSuperadmin();

        $entry = StockEntry::findOrFail($id);
        $product = Product::findOrFail($entry->product_id);

        // Hitung ulang stok
        if ($entry->type === 'in') {
            $product->stock -= $entry->quantity;
        } else {
            $product->stock += $entry->quantity;
        }

        // Pastikan stok tidak negatif
        if ($product->stock < 0) {
            $product->stock = 0;
        }

        // Update status stok
        // if ($product->stock > 0) {
        //     $product->status_stock = 'ready_stock';
        // } elseif ($product->status_stock !== 'pre_order') {
        //     $product->status_stock = 'out_of_stock';
        // }
        if ($product->stock > 0) {
            $product->status_stock = 'ready_stock';
        } elseif ($product->status_stock === 'ready_stock') {
            $product->status_stock = 'out_of_stock';
        }

        $product->save();
        $entry->delete();

        return response()->json(['message' => 'Entri stok berhasil dihapus dan stok produk diperbarui.']);
    }
}
