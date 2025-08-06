<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\ProductCompatibility;
use Illuminate\Http\Request;

class ProductCompatibilityController extends Controller
{
    /**
     * Menampilkan semua produk yang kompatibel dengan produk tertentu
     */
    public function index($product_id)
    {
        $this->authorizeAdmin();

        $product = Product::with([
            'compatibilities.brand',
            'compatibilities.subcategory.category'
        ])->findOrFail($product_id);

        return response()->json(['data' => $product->compatibilities]);
    }

    /**
     * Simpan relasi kompatibilitas dua arah
     */
    public function store(Request $request)
    {
        $this->authorizeAdmin();

        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'compatible_ids' => 'nullable|array',
            'compatible_ids.*' => 'exists:products,id|different:product_id',
        ]);

        $product = Product::with('subcategory.category')->findOrFail($validated['product_id']);

        // Validasi produk utama harus kategori Komponen
        if (strtolower($product->subcategory->category->name) !== 'komponen') {
            return response()->json([
                'message' => 'Hanya produk dalam kategori Komponen yang bisa memiliki kompatibilitas.'
            ], 422);
        }

        // Validasi produk kompatibel juga harus kategori Komponen
        foreach ($validated['compatible_ids'] ?? [] as $compatibleId) {
            $compatibleProduct = Product::with('subcategory.category')->find($compatibleId);
            if (
                !$compatibleProduct ||
                strtolower($compatibleProduct->subcategory->category->name) !== 'komponen'
            ) {
                return response()->json([
                    'message' => 'Semua produk kompatibel harus dari kategori Komponen.'
                ], 422);
            }
        }

        // Hapus semua relasi lama (dua arah)
        $oldIds = ProductCompatibility::where('product_id', $product->id)->pluck('compatible_with_id');
        foreach ($oldIds as $oldId) {
            ProductCompatibility::where([
                ['product_id', $product->id],
                ['compatible_with_id', $oldId]
            ])->delete();

            ProductCompatibility::where([
                ['product_id', $oldId],
                ['compatible_with_id', $product->id]
            ])->delete();
        }

        // Simpan relasi baru dua arah
        foreach ($validated['compatible_ids'] ?? [] as $compatibleId) {
            ProductCompatibility::firstOrCreate([
                'product_id' => $product->id,
                'compatible_with_id' => $compatibleId
            ]);

            ProductCompatibility::firstOrCreate([
                'product_id' => $compatibleId,
                'compatible_with_id' => $product->id
            ]);
        }

        return response()->json([
            'message' => 'Kompatibilitas dua arah berhasil diperbarui.',
            'data' => $product->compatibilities()->with(['brand', 'subcategory.category'])->get()
        ]);
    }

    /**
     * Hapus satu relasi kompatibilitas dua arah
     */
    public function destroy(Request $request)
    {
        $this->authorizeAdmin();

        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'compatible_id' => 'required|exists:products,id|different:product_id',
        ]);

        $product = Product::with('subcategory.category')->findOrFail($validated['product_id']);

        // Validasi kategori Komponen
        if (strtolower($product->subcategory->category->name) !== 'komponen') {
            return response()->json([
                'message' => 'Hanya produk dari kategori Komponen yang dapat menghapus kompatibilitas.'
            ], 422);
        }

        // Hapus dua arah
        ProductCompatibility::where([
            ['product_id', $validated['product_id']],
            ['compatible_with_id', $validated['compatible_id']]
        ])->delete();

        ProductCompatibility::where([
            ['product_id', $validated['compatible_id']],
            ['compatible_with_id', $validated['product_id']]
        ])->delete();

        return response()->json(['message' => 'Kompatibilitas dua arah berhasil dihapus.']);
    }

    /**
     * Validasi role admin
     */
    private function authorizeAdmin()
    {
        if (!auth()->check() || auth()->user()->role_id !== 2) {
            abort(403, 'Hanya admin yang dapat mengakses fitur ini.');
        }
    }

    public function publicIndex($product_id)
    {
        $product = Product::with([
            'compatibilities.brand',
            'compatibilities.subcategory.category'
        ])->findOrFail($product_id);

        return response()->json(['data' => $product->compatibilities]);
    }

    public function publicAll()
    {
        $data = \DB::table('product_compatibilities')->select('product_id', 'compatible_with_id')->get();
        return response()->json(['data' => $data]);
    }

    
}
