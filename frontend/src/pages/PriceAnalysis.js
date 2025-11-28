import React, { useEffect, useState } from "react";
import "./PriceAnalysis.css";

const API_BASE_URL = "http://localhost:5001";

function PriceAnalysis() {
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [alertMessage, setAlertMessage] = useState(null);
  const [alertType, setAlertType] = useState("info");
  const [costPrice, setCostPrice] = useState(0);

  const SELLER_ID = localStorage.getItem("seller_unique_id");

  const showAlert = (message, type = "info") => {
    setAlertMessage(message);
    setAlertType(type);
    setTimeout(() => setAlertMessage(null), 4000);
  };

  // Fetch all products
  useEffect(() => {
    if (!SELLER_ID) {
      showAlert("Seller not logged in! Please log in.", "error");
      return;
    }
    
    const fetchProducts = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/seller/fish?seller_id=${encodeURIComponent(SELLER_ID)}`
        );
        if (!res.ok) throw new Error("Failed to fetch products.");
        const data = await res.json();
        setProducts(data);
      } catch (err) {
        console.error("Failed to load products:", err);
        showAlert("Error loading products list.", "error");
      }
    };
    
    fetchProducts();
  }, [SELLER_ID]);

  // Fetch analysis data for selected product
  const fetchPriceAnalysis = async (productId) => {
    if (!productId || !SELLER_ID) return;

    setLoading(true);
    setAnalysisData(null);
    
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/seller/price-analysis/${productId}?seller_id=${encodeURIComponent(SELLER_ID)}`
      );
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to fetch analysis.");
      }
      
      const data = await res.json();
      setAnalysisData(data);
      showAlert(`Analysis loaded for ${data.productName}`, 'success');
    } catch (err) {
      console.error("Failed to load price analysis:", err);
      showAlert(err.message || "Error loading price analysis data.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleViewAnalysis = (productId) => {
    setSelectedProductId(productId);
    setCostPrice(0); 
    fetchPriceAnalysis(productId);
  };

  // Handle suggestion acceptance
  const handleApplySuggestion = async (suggestion) => {
    const newPrice = suggestion.price;
    
    if (!window.confirm(
      `Apply ${suggestion.label}?\n\n` +
      `New Price: ₱${newPrice.toFixed(2)}/kg\n` +
      `This will update your stock management.`
    )) {
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/seller/fish/${selectedProductId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            price: newPrice, 
            seller_id: SELLER_ID 
          }),
        }
      );

      const data = await res.json();

      if (res.ok) {
        showAlert(
          `✓ Price updated to ₱${newPrice.toFixed(2)}/kg!`, 
          "success"
        );
        
        setProducts(prev => 
          prev.map(p => 
            p.id === parseInt(selectedProductId) 
              ? { ...p, price: newPrice } 
              : p
          )
        );
        
        setTimeout(() => fetchPriceAnalysis(selectedProductId), 800);
      } else {
        showAlert(data.message || "Error applying suggested price", "error");
      }
    } catch (err) {
      console.error("Failed to apply suggestion:", err);
      showAlert("Error communicating with the server.", "error");
    }
  };

  const renderAnalysisDetails = () => {
    if (!selectedProductId) {
      return (
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <h3>No Product Selected</h3>
          <p>Select a product from the table to view its price analysis and suggestions.</p>
        </div>
      );
    }

    if (loading) {
      return (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading analysis...</p>
        </div>
      );
    }

    if (!analysisData) return null;

    const { 
      productName, 
      currentPrice, 
      totalUpdates, 
      history, 
      suggestions,
      canGenerateSuggestions 
    } = analysisData;

    let trend = '✨ Initial';
    let trendClass = 'new';
    
    if (history.length > 0) {
      const lastChange = history[0];
      const oldPrice = Number(lastChange.old_price);
      
      if (currentPrice > oldPrice) {
        trend = '↗ Increased';
        trendClass = 'up';
      } else if (currentPrice < oldPrice) {
        trend = '↘ Decreased';
        trendClass = 'down';
      } else {
        trend = '→ Stable';
        trendClass = 'stable';
      }
    }

    return (
      <div className="analysis-details">
        <div className="detail-header">
          <div>
            <h3>{productName}</h3>
            <span className={`trend-badge ${trendClass}`}>{trend}</span>
          </div>
        </div>
        
        <div className="stats-grid">
          <div className="stat-box primary">
            <span className="stat-label">Current Price</span>
            <span className="stat-value">₱{parseFloat(currentPrice).toFixed(2)}<small>/kg</small></span>
          </div>
          <div className="stat-box">
            <span className="stat-label">Updates</span>
            <span className="stat-value">{totalUpdates}</span>
          </div>
          <div className="stat-box">
            <span className="stat-label">Changes</span>
            <span className="stat-value">{history.length}</span>
          </div>
        </div>
        
        <div className="suggestions-box">
          <h4>💡 Price Suggestions</h4>
          
          <div className="cost-price-input">
            <label htmlFor="cost-price">
              <span className="label-icon">💵</span>
              <span className="label-text">Cost Price per Kilo (Optional):</span>
            </label>
            <div className="input-wrapper">
              <span className="currency-symbol">₱</span>
              <input
                id="cost-price"
                type="text"
                inputMode="decimal"
                value={costPrice > 0 ? costPrice : ''}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9.]/g, '');
                  setCostPrice(parseFloat(value) || 0);
                }}
                placeholder="Enter your cost price (e.g., 100.00)"
              />
            </div>
            <small className="input-hint">
              {costPrice > 0 
                ? `Your cost: ₱${costPrice.toFixed(2)}/kg - Profit margins will be shown below` 
                : 'Enter the amount you paid to buy this fish per kilo'}
            </small>
          </div>
          
          {!canGenerateSuggestions ? (
            <div className="suggestion-notice">
              <p className="notice-title">Suggestions Not Ready</p>
              <p className="notice-text">
                Update price <strong>3 times</strong> to unlock suggestions.
              </p>
              <div className="progress-wrap">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{width: `${(totalUpdates / 3) * 100}%`}}
                  ></div>
                </div>
                <span className="progress-text">{totalUpdates}/3</span>
              </div>
            </div>
          ) : (
            <div className="suggestions-grid">
              {suggestions.map((s, index) => {
                const isCurrentPrice = Math.abs(s.price - currentPrice) < 0.01;
                const difference = s.price - currentPrice;
                const interest = costPrice > 0 ? s.price - costPrice : null;
                const interestPercentage = costPrice > 0 ? ((interest / costPrice) * 100) : null;
                
                return (
                  <div key={index} className={`suggestion-item ${isCurrentPrice ? 'current' : ''}`}>
                    <div className="suggestion-top">
                      <span className="suggestion-num">#{index + 1}</span>
                      {isCurrentPrice && <span className="current-tag">Current</span>}
                    </div>
                    <p className="suggestion-name">{s.label}</p>
                    <p className="suggestion-price">₱{s.price.toFixed(2)}<small>/kg</small></p>
                    
                    {/* Interest/Profit Display */}
                    {costPrice > 0 && (
                      <div className={`interest-box ${interest > 0 ? 'profit' : interest < 0 ? 'loss' : 'breakeven'}`}>
                        <div className="interest-label">
                          {interest > 0 ? '💰 Profit' : interest < 0 ? '⚠️ Loss' : '⚖️ Break-even'}
                        </div>
                        <div className="interest-amount">
                          ₱{Math.abs(interest).toFixed(2)}/kg
                        </div>
                        {interestPercentage !== null && (
                          <div className="interest-percent">
                            ({interest > 0 ? '+' : ''}{interestPercentage.toFixed(1)}% margin)
                          </div>
                        )}
                      </div>
                    )}
                    
                    {!isCurrentPrice && (
                      <p className={`suggestion-change ${difference > 0 ? 'positive' : 'negative'}`}>
                        {difference > 0 ? '+' : ''}₱{difference.toFixed(2)} vs current
                      </p>
                    )}
                    <button 
                      onClick={() => handleApplySuggestion(s)}
                      className={`apply-button ${isCurrentPrice ? 'disabled' : ''}`}
                      disabled={isCurrentPrice}
                    >
                      {isCurrentPrice ? '✓ Active' : 'Apply Price'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        <div className="history-box">
          <h4>📜 Price History</h4>
          
          {history.length === 0 ? (
            <div className="empty-history">
              <p>No price changes yet.</p>
            </div>
          ) : (
            <div className="history-table-container">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Previous</th>
                    <th>New</th>
                    <th>Change</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h, index) => {
                    const oldPrice = Number(h.old_price);
                    const newPrice = Number(h.new_price);
                    const difference = newPrice - oldPrice;
                    const isIncrease = difference > 0;
                    const isDecrease = difference < 0;
                    
                    return (
                      <tr key={index}>
                        <td>
                          <div className="date-col">
                            {new Date(h.change_date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                            <small>
                              {new Date(h.change_date).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </small>
                          </div>
                        </td>
                        <td>₱{oldPrice.toFixed(2)}</td>
                        <td>₱{newPrice.toFixed(2)}</td>
                        <td className={`change-col ${isIncrease ? 'positive' : isDecrease ? 'negative' : 'neutral'}`}>
                          {isIncrease ? '↗' : isDecrease ? '↘' : '→'}
                          {isIncrease && '+'}₱{difference.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="price-analysis-page">
      <div className="page-top">
        <h2>💰 Price Analysis</h2>
        <p>Track pricing trends and get smart recommendations</p>
      </div>

      {alertMessage && (
        <div className={`alert ${alertType}`}>
          {alertType === 'success' ? '✓' : alertType === 'error' ? '✕' : 'ℹ'} {alertMessage}
        </div>
      )}

      <div className="content-split">
        <div className="left-panel">
          <div className="panel-header">
            <h3>Products ({products.length})</h3>
          </div>
          
          {products.length === 0 ? (
            <div className="empty-products">
              <p>📦 No products available</p>
              <p className="hint">Add products in Stock Management</p>
            </div>
          ) : (
            <div className="products-table-container">
              <table className="products-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr 
                      key={product.id}
                      className={selectedProductId === product.id ? 'selected' : ''}
                    >
                      <td>
                        <div className="product-info">
                          <strong>{product.name}</strong>
                          <small>{product.category || 'Uncategorized'}</small>
                        </div>
                      </td>
                      <td className="price-col">₱{parseFloat(product.price).toFixed(2)}</td>
                      <td className="stock-col">{product.stock}kg</td>
                      <td>
                        <button
                          className="view-btn"
                          onClick={() => handleViewAnalysis(product.id)}
                        >
                          {selectedProductId === product.id ? '📊 Viewing' : '👁 View'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="right-panel">
          {renderAnalysisDetails()}
        </div>
      </div>
    </div>
  );
}

export default PriceAnalysis;