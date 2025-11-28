import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "./BuyerLogin.css";

const BuyerLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("Logging in...");

    try {
      console.log("🔐 Attempting login for:", email);
      
      const res = await axios.post("http://localhost:5002/api/buyer/login", {
        email,
        password,
      });

      if (res.status === 200) {
        console.log("Full Response:", res.data);
        
        const { buyer } = res.data;
        
        if (!buyer || !buyer.id) {
          console.error("❌ CRITICAL: Backend did not return buyer.id!");
          setMessage("Login error: Invalid response from server.");
          return;
        }
        
        console.log("Buyer object:", buyer);
        console.log("   - ID:", buyer.id);
        console.log("   - Email:", buyer.email);
        console.log("   - Username:", buyer.username);
        
        // Use sessionStorage instead of localStorage for tab-specific sessions
        sessionStorage.setItem("customer_id", String(buyer.id));
        sessionStorage.setItem("buyerEmail", buyer.email);
        sessionStorage.setItem("buyerName", buyer.username || buyer.first_name || "Customer");
        
        localStorage.setItem("last_customer_id", String(buyer.id));
        
        // Verify it was saved
        const savedId = sessionStorage.getItem("customer_id");
        const savedEmail = sessionStorage.getItem("buyerEmail");
        const savedName = sessionStorage.getItem("buyerName");
        
        console.log("✅ Data saved to sessionStorage (tab-specific):");
        console.log("   ✓ customer_id:", savedId);
        console.log("   ✓ buyerEmail:", savedEmail);
        console.log("   ✓ buyerName:", savedName);
        console.log("   ✓ Cart key will be: cart_" + savedId);
        
        if (!savedId) {
          console.error("❌ CRITICAL ERROR: customer_id was NOT saved!");
          setMessage("Error: Failed to save session. Please try again.");
          return;
        }
        
        setMessage("Login successful! Redirecting...");
        
        setTimeout(() => {
          navigate("/buyer/dashboard");
        }, 500);
      }
    } catch (err) {
      console.error("❌ Login Error:", err);
      if (err.response) {
        console.error("   Status:", err.response.status);
        console.error("   Data:", err.response.data);
        setMessage(err.response.data?.message || "Invalid credentials.");
      } else {
        console.error("   Error:", err.message);
        setMessage("Network error. Please check if the server is running.");
      }
    }
  };

  return (
    <div className="buyer-container">
      <div className="buyer-card">
        <h2>Customer Login</h2>
        <form onSubmit={handleLogin}>
          <label>Email</label>
          <input
            type="email"
            value={email}
            placeholder="Enter your email"
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <label>Password</label>
          <input
            type="password"
            value={password}
            placeholder="Enter your password"
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" className="buyer-btn">Login</button>
        </form>
        {message && <p className="buyer-message">{message}</p>}
        <p>
          Don't have an account?{" "}
          <Link to="/buyer/register" className="buyer-link">
            Register here.
          </Link>
        </p>
      </div>
    </div>
  );
};

export default BuyerLogin;