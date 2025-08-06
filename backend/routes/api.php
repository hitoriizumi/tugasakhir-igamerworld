<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\{
    AuthController,
    UserController,
    SubcategoryController,
    BrandController,
    ProductController,
    ProductImageController,
    StockEntryController,
    ProductCompatibilityController,
    PublicProductController,
    CategoryController,
    CartController,
    WishlistController,
    ShippingAddressController,
    LocationController,
    CourierController,
    PaymentMethodController,
    OrderController,
    OrderDeliveryController,
    PaymentConfirmationController,
    CustomPCOrderController,
    FeedbackController,
    NotificationController,
    DashboardController
};

// ==============================
// ✅ AUTHENTICATION (PUBLIC)
// ==============================
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/forgot-password', [UserController::class, 'forgotPassword']);
Route::post('/reset-password', [UserController::class, 'resetPassword']);

// ==============================
// ✅ PRODUK PUBLIK (GUEST / PELANGGAN)
// ==============================
Route::get('/public/products', [PublicProductController::class, 'index']);
Route::get('/public/products/{id}', [PublicProductController::class, 'show']);
Route::get('/public/products/{id}/similar', [PublicProductController::class, 'similar']);
Route::get('/public/brands', [PublicProductController::class, 'brands']);
Route::get('/public/subcategories', [PublicProductController::class, 'subcategories']);
Route::get('/public/categories', [CategoryController::class, 'index']);
Route::get('/public/product-compatibilities/{id}', [ProductCompatibilityController::class, 'publicIndex']);
Route::get('/public/product-compatibilities-all', [ProductCompatibilityController::class, 'publicAll']);
Route::get('/public/products/{id}/similar/name', [PublicProductController::class, 'similarByName']);
Route::get('/public/products/{id}/similar/brand', [PublicProductController::class, 'similarByBrand']);
Route::get('/public/products/{id}/similar/subcategory', [PublicProductController::class, 'similarBySubcategory']);


// ==============================
// 🚚 KURIR DAN METODE PEMBAYARAN (PUBLIC / PELANGGAN)
// ==============================
Route::get('/public/couriers', [CourierController::class, 'publicIndex']);
Route::get('/public/payment-methods', [PaymentMethodController::class, 'publicIndex']);

// ==============================
// 🔐 ROUTE TERLINDUNGI (LOGIN REQUIRED)
// ==============================
Route::middleware('auth:sanctum')->group(function () {

    // ==========================
    // 🔐 AUTH DAN PROFIL SENDIRI
    // ==========================
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [UserController::class, 'getProfile']);
    Route::put('/me/update-profile', [UserController::class, 'updateProfile']);
    Route::put('/me/update-password', [UserController::class, 'updatePassword']);

    // ==========================
    // 👑 MANAJEMEN ADMIN (SUPERADMIN)
    // ==========================
    Route::get('/admins', [UserController::class, 'getAdmins']);
    Route::post('/admins', [UserController::class, 'createAdmin']);
    Route::get('/admins/{id}', [UserController::class, 'getAdminById']);
    Route::put('/admins/{id}', [UserController::class, 'updateAdmin']);
    Route::delete('/admins/{id}', [UserController::class, 'softDeleteAdmin']);
    Route::put('/admins/{id}/restore', [UserController::class, 'restoreAdmin']);

    // 📊 Statistik Dashboard (Admin & Superadmin)
    Route::get('/dashboard-stats', [DashboardController::class, 'getStats']);

    // ==========================
    // 📝 FEEDBACK WEBSITE
    // ==========================
    Route::post('/feedbacks', [FeedbackController::class, 'store']);
    Route::get('/feedbacks', [FeedbackController::class, 'index']);
    Route::get('/feedbacks/{id}', [FeedbackController::class, 'show']); 


    // ==========================
    // ⚙️ METADATA PRODUK (ADMIN)
    // ==========================
    // Kategori (read-only)
    Route::get('/categories', [CategoryController::class, 'index']);

    // Subkategori
    Route::get('/subcategories', [SubcategoryController::class, 'index']);
    Route::post('/subcategories', [SubcategoryController::class, 'store']);
    Route::put('/subcategories/{id}', [SubcategoryController::class, 'update']);
    Route::delete('/subcategories/{id}', [SubcategoryController::class, 'destroy']);
    Route::patch('/subcategories/{id}/toggle', [SubcategoryController::class, 'toggleStatus']);

    // Brand
    Route::get('/brands', [BrandController::class, 'index']);
    Route::post('/brands', [BrandController::class, 'store']);
    Route::put('/brands/{id}', [BrandController::class, 'update']);
    Route::delete('/brands/{id}', [BrandController::class, 'destroy']);
    Route::patch('/brands/{id}/toggle', [BrandController::class, 'toggleStatus']);

    // ==========================
    // 📦 PRODUK (ADMIN)
    // ==========================
    Route::get('/products', [ProductController::class, 'index']);
    Route::get('/products/compatibility/list', [ProductController::class, 'listAllForCompatibility']);
    Route::get('/products/{id}', [ProductController::class, 'show']);
    // Route::get('/products/components', [ProductController::class, 'listAllComponents']);
    
    Route::post('/products', [ProductController::class, 'store']);
    Route::put('/products/{id}', [ProductController::class, 'update']);
    Route::delete('/products/{id}', [ProductController::class, 'destroy']);
    Route::patch('/products/{id}/toggle', [ProductController::class, 'toggleStatus']);

    // ==========================
    // 🖼️ GAMBAR TAMBAHAN PRODUK (ADMIN)
    // ==========================
    Route::get('/products/{product_id}/images', [ProductImageController::class, 'index']);
    Route::post('/products/images', [ProductImageController::class, 'store']);
    Route::delete('/products/images/{id}', [ProductImageController::class, 'destroy']);

    // ==========================
    // 🧮 MANAJEMEN STOK (ADMIN & SUPERADMIN)
    // ==========================
    Route::get('/stock-entries/{product_id}', [StockEntryController::class, 'index']);
    Route::post('/stock-entries', [StockEntryController::class, 'store']);
    Route::delete('/stock-entries/{id}', [StockEntryController::class, 'destroy']);

    // ==========================
    // 🔁 KOMPATIBILITAS PRODUK (ADMIN, kategori = Komponen)
    // ==========================
    Route::get('/products/{id}/compatibilities', [ProductCompatibilityController::class, 'index']);
    Route::post('/products/compatibilities', [ProductCompatibilityController::class, 'store']);
    Route::delete('/products/compatibilities', [ProductCompatibilityController::class, 'destroy']);

    // ==========================
    // 🛒 MANAJEMEN KERANJANG (PELANGGAN)
    // ==========================
    Route::get('/cart', [CartController::class, 'index']);
    Route::post('/cart', [CartController::class, 'store']);
    Route::put('/cart/{id}', [CartController::class, 'update']);
    Route::delete('/cart/{id}', [CartController::class, 'destroy']);

    // ==========================
    // MANAJEMEN WISHLIST (PELANGGAN)
    // ==========================
    Route::get('/wishlist', [WishlistController::class, 'index']);
    Route::post('/wishlist', [WishlistController::class, 'store']);
    Route::delete('/wishlist/{product_id}', [WishlistController::class, 'destroy']);

    // ==========================
    // MANAJEMEN ALAMAT (PELANGGAN)
    // ==========================
    Route::get('/customer/shipping-addresses', [ShippingAddressController::class, 'index']);
    Route::post('/customer/shipping-addresses', [ShippingAddressController::class, 'store']);
    Route::put('/customer/shipping-addresses/{id}', [ShippingAddressController::class, 'update']);
    Route::patch('/customer/shipping-addresses/{id}/set-primary', [ShippingAddressController::class, 'setPrimary']);
    Route::patch('/customer/shipping-addresses/{id}/toggle-active', [ShippingAddressController::class, 'toggleActive']);
    Route::get('/provinces', [LocationController::class, 'getProvinces']);
    Route::get('/provinces/{id}/cities', [LocationController::class, 'getCities']);

    // ==========================
    // 🚚 MANAJEMEN KURIR (ADMIN & SUPERADMIN)
    // ==========================
    Route::get('/couriers', [CourierController::class, 'index']);
    Route::post('/couriers', [CourierController::class, 'store']);
    Route::put('/couriers/{id}', [CourierController::class, 'update']);
    Route::patch('/couriers/{id}/toggle', [CourierController::class, 'toggleActive']);

    // ==========================
    // 💳 MANAJEMEN METODE PEMBAYARAN (ADMIN & SUPERADMIN)
    // ==========================
    Route::get('/payment-methods', [PaymentMethodController::class, 'index']);
    Route::post('/payment-methods', [PaymentMethodController::class, 'store']);
    Route::put('/payment-methods/{id}', [PaymentMethodController::class, 'update']);
    Route::patch('/payment-methods/{id}/toggle', [PaymentMethodController::class, 'toggleActive']);

    // ==========================
    // MANAJEMEN PESANAN (ADMIN & SUPERADMIN & PELANGGAN)
    // ==========================
    Route::post('/checkout', [OrderController::class, 'checkout']);
    Route::put('/orders/{id}/cancel', [OrderController::class, 'cancelOrder']);

    // Riwayat pesanan pelanggan
    Route::get('/orders/customer/product', [OrderController::class, 'indexByCustomerProduct']);
    Route::get('/orders/customer/product/{id}', [OrderController::class, 'showByCustomerProduct']);
    Route::get('/orders/customer/custom-pc', [OrderController::class, 'indexByCustomerCustomPC']);
    Route::get('/orders/customer/custom-pc/{id}', [OrderController::class, 'showByCustomerCustomPC']);
    // Riwayat pesanan admin
    Route::get('/orders/admin/product', [OrderController::class, 'indexForAdminProduct']);
    Route::get('/orders/admin/product/{id}', [OrderController::class, 'showForAdminProduct']);
    Route::get('/orders/admin/custom-pc', [OrderController::class, 'indexForAdminCustomPC']);
    Route::get('/orders/admin/custom-pc/{id}', [OrderController::class, 'showForAdminCustomPC']);

    // Pelanggan dan admin memverifikasi pembayaran
    Route::post('/orders/customer/product/{order}/payment-confirmation', [PaymentConfirmationController::class, 'storeProduct']);
    Route::post('/orders/customer/custom-pc/{order}/payment-confirmation', [PaymentConfirmationController::class, 'storeCustomPC']);
    Route::get('/orders/{orderId}/my-payment-confirmation', [PaymentConfirmationController::class, 'showByCustomer']);
    Route::put('/orders/{orderId}/confirm-payment', [PaymentConfirmationController::class, 'update']); 
    Route::get('/orders/{orderId}/payment-confirmation', [PaymentConfirmationController::class, 'show']);
    Route::patch('/orders/{orderId}/payment-confirmation/verify', [PaymentConfirmationController::class, 'verify']);

    // Admin dan pelanggan mengelola pengiriman
    // CUSTOMER - Produk Biasa
    Route::get('/customer/orders/product/{orderId}/delivery', [OrderDeliveryController::class, 'showProductByCustomer']);
    Route::put('/customer/orders/product/{orderId}/delivery/confirm', [OrderDeliveryController::class, 'confirmReceivedProduct']);
    // CUSTOMER - Rakitan PC
    Route::get('/customer/orders/custom-pc/{orderId}/delivery', [OrderDeliveryController::class, 'showCustomPCByCustomer']);
    Route::put('/customer/orders/custom-pc/{orderId}/delivery/confirm', [OrderDeliveryController::class, 'confirmReceivedCustomPC']);
    // ADMIN - Produk Biasa
    Route::get('/orders/product/{orderId}/delivery', [OrderDeliveryController::class, 'showProduct']);
    Route::post('/orders/product/{orderId}/delivery', [OrderDeliveryController::class, 'updateProduct']);
    Route::put('/orders/product/{orderId}/delivery/finish', [OrderDeliveryController::class, 'markAsFinishedProduct']);
    // ADMIN - Rakitan PC
    Route::get('/orders/custom-pc/{orderId}/delivery', [OrderDeliveryController::class, 'showCustomPC']);
    Route::post('/orders/custom-pc/{orderId}/delivery', [OrderDeliveryController::class, 'updateCustomPC']);
    Route::put('/orders/custom-pc/{orderId}/delivery/finish', [OrderDeliveryController::class, 'markAsFinishedCustomPC']);

    // Pelanggan menyimpan info perakitan
    Route::post('/custom-pc-orders', [CustomPCOrderController::class, 'store']);

    // Admin mengubah status pesanan order
    Route::patch('/orders/admin/product/{id}/update-status', [OrderController::class, 'updateStatus']);
    Route::patch('/orders/admin/custom-pc/{id}/update-status', [OrderController::class, 'updateStatus']);
    // Admin menyetujui semua pesanan produk yang menunggu verifikasi
    Route::post('/orders/admin/product/approve-all', [OrderController::class, 'approveAllPendingProductOrders']);

    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::patch('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::patch('/notifications/mark-all-read', [NotificationController::class, 'markAllAsRead']);
    Route::delete('/notifications/{id}', [NotificationController::class, 'destroy']);

    // Route::post('/orders/{orderId}/delivery', [OrderDeliveryController::class, 'update']);
    // Route::get('/orders/{orderId}/delivery', [OrderDeliveryController::class, 'show']);
    // Route::get('/orders/{orderId}/delivery/customer', [OrderDeliveryController::class, 'showByCustomer']);
    // Route::patch('/orders/{id}/mark-as-finished', [OrderDeliveryController::class, 'markAsFinished']);
    // Route::patch('/orders/{id}/confirm-received', [OrderDeliveryController::class, 'confirmReceived']);
});
