import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom"; 
import './ShopProductPage.css';

// ✅ Import cart utilities
import { addToCart as addToCartUtil, getCartCount } from "../utils/cartUtils";

const ShopProductPage = () => {
  const { shopId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();

  const shopName = state?.shopName || 'Shop Products';

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cartCount, setCartCount] = useState(0);

  // ✅ Update cart count
  const updateCartCount = () => {
    const count = getCartCount();
    setCartCount(count);
  };

  // ✅ Add to cart using utility (user-specific)
  const addToCart = (product) => {
    // Normalize price
    const priceNum = Number(product.new_price ?? product.price ?? 0);
    const productToAdd = { ...product, price: priceNum };
    
    // Use utility function
    addToCartUtil(productToAdd);
    updateCartCount();
    
    // Show toast notification
    showToast(`${product.name} added to cart!`);
  };

  // ✅ Toast notification helper
  const showToast = (message) => {
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 2000);
  };

  const renderStars = (value) => {
    const v = Math.max(0, Math.min(5, Number(value) || 0));
    if (v === 0) return <span className="no-rating">No rating</span>;
    
    const full = Math.floor(v);
    const half = v - full >= 0.5 ? 1 : 0;
    const empty = 5 - full - half;
    
    return (
      <span aria-label={`Rating ${v} out of 5`} className="rating-stars">
        {"★".repeat(full)}{half ? "⯪" : ""}{"☆".repeat(empty)}
        <span className="rating-value">({v.toFixed(1)})</span>
      </span>
    );
  };

  useEffect(() => {
    const loadProducts = async () => {
      try {
        // Try the dedicated endpoint first
        const res = await fetch(`http://localhost:5002/api/shop/${shopId}/products`);
        
        if (!res.ok) {
          // Fallback: fetch all shops and filter
          const allShopsRes = await fetch("http://localhost:5002/api/shop");
          if (!allShopsRes.ok) throw new Error("Failed to fetch products");
          
          const allShops = await allShopsRes.json();
          const shopData = allShops.find(shop => String(shop.seller_id) === shopId);
          setProducts(shopData?.products || []);
        } else {
          const data = await res.json();
          setProducts(data.products || data || []);
        }

      } catch (err) {
        console.error(`Error fetching products for shop ${shopId}:`, err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
    updateCartCount();

    // ✅ Listen for cart updates from other components
    const handleCartUpdate = () => {
      updateCartCount();
    };

    window.addEventListener('cartUpdated', handleCartUpdate);
    
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, [shopId]);

  if (loading) return <p className="loading-message">Loading products...</p>;

  return (
    <div className="product-page-container">
      <div className="page-header">
        <button onClick={() => navigate(-1)} className="back-btn">
          &#8592; Back to Shops
        </button>
        
        <h1 className="page-title">{shopName}</h1>
        
        {/* ✅ Cart button with count */}
        <button className="header-cart-btn" onClick={() => navigate("/buyer/cart")}>
          🛒
          {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
        </button>
      </div>
      
      <hr/>
      
      {products.length === 0 ? (
        <p className="no-products-message">This shop has no products available.</p>
      ) : (
        <div className="product-list-grid">
          {products.map((prod) => {
            const rating = prod.avg_rating ?? prod.rating ?? prod.product_rating ?? null;
            const price = Number(prod.new_price ?? prod.price ?? 0);
            const imageUrl = prod.image_url ? `http://localhost:5001/uploads/${prod.image_url}` : "";
            
            return (
              <div key={prod.id} className="product-card">
                <img
                  src={imageUrl || "https://via.placeholder.com/200?text=No+Image"}
                  alt={prod.name}
                  className="product-image"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://via.placeholder.com/200?text=No+Image";
                  }}
                />
                <h4 className="product-name">{prod.name}</h4>
                <p className="product-price"><b>₱{price.toFixed(2)}</b></p>
                <p className={`product-stock ${prod.stock <= 5 ? 'low-stock' : ''}`}>
                  Stock: {prod.stock}
                </p>
                <div className="product-rating">{renderStars(rating)}</div>
                <button 
                  className="cart-btn" 
                  onClick={() => addToCart(prod)}
                  disabled={prod.stock === 0}
                >
                  {prod.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ShopProductPage;