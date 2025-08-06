<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class NotificationController extends Controller
{
    // ✅ Validasi role: hanya admin dan pelanggan
    private function authorizeCustomerOrAdmin()
    {
        $user = Auth::user();
        if (!$user || !in_array($user->role_id, [2, 3])) {
            abort(403, 'Hanya admin atau pelanggan yang dapat mengakses fitur ini.');
        }
    }

    // 📥 Ambil notifikasi dengan pagination
    public function index(Request $request)
    {
        $this->authorizeCustomerOrAdmin();

        $userId = Auth::id();
        $perPage = $request->input('per_page', 10); // default 10

        $notifications = Notification::where('user_id', $userId)
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);

        return response()->json($notifications);
    }

    // ✅ Tandai sebagai dibaca
    public function markAsRead($id)
    {
        $this->authorizeCustomerOrAdmin();

        $notif = Notification::where('id', $id)
            ->where('user_id', Auth::id())
            ->firstOrFail();

        if (!$notif->is_read) {
            $notif->is_read = true;
            $notif->save();
        }

        return response()->json(['message' => 'Notifikasi ditandai sebagai dibaca.']);
    }

    // ✅ Tandai semua sebagai dibaca
    public function markAllAsRead()
    {
        $this->authorizeCustomerOrAdmin();

        Notification::where('user_id', Auth::id())
            ->where('is_read', false)
            ->update(['is_read' => true]);

        return response()->json(['message' => 'Semua notifikasi ditandai sebagai dibaca.']);
    }

    // 🔢 Jumlah notifikasi belum dibaca
    public function unreadCount()
    {
        $this->authorizeCustomerOrAdmin();

        $count = Notification::where('user_id', Auth::id())
            ->where('is_read', false)
            ->count();

        return response()->json(['unread' => $count]);
    }

    // 🗑️ Hapus notifikasi
    public function destroy($id)
    {
        $this->authorizeCustomerOrAdmin();

        $notif = Notification::where('id', $id)
            ->where('user_id', Auth::id())
            ->firstOrFail();

        $notif->delete();

        return response()->json(['message' => 'Notifikasi dihapus.']);
    }

    // 🔗 Fungsi helper untuk menghasilkan link frontend sesuai role dan tipe notifikasi
    public static function generateFrontendLink($type, $role, $orderId)
    {
        if ($role === 'admin') {
            return match ($type) {
                'order_product_detail' => "/admin/orders/product/{$orderId}",
                'order_custom_detail' => "/admin/orders/custom-pc/{$orderId}",
                'payment_product'      => "/admin/orders/product/{$orderId}/payment",
                'payment_custom'       => "/admin/orders/custompc/{$orderId}/payment",
                'delivery_product'     => "/admin/orders/product/{$orderId}/delivery",
                'delivery_custom'      => "/admin/orders/custompc/{$orderId}/delivery",
                'feedback_detail'      => "/admin/feedbacks/{$orderId}",
                default                => "/"
            };
        }

        if ($role === 'superadmin') {
            return match ($type) {
                'feedback_detail' => "/superadmin/feedbacks/{$orderId}",
                default           => "/"
            };
        }

        if ($role === 'customer') {
            return match ($type) {
                'order_product_detail' => "/history/{$orderId}",
                'order_custom_detail'  => "/history/custompc/{$orderId}",
                'payment_product'      => "/history/{$orderId}/payment",
                'payment_custom'       => "/history/custompc/{$orderId}/payment",
                'delivery_product'     => "/history/{$orderId}/delivery",
                'delivery_custom'      => "/history/custompc/{$orderId}/delivery",
                default                => "/"
            };
        }

        return "/";
    }
}
