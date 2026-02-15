import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import AmaChat from './components/AmaChat';
import HomePage from './pages/HomePage';
import CategoryPage from './pages/CategoryPage';
import SellerStorePage from './pages/SellerStorePage';
import ProductPage from './pages/ProductPage';
import SearchResultsPage from './pages/SearchResultsPage';
import CheckoutPage from './pages/CheckoutPage';
import HelpCenterPage from './pages/HelpCenterPage';
import ContactUsPage from './pages/ContactUsPage';
import TermsOfServicePage from './pages/TermsOfServicePage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import HowItWorksPage from './pages/HowItWorksPage';
import BuyerProtectionPage from './pages/BuyerProtectionPage';
import StartSellingPage from './pages/StartSellingPage';
import SellerDashboardPage from './pages/SellerDashboardPage';
import SellerApplicationPage from './pages/SellerApplicationPage';
import SellerLoginPage from './pages/SellerLoginPage';
import SellerSignupPage from './pages/SellerSignupPage';
import SellerVerifyCodePage from './pages/SellerVerifyCodePage';
import SellerForgotPasswordPage from './pages/SellerForgotPasswordPage';
import SellerResetPasswordPage from './pages/SellerResetPasswordPage';
import SellerDashboard from './pages/SellerDashboard';
import BuyerLoginPage from './pages/BuyerLoginPage';
import BuyerSignupPage from './pages/BuyerSignupPage';
import BuyerVerifyCodePage from './pages/BuyerVerifyCodePage';
import BuyerForgotPasswordPage from './pages/BuyerForgotPasswordPage';
import BuyerResetPasswordPage from './pages/BuyerResetPasswordPage';
import BuyerDashboardPage from './pages/BuyerDashboardPage';
import AdminApplicationsPage from './pages/AdminApplicationsPage';
import AdminSellersPage from './pages/AdminSellersPage';
import ReceiptConfirmationPage from './pages/ReceiptConfirmationPage';
import DeliveryLoginPage from './pages/DeliveryLoginPage';
import DeliverySignupPage from './pages/DeliverySignupPage';
import DeliveryDashboardPage from './pages/DeliveryDashboardPage';
import CartPage from './pages/CartPage';
import CartCheckoutPage from './pages/CartCheckoutPage';
import WishlistPage from './pages/WishlistPage';
import DealsPage from './pages/DealsPage';
import './styles/App.css';
import './styles/MobileAnimations.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Header />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/category/:slug" element={<CategoryPage />} />
            <Route path="/seller/:slug" element={<SellerStorePage />} />
            <Route path="/product/:slug" element={<ProductPage />} />
            <Route path="/search" element={<SearchResultsPage />} />
            <Route path="/checkout/:productSlug" element={<CheckoutPage />} />
            <Route path="/help-center" element={<HelpCenterPage />} />
            <Route path="/contact-us" element={<ContactUsPage />} />
            <Route path="/terms-of-service" element={<TermsOfServicePage />} />
            <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
            <Route path="/how-it-works" element={<HowItWorksPage />} />
            <Route path="/buyer-protection" element={<BuyerProtectionPage />} />
            <Route path="/start-selling" element={<StartSellingPage />} />
            <Route path="/seller-dashboard" element={<SellerDashboardPage />} />
            <Route path="/seller-application" element={<SellerApplicationPage />} />
            <Route path="/seller/login" element={<SellerLoginPage />} />
            <Route path="/seller/signup" element={<SellerSignupPage />} />
            <Route path="/seller/verify-email" element={<SellerVerifyCodePage />} />
            <Route path="/seller/verify" element={<SellerVerifyCodePage />} />
            <Route path="/seller/verify-code" element={<SellerVerifyCodePage />} />
            <Route path="/seller/forgot-password" element={<SellerForgotPasswordPage />} />
            <Route path="/seller/reset-password" element={<SellerResetPasswordPage />} />
            <Route path="/seller/dashboard" element={<SellerDashboard />} />
            <Route path="/buyer/login" element={<BuyerLoginPage />} />
            <Route path="/buyer/signup" element={<BuyerSignupPage />} />
            <Route path="/buyer/verify-code" element={<BuyerVerifyCodePage />} />
            <Route path="/buyer/forgot-password" element={<BuyerForgotPasswordPage />} />
            <Route path="/buyer/reset-password" element={<BuyerResetPasswordPage />} />
            <Route path="/buyer/dashboard" element={<BuyerDashboardPage />} />
            <Route path="/delivery/login" element={<DeliveryLoginPage />} />
            <Route path="/delivery/signup" element={<DeliverySignupPage />} />
            <Route path="/delivery/dashboard" element={<DeliveryDashboardPage />} />
            <Route path="/admin/applications" element={<AdminApplicationsPage />} />
            <Route path="/admin/sellers" element={<AdminSellersPage />} />
            <Route path="/receipt-confirmation" element={<ReceiptConfirmationPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/cart-checkout" element={<CartCheckoutPage />} />
            <Route path="/wishlist" element={<WishlistPage />} />
            <Route path="/deals" element={<DealsPage />} />
          </Routes>
        </main>
        <Footer />
        <AmaChat />
      </div>
    </Router>
  );
}

export default App;
