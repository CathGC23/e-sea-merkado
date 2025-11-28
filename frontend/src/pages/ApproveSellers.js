import React, { useEffect, useState } from "react";
import axios from "axios";
import AddSellerModal from "./AddSellerModal";
import ViewRequirementsModal from "./ViewRequirementsModal";
import "./ApproveSellers.css";

// Helper function to calculate the date difference in days
const getDaysDiff = (dateString) => {
  if (!dateString) return 0; // Handle cases where date_added is missing
  const oneDay = 24 * 60 * 60 * 1000; // milliseconds in a day
  const dateCreated = new Date(dateString);
  const today = new Date();
  return Math.round(Math.abs((today - dateCreated) / oneDay));
};

const ApproveSellers = () => {
  const [sellers, setSellers] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [showRequirementsModal, setShowRequirementsModal] = useState(false);

  // Function to determine and set the current display status
  const processSellers = (fetchedSellers) => {
    return fetchedSellers.map((seller) => {
      // Use the 'status' from the database as the base
      let displayStatus = seller.status; 

      // If the admin/system has already set it to 'accepted' or 'rejected', keep that status.
      if (displayStatus === "accepted" || displayStatus === "rejected") {
        return { ...seller, display_status: displayStatus };
      }

      // Check compliance based on the 'requirements' object
      const requirements = typeof seller.requirements === "string" 
          ? JSON.parse(seller.requirements) 
          : seller.requirements;

      const isCompliant = Object.values(requirements).every(Boolean);

      const daysSinceCreation = getDaysDiff(seller.date_added); 
      if (!isCompliant && daysSinceCreation >= 3) {
        displayStatus = "rejected";
      } else if (!isCompliant) {
        displayStatus = "pending";
      } else if (isCompliant && displayStatus !== "accepted") {
          displayStatus = "accepted";
      }

      return { ...seller, display_status: displayStatus };
    });
  };

  const fetchSellers = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/sellers");
      
      const data = res.data.map((s) => ({
        ...s,
        requirements:
          typeof s.requirements === "string"
            ? JSON.parse(s.requirements)
            : s.requirements,
      }));
      
      setSellers(processSellers(data));
      
    } catch (err) {
      console.error("❌ Error fetching sellers:", err);
    }
  };

  useEffect(() => {
    fetchSellers();
    // Set up a refresh interval to catch auto-rejections without a page reload
    const intervalId = setInterval(fetchSellers, 30000); // Check every 30 seconds
    return () => clearInterval(intervalId);
  }, []);

  const updateStatus = async (id, status) => {
    try {
      // Admin action is only to manually change 'pending' to 'accepted'
      if (status !== "accepted") return;

      await axios.put(`http://localhost:5000/api/sellers/${id}/status`, {
        status, // 'accepted'
      });
      alert(`Seller ${status} successfully`);
      fetchSellers();
    } catch (err) {
      console.error("❌ Error updating status:", err);
    }
  };

  const handleAddSeller = () => setShowAddModal(true);
  
  // Handles the data coming from the modal and sends it to the API
  const handleAddSuccess = async (newSellerData) => { 
    try {
      // The API call to add the seller
      await axios.post("http://localhost:5000/api/sellers", newSellerData);
      alert("Seller added successfully!");
    } catch (error) {
      console.error("❌ Error adding seller:", error);
      alert("Failed to add seller.");
    }
    fetchSellers();
    setShowAddModal(false);
  };

  const handleViewRequirements = (seller) => {
    setSelectedSeller(seller);
    setShowRequirementsModal(true);
  };

  return (
    <div className="approve-sellers-container">
      <div className="header-bar">
        <h2>Approve Sellers</h2>
        <button className="add-seller-btn" onClick={handleAddSeller}>
          + Add Seller
        </button>
      </div>

      <div className="table-card">
        <table className="sellers-table">
          <thead>
            <tr>
              <th>Generated ID</th> 
              <th>Full Name</th>
              <th>Shop Name</th>
              <th>Address</th>
              <th>Requirements</th>
              <th>Status</th> 
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {sellers.length > 0 ? (
              sellers.map((seller) => (
                <tr key={seller.id}>
                  <td>{seller.unique_id}</td>
                  <td>
                    {seller.first_name} {seller.middle_name} {seller.last_name}
                  </td>
                  <td>{seller.shop_name}</td>
                  <td>
                    {seller.street}, {seller.barangay}, {seller.municipality},{" "}
                    {seller.province}
                  </td>
                  <td>
                    <button
                      className="view-btn"
                      onClick={() => handleViewRequirements(seller)}
                    >
                      View
                    </button>
                  </td>
                  <td>
                    <span className={`status-badge ${seller.display_status}`}>
                      {seller.display_status}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      {/* Accept button is only clickable if the calculated status is PENDING */}
                      <button
                        className="approve-btn"
                        onClick={() => updateStatus(seller.id, "accepted")}
                        disabled={seller.display_status !== "pending"}
                      >
                        Accept
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="no-data">
                  No sellers found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <AddSellerModal
          onClose={() => setShowAddModal(false)}
          onAddSeller={handleAddSuccess}
        />
      )}

      {showRequirementsModal && selectedSeller && (
        <ViewRequirementsModal
          seller={selectedSeller}
          onClose={() => setShowRequirementsModal(false)}
        />
      )}
    </div>
  );
};

export default ApproveSellers;