<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\ProductImage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ProductImageController extends Controller
{
    /**
     * Tampilkan semua gambar dari produk tertentu
     */
    public function index($product_id)
    {
        $this->authorizeAdmin();

        $product = Product::findOrFail($product_id);

        $images = $product->images()->orderBy('created_at')->get();

        return response()->json(['data' => $images]);
    }

    /**
     * Tambah gambar ke produk (maksimal total 5 gambar termasuk main)
     */
    public function store(Request $request)
    {
        $this->authorizeAdmin();

        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'image' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
        ]);

        if (!$request->hasFile('image')) {
            return response()->json([
                'message' => 'Tidak ada gambar yang dikirim.',
            ], 422);
        }

        $product = Product::findOrFail($validated['product_id']);

        $currentCount = $product->images()->count();
        if ($product->main_image) {
            $currentCount += 1;
        }

        if ($currentCount >= 5) {
            return response()->json(['message' => 'Maksimal 5 gambar per produk.'], 422);
        }

        $file = $request->file('image');
        $filename = 'product_image_' . time() . '_' . Str::random(6) . '.' . $file->getClientOriginalExtension();
        $path = $file->storeAs('uploads/product-images', $filename, 'public');

        $image = ProductImage::create([
            'product_id' => $validated['product_id'],
            'image_url' => asset('storage/' . $path),
        ]);

        return response()->json(['message' => 'Gambar berhasil ditambahkan.', 'data' => $image], 201);
    }

    /**
     * Hapus gambar dari produk
     */
    public function destroy($id)
    {
        $this->authorizeAdmin();

        $image = ProductImage::findOrFail($id);

        if ($image->image_url && str_starts_with($image->image_url, asset('storage'))) {
            $path = str_replace(asset('storage') . '/', '', $image->image_url);
            if (Storage::disk('public')->exists($path)) {
                Storage::disk('public')->delete($path);
            }
        }

        $image->delete();

        return response()->json(['message' => 'Gambar berhasil dihapus.']);
    }

    /**
     * Cek otorisasi admin
     */
    private function authorizeAdmin()
    {
        if (!auth()->check() || auth()->user()->role_id !== 2) {
            abort(403, 'Hanya admin yang dapat mengakses fitur ini.');
        }
    }
}
