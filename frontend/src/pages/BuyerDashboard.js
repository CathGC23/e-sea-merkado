// src/components/pages/BuyerDashboard.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import { FaShoppingCart, FaHome, FaStore, FaBell, FaUser, FaStar } from "react-icons/fa";
import "./BuyerDashboard.css";
import Shop from "./Shop";

// Import cart utilities
import { getCart, addToCart as addToCartUtil, getCartCount } from "../utils/cartUtils";

const BuyerDashboard = () => {
  const [products, setProducts] = useState([]);
  const [recentPurchases, setRecentPurchases] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState("home");
  const [searchTerm, setSearchTerm] = useState("");

  const CUSTOMER_ID = localStorage.getItem("customer_id") || "1";
  const navigate = useNavigate();

  // Update cart count
  const updateCartCount = () => {
    const count = getCartCount();
    setCartCount(count);
  };

  // Fetch all products
  const loadProducts = async () => {
    try {
      const res = await fetch("http://localhost:5001/api/seller/fish");
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      console.error("Error fetching products:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch recent purchases
  const loadRecentPurchases = async () => {
    try {
      const res = await fetch(
        `http://localhost:5002/api/buyer/purchases?buyer_id=${CUSTOMER_ID}`
      );
      
      if (!res.ok) {
        console.error(`HTTP error! status: ${res.status}`);
        setRecentPurchases([]);
        return;
      }
      
      const data = await res.json();
      setRecentPurchases(data);
    } catch (err) {
      console.error("Error fetching purchases:", err);
      setRecentPurchases([]);
    }
  };

  useEffect(() => {
    loadProducts();
    loadRecentPurchases();
    updateCartCount();

    // Listen for cart updates
    const handleCartUpdate = () => {
      updateCartCount();
    };

    window.addEventListener('cartUpdated', handleCartUpdate);
    
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, []);

  // Add product to cart using utility
  const addToCart = (product) => {
    addToCartUtil(product);
    updateCartCount();
    alert(`${product.name} added to cart!`);
  };

  // Render rating stars
  const renderStars = (rating) => (
    <div className="rating-stars">
      {Array.from({ length: 5 }).map((_, i) => (
        <FaStar key={i} className={i < rating ? "star filled" : "star"} />
      ))}
    </div>
  );

  if (loading) return <p>Loading dashboard...</p>;

  // Filter products by search term or show top 3 best sellers
  const filteredProducts = searchTerm
    ? products.filter((prod) =>
        prod.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [...products]
        .sort((a, b) => (b.sales_count || 0) - (a.sales_count || 0))
        .slice(0, 3);

  return (
    <div className="buyer-dashboard">
      <header className="dashboard-header">
        <div className="left-section">
          <img src={logo} alt="Sea Merkado Logo" className="dashboard-logo" />
          <input
            type="text"
            className="search-bar"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="right-section" onClick={() => navigate("/buyer/cart")}>
          <FaShoppingCart className="cart-icon" />
          {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
        </div>
      </header>

      <main className="dashboard-content">
        {currentPage === "home" && (
          <>
            <section className="recent-section">
              <h2>Recent Purchases</h2>
              {recentPurchases.length === 0 ? (
                <p>No recent purchases. Start shopping now!</p>
              ) : (
                <div className="product-list">
                  {recentPurchases.map((prod) => (
                    <div key={prod.purchase_id} className="product-card">
                      <img
                        src={
                          prod.image_url
                            ? `http://localhost:5001/uploads/${prod.image_url}`
                            : "https://via.placeholder.com/150?text=No+Image"
                        }
                        alt={prod.product_name}
                        className="product-img"
                      />
                      <h4>{prod.product_name}</h4>
                      <p>Price: ₱{Number(prod.price).toFixed(2)}</p>
                      <p>Quantity: {prod.quantity}</p>
                      <p className="order-info">
                        Order: {prod.order_number}
                      </p>
                      <span className={`status-badge ${prod.status}`}>
                        {prod.status}
                      </span>
                      <p className="purchase-date">
                        {new Date(prod.created_at).toLocaleDateString()}
                      </p>
                      {renderStars(prod.rating || 0)}
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="best-seller-section">
              <h2>{searchTerm ? "Search Results" : "Best Seller"}</h2>
              {filteredProducts.length === 0 ? (
                <p>No products found.</p>
              ) : (
                <div className="product-list">
                  {filteredProducts.map((prod) => (
                    <div key={prod.id} className="product-card">
                      <img
                        src={
                          prod.image_url
                            ? `http://localhost:5001/uploads/${prod.image_url}`
                            : "https://via.placeholder.com/150?text=No+Image"
                        }
                        alt={prod.name}
                        className="product-img"
                      />
                      <h4>{prod.name}</h4>
                      <p>Price: ₱{Number(prod.price).toFixed(2)}</p>
                      <p>Stock: {prod.stock}</p>
                      {renderStars(prod.rating || 0)}
                      <button onClick={() => addToCart(prod)}>Add to Cart</button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        {currentPage === "shop" && <Shop />}
      </main>

      {/* NAVBAR */}
      <nav className="bottom-nav">
        <div
          className={`nav-item ${currentPage === "home" ? "active" : ""}`}
          onClick={() => setCurrentPage("home")}
        >
          <FaHome />
          <span>Home</span>
        </div>

        <div
          className={`nav-item ${currentPage === "shop" ? "active" : ""}`}
          onClick={() => setCurrentPage("shop")}
        >
          <FaStore />
          <span>Shop</span>
        </div>

        <div className="nav-item" onClick={() => navigate("/buyer/notifications")}>
          <FaBell />
          <span>Notifications</span>
        </div>

        <div className="nav-item" onClick={() => navigate("/buyer/profile")}>
          <FaUser />
          <span>Profile</span>
        </div>
      </nav>
    </div>
  );
};

export default BuyerDashboard;