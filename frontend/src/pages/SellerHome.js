import React, { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import './SellerHome.css';

const SellerHome = () => {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [sellerInfo, setSellerInfo] = useState({ shop_name: "", first_name: "", last_name: "" });
  const [profile, setProfile] = useState({ logo: "" });
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const SELLER_ID = localStorage.getItem("seller_unique_id");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, orderRes, profileRes, infoRes] = await Promise.all([
          fetch(`http://localhost:5001/api/seller/fish?seller_id=${SELLER_ID}`),
          fetch(`http://localhost:5001/api/orders?seller_id=${SELLER_ID}`),
          fetch(`http://localhost:5001/api/seller/profile/${SELLER_ID}`),
          fetch(`http://localhost:5001/api/seller/info/${SELLER_ID}`)
        ]);

        const prodData = await prodRes.json();
        const orderData = await orderRes.json();
        const profileData = await profileRes.json();
        const infoData = await infoRes.json();

        setProducts(Array.isArray(prodData) ? prodData : []);
        setOrders(Array.isArray(orderData) ? orderData : []);
        setProfile(profileData || {});
        setSellerInfo(infoData || {});
      } catch (err) {
        console.error("Error fetching seller data:", err);
        setProducts([]);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [SELLER_ID]);

  // Get products by category for chart
  const getProductsByCategory = () => {
    const categoryCount = {};
    products.forEach(product => {
      const category = product.category || "Uncategorized";
      categoryCount[category] = (categoryCount[category] || 0) + 1;
    });
    
    return Object.entries(categoryCount).map(([name, count]) => ({
      name,
      count
    }));
  };

  // Get products by category for pie chart
  const getProductsForPieChart = () => {
    const categoryCount = {};
    products.forEach(product => {
      const category = product.category || "Uncategorized";
      categoryCount[category] = (categoryCount[category] || 0) + 1;
    });
    
    return Object.entries(categoryCount).map(([name, value]) => ({
      name,
      value
    }));
  };

  const COLORS = ['#1e88a8', '#2a9d8f', '#2c7a7b', '#0891b2', '#0e7490', '#155e75'];

  // Get total revenue
  const getTotalRevenue = () => {
    return orders
      .filter(o => o.status === 'Completed')
      .reduce((sum, order) => sum + Number(order.total), 0);
  };

  // Get orders by date for chart
  const getOrdersByDate = () => {
    const dateCount = {};
    orders.forEach(order => {
      const date = new Date(order.orderDate).toISOString().split('T')[0];
      dateCount[date] = (dateCount[date] || 0) + 1;
    });
    
    // Get last 7 days
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      last7Days.push({
        date: dateStr,
        orders: dateCount[dateStr] || 0
      });
    }
    
    return last7Days;
  };

  // Filter orders by selected date
  const getOrdersForDate = (date) => {
    return orders.filter(order => {
      const orderDate = new Date(order.orderDate).toISOString().split('T')[0];
      return orderDate === date;
    });
  };

  const pendingOrders = orders.filter(o => o.status === "Pending");
  const ordersForSelectedDate = getOrdersForDate(selectedDate);

  const getFileUrl = (path) => {
    if (!path) return "https://via.placeholder.com/100";
    // Remove leading slashes and "uploads/" if present
    const normalized = path.replace(/^\/+/, '').replace(/^uploads\//, '');
    return `http://localhost:5001/uploads/${normalized}`;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="seller-home">
      {/* Top Bar with Shop Info */}
      <div className="top-bar">
        <div className="shop-branding">
          <img
            src={getFileUrl(profile.logo)}
            alt="Shop Logo"
            className="shop-logo"
          />
          <div className="shop-info">
            <h1 className="shop-name">{sellerInfo.shop_name || "Your Shop"}</h1>
            <p className="shop-owner">
              {sellerInfo.first_name} {sellerInfo.middle_name} {sellerInfo.last_name}
            </p>
          </div>
        </div>
        
        <div className="user-profile">
          <span className="seller-id">ID: {SELLER_ID}</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card stat-products">
          <div className="stat-icon-wrapper">
            <div className="stat-icon">🐟</div>
          </div>
          <div className="stat-content">
            <p className="stat-label">Total Products</p>
            <h2 className="stat-value">{products.length}</h2>
            <p className="stat-subtext">Items in stock</p>
          </div>
        </div>

        <div className="stat-card stat-orders">
          <div className="stat-icon-wrapper">
            <div className="stat-icon">📦</div>
          </div>
          <div className="stat-content">
            <p className="stat-label">Total Orders</p>
            <h2 className="stat-value">{orders.length}</h2>
            <p className="stat-subtext">All time orders</p>
          </div>
        </div>

        <div className="stat-card stat-revenue">
          <div className="stat-icon-wrapper">
            <div className="stat-icon">💰</div>
          </div>
          <div className="stat-content">
            <p className="stat-label">Revenue</p>
            <h2 className="stat-value">₱{getTotalRevenue().toLocaleString()}</h2>
            <p className="stat-subtext">From completed orders</p>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="content-grid">
        {/* Sales Chart */}
        <div className="chart-card chart-large">
          <div className="card-header">
            <h3>🌊 Sales Overview</h3>
            <span className="chart-period">Last 7 Days</span>
          </div>
          <div className="chart-content">
            {orders.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={getOrdersByDate()} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0891b2" stopOpacity={0.6}/>
                      <stop offset="95%" stopColor="#0891b2" stopOpacity={0.05}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    stroke="#6b7280" 
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <YAxis 
                    stroke="#6b7280" 
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: 'none',
                      borderRadius: '12px',
                      padding: '8px 12px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                    }}
                    labelStyle={{ fontSize: '12px', fontWeight: '600', color: '#0e7490' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="orders" 
                    stroke="#0891b2" 
                    strokeWidth={3}
                    fill="url(#colorOrders)"
                    dot={{ fill: '#0891b2', r: 5, strokeWidth: 2, stroke: 'white' }}
                    activeDot={{ r: 7, strokeWidth: 2, stroke: 'white' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state">
                <p>🌊 No order data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Top Product Sale - Pie Chart */}
        <div className="chart-card">
          <div className="card-header">
            <h3>🐠 Top Product Sale</h3>
          </div>
          <div className="chart-content pie-chart-container">
            {products.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={getProductsForPieChart()}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {getProductsForPieChart().map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={COLORS[index % COLORS.length]}
                          stroke="white"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: 'none',
                        borderRadius: '12px',
                        padding: '8px 12px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        fontSize: '12px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pie-legend">
                  {getProductsForPieChart().map((entry, index) => (
                    <div key={index} className="legend-item">
                      <span 
                        className="legend-color" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      ></span>
                      <span className="legend-text">{entry.name}</span>
                      <span className="legend-value">{entry.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="empty-state">
                <p>🐠 No product data</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Calendar Section */}
      <div className="calendar-section">
        <div className="calendar-card">
          <div className="card-header">
            <h3>📅 Orders by Date</h3>
            <div className="date-picker-wrapper">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="date-picker"
              />
              <span className="order-count-badge">
                {ordersForSelectedDate.length}
              </span>
            </div>
          </div>
          
          <div className="orders-list">
            {ordersForSelectedDate.length > 0 ? (
              ordersForSelectedDate.map(order => (
                <div key={order.orderId} className="order-item-compact">
                  <div className="order-left">
                    <div className="order-id-compact">#{order.orderId}</div>
                    <div className="order-customer-compact">{order.customerName}</div>
                    <div className="order-details-compact">
                      {order.items.length} items • {order.contact}
                    </div>
                  </div>
                  <div className="order-right">
                    <span className={`order-status-compact status-${order.status.toLowerCase().replace(' ', '-')}`}>
                      {order.status}
                    </span>
                    <div className="order-amount-compact">
                      ₱{Number(order.total).toFixed(2)}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state-inline">
                <p>No orders on {new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pending Orders */}
      <div className="pending-orders-section">
        <div className="section-header">
          <h3>⏳ Pending Orders</h3>
          <span className="pending-count">{pendingOrders.length}</span>
        </div>
        
        <div className="pending-orders-grid">
          {pendingOrders.length > 0 ? (
            pendingOrders.map(order => (
              <div key={order.orderId} className="pending-order-card">
                <div className="pending-order-header">
                  <div className="pending-order-id-section">
                    <span className="pending-order-number">#{order.orderId}</span>
                    <span className="pending-badge">PENDING</span>
                  </div>
                </div>
                
                <div className="pending-order-body">
                  <div className="customer-section">
                    <div className="customer-name-compact">👤 {order.customerName}</div>
                    <div className="customer-detail">📞 {order.contact}</div>
                    <div className="customer-detail">📍 {order.address}</div>
                  </div>
                  
                  <div className="order-summary">
                    <div className="summary-row">
                      <span className="summary-label">Items:</span>
                      <span className="summary-value">{order.items.length}</span>
                    </div>
                    <div className="summary-row">
                      <span className="summary-label">Payment:</span>
                      <span className="summary-value">{order.paymentMode}</span>
                    </div>
                    {order.notes && (
                      <div className="order-notes-compact">
                        💬 {order.notes}
                      </div>
                    )}
                  </div>
                  
                  <div className="order-footer-info">
                    <span className="order-time">
                      {new Date(order.orderDate).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric'
                      })} • {new Date(order.orderDate).toLocaleTimeString('en-US', { 
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                    <span className="order-total-compact">₱{Number(order.total).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-pending">
              <h4>All Caught Up!</h4>
              <p>No pending orders at the moment</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SellerHome;