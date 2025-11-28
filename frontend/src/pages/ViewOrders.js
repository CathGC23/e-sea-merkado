import React, { useEffect, useState } from "react";
import "./ViewOrders.css";

const STATUS_OPTIONS = ["Pending", "Preparing", "Ready for Pickup", "Completed", "Cancelled"];

export default function ViewOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProof, setSelectedProof] = useState(null);

  const sellerId = localStorage.getItem("seller_unique_id");

  const fetchOrders = async () => {
    if (!sellerId) {
      setError("Seller ID not found. Please log in.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`http://localhost:5001/api/orders?seller_id=${sellerId}`);
      if (!res.ok) throw new Error("Failed to fetch orders");
      const data = await res.json();
      setOrders(data);
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusChange = async (orderId, newStatus) => {
    if (!window.confirm(`Change order ${orderId} status to "${newStatus}"?`)) return;

    try {
      const res = await fetch(`http://localhost:5001/api/orders/${orderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          seller_id: sellerId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(`Failed to update status: ${data.message}`);
        return;
      }

      setOrders((prev) =>
        prev.map((order) =>
          order.orderId === orderId ? { ...order, status: newStatus } : order
        )
      );

      alert(`✅ Order ${orderId} status updated to "${newStatus}"\n📬 Customer has been notified!`);

    } catch (err) {
      console.error("Error updating status:", err);
      alert("Error communicating with server.");
    }
  };

  const viewProof = (proofPath) => {
    if (!proofPath) {
      alert("No proof of payment available for this order.");
      return;
    }
    setSelectedProof(proofPath);
  };

  const closeProofModal = () => {
    setSelectedProof(null);
  };

  if (loading) return <p className="loading">Loading orders...</p>;
  if (error) return <p className="error">Error: {error}</p>;

  return (
    <div className="view-orders-container">
      {orders.length === 0 ? (
        <p className="no-orders">No orders found.</p>
      ) : (
        <table className="view-orders-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Contact</th>
              <th>Total</th>
              <th>Date</th>
              <th>Items</th>
              <th>Proof</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.orderId}>
                <td>{o.orderId}</td>
                <td>{o.customerName}</td>
                <td>{o.contact}</td>
                <td>₱{Number(o.total).toFixed(2)}</td>
                <td>{new Date(o.orderDate).toLocaleString()}</td>
                <td>
                  {o.items.length === 0 ? (
                    <span className="no-items">No items</span>
                  ) : (
                    <div className="items-wrapper">
                      <table className="items-table">
                        <thead>
                          <tr>
                            <th className="product-col">Product</th>
                            <th className="qty-col">Qty</th>
                            <th className="price-col">Price</th>
                          </tr>
                        </thead>
                        <tbody>
                          {o.items.map((it) => (
                            <tr key={it.itemId}>
                              <td className="product-col">{it.productName}</td>
                              <td className="qty-col">{it.quantity}</td>
                              <td className="price-col">₱{it.price}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </td>
                <td className="proof-cell">
                  {o.proofOfPayment ? (
                    <button
                      className="btn-view-proof"
                      onClick={() => viewProof(o.proofOfPayment)}
                    >
                      📸 View Proof
                    </button>
                  ) : (
                    <span className="no-proof">No proof</span>
                  )}
                </td>
                <td>
                  <span className="status-cell" data-status={o.status || "Pending"}>
                    {o.status || "Pending"}
                  </span>
                </td>
                <td>
                  <select
                    className="status-dropdown"
                    value={o.status || "Pending"}
                    onChange={(e) =>
                      handleStatusChange(o.orderId, e.target.value)
                    }
                    disabled={o.status === "Completed" || o.status === "Cancelled"}
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {selectedProof && (
        <div className="proof-modal-overlay" onClick={closeProofModal}>
          <div className="proof-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="proof-modal-header">
              <h3>Proof of Payment</h3>
              <button className="proof-modal-close" onClick={closeProofModal}>
                ×
              </button>
            </div>
            <div className="proof-modal-body">
              <img
                src={`http://localhost:5001${selectedProof}`}
                alt="Proof of Payment"
                className="proof-image"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/placeholder-image.png';
                }}
              />
            </div>
            <div className="proof-modal-footer">
              <a
                href={`http://localhost:5001${selectedProof}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-download-proof"
              >
                📥 Download Image
              </a>
              <button className="btn-close-proof" onClick={closeProofModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}