<?php

namespace App\Http\Controllers;

use App\Models\Wishlist;
use App\Models\Product;
use Illuminate\Http\Request;

class WishlistController extends Controller
{
    public function index()
    {
        $this->authorizeCustomer();

        $user = auth()->user();

        $wishlist = Wishlist::with([
            'product.brand',
            'product.subcategory.category',
            'product.images' => function ($query) {
                $query->where('is_main', 1);
            }
        ])
        ->where('user_id', $user->id)
        ->latest()
        ->get();

        return response()->json(['data' => $wishlist]);
    }

    public function store(Request $request)
    {
        $this->authorizeCustomer();

        $request->validate([
            'product_id' => 'required|exists:products,id'
        ]);

        $user = auth()->user();
        $product = Product::findOrFail($request->product_id);

        $exists = Wishlist::where('user_id', $user->id)
            ->where('product_id', $product->id)
            ->exists();

        if ($exists) {
            if ($product->status_stock === 'out_of_stock') {
                return response()->json([
                    'message' => 'Barang ini habis, ditunggu yah'
                ], 422);
            }

            return response()->json([
                'message' => 'Produk sudah ada di wishlist.'
            ], 422);
        }

        $wishlist = Wishlist::create([
            'user_id' => $user->id,
            'product_id' => $product->id
        ]);

        return response()->json(['message' => 'Produk ditambahkan ke wishlist.', 'data' => $wishlist]);
    }

    public function destroy($product_id)
    {
        $this->authorizeCustomer();

        $wishlist = Wishlist::where('user_id', auth()->id())
            ->where('product_id', $product_id)
            ->first();

        if (!$wishlist) {
            return response()->json(['message' => 'Produk tidak ditemukan di wishlist.'], 404);
        }

        $wishlist->delete();

        return response()->json(['message' => 'Produk dihapus dari wishlist.']);
    }

    // 🔒 Validasi role pelanggan (role_id = 3)
    private function authorizeCustomer()
    {
        abort_if(!auth()->check() || auth()->user()->role_id !== 3, 403, 'Hanya pelanggan yang dapat mengakses fitur wishlist.');
    }
}

