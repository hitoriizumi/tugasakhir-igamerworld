<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Carbon\Carbon;

class DashboardController extends Controller
{
    private function authorizeAdminOrSuperadmin()
    {
        $role = auth()->user()->role_id;
        if (!in_array($role, [1, 2])) {
            abort(403, 'Hanya admin atau superadmin yang dapat mengakses dashboard.');
        }
    }

    public function getStats()
    {
        try {
            $this->authorizeAdminOrSuperadmin();
            $role = auth()->user()->role_id;

            $today = Carbon::today();
            $startOfMonth = Carbon::now()->startOfMonth();
            $endOfMonth = Carbon::now()->endOfMonth();

            // 1. Jumlah semua pesanan
            $totalOrders = Order::count();

            // 2. Jumlah pesanan berdasarkan status
            $ordersByStatus = Order::select('order_status', DB::raw('COUNT(*) as total'))
                ->groupBy('order_status')
                ->pluck('total', 'order_status');

            // 3. Jumlah produk aktif dan nonaktif
            $products = [
                'aktif' => Product::where('is_active', true)->count(),
                'nonaktif' => Product::where('is_active', false)->count(),
            ];

            // 4. Jumlah admin aktif dan nonaktif (khusus superadmin)
            $admins = null;
            if ($role === 1) {
                $admins = [
                    'aktif' => User::where('role_id', 2)->whereNull('deleted_at')->count(),
                    'nonaktif' => User::where('role_id', 2)->whereNotNull('deleted_at')->count(),
                ];
            }

            // 5. Statistik pesanan per bulan untuk semua tahun
            $orderStatsByYear = Order::selectRaw('YEAR(created_at) as year, MONTH(created_at) as month, COUNT(*) as total')
                ->groupBy(DB::raw('YEAR(created_at)'), DB::raw('MONTH(created_at)'))
                ->orderByRaw('year ASC, month ASC')
                ->get()
                ->groupBy('year');

            $availableYears = $orderStatsByYear->keys()->values()->all();

            // 6. Total pembayaran masuk dari pesanan yang sudah dibayar
            $totalPaidAmount = Order::where('payment_status', 'sudah_bayar')->sum('total_price');

            // 7. Jumlah pesanan hari ini
            $todayOrders = Order::whereDate('created_at', $today)->count();

            $todayOrdersByStatus = Order::whereDate('created_at', $today)
                ->select('order_status', DB::raw('COUNT(*) as total'))
                ->groupBy('order_status')
                ->pluck('total', 'order_status');

            // 8. Jumlah stok rendah
            $lowStockCount = Product::where('stock', '<', 5)
                ->where('is_active', true)
                ->count();

            // 9. Jumlah unit produk pre-order yang harus direstock (stok negatif)
            $preOrderCount = Product::where('status_stock', 'pre_order')
                ->where('stock', '<', 0)
                ->sum(DB::raw('ABS(stock)'));

            // 10. Pesanan yang belum diverifikasi
            $unverifiedOrdersCount = Order::where('order_status', 'menunggu_verifikasi')->count();

            // 11. 5 Pesanan terbaru
            $latestOrders = Order::with('user:id,name')
                ->latest()
                ->take(5)
                ->get(['id', 'user_id', 'order_status', 'invoice_number', 'created_at']);

            // 12. Produk terlaris sepanjang waktu
            $orderItemSales = DB::table('order_items')
                ->join('orders', 'order_items.order_id', '=', 'orders.id')
                ->join('products', 'order_items.product_id', '=', 'products.id')
                ->select('products.id', 'products.name', DB::raw('SUM(order_items.quantity) as total_sold'))
                ->groupBy('products.id', 'products.name');

            $customPCSales = DB::table('custom_pc_components')
                ->join('custom_pc_orders', 'custom_pc_components.custom_pc_order_id', '=', 'custom_pc_orders.id')
                ->join('orders', 'custom_pc_orders.order_id', '=', 'orders.id')
                ->join('products', 'custom_pc_components.product_id', '=', 'products.id')
                ->select('products.id', 'products.name', DB::raw('SUM(custom_pc_components.quantity) as total_sold'))
                ->groupBy('products.id', 'products.name');

            $bestSellingProducts = DB::table(DB::raw("({$orderItemSales->toSql()} UNION ALL {$customPCSales->toSql()}) as combined"))
                ->mergeBindings($orderItemSales)
                ->mergeBindings($customPCSales)
                ->select('combined.id', 'combined.name', DB::raw('SUM(combined.total_sold) as total_sold'))
                ->groupBy('combined.id', 'combined.name')
                ->orderByDesc('total_sold')
                ->limit(5)
                ->get();

            return response()->json([
                'total_orders' => $totalOrders,
                'orders_by_status' => $ordersByStatus,
                'products' => $products,
                'admins' => $admins,
                'order_stats_by_year' => $orderStatsByYear->toArray(),
                'available_years' => $availableYears,
                'total_paid_amount' => $totalPaidAmount,

                // Tambahan untuk dashboard admin
                'today_orders' => $todayOrders,
                'today_orders_by_status' => $todayOrdersByStatus,
                'low_stock_count' => $lowStockCount,
                'pre_order_count' => $preOrderCount,
                'unverified_orders_count' => $unverifiedOrdersCount,
                'latest_orders' => $latestOrders,
                'best_selling_products' => $bestSellingProducts,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Terjadi kesalahan saat mengambil data dashboard.',
                'message' => $e->getMessage(),
            ], 500);
        }
    }
}
