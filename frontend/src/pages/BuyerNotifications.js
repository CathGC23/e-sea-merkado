import React, { useEffect, useState } from "react";
import "./BuyerNotifications.css";

export default function BuyerNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const buyerId = localStorage.getItem("customer_id"); 

  const fetchNotifications = async () => {
    if (!buyerId) {
      setError("Buyer ID not found. Please log in.");
      setLoading(false);
      return;
    }

    try {
      // FIX: Added credentials: 'include' for Chrome compatibility
      const res = await fetch(
        `http://localhost:5002/api/buyer/${buyerId}/notifications`,
        {
          method: 'GET',
          credentials: 'include', // Crucial for Chrome/CORS strictness
        }
      );

      if (!res.ok) {
        throw new Error("Failed to fetch notifications");
      }

      const data = await res.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.count || 0);
      setError(null);
    } catch (err) {
      console.error("Error fetching notifications:", err);
      setError("Could not connect to the notification service. Check server status.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (buyerId) {
        fetchNotifications();
    }
    
    const interval = setInterval(fetchNotifications, 10000);
    
    return () => clearInterval(interval);
  }, [buyerId]);

  const markAsRead = async (notificationId) => {
    try {
      // FIX: Added credentials: 'include' for Chrome compatibility
      const res = await fetch(
        `http://localhost:5002/api/buyer/notifications/${notificationId}/read`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ customer_id: buyerId }),
          credentials: 'include', // Crucial for Chrome/CORS strictness
        }
      );

      if (!res.ok) {
        throw new Error("Failed to mark notification as read");
      }

      // Update local state
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      // FIX: Added credentials: 'include' for Chrome compatibility
      const res = await fetch(
        `http://localhost:5002/api/buyer/${buyerId}/notifications/read-all`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: 'include', // Crucial for Chrome/CORS strictness
        }
      );

      if (!res.ok) {
        throw new Error("Failed to mark all notifications as read");
      }

      // Update local state
      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
    }
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
    
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="notif-container">
        <p className="notif-loading">Loading notifications...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="notif-container">
        <p className="notif-error">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="notif-container">
      <div className="notif-header">
        <h3>Notifications</h3>
        {unreadCount > 0 && (
          <span className="notif-badge">{unreadCount}</span>
        )}
      </div>

      {notifications.length > 0 && unreadCount > 0 && (
        <button 
          className="btn-mark-all-read"
          onClick={markAllAsRead}
        >
          Mark all as read
        </button>
      )}

      <div className="notif-list">
        {notifications.length === 0 ? (
          <div className="notif-empty">
            <p>📭 No notifications yet</p>
            <span>You'll see order updates here</span>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`notif-item ${notification.is_read ? 'read' : 'unread'}`}
              onClick={() => !notification.is_read && markAsRead(notification.id)}
            >
              <div className="notif-content">
                <div className="notif-shop">
                  🏪 {notification.shop_name}
                </div>
                <div className="notif-message">
                  {notification.message}
                </div>
                <div className="notif-time">
                  🕐 {formatTimeAgo(notification.created_at)}
                </div>
              </div>
              {!notification.is_read && (
                <div className="notif-indicator">●</div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}