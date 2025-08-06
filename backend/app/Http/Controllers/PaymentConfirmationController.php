<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\PaymentConfirmation;
use App\Models\OrderNote;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use App\Models\Notification;
use App\Models\User;
use App\Http\Controllers\NotificationController;

class PaymentConfirmationController extends Controller
{
    private function authorizeCustomer()
    {
        if (auth()->user()->role_id !== 3) {
            abort(403, 'Hanya pelanggan yang dapat mengakses fitur ini.');
        }
    }

    private function authorizeAdmin()
    {
        if (auth()->user()->role_id !== 2) {
            abort(403, 'Hanya admin yang dapat mengakses fitur ini.');
        }
    }

    // Pelanggan mengirim konfirmasi pembayaran untuk produk biasa
    public function storeProduct(Request $request, $orderId)
    {
        return $this->handleStoreConfirmation($request, $orderId, 'product');
    }

    // Pelanggan mengirim konfirmasi pembayaran untuk rakitan PC
    public function storeCustomPC(Request $request, $orderId)
    {
        return $this->handleStoreConfirmation($request, $orderId, 'custom_pc');
    }

    // ✅ Pelanggan mengirim konfirmasi pembayaran
    public function handleStoreConfirmation(Request $request, $orderId)
    {
        $this->authorizeCustomer();

        $user = auth()->user();
        $order = Order::where('id', $orderId)
                    ->where('user_id', $user->id)
                    ->firstOrFail();

        // Hanya boleh kirim konfirmasi saat menunggu pembayaran
        if ($order->order_status !== 'menunggu_pembayaran') {
            return response()->json(['message' => 'Pesanan belum disetujui admin atau sudah diproses. Konfirmasi tidak dapat dilakukan.'], 422);
        }

        // Cegah duplikat konfirmasi
        if (PaymentConfirmation::where('order_id', $orderId)->exists()) {
            return response()->json(['message' => 'Konfirmasi pembayaran sudah dikirim.'], 409);
        }

        $validated = $request->validate([
            'payment_image'   => 'required|image|mimes:jpg,jpeg,png,webp|max:2048',
            'bank_name'       => 'required|string|max:255',
            'account_number'  => 'required|string|max:255',
        ]);

        $validated['user_id'] = $user->id;
        $validated['order_id'] = $orderId;
        $validated['transfer_time'] = now();

        $file = $request->file('payment_image');
        $filename = 'payment_' . time() . '_' . \Str::random(6) . '.' . $file->getClientOriginalExtension();
        $relativePath = $file->storeAs('uploads/payment_proofs', $filename, 'public');
        $validated['payment_image'] = asset('storage/' . $relativePath);

        $confirmation = PaymentConfirmation::create($validated);

        $order->update(['payment_status' => 'sudah_bayar']);

        $admins = User::where('role_id', 2)->get();

        foreach ($admins as $admin) {
            Notification::create([
                'user_id' => $admin->id,
                'order_id' => $order->id,
                'message' => 'Pelanggan ' . $user->name . ' mengirim konfirmasi pembayaran untuk pesanan #' . $order->invoice_number . '.',
                'link_to' => NotificationController::generateFrontendLink(
                    $order->order_type === 'custom_pc' ? 'payment_custom' : 'payment_product',
                    'admin',
                    $order->id
                ),
            ]);
        }

        return response()->json([
            'message' => 'Konfirmasi pembayaran berhasil dikirim.',
            'data' => $confirmation
        ], 201);
    }

    // ✅ Admin melihat konfirmasi pembayaran
    public function show($orderId)
    {
        $this->authorizeAdmin();

        $confirmation = PaymentConfirmation::with(['user', 'order.customPCOrder']) // baru saya ubah
            ->where('order_id', $orderId)
            ->first();

        if (!$confirmation) {
            return response()->json(['message' => 'Data konfirmasi pembayaran tidak ditemukan.'], 404);
        }

        return response()->json([
            'data' => $confirmation,
            'order_type' => $confirmation->order->order_type
        ]);
    }

    public function showByCustomer($orderId)
    {
        $this->authorizeCustomer();

        $user = auth()->user();

        $confirmation = PaymentConfirmation::with(['order']) // pastikan relasi order dibawa
            ->where('order_id', $orderId)
            ->where('user_id', $user->id)
            ->first();

        if (!$confirmation) {
            return response()->json(['message' => 'Data konfirmasi pembayaran tidak ditemukan.'], 404);
        }

        return response()->json([
            'data' => $confirmation,
            'order_type' => $confirmation->order->order_type
        ]);
    }

    // ✅ Pelanggan mengupdate konfirmasi pembayaran
    public function update(Request $request, $orderId)
    {
        $this->authorizeCustomer();

        $user = auth()->user();
        $order = Order::where('id', $orderId)
                    ->where('user_id', $user->id)
                    ->firstOrFail();

        $confirmation = PaymentConfirmation::where('order_id', $orderId)
            ->where('user_id', $user->id)
            ->firstOrFail();

        // Hanya boleh update saat menunggu pembayaran dan belum diverifikasi
        if ($order->order_status !== 'menunggu_pembayaran') {
            return response()->json(['message' => 'Pesanan tidak dalam status menunggu pembayaran.'], 422);
        }

        if ($confirmation->is_verified !== null) {
            return response()->json(['message' => 'Konfirmasi sudah diverifikasi dan tidak bisa diubah.'], 403);
        }

        $validated = $request->validate([
            'payment_image'   => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
            'bank_name'       => 'required|string|max:255',
            'account_number'  => 'required|string|max:255',
        ]);

        $validated['transfer_time'] = now();

        if ($request->hasFile('payment_image')) {
            if ($confirmation->payment_image && str_starts_with($confirmation->payment_image, asset('storage'))) {
                $oldPath = str_replace(asset('storage') . '/', '', $confirmation->payment_image);
                if (Storage::disk('public')->exists($oldPath)) {
                    Storage::disk('public')->delete($oldPath);
                }
            }

            $file = $request->file('payment_image');
            $filename = 'payment_' . time() . '_' . \Str::random(6) . '.' . $file->getClientOriginalExtension();
            $relativePath = $file->storeAs('uploads/payment_proofs', $filename, 'public');
            $validated['payment_image'] = asset('storage/' . $relativePath);
        }

        $confirmation->update($validated);

        return response()->json([
            'message' => 'Konfirmasi pembayaran berhasil diperbarui.',
            'data' => $confirmation
        ]);
    }


    // ✅ Admin memverifikasi atau menolak pembayaran
    public function verify(Request $request, $orderId)
    {
        $this->authorizeAdmin();

        $confirmation = PaymentConfirmation::where('order_id', $orderId)->firstOrFail();
        $order = Order::findOrFail($orderId);

        if ($confirmation->is_verified !== null) {
            return response()->json(['message' => 'Pembayaran sudah diverifikasi.'], 409);
        }

        $validated = $request->validate([
            'is_verified' => 'required|boolean',
            'note'        => 'nullable|string',
        ]);

        $confirmation->update([
            'is_verified' => $validated['is_verified'],
            'verified_at' => now(),
        ]);

        if ($validated['is_verified']) {
            $order->update([
                'payment_status' => 'sudah_bayar',
                'order_status' => 'diproses',
                'paid_at' => now(),
            ]);

            OrderNote::create([
                'order_id' => $order->id,
                'user_id' => auth()->id(),
                'note' => 'Pembayaran telah diverifikasi oleh admin.',
            ]);

             // 🔔 Notifikasi ke customer
            Notification::create([
                'user_id' => $order->user_id,
                'order_id' => $order->id,
                'message' => 'Pembayaran kamu telah diverifikasi oleh admin.',
                'link_to' => NotificationController::generateFrontendLink(
                    $order->order_type === 'custom_pc' ? 'order_custom_detail' : 'order_product_detail',
                    'customer',
                    $order->id
                ),
            ]);
        } else {
            $order->update(['payment_status' => 'gagal']);

            if (!empty($validated['note'])) {
                OrderNote::create([
                    'order_id' => $order->id,
                    'user_id' => auth()->id(),
                    'note' => '[DIBATALKAN] ' . $validated['note'],
                ]);
            }

            // 🔔 Notifikasi ke customer
            Notification::create([
                'user_id' => $order->user_id,
                'order_id' => $order->id,
                'message' => 'Pembayaran kamu ditolak. Silakan kirim ulang bukti pembayaran.',
                'link_to' => NotificationController::generateFrontendLink(
                    $order->order_type === 'custom_pc' ? 'payment_custom' : 'payment_product',
                    'customer',
                    $order->id
                ),
            ]);
        }

        return response()->json(['message' => 'Status pembayaran berhasil diperbarui.']);
    }
}
