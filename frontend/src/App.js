import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Admin Pages & Components
import Home from "./pages/Home";
import RoleSelection from "./pages/RoleSelection";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import ManageSellers from "./pages/ManageSellers";
import SellerProducts from "./pages/SellerProducts";

// Seller Pages & Components
import SellerLogin from "./pages/SellerLogin";
import SellerRegister from "./pages/SellerRegister";
import SellerDashboard from "./pages/SellerDashboard";
import SellerHome from "./pages/SellerHome";
import AddFishProducts from "./pages/AddFishProducts";
import StockManagement from "./pages/StockManagement";
import ViewOrders from "./pages/ViewOrders";
import AllProducts from "./pages/AllProducts";
import PriceAnalysis from "./pages/PriceAnalysis";
import Profile from "./pages/Profile";

// Buyer Pages & Components
import BuyerLogin from "./pages/BuyerLogin";
import BuyerRegister from "./pages/BuyerRegister";
import BuyerDashboard from "./pages/BuyerDashboard";
import Shop from "./pages/Shop";
import BuyerProfile from "./pages/BuyerProfile";
import ShopProductPage from "./pages/ShopProductPage"; 

// Cart Page
import CartPage from "./pages/CartPage";

// Notifications Page (NEW)
import BuyerNotifications from "./pages/BuyerNotifications";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* General Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/role" element={<RoleSelection />} />

        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />}>
          <Route path="manage-products" element={<ManageSellers />} />
          <Route path="seller-products/:sellerId" element={<SellerProducts />} />
        </Route>

        {/* Seller Routes */}
        <Route path="/seller/login" element={<SellerLogin />} />
        <Route path="/seller/register" element={<SellerRegister />} />
        <Route path="/seller/dashboard" element={<SellerDashboard />}>
          <Route path="home" element={<SellerHome />} />
          <Route path="add-fish" element={<AddFishProducts />} />
          <Route path="stock" element={<StockManagement />} />
          <Route path="orders" element={<ViewOrders />} />
          <Route path="products" element={<AllProducts />} />
          <Route path="price" element={<PriceAnalysis />} />
          <Route path="profile" element={<Profile />} />
        </Route>

        {/* Buyer Routes */}
        <Route path="/buyer/login" element={<BuyerLogin />} />
        <Route path="/buyer/register" element={<BuyerRegister />} />
        <Route path="/buyer/dashboard" element={<BuyerDashboard />} />
        <Route path="/buyer/shop" element={<Shop />} />
        <Route path="/buyer/profile" element={<BuyerProfile />} />
        <Route path="/buyer/cart" element={<CartPage />} />

        <Route path="/buyer/notifications" element={<BuyerNotifications />} />

        <Route path="/shop/:shopId" element={<ShopProductPage />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
