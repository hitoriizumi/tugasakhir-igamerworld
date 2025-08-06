<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderDelivery;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use App\Models\Notification;
use App\Models\User;
use App\Http\Controllers\NotificationController;

class OrderDeliveryController extends Controller
{
    private function authorizeAdmin()
    {
        if (auth()->user()->role_id !== 2) {
            abort(403, 'Hanya admin yang dapat mengakses fitur ini.');
        }
    }

    private function authorizeCustomer()
    {
        if (auth()->user()->role_id !== 3) {
            abort(403, 'Hanya pelanggan yang dapat mengakses fitur ini.');
        }
    }

    // ===============================
    // 🧭 ADMIN - Produk Biasa
    // ===============================
    public function showProduct($orderId)
    {
        $this->authorizeAdmin();

        $delivery = OrderDelivery::with([
            'order.user',
            'order.orderItems.product',
            'order.courier',
            'order.paymentMethod',
            'order.shippingAddress',
            'order.orderNotes.user'
        ])->where('order_id', $orderId)->first();

        if (!$delivery || $delivery->order->order_type !== 'product') {
            return response()->json(['message' => 'Data pengiriman tidak ditemukan.'], 404);
        }

        return response()->json(['data' => $delivery]);
    }

    public function updateProduct(Request $request, $orderId)
    {
        return $this->handleUpdate($request, $orderId, 'product');
    }

    public function markAsFinishedProduct($orderId)
    {
        return $this->handleMarkAsFinished($orderId, 'product');
    }

    // ===============================
    // 🧭 ADMIN - Rakitan PC
    // ===============================
    public function showCustomPC($orderId)
    {
        $this->authorizeAdmin();

        $delivery = OrderDelivery::with([
            'order.user',
            'order.customPCOrder.custom_pc_components.product',
            'order.courier',
            'order.paymentMethod',
            'order.shippingAddress',
            'order.orderNotes.user'
        ])->where('order_id', $orderId)->first();

        if (!$delivery || $delivery->order->order_type !== 'custom_pc') {
            return response()->json(['message' => 'Data pengiriman tidak ditemukan.'], 404);
        }

        return response()->json(['data' => $delivery]);
    }

    public function updateCustomPC(Request $request, $orderId)
    {
        return $this->handleUpdate($request, $orderId, 'custom_pc');
    }

    public function markAsFinishedCustomPC($orderId)
    {
        return $this->handleMarkAsFinished($orderId, 'custom_pc');
    }

    // ===============================
    // 📦 CUSTOMER - Produk Biasa
    // ===============================
    public function showProductByCustomer($orderId)
    {
        return $this->handleShowByCustomer($orderId, 'product');
    }

    public function confirmReceivedProduct($orderId)
    {
        return $this->handleConfirmReceived($orderId, 'product');
    }

    // ===============================
    // 📦 CUSTOMER - Rakitan PC
    // ===============================
    public function showCustomPCByCustomer($orderId)
    {
        return $this->handleShowByCustomer($orderId, 'custom_pc');
    }

    public function confirmReceivedCustomPC($orderId)
    {
        return $this->handleConfirmReceived($orderId, 'custom_pc');
    }

    // ===============================
    // 🔁 Shared Logic Handler
    // ===============================
    private function handleUpdate(Request $request, $orderId, $type)
    {
        $this->authorizeAdmin();

        $order = Order::with('orderDelivery')->findOrFail($orderId);
        if ($order->order_type !== $type) {
            return response()->json(['message' => 'Jenis pesanan tidak sesuai.'], 422);
        }

        $delivery = $order->orderDelivery;
        if (!$delivery) {
            return response()->json(['message' => 'Data pengiriman belum tersedia.'], 404);
        }

        if ($order->order_status === 'selesai') {
            return response()->json(['message' => 'Pesanan sudah selesai dan tidak dapat diubah.'], 403);
        }

        if ($order->payment_status !== 'sudah_bayar') {
            return response()->json(['message' => 'Pesanan belum dibayar.'], 422);
        }

        if (!in_array($order->order_status, ['diproses', 'dikirim'])) {
            return response()->json(['message' => 'Pengiriman hanya dapat diubah jika status pesanan diproses atau dikirim.'], 422);
        }

        $validated = $request->validate([
            'tracking_number'    => 'nullable|string|max:255',
            'estimated_arrival'  => 'nullable|date',
            'notes'              => 'nullable|string',
            'delivery_image'     => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
        ]);

        if ($request->hasFile('delivery_image')) {
            if ($delivery->delivery_image && str_starts_with($delivery->delivery_image, asset('storage'))) {
                $oldPath = str_replace(asset('storage') . '/', '', $delivery->delivery_image);
                if (Storage::disk('public')->exists($oldPath)) {
                    Storage::disk('public')->delete($oldPath);
                }
            }

            $file = $request->file('delivery_image');
            $filename = 'delivery_' . time() . '_' . \Str::random(6) . '.' . $file->getClientOriginalExtension();
            $relativePath = $file->storeAs('uploads/delivery_proofs', $filename, 'public');
            $validated['delivery_image'] = asset('storage/' . $relativePath);
        }

        $delivery->update($validated);

        Notification::create([
            'user_id' => $order->user_id,
            'order_id' => $order->id,
            'message' => 'Admin telah mengisi data pengiriman untuk pesanan #' . $order->invoice_number . '.',
            'link_to' => NotificationController::generateFrontendLink(
                $type === 'product' ? 'delivery_product' : 'delivery_custom',
                'customer',
                $order->id
            ),
        ]);

        if ($delivery->pickup_method === 'kirim' && $order->order_status === 'diproses') {
            $order->update(['order_status' => 'dikirim']);
        }

        return response()->json(['message' => 'Data pengiriman berhasil diperbarui.', 'data' => $delivery->fresh()]);
    }

    private function handleMarkAsFinished($orderId, $type)
    {
        $this->authorizeAdmin();

        $order = Order::with('orderDelivery')->findOrFail($orderId);
        if ($order->order_type !== $type) {
            return response()->json(['message' => 'Jenis pesanan tidak sesuai.'], 422);
        }

        $delivery = $order->orderDelivery;
        if (!$delivery) {
            return response()->json(['message' => 'Data pengiriman belum tersedia.'], 404);
        }

        if (!$delivery->delivery_image || !$delivery->estimated_arrival) {
            return response()->json(['message' => 'Lengkapi bukti pengambilan dan tanggal sebelum menyelesaikan pesanan.'], 422);
        }

        $order->update([
            'order_status' => 'selesai',
            'finished_at' => now(),
        ]);

        Notification::create([
        'user_id' => $order->user_id,
        'order_id' => $order->id,
        'message' => 'Pesanan kamu #' . $order->invoice_number . ' telah ditandai selesai oleh admin.',
        'link_to' => NotificationController::generateFrontendLink(
            $type === 'product' ? 'order_product_detail' : 'order_custom_detail',
            'customer',
            $order->id
        ),
    ]);

        return response()->json(['message' => 'Pesanan berhasil ditandai selesai oleh admin.']);
    }

    private function handleShowByCustomer($orderId, $type)
    {
        $this->authorizeCustomer();

        $delivery = OrderDelivery::with([
            'order' => function ($q) use ($type) {
                $q->where('user_id', auth()->id())
                  ->where('order_type', $type)
                  ->with([
                      'orderItems.product',
                      'customPCOrder.custom_pc_components.product',
                      'courier',
                      'paymentMethod',
                      'shippingAddress',
                      'orderNotes.user'
                  ]);
            }
        ])->where('order_id', $orderId)->first();

        if (!$delivery || !$delivery->order) {
            return response()->json(['message' => 'Data pengiriman tidak ditemukan atau tidak memiliki akses.'], 404);
        }

        return response()->json(['data' => $delivery]);
    }

    private function handleConfirmReceived($orderId, $type)
    {
        $this->authorizeCustomer();

        $order = Order::with('orderDelivery')
            ->where('id', $orderId)
            ->where('user_id', auth()->id())
            ->where('order_type', $type)
            ->firstOrFail();

        if (!$order->orderDelivery || $order->orderDelivery->pickup_method !== 'kirim') {
            return response()->json(['message' => 'Konfirmasi hanya berlaku untuk pengiriman ke alamat.'], 422);
        }

        if ($order->order_status !== 'dikirim') {
            return response()->json(['message' => 'Pesanan belum dikirim.'], 422);
        }

        $order->update([
            'order_status' => 'selesai',
            'finished_at' => now(),
        ]);

        // ✅ Kirim notifikasi ke semua admin
        $admins = User::where('role_id', 2)->get();

        foreach ($admins as $admin) {
            Notification::create([
                'user_id' => $admin->id,
                'order_id' => $order->id,
                'message' => 'Pelanggan telah menandai pesanan #' . $order->invoice_number . ' sebagai selesai.',
                'link_to' => NotificationController::generateFrontendLink(
                    $type === 'product' ? 'order_product_detail' : 'order_custom_detail',
                    'admin',
                    $order->id
                ),
            ]);
        }

        return response()->json(['message' => 'Terima kasih! Pesanan berhasil dikonfirmasi diterima.']);
    }
}
