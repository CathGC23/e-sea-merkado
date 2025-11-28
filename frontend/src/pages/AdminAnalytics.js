// AdminAnalytics.js
import React, { useEffect, useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  Cell 
} from 'recharts';
import './AdminAnalytics.css';

const AdminAnalytics = () => {
  const [analytics, setAnalytics] = useState({
    totalRevenue: 0,
    activeSellers: 0,
    totalOrders: 0,
    fishVarieties: 0
  });
  
  const [salesData, setSalesData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [displayedSellersCount, setDisplayedSellersCount] = useState(5);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // Fetch all sellers
      const sellersRes = await fetch('http://localhost:5000/api/sellers');
      const sellers = await sellersRes.json();
      const acceptedSellers = sellers.filter(s => s.status === 'accepted');

      // Fetch data for each seller
      let totalRevenue = 0;
      let totalOrders = 0;
      let allProducts = [];
      let salesBySellerMonth = {};
      let productSales = {};

      for (const seller of acceptedSellers) {
        try {
          // Get seller's orders
          const ordersRes = await fetch(`http://localhost:5001/api/orders?seller_id=${seller.unique_id}`);
          const orders = await ordersRes.json();

          // Calculate revenue from completed orders
          const completedOrders = orders.filter(o => o.status === 'Completed');
          const sellerRevenue = completedOrders.reduce((sum, order) => sum + Number(order.total), 0);
          totalRevenue += sellerRevenue;
          totalOrders += orders.length;

          // Group sales by month for this seller
          orders.forEach(order => {
            const date = new Date(order.orderDate);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            
            if (!salesBySellerMonth[seller.unique_id]) {
              salesBySellerMonth[seller.unique_id] = {
                sellerName: seller.shop_name,
                sellerId: seller.unique_id,
                totalRevenue: 0,
                months: {}
              };
            }
            
            if (!salesBySellerMonth[seller.unique_id].months[monthKey]) {
              salesBySellerMonth[seller.unique_id].months[monthKey] = 0;
            }
            
            const orderTotal = Number(order.total);
            salesBySellerMonth[seller.unique_id].months[monthKey] += orderTotal;
            salesBySellerMonth[seller.unique_id].totalRevenue += orderTotal;
          });

          // Track product sales
          orders.forEach(order => {
            order.items.forEach(item => {
              const key = `${item.productName}_${seller.shop_name}`;
              if (!productSales[key]) {
                productSales[key] = {
                  name: item.productName,
                  seller: seller.shop_name,
                  totalSales: 0,
                  quantity: 0
                };
              }
              productSales[key].totalSales += Number(item.price) * Number(item.quantity);
              productSales[key].quantity += Number(item.quantity);
            });
          });

          // Get seller's products for variety count
          const productsRes = await fetch(`http://localhost:5001/api/seller/fish?seller_id=${seller.unique_id}`);
          const products = await productsRes.json();
          allProducts = [...allProducts, ...products];
        } catch (err) {
          console.error(`Error fetching data for seller ${seller.unique_id}:`, err);
        }
      }

      // Get unique fish varieties
      const uniqueVarieties = new Set(allProducts.map(p => p.name.toLowerCase()));

      // Sort sellers by revenue (top sellers first)
      const sortedSellers = Object.values(salesBySellerMonth)
        .sort((a, b) => b.totalRevenue - a.totalRevenue);

      // Prepare sales trend data
      const salesTrendData = prepareSalesTrendData(sortedSellers);

      // Prepare top products data
      const topProductsData = Object.values(productSales)
        .sort((a, b) => b.totalSales - a.totalSales)
        .slice(0, 10);

      setAnalytics({
        totalRevenue,
        activeSellers: acceptedSellers.length,
        totalOrders,
        fishVarieties: uniqueVarieties.size
      });

      setSalesData(salesTrendData);
      setTopProducts(topProductsData);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const prepareSalesTrendData = (sortedSellers) => {
    // Get last 6 months
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      months.push({
        month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        monthKey
      });
    }

    // Create data structure for chart
    return months.map(({ month, monthKey }) => {
      const dataPoint = { month };
      
      sortedSellers.forEach((seller) => {
        dataPoint[seller.sellerName] = seller.months[monthKey] || 0;
      });
      
      return dataPoint;
    });
  };

  const getSellersForDisplay = () => {
    if (salesData.length === 0) return [];
    const allSellerNames = Object.keys(salesData[0]).filter(key => key !== 'month');
    return allSellerNames.slice(0, displayedSellersCount);
  };

  const handleShowMore = () => {
    setDisplayedSellersCount(prev => {
      const allSellerNames = Object.keys(salesData[0] || {}).filter(key => key !== 'month');
      return Math.min(prev + 5, allSellerNames.length);
    });
  };

  const hasMoreSellers = () => {
    if (salesData.length === 0) return false;
    const allSellerNames = Object.keys(salesData[0]).filter(key => key !== 'month');
    return displayedSellersCount < allSellerNames.length;
  };

  const COLORS = ['#0e7490', '#155e75', '#164e63', '#0891b2', '#06b6d4', '#0e7490', '#155e75'];
  const DARK_BLUE = '#0e7490'; // Seafood market theme color

  // Calendar functions
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { daysInMonth, startingDayOfWeek };
  };

  const isToday = (day) => {
    const today = new Date();
    return day === today.getDate() && 
           currentDate.getMonth() === today.getMonth() && 
           currentDate.getFullYear() === today.getFullYear();
  };

  if (loading) {
    return (
      <div className="analytics-loading">
        <div className="spinner"></div>
        <p>Loading analytics...</p>
      </div>
    );
  }

  const displayedSellers = getSellersForDisplay();
  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);

  return (
    <div className="admin-analytics">
      <div className="analytics-header">
        <h2>Analytics Dashboard</h2>
        <p className="analytics-subtitle">Overview of all sellers performance</p>
      </div>

      {/* Stats Cards */}
      <div className="analytics-stats-grid">
        <div className="analytics-stat-card revenue-card">
          <div className="stat-icon-wrapper">
            <span className="stat-icon">💰</span>
          </div>
          <div className="stat-content">
            <p className="stat-label">Total Revenue</p>
            <h2 className="stat-value">₱{analytics.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
            <p className="stat-subtext">From all completed orders</p>
          </div>
        </div>

        <div className="analytics-stat-card sellers-card">
          <div className="stat-icon-wrapper">
            <span className="stat-icon">🏪</span>
          </div>
          <div className="stat-content">
            <p className="stat-label">Active Sellers</p>
            <h2 className="stat-value">{analytics.activeSellers}</h2>
            <p className="stat-subtext">Approved and registered</p>
          </div>
        </div>

        <div className="analytics-stat-card orders-card">
          <div className="stat-icon-wrapper">
            <span className="stat-icon">📦</span>
          </div>
          <div className="stat-content">
            <p className="stat-label">Total Orders</p>
            <h2 className="stat-value">{analytics.totalOrders}</h2>
            <p className="stat-subtext">All time orders</p>
          </div>
        </div>

        <div className="analytics-stat-card varieties-card">
          <div className="stat-icon-wrapper">
            <span className="stat-icon">🐟</span>
          </div>
          <div className="stat-content">
            <p className="stat-label">Fish Varieties</p>
            <h2 className="stat-value">{analytics.fishVarieties}</h2>
            <p className="stat-subtext">Unique products</p>
          </div>
        </div>
      </div>

      {/* Main Content Row */}
      <div className="analytics-main-row">
        {/* Sales Trend Chart */}
        <div className="analytics-chart-card chart-large">
          <div className="chart-header">
            <div>
              <h3>Sales Trend by Seller</h3>
              <p className="chart-subtitle">Monthly revenue comparison (Last 6 months)</p>
            </div>
          </div>
          
          <div className="chart-content">
            {salesData.length > 0 && displayedSellers.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={salesData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="month" 
                    stroke="#6b7280"
                    fontSize={10}
                    tickLine={false}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <YAxis 
                    stroke="#6b7280"
                    fontSize={10}
                    tickLine={false}
                    axisLine={{ stroke: '#e5e7eb' }}
                    tickFormatter={(value) => `₱${value.toLocaleString()}`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      fontSize: '11px'
                    }}
                    formatter={(value) => [`₱${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, '']}
                  />
                  <Legend 
                    wrapperStyle={{ paddingTop: '10px', fontSize: '11px' }}
                    iconType="circle"
                  />
                  {displayedSellers.map((seller, index) => (
                    <Line
                      key={seller}
                      type="monotone"
                      dataKey={seller}
                      stroke={COLORS[index % COLORS.length]}
                      strokeWidth={2.5}
                      dot={{ fill: COLORS[index % COLORS.length], r: 3, strokeWidth: 2, stroke: 'white' }}
                      activeDot={{ r: 5, strokeWidth: 2, stroke: 'white' }}
                      name={seller}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state">
                <p>No sales data available</p>
              </div>
            )}
          </div>

          {hasMoreSellers() && (
            <div className="show-more-container">
              <button className="show-more-btn" onClick={handleShowMore}>
                Show More Sellers
              </button>
            </div>
          )}
        </div>

        {/* Calendar */}
        <div className="analytics-chart-card calendar-card">
          <div className="chart-header">
            <h3>{currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h3>
          </div>
          
          <div className="calendar-grid">
            <div className="calendar-weekdays">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="calendar-weekday">{day}</div>
              ))}
            </div>
            
            <div className="calendar-days">
              {[...Array(startingDayOfWeek)].map((_, index) => (
                <div key={`empty-${index}`} className="calendar-day-empty"></div>
              ))}
              
              {[...Array(daysInMonth)].map((_, index) => {
                const day = index + 1;
                return (
                  <div 
                    key={day} 
                    className={`calendar-day-cell ${isToday(day) ? 'today' : ''}`}
                  >
                    {day}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Product Performance - Chart and Table Side by Side */}
      <div className="analytics-chart-card">
        <div className="chart-header">
          <div>
            <h3>Product Performance</h3>
            <p className="chart-subtitle">Top 10 fish products by sales revenue</p>
          </div>
        </div>
        
        <div className="product-performance-row">
          {/* Bar Chart */}
          <div className="chart-content-half">
            {topProducts.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart 
                  data={topProducts} 
                  margin={{ top: 10, right: 10, left: 0, bottom: 80 }}
                  layout="horizontal"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="name"
                    stroke="#6b7280"
                    fontSize={9}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    tickLine={false}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <YAxis 
                    stroke="#6b7280"
                    fontSize={10}
                    tickLine={false}
                    axisLine={{ stroke: '#e5e7eb' }}
                    tickFormatter={(value) => `₱${value.toLocaleString()}`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      fontSize: '11px'
                    }}
                    formatter={(value, name, props) => {
                      const item = props.payload;
                      return [
                        <div key="tooltip" style={{ fontSize: '11px' }}>
                          <div style={{ fontWeight: '600', marginBottom: '3px' }}>{item.name}</div>
                          <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '3px' }}>
                            Seller: {item.seller}
                          </div>
                          <div style={{ fontSize: '11px' }}>
                            Sales: ₱{Number(value).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </div>
                          <div style={{ fontSize: '10px', color: '#6b7280' }}>
                            Quantity Sold: {item.quantity}
                          </div>
                        </div>
                      ];
                    }}
                    cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                  />
                  <Bar dataKey="totalSales" radius={[6, 6, 0, 0]} fill={DARK_BLUE} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state">
                <p>No product sales data available</p>
              </div>
            )}
          </div>

          {/* Table */}
          <div className="products-table-half">
            {topProducts.length > 0 && (
              <div className="products-table-wrapper">
                <table className="products-table">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Product Name</th>
                      <th>Seller</th>
                      <th>Total Sales</th>
                      <th>Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topProducts.map((product, index) => (
                      <tr key={index}>
                        <td className="rank-cell">
                          <span className={`rank-badge rank-${index + 1}`}>#{index + 1}</span>
                        </td>
                        <td className="product-name-cell">{product.name}</td>
                        <td className="seller-cell">{product.seller}</td>
                        <td className="sales-cell">
                          ₱{product.totalSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="quantity-cell">{product.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;