<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $this->authorizeAdmin();

        $query = Product::with(['subcategory.category', 'brand', 'images']);

        if ($request->filled('id')) {
            $query->where('id', $request->id);
        }

        if ($request->filled('keyword')) {
            $query->where('name', 'like', '%' . $request->keyword . '%');
        }

        if ($request->filled('brand_id')) {
            $query->where('brand_id', $request->brand_id);
        }

        if ($request->filled('subcategory_id')) {
            $query->where('subcategory_id', $request->subcategory_id);
        }

        if ($request->filled('category_id')) {
            $query->whereHas('subcategory', function ($q) use ($request) {
                $q->where('category_id', $request->category_id);
            });
        }

        // Tambahan baru → filter berdasarkan nama kategori
        if ($request->filled('category')) {
            $query->whereHas('subcategory.category', function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->category . '%');
            });
        }

        if ($request->filled('status_stock')) {
            $query->where('status_stock', $request->status_stock);
        }

        if ($request->filled('is_active')) {
            $query->where('is_active', $request->is_active);
        }

        switch ($request->sort) {
            case 'price_asc':
                $query->orderBy('is_active', 'desc')->orderBy('price', 'asc');
                break;
            case 'price_desc':
                $query->orderBy('is_active', 'desc')->orderBy('price', 'desc');
                break;
            case 'newest':
                $query->orderBy('is_active', 'desc')->orderBy('created_at', 'desc');
                break;
            case 'oldest':
                $query->orderBy('is_active', 'desc')->orderBy('created_at', 'asc');
                break;
            default:
                $query->orderBy('is_active', 'desc')->orderBy('created_at', 'desc');
        }

        // Tambahkan pagination
        $products = $query->paginate(10);

        // Return standar respons Laravel pagination (sudah lengkap)
        return response()->json($products);
    }

    public function store(Request $request)
    {
        $this->authorizeAdmin();

        $validated = $request->validate([
            'subcategory_id' => 'required|exists:subcategories,id',
            'brand_id' => 'required|exists:brands,id',
            'name' => 'required|string|max:255|unique:products,name',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'status_stock' => 'required|in:pre_order,out_of_stock',
            'main_image' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
            'has_igpu' => 'nullable|boolean',
        ]);

        $isProcessor = \App\Models\Subcategory::with('category')->find($validated['subcategory_id'])?->name === 'Processor';

        $hasIGPU = ($isProcessor && $request->boolean('has_igpu')) ? true : false;

        $mainImagePath = null;
        if ($request->hasFile('main_image')) {
            $file = $request->file('main_image');
            $filename = 'product_' . time() . '_' . Str::random(6) . '.' . $file->getClientOriginalExtension();
            $mainImagePath = $file->storeAs('uploads/products', $filename, 'public');
        }

        $product = Product::create([
            'subcategory_id' => $validated['subcategory_id'],
            'brand_id' => $validated['brand_id'],
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'price' => $validated['price'],
            'main_image' => $mainImagePath ? asset('storage/' . $mainImagePath) : null,
            'stock' => 0,
            'status_stock' => $validated['status_stock'],
            'is_active' => true,
            'has_igpu' => $hasIGPU,
        ]);

        return response()->json(['message' => 'Product created successfully.', 'data' => $product], 201);
    }

    public function update(Request $request, $id)
    {
        $this->authorizeAdmin();

        $product = Product::findOrFail($id);

        $rules = [
            'subcategory_id' => 'required|exists:subcategories,id',
            'brand_id' => 'required|exists:brands,id',
            'name' => 'required|string|max:255|unique:products,name,' . $id,
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'main_image' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
            'has_igpu' => 'nullable|boolean',
        ];

        if ($product->stock > 0) {
            // Jika produk sudah punya stok, status harus tetap ready_stock
            $rules['status_stock'] = 'required|in:ready_stock';
        } else {
            // Jika belum ada stok, admin boleh atur pre_order / out_of_stock
            $rules['status_stock'] = 'required|in:pre_order,out_of_stock';
        }

        $validated = $request->validate($rules);

        $subcategory = \App\Models\Subcategory::with('category')->find($validated['subcategory_id']);
        $isProcessor = $subcategory && $subcategory->name === 'Processor' && $subcategory->category->name === 'Komponen';
        $hasIGPU = ($isProcessor && $request->boolean('has_igpu')) ? true : false;

        if ($request->hasFile('main_image')) {
            if ($product->main_image && str_starts_with($product->main_image, asset('storage'))) {
                $oldPath = str_replace(asset('storage') . '/', '', $product->main_image);
                if (Storage::disk('public')->exists($oldPath)) {
                    Storage::disk('public')->delete($oldPath);
                }
            }

            $file = $request->file('main_image');
            $filename = 'product_' . time() . '_' . Str::random(6) . '.' . $file->getClientOriginalExtension();
            $newPath = $file->storeAs('uploads/products', $filename, 'public');

            $product->main_image = asset('storage/' . $newPath);
        }

        $product->update([
            'subcategory_id' => $validated['subcategory_id'],
            'brand_id' => $validated['brand_id'],
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'price' => $validated['price'],
            'status_stock' => $validated['status_stock'],
            'has_igpu' => $hasIGPU,
        ]);

        return response()->json(['message' => 'Product updated successfully.', 'data' => $product]);
    }


    public function destroy($id)
    {
        $this->authorizeAdmin();

        $product = Product::findOrFail($id);

        if ($product->main_image && str_starts_with($product->main_image, asset('storage'))) {
            $oldPath = str_replace(asset('storage') . '/', '', $product->main_image);
            if (Storage::disk('public')->exists($oldPath)) {
                Storage::disk('public')->delete($oldPath);
            }
        }

        $product->delete();

        return response()->json(['message' => 'Product deleted successfully.']);
    }

    public function toggleStatus($id)
    {
        $this->authorizeAdmin();

        $product = Product::findOrFail($id);
        $product->is_active = !$product->is_active;
        $product->save();

        return response()->json([
            'message' => 'Product status updated.',
            'is_active' => $product->is_active,
        ]);
    }

    private function authorizeAdmin()
    {
        if (!auth()->check() || auth()->user()->role_id !== 2) {
            abort(403, 'Hanya admin yang dapat mengakses fitur ini.');
        }
    }

    // Menampilkan detail 1 produk berdasarkan ID
    public function show($id)
    {
        $this->authorizeAdmin();

        $product = Product::with(['subcategory.category', 'brand'])->find($id);

        if (!$product) {
            return response()->json(['message' => 'Produk tidak ditemukan.'], 404);
        }

        return response()->json(['data' => $product]);
    }

    public function listAllForCompatibility()
    {
        $this->authorizeAdmin();
        $products = Product::with(['subcategory.category', 'brand'])
            ->where('is_active', true)
            ->get();

        return response()->json(['data' => $products]);
    }


}
