import React, { useState } from "react";
import { Link, Outlet } from "react-router-dom";
import {
  FaHome,
  FaBoxOpen,
  FaClipboardList,
  FaChartBar,
  FaUserCircle,
  FaSignOutAlt,
  FaBars,
  FaTimes,
} from "react-icons/fa";
import "./SellerDashboard.css";
import logo from "../assets/logo.png";

const SellerDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("sellerToken");
    localStorage.removeItem("uniqueId");
    window.location.href = "/role";
  };

  return (
    <div className="dashboard-container">
      {/* Mobile Header */}
      <header className="mobile-header">
        <button
          className="menu-toggle"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <FaTimes /> : <FaBars />}
        </button>
        <img src={logo} alt="Sea-Merkado Logo" className="mobile-logo" />
      </header>

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <img src={logo} alt="e-Sea-Merkado Logo" className="sidebar-logo" />
          <h3>e-Sea-Merkado</h3>
        </div>
        <nav className="sidebar-nav">
          <Link to="/seller/dashboard/home" className="nav-link">
            <FaHome />
            <span>Home</span>
          </Link>
          <Link to="/seller/dashboard/add-fish" className="nav-link">
            <FaBoxOpen />
            <span>Add Fish Products</span>
          </Link>
          <Link to="/seller/dashboard/stock" className="nav-link">
            <FaClipboardList />
            <span>Stock Management</span>
          </Link>
          <Link to="/seller/dashboard/orders" className="nav-link">
            <FaClipboardList />
            <span>View Orders</span>
          </Link>
          <Link to="/seller/dashboard/products" className="nav-link">
            <FaBoxOpen />
            <span>All Products</span>
          </Link>
          <Link to="/seller/dashboard/price" className="nav-link">
            <FaChartBar />
            <span>Price Analysis</span>
          </Link>
          <Link to="/seller/dashboard/profile" className="nav-link">
            <FaUserCircle />
            <span>Profile</span>
          </Link>
        </nav>
        <button onClick={handleLogout} className="logout-btn">
          <FaSignOutAlt />
          <span>Logout</span>
        </button>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <Outlet /> {/* This will render the selected page */}
      </main>
    </div>
  );
};

export default SellerDashboard;
