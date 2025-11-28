import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; 
import './Shop.css'; 

const Shop = () => {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate(); 

  useEffect(() => {
    const loadShops = async () => {
      try {
        const res = await fetch("http://localhost:5002/api/shop");
        if (!res.ok) throw new Error("Failed to fetch shop data");
        const data = await res.json();
        const processedData = data.map(shop => ({
          ...shop,
          products: Array.isArray(shop.products) ? shop.products : []
        }));
        setShops(processedData);
      } catch (err) {
        console.error("Error fetching shops:", err);
        setShops([]);
      } finally {
        setLoading(false);
      }
    };

    loadShops();
  }, []);

  const handleShopClick = (shopId, shopName) => {
    navigate(`/shop/${shopId}`, { state: { shopName: shopName } });
  };
  
  if (loading) return <p className="loading-message">Loading shops...</p>;
  if (shops.length === 0) return <p className="no-shops-message">No shops available.</p>;

  return (
    <div className="shop-container">
      {shops.map((shop) => (
        <div 
          key={shop.seller_id} 
          className="shop-card navigation-card"
          onClick={() => handleShopClick(shop.seller_id, shop.shop_name)}
        >
          <div className="shop-header">
            <div className="shop-info">
              {shop.logo ? (
                <img
                  src={`http://localhost:5001${shop.logo}`}
                  alt={`${shop.shop_name} logo`}
                  className="shop-logo"
                  onError={(e) => { 
                    e.target.onerror = null; 
                    e.target.src = '/placeholder-logo.png'; 
                    console.log(`Failed to load logo for ${shop.shop_name}`); 
                  }}
                />
              ) : (
                <div className="shop-logo shop-logo-placeholder">🏪</div>
              )}
              <h2 className="shop-name">{shop.shop_name}</h2>
            </div>
            
            <div className="product-count">
              {shop.products.length} Product{shop.products.length !== 1 ? 's' : ''}
              <span className="toggle-icon right-arrow">&#10095;</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Shop;