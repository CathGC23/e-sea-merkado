import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import "./SellerLogin.css";

const SellerLogin = () => {
  const [formData, setFormData] = useState({
    uniqueId: "",
    password: "",
  });
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("Logging in...");

    try {
      const res = await axios.post("http://localhost:5001/api/seller/login", {
        unique_id: formData.uniqueId,
        password: formData.password,
      });

      setMessage(res.data.message);

      if (res.status === 200) {
        // ✅ Store with the correct key that AddFishProducts expects
        localStorage.setItem("seller_unique_id", formData.uniqueId);
        setTimeout(() => navigate("/seller/dashboard"), 2000);
      }
    } catch (err) {
      console.error("Login error:", err);
      setMessage(
        err.response?.data?.message || "Login failed. Check your ID and password."
      );
    }
  };

  return (
    <div className="seller-container">
      <div className="seller-card">
        <h2>Seller Login</h2>
        <form onSubmit={handleSubmit}>
          <label htmlFor="uniqueId">Generated ID</label>
          <input
            type="text"
            id="uniqueId"
            name="uniqueId"
            value={formData.uniqueId}
            onChange={handleChange}
            placeholder="Enter your ID"
            required
          />

          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter your password"
            required
          />

          <button type="submit" className="seller-btn">
            Login
          </button>
        </form>

        <p className="seller-message">{message}</p>

        <Link to="/seller/register" className="seller-link">
          New seller? Register here.
        </Link>
      </div>
    </div>
  );
};

export default SellerLogin;
