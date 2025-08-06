import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Login & Register
import SuperAdminLogin from './pages/superadmin/Login';
import AdminLogin from './pages/admin/Login';
import CustomerLogin from './pages/customer/Login';
import RegisterCustomer from './pages/customer/Register';

// Auth Password
import ForgotPasswordCustomer from './pages/customer/auth/ForgotPassword';
import ResetPasswordCustomer from './pages/customer/auth/ResetPassword';
import ForgotPasswordAdmin from './pages/admin/auth/ForgotPassword';
import ResetPasswordAdmin from './pages/admin/auth/ResetPassword';
import ForgotPasswordSuperadmin from './pages/superadmin/auth/ForgotPassword';
import ResetPasswordSuperadmin from './pages/superadmin/auth/ResetPassword';

// Halaman Admin
import AdminDashboard from './pages/admin/AdminDashboard';
import StockEntryList from './pages/admin/stock/StockEntryList';
import StockDashboard from './pages/admin/stock/StockDashboard';
import CompatibilityManager from './pages/admin/compatibilities/CompatibilityManager';
import EditCompatibility from './pages/admin/compatibilities/EditCompatibility';
import DeliveryPaymentDashboard from './pages/admin/methods/DeliveryPaymentDashboard';
import OrderProductList from './pages/admin/orders/product/OrderProductList';
import OrderProductDetail from './pages/admin/orders/product/OrderProductDetail';
import OrderCustomPCDetail from './pages/admin/orders/custompc/OrderCustomPCDetail';
import OrderProductPaymentPage from './pages/admin/orders/OrderProductPaymentPage';
import OrderCustomPCPaymentPage from './pages/admin/orders/OrderCustomPCPaymentPage';
import OrderProductDeliveryPage from './pages/admin/orders/OrderProductDeliveryPage';
import OrderCustomDeliveryPage from './pages/admin/orders/OrderCustomDeliveryPage';
import FeedbackListAdmin from './pages/admin/feedback/FeedbackListAdmin';
import FeedbackDetailAdmin from './pages/admin/feedback/FeedbackDetailAdmin';
import NotificationListAdmin from './pages/admin/NotificationListAdmin';

// Superadmin Pages
import SuperadminDashboard from './pages/superadmin/SuperadminDashboard';
import AdminList from './pages/superadmin/ManageAdmin/AdminList';
import AddAdmin from './pages/superadmin/ManageAdmin/AddAdmin';
import EditAdmin from './pages/superadmin/ManageAdmin/EditAdmin';
import SuperadminProfile from './pages/superadmin/profile/SuperadminProfile';
import SuperadminOrderProductList from './pages/superadmin/orders/SuperadminOrderProductList';
import SuperadminOrderProductDetail from './pages/superadmin/orders/SuperadminOrderProductDetail';
import SuperadminOrderCustomPCDetail from './pages/superadmin/orders/SuperadminOrderCustomPCDetail';
import FeedbackListSuperadmin from './pages/superadmin/feedback/FeedbackListSuperadmin';
import FeedbackDetailSuperadmin from './pages/superadmin/feedback/FeedbackDetailSuperadmin';

// Profile
import CustomerProfile from './pages/customer/profile/CustomerProfile';
import AdminProfile from './pages/admin/profile/AdminProfile';

// Feedback
import CustomerFeedbackForm from './pages/customer/feedback/CustomerFeedbackForm';

// Produk (Admin)
import ProductList from './pages/admin/products/ProductList';
import AddProduct from './pages/admin/products/AddProduct';
import EditProduct from './pages/admin/products/EditProduct';

// halaman Pelanggan
import CustomerProductList from './pages/customer/products/ProductList';
import ProductDetail from './pages/customer/products/ProductDetail';
import CartPage from './pages/customer/cart/CartPage';
import WishlistPage from './pages/customer/wishlist/WishlistPage';
import CustomerAddressPage from './pages/customer/address/CustomerAddressPage';
import CheckoutPage from './pages/customer/order/CheckoutPage';
import CustomPCForm from './pages/customer/orders/CustomPCForm';
import OrderList from './pages/customer/orders/OrderList';
import OrderDetail from './pages/customer/orders/OrderDetail';
import CustomPCOrderDetail from './pages/customer/orders/CustomPCOrderDetail';
import OrderCustomerPaymentPage from './pages/customer/orders/OrderCustomerPaymentPage';
import OrderCustomerCustomPaymentPage from './pages/customer/orders/OrderCustomerCustomPaymentPage';
import OrderCustomerDeliveryPage from './pages/customer/orders/OrderCustomerDeliveryPage';
import OrderCustomerCustomDeliveryPage from './pages/customer/orders/OrderCustomerCustomDeliveryPage';
import FirstPageCustomPC from './pages/customer/orders/FirstPageCustomPC';
import CustomerNotificationPage from './pages/customer/CustomerNotificationPage';

// Metadata - Admin (Tab Layout)
import MetadataDashboard from './pages/admin/metadata/MetadataDashboard';

// Landing Page
import LandingPage from './pages/customer/LandingPage';

// Halaman Footer
import AboutUs from './pages/customer/AboutUs';
import PrivacyPolicy from './pages/customer/PrivacyPolicy';
import TermsAndConditions from './pages/customer/PrivacyPolicy';

function App() {
  return (
    <Router>
      <Routes>
        {/* Login & Register */}
        <Route path="/login" element={<CustomerLogin />} />
        <Route path="/login/superadmin" element={<SuperAdminLogin />} />
        <Route path="/login/admin" element={<AdminLogin />} />
        <Route path="/register" element={<RegisterCustomer />} />

        {/* Admin */}
        <Route path="/admin/auth/forgot-password" element={<ForgotPasswordAdmin />} />
        <Route path="/admin/auth/reset-password" element={<ResetPasswordAdmin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/products" element={<ProductList />} />
        <Route path="/admin/products/add" element={<AddProduct />} />
        <Route path="/admin/products/edit/:id" element={<EditProduct />} />
        <Route path="/admin/stock/:productId" element={<StockEntryList />} />
        <Route path="/admin/stock" element={<StockDashboard />} />
        <Route path="/admin/metadata" element={<MetadataDashboard />} />
        <Route path="/admin/compatibilities" element={<CompatibilityManager />} />
        <Route path="/admin/compatibilities/edit/:id" element={<EditCompatibility />} />
        <Route path="/admin/profile" element={<AdminProfile />} />
        <Route path="/admin/methods" element={<DeliveryPaymentDashboard />} />
        <Route path="/admin/orders/product" element={<OrderProductList />} />
        <Route path="/admin/orders/product/:id" element={<OrderProductDetail />} />
        <Route path="/admin/orders/custom-pc/:id" element={<OrderCustomPCDetail />} />
        <Route path="/admin/orders/product/:id/payment" element={<OrderProductPaymentPage />} />
        <Route path="/admin/orders/custompc/:id/payment" element={<OrderCustomPCPaymentPage />} />
        <Route path="/admin/orders/product/:id/delivery" element={<OrderProductDeliveryPage />} />
        <Route path="/admin/orders/custompc/:id/delivery" element={<OrderCustomDeliveryPage />} />
        <Route path="/admin/feedbacks" element={<FeedbackListAdmin />} />
        <Route path="/admin/feedbacks/:id" element={<FeedbackDetailAdmin />} />
        <Route path="/admin/notifications" element={<NotificationListAdmin />} />

        {/* Superadmin */}
        <Route path="/superadmin/auth/forgot-password" element={<ForgotPasswordSuperadmin />} />
        <Route path="/superadmin/auth/reset-password" element={<ResetPasswordSuperadmin />} />
        <Route path="/superadmin/dashboard" element={<SuperadminDashboard />} />
        <Route path="/superadmin/dashboard/manage-admin" element={<AdminList />} />
        <Route path="/superadmin/dashboard/manage-admin/add" element={<AddAdmin />} />
        <Route path="/superadmin/dashboard/manage-admin/edit/:id" element={<EditAdmin />} />
        <Route path="/superadmin/profile" element={<SuperadminProfile />} />
        <Route path="/superadmin/orders/product" element={<SuperadminOrderProductList />} />
        <Route path="/superadmin/orders/product/:id" element={<SuperadminOrderProductDetail />} />
        <Route path="/superadmin/orders/custom-pc/:id" element={<SuperadminOrderCustomPCDetail />} />
        <Route path="/superadmin/feedbacks" element={<FeedbackListSuperadmin />} />
        <Route path="/superadmin/feedbacks/:id" element={<FeedbackDetailSuperadmin />} />

        {/* Customer */}
        <Route path="/customer/auth/forgot-password" element={<ForgotPasswordCustomer />} />
        <Route path="/customer/auth/reset-password" element={<ResetPasswordCustomer />} />
        <Route path="/produk" element={<CustomerProductList />} />
        <Route path="/produk/:id" element={<ProductDetail />} />
        <Route path="/keranjang" element={<CartPage />} />
        <Route path="/wishlist" element={<WishlistPage />} />
        <Route path="/profile" element={<CustomerProfile />} />
        <Route path="/customer/addresses" element={<CustomerAddressPage />} />
        <Route path="/custom-pc" element={<FirstPageCustomPC />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/form/custom-pc" element={<CustomPCForm />} />
        <Route path="/history" element={<OrderList />} />
        <Route path="/history/:id" element={<OrderDetail />} />
        <Route path="/history/custompc/:id" element={<CustomPCOrderDetail />} />
        <Route path="/history/:id/payment" element={<OrderCustomerPaymentPage />} />
        <Route path="/history/custompc/:id/payment" element={<OrderCustomerCustomPaymentPage />} />
        <Route path="/history/:id/delivery" element={<OrderCustomerDeliveryPage />} />
        <Route path="/history/custompc/:id/delivery" element={<OrderCustomerCustomDeliveryPage />} />
        <Route path="/feedback" element={<CustomerFeedbackForm />} />
        <Route path="/customer/notifications" element={<CustomerNotificationPage />} />

        {/* Landing & Footer */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/tentang-kami" element={<AboutUs />} />
        <Route path="/kebijakan-privasi" element={<PrivacyPolicy />} />
        <Route path="/syarat-ketentuan" element={<TermsAndConditions />} />
      </Routes>
    </Router>
  );
}

export default App;
