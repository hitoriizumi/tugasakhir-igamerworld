<?php

namespace App\Http\Controllers;

use App\Models\Cart;
use App\Models\Product;
use Illuminate\Http\Request;

class CartController extends Controller
{
    // 🔓 Tampilkan semua item di keranjang pelanggan
    public function index()
    {
        $this->authorizeCustomer();

        $user = auth()->user();

        $carts = Cart::with(['product.images' => function ($query) {
            $query->where('is_main', 1);
        }])
        ->where('user_id', $user->id)
        ->latest()
        ->get();

        return response()->json(['data' => $carts]);
    }

    // ➕ Tambah produk ke keranjang
    public function store(Request $request)
    {
        $this->authorizeCustomer();

        $request->validate([
            'product_id' => 'required|exists:products,id',
            'quantity' => 'required|integer|min:1',
        ]);

        $user = auth()->user();
        $product = Product::findOrFail($request->product_id);

        if (!$product->is_active) {
            return response()->json(['message' => 'Produk tidak aktif.'], 422);
        }

        if ($product->status_stock === 'out_of_stock') {
            return response()->json(['message' => 'Produk sedang habis dan tidak dapat ditambahkan ke keranjang.'], 422);
        }

        $cart = Cart::where('user_id', $user->id)
            ->where('product_id', $product->id)
            ->first();

        $newQty = $request->quantity;

        if ($cart) {
            $newQty += $cart->quantity;
        }

        if ($product->status_stock === 'ready_stock' && $newQty > $product->stock) {
            return response()->json(['message' => 'Jumlah melebihi stok yang tersedia.'], 422);
        }

        if ($cart) {
            $cart->quantity = $newQty;
            $cart->save();
            return response()->json(['message' => 'Jumlah produk diperbarui di keranjang.']);
        }

        Cart::create([
            'user_id' => $user->id,
            'product_id' => $product->id,
            'quantity' => $request->quantity,
        ]);

        return response()->json(['message' => 'Produk ditambahkan ke keranjang.']);
    }

    // 🔁 Update jumlah produk di keranjang
    public function update(Request $request, $id)
    {
        $this->authorizeCustomer();

        $request->validate([
            'quantity' => 'required|integer|min:1',
        ]);

        $user = auth()->user();

        $cart = Cart::with('product')
            ->where('user_id', $user->id)
            ->findOrFail($id);

        $product = $cart->product;

        if (!$product->is_active || $product->status_stock === 'out_of_stock') {
            return response()->json(['message' => 'Produk sedang habis dan tidak dapat diperbarui.'], 422);
        }

        if ($product->status_stock === 'ready_stock' && $request->quantity > $product->stock) {
            return response()->json(['message' => 'Jumlah melebihi stok yang tersedia.'], 422);
        }

        $cart->quantity = $request->quantity;
        $cart->save();

        return response()->json(['message' => 'Jumlah produk di keranjang diperbarui.']);
    }

    // ❌ Hapus item dari keranjang
    public function destroy($id)
    {
        $this->authorizeCustomer();

        $user = auth()->user();
        $cart = Cart::where('user_id', $user->id)->findOrFail($id);
        $cart->delete();

        return response()->json(['message' => 'Produk dihapus dari keranjang.']);
    }

    // 🔒 Validasi role pelanggan (role_id = 3)
    private function authorizeCustomer()
    {
        abort_if(!auth()->check() || auth()->user()->role_id !== 3, 403, 'Hanya pelanggan yang dapat mengakses fitur keranjang.');
    }
}
