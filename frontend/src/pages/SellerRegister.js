// src/pages/SellerRegister.js
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import "./SellerRegister.css";

const SellerRegister = () => {
  const [formData, setFormData] = useState({
    email: "",
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
    setMessage("Processing registration...");

    try {
      const res = await axios.post("http://localhost:5001/api/seller/register", {
        email: formData.email,
        unique_id: formData.uniqueId,
        password: formData.password,
      });

      setMessage(res.data.message);

      if (res.status === 200) {
        setTimeout(() => navigate("/seller/login"), 2000);
      }
    } catch (err) {
      console.error("Registration error:", err);
      setMessage(
        err.response?.data?.message ||
          "Registration failed. Check your ID and status."
      );
    }
  };

  return (
    <div className="sellerreg-container">
      <div className="sellerreg-card">
        <h2>Seller Registration</h2>
        <form onSubmit={handleSubmit}>
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter your email"
            required
          />

          <label htmlFor="uniqueId">Generated ID</label>
          <input
            type="text"
            id="uniqueId"
            name="uniqueId"
            value={formData.uniqueId}
            onChange={handleChange}
            placeholder="SELL-123456"
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

          <button type="submit" className="sellerreg-btn">
            Register
          </button>
        </form>

        <p className="sellerreg-message">{message}</p>

        <Link to="/seller/login" className="sellerreg-link">
          Already registered? Login here.
        </Link>
      </div>
    </div>
  );
};

export default SellerRegister;
