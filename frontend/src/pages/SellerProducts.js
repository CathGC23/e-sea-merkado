// SellerProducts.js - COMPLETE WITH UNIQUE CLASS NAMES
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./SellerProducts.css";

function SellerProducts() {
  const { sellerId } = useParams(); // Get seller ID from URL
  const navigate = useNavigate();
  
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [shopName, setShopName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (sellerId) {
      loadData();
    }
  }, [sellerId]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch(
        `http://localhost:5000/api/admin/seller-products?seller_id=${sellerId}`
      );
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      
      console.log("✅ Loaded seller products:", data);
      
      setProducts(data.products || []);
      setCategories(data.categories || []);
      setShopName(data.shop_name || `Seller ${sellerId}`);
      
    } catch (err) {
      console.error("❌ Failed to load seller products:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts =
    selectedCategory === "All"
      ? products
      : products.filter((p) => p.category === selectedCategory);

  const getCategoryCount = (name) =>
    name === "All"
      ? products.length
      : products.filter((p) => p.category === name).length;

  // Loading State
  if (loading) {
    return (
      <div className="sp-container">
        <div className="sp-loading-spinner">
          <div className="sp-spinner"></div>
          <p>Loading products...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="sp-container">
        <div className="sp-header">
          <button onClick={() => navigate(-1)} className="sp-back-btn">
            &larr; Back to Sellers
          </button>
        </div>
        <div className="sp-error-message">
          <h3>⚠️ Error Loading Products</h3>
          <p>{error}</p>
          <button onClick={loadData} className="sp-retry-btn">
            🔄 Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="sp-container">
      {/* Header Section */}
      <div className="sp-header">
        <button onClick={() => navigate(-1)} className="sp-back-btn">
          &larr; Back to Sellers
        </button>
        <div className="sp-header-content">
          <h2>Products for {shopName}</h2>
          <div className="sp-product-count">
            {filteredProducts.length}{" "}
            {filteredProducts.length === 1 ? "Product" : "Products"}
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="sp-category-filter">
        <button
          className={`sp-category-btn ${selectedCategory === "All" ? "active" : ""}`}
          onClick={() => setSelectedCategory("All")}
        >
          All ({products.length})
        </button>

        {categories.map((cat) => (
          <button
            key={cat.id}
            className={`sp-category-btn ${
              selectedCategory === cat.category_name ? "active" : ""
            }`}
            onClick={() => setSelectedCategory(cat.category_name)}
          >
            {cat.category_name} ({getCategoryCount(cat.category_name)})
          </button>
        ))}
      </div>

      {/* Products Table or Empty State */}
      {filteredProducts.length === 0 ? (
        <div className="sp-no-products">
          <div className="sp-empty-state">
            <span className="sp-empty-icon">📦</span>
            <h3>No Products Found</h3>
            <p>
              {shopName} has no products
              {selectedCategory !== "All" && ` in "${selectedCategory}" category`}.
            </p>
          </div>
        </div>
      ) : (
        <div className="sp-table-wrapper">
          <table className="sp-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Name</th>
                <th>Category</th>
                <th>Price (₱/{products[0]?.unit || "kg"})</th>
                <th>Stock</th>
                <th>Previous Price</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {filteredProducts.map((p) => {
                // Determine stock status
                let stockStatus = "high";
                if (p.stock < 5) stockStatus = "critical";
                else if (p.stock <= 20) stockStatus = "low";

                // Determine price trend
                let priceTrend = "stable";
                if (p.previous_price && p.previous_price !== p.price) {
                  priceTrend = p.price > p.previous_price ? "up" : "down";
                }

                return (
                  <tr key={p.id}>
                    {/* Product Image */}
                    <td>
                      {p.image_url ? (
                        <img
                          src={`http://localhost:5001/uploads/${p.image_url}`}
                          alt={p.name}
                          className="sp-product-img"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "/placeholder-fish.png";
                          }}
                        />
                      ) : (
                        <div className="sp-no-image">📷</div>
                      )}
                    </td>

                    {/* Product Name */}
                    <td className="sp-product-name">{p.name}</td>

                    {/* Category */}
                    <td>
                      <span className="sp-category-badge">{p.category}</span>
                    </td>

                    {/* Current Price */}
                    <td className="sp-price-cell">
                      <span className="sp-current-price">
                        ₱{Number(p.price).toFixed(2)}
                      </span>
                      {priceTrend !== "stable" && (
                        <span className={`sp-price-trend ${priceTrend}`}>
                          {priceTrend === "up" ? "↑" : "↓"}
                        </span>
                      )}
                    </td>

                    {/* Stock Level */}
                    <td className={`sp-stock-cell ${stockStatus}`}>
                      <span className="sp-stock-value">
                        {p.stock} {p.unit || "kg"}
                      </span>
                      <span className={`sp-stock-badge ${stockStatus}`}>
                        {stockStatus === "critical" && "⚠️ Critical"}
                        {stockStatus === "low" && "📉 Low"}
                        {stockStatus === "high" && "✅ Good"}
                      </span>
                    </td>

                    {/* Previous Price */}
                    <td className="sp-previous-price">
                      {p.previous_price && p.previous_price !== p.price ? (
                        <span className="sp-old-price">
                          ₱{Number(p.previous_price).toFixed(2)}
                        </span>
                      ) : (
                        <span className="sp-no-change">-</span>
                      )}
                    </td>

                    {/* Status */}
                    <td>
                      <span className={`sp-status-badge ${p.stock > 0 ? "active" : "out-of-stock"}`}>
                        {p.stock > 0 ? "Active" : "Out of Stock"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default SellerProducts;