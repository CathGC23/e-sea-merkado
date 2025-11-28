import React, { useEffect, useState } from "react";
import "./StockManagement.css";

function StockManagement() {
  const [stockItems, setStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editStock, setEditStock] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [alertMessage, setAlertMessage] = useState(null);
  const [alertType, setAlertType] = useState("info");

  const seller_id = localStorage.getItem("seller_unique_id");

  const showAlert = (message, type = "info") => {
    setAlertMessage(message);
    setAlertType(type);
    setTimeout(() => setAlertMessage(null), 4000);
  };

  useEffect(() => {
    const loadStock = async () => {
      if (!seller_id) {
        showAlert("Seller not logged in! Redirecting to login page...", "error");
        window.location.href = "/seller-login";
        return;
      }
      try {
        const res = await fetch(
          `http://localhost:5001/api/seller/fish?seller_id=${encodeURIComponent(seller_id)}`
        );
        const data = await res.json();
        setStockItems(data);
      } catch (err) {
        console.error("Failed to load stock:", err);
        showAlert("Error loading stock items", "error");
      } finally {
        setLoading(false);
      }
    };
    loadStock();
  }, [seller_id]);

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditStock(item.stock.toString());
    setEditPrice(item.price.toString());
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditStock("");
    setEditPrice("");
  };

  const updateStock = async (item) => {
    const newStock = parseFloat(editStock);
    const newPrice = parseFloat(editPrice);

    if (isNaN(newStock) || newStock < 0) {
      showAlert("Please enter a valid stock amount", "error");
      return;
    }
    if (isNaN(newPrice) || newPrice <= 0) {
      showAlert("Please enter a valid price", "error");
      return;
    }

    // Check if price has changed
    const priceChanged = newPrice !== parseFloat(item.price);
    
    if (!window.confirm(
      `Update ${item.name}?\n\n` +
      `Stock: ${item.stock}kg → ${newStock}kg\n` +
      `Price: ₱${parseFloat(item.price).toFixed(2)} → ₱${newPrice.toFixed(2)}` +
      (priceChanged ? '\n\n⚠️ Price change will be recorded in Price Analysis' : '')
    )) return;

    try {
      const res = await fetch(
        `http://localhost:5001/api/seller/fish/${item.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            stock: newStock, 
            price: newPrice,
            seller_id: seller_id  
          }),
        }
      );

      const data = await res.json();

      if (res.ok) {
        if (priceChanged) {
          showAlert(
            `${data.message} Price change recorded in Price Analysis!`, 
            "success"
          );
        } else {
          showAlert(data.message, "success");
        }
        
        setStockItems((prev) =>
          prev.map((i) =>
            i.id === item.id ? { ...i, stock: newStock, price: newPrice } : i
          )
        );
        cancelEdit();
      } else {
        showAlert(data.message || "Error updating product", "error");
      }
    } catch (err) {
      console.error("Failed to update stock:", err);
      showAlert("Error updating stock", "error");
    }
  };

  if (loading) {
    return (
      <div className="stock-container">
        <div className="loading">Loading stock...</div>
      </div>
    );
  }

  return (
    <div className="stock-container">
      <h2>Stock Management</h2>

      {alertMessage && (
        <div className={`alert-banner ${alertType}`}>{alertMessage}</div>
      )}

      <div className="table-wrapper">
        <table className="stock-table">
          <thead>
            <tr>
              <th>Product Name</th>
              <th>Category</th>
              <th>Stock</th>
              <th>Price (₱/kg)</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {stockItems.length === 0 ? (
              <tr>
                <td colSpan="5" className="no-data">
                  No products yet. Add products to manage stock.
                </td>
              </tr>
            ) : (
              stockItems.map((item) => {
                const isEditing = editingId === item.id;
                let stockStatus = "high";
                if (item.stock < 5) stockStatus = "critical";
                else if (item.stock <= 20) stockStatus = "low";

                return (
                  <tr key={item.id} className={isEditing ? "editing-row" : ""}>
                    <td className="product-name">{item.name}</td>
                    <td className="category">{item.category || "N/A"}</td>
                    <td className={`stock-cell ${stockStatus}`}>
                      {isEditing ? (
                        <div className="edit-input-group">
                          <input
                            type="text"
                            inputMode="decimal"
                            value={editStock}
                            onChange={(e) => setEditStock(e.target.value)}
                            className="stock-input"
                            placeholder="0"
                          />
                          <span className="unit-label">kg</span>
                        </div>
                      ) : (
                        <span className="stock-display">{item.stock} kg</span>
                      )}
                    </td>
                    <td className="price-cell">
                      {isEditing ? (
                        <div className="edit-input-group">
                          <span className="currency-symbol">₱</span>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={editPrice}
                            onChange={(e) => setEditPrice(e.target.value)}
                            className="price-input"
                            placeholder="0.00"
                          />
                        </div>
                      ) : (
                        <span className="price-display">
                          ₱{parseFloat(item.price).toFixed(2)}
                        </span>
                      )}
                    </td>
                    <td className="action-cell">
                      {isEditing ? (
                        <div className="action-buttons">
                          <button
                            onClick={() => updateStock(item)}
                            className="save-btn"
                          >
                            Save
                          </button>
                          <button onClick={cancelEdit} className="cancel-btn">
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEdit(item)}
                          className="update-btn"
                        >
                          Update
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {stockItems.length > 0 && (
        <div className="stock-summary">
          <div className="summary-item total">
            <span className="summary-label">Total Products</span>
            <span className="summary-value">{stockItems.length}</span>
          </div>
          <div className="summary-item critical">
            <span className="summary-label">Low Stock Alert</span>
            <span className="summary-value">
              {stockItems.filter((item) => item.stock < 5).length}
            </span>
          </div>
          <div className="summary-item low">
            <span className="summary-label">Moderate Stock</span>
            <span className="summary-value">
              {
                stockItems.filter(
                  (item) => item.stock >= 5 && item.stock <= 20
                ).length
              }
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default StockManagement;