// RoleSelection.js (Revised)
import React from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import "./RoleSelection.css";

const RoleSelection = () => {
  const navigate = useNavigate();

  return (
    <div className="role-container">
      <div className="role-header">
        <img src={logo} alt="Sea Merkado Logo" className="role-logo" />
        <p className="role-tagline">The Mansalay's digital marketplace</p>
      </div>

      <div className="role-card">
        <h2 className="role-prompt">Please select your role to proceed:</h2>
        <div className="role-buttons">
          <button className="role-btn" onClick={() => navigate("/admin/login")}>
            Admin Login
          </button>
          <button className="role-btn" onClick={() => navigate("/seller/login")}>
            Seller Login
          </button>
          <button className="role-btn" onClick={() => navigate("/buyer/login")}>
            Customer Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoleSelection;