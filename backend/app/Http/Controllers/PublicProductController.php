<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Brand;
use App\Models\Subcategory;
use Illuminate\Http\Request;

class PublicProductController extends Controller
{
    /**
     * Menampilkan daftar produk aktif untuk publik (guest & customer)
     * Mendukung filter, pencarian, dan sorting
     */
    public function index(Request $request)
    {
        $query = Product::with([
            'brand',
            'subcategory.category',
            'images',
            'compatibilities.brand',
            'compatibilities.subcategory.category'
        ])->where('is_active', true);

        // 🔍 Filter keyword
        if ($request->filled('keyword')) {
            $query->where('name', 'like', '%' . $request->keyword . '%');
        }

        // 🔍 Filter brand
        if ($request->filled('brand_id')) {
            $query->where('brand_id', $request->brand_id);
        }

        // 🔍 Filter subkategori
        if ($request->filled('subcategory_id')) {
            $query->where('subcategory_id', $request->subcategory_id);
        }

        // 🔍 Filter kategori melalui relasi subkategori
        if ($request->filled('category_id')) {
            $query->whereHas('subcategory', function ($q) use ($request) {
                $q->where('category_id', $request->category_id);
            });
        }

        // 🔍 Filter status stok
        if ($request->filled('status_stock')) {
            $query->where('status_stock', $request->status_stock);
        }

        // ↕️ Sorting by pilihan
        switch ($request->sort) {
            case 'price_asc':
                $query->orderBy('price', 'asc');
                break;
            case 'price_desc':
                $query->orderBy('price', 'desc');
                break;
            case 'newest':
                $query->orderBy('created_at', 'desc');
                break;
            case 'oldest':
                $query->orderBy('created_at', 'asc');
                break;
            default:
                $query->orderBy('created_at', 'desc'); // Default: terbaru
        }

        // 📌 Prioritaskan ready & pre-order, taruh out_of_stock paling bawah
        $query->orderByRaw("FIELD(status_stock, 'ready_stock', 'pre_order', 'out_of_stock')");

        $products = $query->paginate(30);
        return response()->json($products);
    }

    /**
     * Menampilkan detail produk aktif berdasarkan ID
     */
    public function show($id)
    {
        $product = Product::with([
            'brand',
            'subcategory.category',
            'images',
            'compatibilities.brand',
            'compatibilities.subcategory.category'
        ])
        ->where('is_active', true)
        ->findOrFail($id);

        return response()->json(['data' => $product]);
    }

    /**
     * Menampilkan daftar brand aktif
     */
    public function brands()
    {
        $brands = Brand::where('is_active', true)
            ->orderBy('name')
            ->get();

        return response()->json(['data' => $brands]);
    }

    /**
     * Menampilkan daftar subkategori aktif beserta kategori induknya
     */
    public function subcategories()
    {
        $subcategories = Subcategory::with('category')
            ->withCount('products')
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

        return response()->json(['data' => $subcategories]);
    }

    public function similar($id)
    {
        $product = Product::with('subcategory')->findOrFail($id);

        $query = Product::with(['brand', 'subcategory.category', 'images'])
            ->where('is_active', true)
            ->where('id', '!=', $product->id)
            ->where(function ($q) use ($product) {
                $q->where('brand_id', $product->brand_id)
                ->orWhere('subcategory_id', $product->subcategory_id)
                ->orWhereHas('subcategory', function ($q2) use ($product) {
                    $q2->where('category_id', $product->subcategory->category_id);
                });
            })
            ->orderByRaw("FIELD(status_stock, 'ready_stock', 'pre_order', 'out_of_stock')")
            ->limit(10)
            ->get();

        return response()->json(['data' => $query]);
    }

    public function compatibleWith($productId)
    {
        $product = Product::findOrFail($productId);

        $compatibleIds = DB::table('product_compatibilities')
            ->where('product_id', $productId)
            ->orWhere('compatible_with_id', $productId)
            ->pluck('product_id', 'compatible_with_id')
            ->flatten()
            ->unique()
            ->reject(fn($id) => $id == $productId)
            ->values();

        $products = Product::with(['brand', 'subcategory.category', 'images'])
            ->whereIn('id', $compatibleIds)
            ->where('is_active', true)
            ->get();

        return response()->json(['data' => $products]);
    }

    // Produk mirip berdasarkan nama
    public function similarByName($id)
    {
        $product = Product::findOrFail($id);
        $keyword = explode(' ', $product->name)[0]; // ambil kata pertama

        $similar = Product::where('id', '!=', $id)
            ->where('name', 'like', "%$keyword%")
            ->where('is_active', true)
            ->limit(12)
            ->get();

        return response()->json(['data' => $similar]);
    }

    // Produk dengan brand yang sama
    public function similarByBrand($id)
    {
        $product = Product::with('brand')->findOrFail($id);

        $similar = Product::where('id', '!=', $id)
            ->where('brand_id', $product->brand_id)
            ->where('is_active', true)
            ->limit(12)
            ->get();

        return response()->json(['data' => $similar]);
    }

    // Produk dengan subkategori yang sama
    public function similarBySubcategory($id)
    {
        $product = Product::with('subcategory')->findOrFail($id);

        $similar = Product::where('id', '!=', $id)
            ->where('subcategory_id', $product->subcategory_id)
            ->where('is_active', true)
            ->limit(12)
            ->get();

        return response()->json(['data' => $similar]);
    }

}
