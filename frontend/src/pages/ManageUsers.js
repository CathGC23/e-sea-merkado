import React, { useEffect, useState } from "react";
import axios from "axios";
import "./ManageUsers.css";

const ManageUsers = () => {
  const [buyers, setBuyers] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [selectedBuyer, setSelectedBuyer] = useState(null);

  useEffect(() => {
    fetchBuyers();
    fetchSellers();
  }, []);

  const fetchBuyers = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/all-buyers");
      setBuyers(res.data);
    } catch (error) {
      console.error("Error fetching buyers:", error);
    }
  };

  const fetchSellers = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/all-sellers");
      setSellers(res.data);
    } catch (error) {
      console.error("Error fetching sellers:", error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString || dateString === "N/A") return "N/A";
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? "N/A" : date.toLocaleDateString();
  };

  return (
    <div className="manage-users-container">
      {/* Buyers */}
      <div className="users-section">
        <h3>Buyers</h3>
        <table>
          <thead>
            <tr>
              <th>Full Name</th>
              <th>Date Created</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {buyers.length > 0 ? (
              buyers.map((buyer) => (
                <tr key={buyer.id}>
                  <td>{buyer.full_name || `${buyer.first_name} ${buyer.last_name}`}</td>
                  <td>{formatDate(buyer.created_at)}</td>
                  <td>
                    <button
                      className="view-btn"
                      onClick={() => setSelectedBuyer(buyer)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" style={{ textAlign: "center" }}>
                  No buyers found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Sellers */}
      <div className="users-section">
        <h3>Sellers</h3>
        <table>
          <thead>
            <tr>
              <th>Unique ID</th>
              <th>Email</th>
              <th>Date Registered</th>
            </tr>
          </thead>
          <tbody>
            {sellers.length > 0 ? (
              sellers.map((seller) => (
                <tr key={seller.id}>
                  <td>{seller.unique_id}</td>
                  <td>{seller.email || "N/A"}</td>
                  <td>{formatDate(seller.date_registered)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" style={{ textAlign: "center" }}>
                  No sellers found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Buyer Modal */}
      {selectedBuyer && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h4>Buyer Info</h4>
            <p><strong>Username:</strong> {selectedBuyer.username}</p>
            <p><strong>Email:</strong> {selectedBuyer.email}</p>
            <p><strong>Contact:</strong> {selectedBuyer.contact}</p>
            <button className="close-btn" onClick={() => setSelectedBuyer(null)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageUsers;
