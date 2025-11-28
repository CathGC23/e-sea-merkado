import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ManageSellers.css";

function ManageSellers() {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSellers();
  }, []);

  const fetchSellers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log("🔄 Fetching sellers from API...");
      const res = await fetch("http://localhost:5000/api/admin/all-sellers");
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      console.log("✅ Received sellers data:", data);
      console.log("📊 Number of sellers:", data.length);
      
      // Log each seller for debugging
      data.forEach((seller, index) => {
        console.log(`Seller ${index + 1}:`, {
          unique_id: seller.unique_id,
          shop_name: seller.shop_name,
          first_name: seller.first_name,
          last_name: seller.last_name,
          logo: seller.logo
        });
      });
      
      setSellers(data);
    } catch (err) {
      console.error("❌ Failed to fetch sellers:", err);
      setError(err.message);
      setSellers([]);
    } finally {
      setLoading(false);
    }
  };

  const getFullName = (seller) => {
    const nameParts = [seller.first_name, seller.middle_name, seller.last_name]
      .filter(Boolean)
      .join(" ");
    return nameParts || "N/A";
  };

  const getFileUrl = (path) => {
    if (!path) return null;
    const normalized = path.startsWith("/") ? path : "/" + path;
    return `http://localhost:5001${normalized}`;
  };

  const handleViewProducts = (sellerUniqueId) => {
    console.log("🔍 Navigating to products for seller:", sellerUniqueId);
    navigate(`/admin/dashboard/seller-products/${sellerUniqueId}`);
  };

  // Loading State
  if (loading) {
    return (
      <div className="ms-container">
        <div className="ms-loading-spinner">
          <div className="ms-spinner"></div>
          <p>Loading sellers...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="ms-container">
        <div className="ms-error-box">
          <h3>⚠️ Error Loading Sellers</h3>
          <p>{error}</p>
          <button onClick={fetchSellers} className="ms-retry-btn">
            🔄 Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="ms-container">
      <h2>All Registered Sellers</h2>
      <p>Click a shop to view and manage their products.</p>

      {sellers.length === 0 ? (
        <div className="ms-no-sellers">
          <div className="ms-empty-state">
            <span className="ms-empty-icon">🏪</span>
            <h3>No Sellers Found</h3>
            <p>There are no accepted sellers in the system yet.</p>
            <small>Make sure sellers have been approved in the "Approve Sellers" section.</small>
          </div>
        </div>
      ) : (
        <div className="ms-list-wrapper">
          <table className="ms-table">
            <thead>
              <tr>
                <th>Logo</th>
                <th>Shop Name</th>
                <th>Seller Name</th>
                <th>ID</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {sellers.map((seller) => (
                <tr key={seller.unique_id}>
                  <td>
                    <div className="ms-logo-container">
                      {seller.logo ? (
                        <img
                          src={getFileUrl(seller.logo)}
                          alt={`${seller.shop_name} logo`}
                          className="ms-logo-thumb"
                          onError={(e) => {
                            console.warn("❌ Failed to load logo:", seller.logo);
                            e.target.style.display = "none";
                            e.target.parentElement.querySelector('.ms-no-logo').style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div 
                        className="ms-no-logo" 
                        style={{ display: seller.logo ? "none" : "flex" }}
                      >
                        🏪
                      </div>
                    </div>
                  </td>
                  <td className="ms-shop-name">
                    {seller.shop_name || "N/A"}
                  </td>
                  <td className="ms-seller-name">
                    {getFullName(seller)}
                  </td>
                  <td className="ms-seller-id">
                    <code>{seller.unique_id || "N/A"}</code>
                  </td>
                  <td>
                    <button
                      className="ms-view-btn"
                      onClick={() => handleViewProducts(seller.unique_id)}
                    >
                      View Products
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default ManageSellers;