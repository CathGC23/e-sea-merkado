import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./BuyerProfile.css";

const BuyerProfile = () => {
  const [buyer, setBuyer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchBuyerProfile();
  }, []);

  const fetchBuyerProfile = async () => {
    const customer_id = sessionStorage.getItem("customer_id");
    
    if (!customer_id) {
      setError("Not logged in. Please login first.");
      setLoading(false);
      navigate("/buyer/login");
      return;
    }

    try {
      console.log("🔍 Fetching profile for customer_id:", customer_id);
      
      const res = await axios.get(
        `http://localhost:5002/api/buyer/profile/${customer_id}`
      );
      
      if (res.status === 200) {
        console.log("✅ Profile loaded:", res.data);
        setBuyer(res.data);
      }
    } catch (err) {
      console.error("❌ Error fetching profile:", err);
      setError(
        err.response?.data?.message || "Failed to load profile."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    const customer_id = sessionStorage.getItem("customer_id");
    console.log("🚪 Logging out customer:", customer_id);

    // Clear session data
    sessionStorage.removeItem("customer_id");
    sessionStorage.removeItem("buyerEmail");
    sessionStorage.removeItem("buyerName");

    console.log("Session cleared.");
    navigate("/buyer/login");
  };

  if (loading) {
    return (
      <div className="profile-container">
        <div className="profile-card">
          <div className="loading-spinner">Loading profile...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-container">
        <div className="profile-card">
          <div className="error-message">{error}</div>
          <button 
            className="btn-back" 
            onClick={() => navigate("/buyer/login")}
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-card">
        <div className="profile-header">
          <h2>My Profile</h2>
          <button className="btn-logout" onClick={handleLogout}>
            Logout
          </button>
        </div>

        {buyer && (
          <div className="profile-info">
            <div className="info-section">
              <h3>Account Information</h3>
              
              <div className="info-row">
                <span className="info-label">Customer ID:</span>
                <span className="info-value">{buyer.id}</span>
              </div>

              <div className="info-row">
                <span className="info-label">Username:</span>
                <span className="info-value">{buyer.username}</span>
              </div>

              <div className="info-row">
                <span className="info-label">Email:</span>
                <span className="info-value">{buyer.email}</span>
              </div>

              <div className="info-row">
                <span className="info-label">Contact:</span>
                <span className="info-value">
                  {buyer.contact || "Not provided"}
                </span>
              </div>
            </div>

            <div className="info-section">
              <h3>Personal Information</h3>
              
              <div className="info-row">
                <span className="info-label">First Name:</span>
                <span className="info-value">
                  {buyer.first_name || "Not provided"}
                </span>
              </div>

              <div className="info-row">
                <span className="info-label">Middle Name:</span>
                <span className="info-value">
                  {buyer.middle_name || "Not provided"}
                </span>
              </div>

              <div className="info-row">
                <span className="info-label">Last Name:</span>
                <span className="info-value">
                  {buyer.last_name || "Not provided"}
                </span>
              </div>

              <div className="info-row">
                <span className="info-label">Member Since:</span>
                <span className="info-value">
                  {new Date(buyer.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="profile-actions">
          <button 
            className="btn-dashboard" 
            onClick={() => navigate("/buyer/dashboard")}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default BuyerProfile;