import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./CartPage.css";

// Import cart utilities
import { getCart, saveCart, getCustomerId } from "../utils/cartUtils";

const CartPage = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [orderData, setOrderData] = useState({
    name: "",
    address: "",
    contact: "",
    notes: "",
  });
  const [confirmPayment, setConfirmPayment] = useState(false);
  const [qrCode, setQrCode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [proofOfPayment, setProofOfPayment] = useState(null);
  const [proofPreview, setProofPreview] = useState(null);
  const [uploadingProof, setUploadingProof] = useState(false);

  // Get customer ID from sessionStorage
  const CUSTOMER_ID = getCustomerId();

  // Check if user is logged in
  useEffect(() => {
    if (!CUSTOMER_ID) {
      console.warn("❌ User not logged in, redirecting to login page");
      alert("Please login first to view your cart");
      navigate("/buyer/login");
      return;
    }
    
    console.log("🔍 CartPage loaded for customer:", CUSTOMER_ID);
    loadCartWithProductDetails();
    loadSavedAddresses();
  }, [CUSTOMER_ID, navigate]);

  // HELPER: Get user-specific addresses key
  const getAddressesKey = () => `saved_addresses_${CUSTOMER_ID}`;

  const loadSavedAddresses = () => {
    if (!CUSTOMER_ID) return;
    
    const addresses = JSON.parse(localStorage.getItem(getAddressesKey())) || [];
    setSavedAddresses(addresses);
  };

  const saveNewAddress = () => {
    if (!orderData.name || !orderData.address || !orderData.contact) {
      alert("Please fill in name, address, and contact to save.");
      return;
    }

    const newAddress = {
      id: Date.now().toString(),
      name: orderData.name,
      address: orderData.address,
      contact: orderData.contact,
      createdAt: new Date().toISOString()
    };

    const updatedAddresses = [...savedAddresses, newAddress];
    setSavedAddresses(updatedAddresses);
    localStorage.setItem(getAddressesKey(), JSON.stringify(updatedAddresses));
    alert("Address saved successfully!");
  };

  const deleteAddress = (addressId) => {
    if (window.confirm("Are you sure you want to delete this address?")) {
      const updatedAddresses = savedAddresses.filter(addr => addr.id !== addressId);
      setSavedAddresses(updatedAddresses);
      localStorage.setItem(getAddressesKey(), JSON.stringify(updatedAddresses));
      if (selectedAddressId === addressId) {
        setSelectedAddressId("");
      }
    }
  };

  const selectSavedAddress = (addressId) => {
    const address = savedAddresses.find(addr => addr.id === addressId);
    if (address) {
      setOrderData({
        name: address.name,
        address: address.address,
        contact: address.contact,
        notes: orderData.notes
      });
      setSelectedAddressId(addressId);
      setShowAddressForm(false);
    }
  };

  const loadCartWithProductDetails = async () => {
    if (!CUSTOMER_ID) {
      setLoading(false);
      return;
    }

    try {
      const savedCart = getCart();
      
      console.log("📦 Loading cart for customer:", CUSTOMER_ID);
      console.log("🛒 Cart data:", savedCart);
      
      if (savedCart.length === 0) {
        setLoading(false);
        return;
      }

      const productIds = savedCart.map(item => item.id);
      const res = await fetch("http://localhost:5002/api/products/details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_ids: productIds })
      });

      if (!res.ok) {
        console.error("Failed to fetch product details");
        setCart(savedCart);
        setSelectedItems(savedCart.map(item => item.id));
        setLoading(false);
        return;
      }

      const products = await res.json();

      const updatedCart = savedCart.map(cartItem => {
        const product = products.find(p => p.id === cartItem.id);
        if (product) {
          return {
            ...cartItem,
            price: Number(product.price),
            stock: Number(product.stock),
            category: product.category,
            unit: product.unit || "kg",
            quantity: Math.min(Number(cartItem.quantity || 1), Number(product.stock)),
            seller_id: product.seller_id
          };
        }
        return cartItem;
      });

      setCart(updatedCart);
      setSelectedItems(updatedCart.map(item => item.id));

      const sellerQr = localStorage.getItem("seller_qr_code");
      if (sellerQr) setQrCode(sellerQr);
    } catch (err) {
      console.error("Error loading cart:", err);
      const savedCart = getCart();
      setCart(savedCart);
      setSelectedItems(savedCart.map(item => item.id));
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectItem = (id) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    setSelectedItems(
      selectedItems.length === cart.length ? [] : cart.map((item) => item.id)
    );
  };

  const removeFromCart = (id) => {
    const updated = cart.filter((item) => item.id !== id);
    setCart(updated);
    saveCart(updated);
    setSelectedItems((prev) => prev.filter((i) => i !== id));
  };

  const updateQuantity = (id, newQty) => {
    const updated = cart.map((item) => {
      if (item.id === id) {
        const validQty = Math.max(1, Math.min(newQty, item.stock || 999));
        return { ...item, quantity: validQty };
      }
      return item;
    });
    setCart(updated);
    saveCart(updated);
  };

  const incrementQuantity = (id) => {
    const item = cart.find(i => i.id === id);
    if (item && item.quantity < (item.stock || 999)) {
      updateQuantity(id, item.quantity + 1);
    } else {
      alert(`Maximum available stock is ${item.stock} ${item.unit || "units"}`);
    }
  };

  const decrementQuantity = (id) => {
    const item = cart.find(i => i.id === id);
    if (item && item.quantity > 1) {
      updateQuantity(id, item.quantity - 1);
    }
  };

  const handleProofFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert("Please upload an image file (JPG, PNG, etc.)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Image size must be less than 5MB");
      return;
    }

    setProofOfPayment(file);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setProofPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeProofOfPayment = () => {
    setProofOfPayment(null);
    setProofPreview(null);
    setConfirmPayment(false);
  };

  const selectedCartItems = cart.filter((item) =>
    selectedItems.includes(item.id)
  );

  const totalPrice = selectedCartItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  const placeOrder = async () => {
    if (!orderData.name || !orderData.address || !orderData.contact) {
      alert("Please fill in all required delivery information.");
      return;
    }

    if (!proofOfPayment) {
      alert("Please upload proof of payment.");
      return;
    }

    if (!confirmPayment) {
      alert("Please confirm payment.");
      return;
    }

    if (selectedCartItems.length === 0) {
      alert("Please select at least one item.");
      return;
    }

    setUploadingProof(true);

    try {
      const formData = new FormData();
      formData.append("proof", proofOfPayment);
      formData.append("customer_name", orderData.name);
      formData.append("customer_contact", orderData.contact);

      const uploadRes = await fetch("http://localhost:5001/api/upload-payment-proof", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        throw new Error("Failed to upload proof of payment");
      }

      const uploadData = await uploadRes.json();
      const proofFilePath = uploadData.proof_path;

      const res = await fetch("http://localhost:5001/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: orderData,
          cart: selectedCartItems,
          total: totalPrice,
          payment_mode: "Gcash QR",
          paid: true,
          proof_of_payment: proofFilePath,
          buyer_id: CUSTOMER_ID,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Failed to place order.");
        return;
      }

      alert(data.message || "Order placed successfully!");

      const remainingCart = cart.filter(
        (item) => !selectedItems.includes(item.id)
      );
      setCart(remainingCart);
      saveCart(remainingCart);

      setSelectedItems([]);
      setShowCheckoutModal(false);
      setConfirmPayment(false);
      setProofOfPayment(null);
      setProofPreview(null);
      setOrderData({ name: "", address: "", contact: "", notes: "" });
      
    } catch (err) {
      console.error("Order error:", err);
      alert("Error placing order. Please try again.");
    } finally {
      setUploadingProof(false);
    }
  };

  if (loading) {
    return (
      <div className="cart-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading your cart...</p>
        </div>
      </div>
    );
  }

  if (!CUSTOMER_ID) {
    return null;
  }

  if (cart.length === 0) {
    return (
      <div className="cart-page">
        <div className="empty-cart">
          <div className="empty-icon">🛒</div>
          <h2>Your cart is empty</h2>
          <p>Looks like you haven't added anything yet!</p>
          <button onClick={() => navigate("/buyer/shop")} className="btn-primary">
            Start Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="cart-header">
        <h1>Shopping Cart</h1>
        <button onClick={() => navigate(-1)} className="btn-back">
          <span className="icon">←</span> Continue Shopping
        </button>
      </div>

      <div className="select-all-container">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={selectedItems.length === cart.length && cart.length > 0}
            onChange={toggleSelectAll}
          />
          <span>Select All ({cart.length} items)</span>
        </label>
      </div>

      <div className="cart-items">
        {cart.map((item) => (
          <div
            key={item.id}
            className={`cart-item ${selectedItems.includes(item.id) ? 'selected' : ''}`}
          >
            <div className="item-checkbox">
              <input
                type="checkbox"
                checked={selectedItems.includes(item.id)}
                onChange={() => toggleSelectItem(item.id)}
              />
            </div>

            <div className="item-image">
              {item.image_url ? (
                <img
                  src={`http://localhost:5001/uploads/${item.image_url}`}
                  alt={item.name}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/placeholder-fish.png';
                  }}
                />
              ) : (
                <div className="placeholder-img">🐟</div>
              )}
            </div>

            <div className="item-details">
              <h3 className="item-name">{item.name}</h3>
              <div className="item-meta">
                <span className="category-badge">{item.category || "N/A"}</span>
                <span className={`stock-badge ${(item.stock || 0) < 5 ? "low" : ""}`}>
                  {item.stock || "∞"} {item.unit || "kg"} available
                </span>
              </div>
              <p className="item-price">₱{Number(item.price).toFixed(2)} / {item.unit || "kg"}</p>
            </div>

            <div className="item-quantity">
              <div className="quantity-controls">
                <button
                  onClick={() => decrementQuantity(item.id)}
                  disabled={item.quantity <= 1}
                  className="qty-btn"
                >
                  −
                </button>
                <span className="quantity-display">
                  {item.quantity}
                </span>
                <button
                  onClick={() => incrementQuantity(item.id)}
                  disabled={item.quantity >= (item.stock || 999)}
                  className="qty-btn"
                >
                  +
                </button>
              </div>
            </div>

            <div className="item-subtotal">
              <p className="subtotal-amount">₱{(Number(item.price) * item.quantity).toFixed(2)}</p>
            </div>

            <button
              onClick={() => removeFromCart(item.id)}
              className="btn-remove"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <div className="cart-footer">
        <div className="cart-summary">
          <div className="summary-row">
            <span>Selected Items:</span>
            <span>{selectedCartItems.length}</span>
          </div>
          <div className="summary-row total">
            <span>Total:</span>
            <span className="total-price">₱{totalPrice.toFixed(2)}</span>
          </div>
        </div>

        <button
          onClick={() => {
            if (selectedCartItems.length === 0) {
              alert("Please select at least one item.");
              return;
            }
            setShowCheckoutModal(true);
          }}
          className="btn-checkout"
          disabled={selectedCartItems.length === 0}
        >
          Proceed to Checkout
        </button>
      </div>

      {showCheckoutModal && (
        <div className="modal-overlay" onClick={() => setShowCheckoutModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Checkout</h2>
              <button className="modal-close" onClick={() => setShowCheckoutModal(false)}>
                ×
              </button>
            </div>

            <div className="modal-body">
              {savedAddresses.length > 0 && (
                <div className="saved-addresses-section">
                  <h3>Saved Addresses</h3>
                  <div className="addresses-grid">
                    {savedAddresses.map((addr) => (
                      <div
                        key={addr.id}
                        className={`address-card ${selectedAddressId === addr.id ? 'selected' : ''}`}
                        onClick={() => selectSavedAddress(addr.id)}
                      >
                        <div className="address-content">
                          <h4>{addr.name}</h4>
                          <p>{addr.address}</p>
                          <p className="contact">{addr.contact}</p>
                        </div>
                        <button
                          className="delete-address-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteAddress(addr.id);
                          }}
                        >
                          🗑️
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    className="btn-new-address"
                    onClick={() => {
                      setShowAddressForm(true);
                      setSelectedAddressId("");
                      setOrderData({ name: "", address: "", contact: "", notes: orderData.notes });
                    }}
                  >
                    + Add New Address
                  </button>
                </div>
              )}

              {(showAddressForm || savedAddresses.length === 0) && (
                <div className="checkout-form">
                  <h3>Delivery Information</h3>

                  <div className="form-group">
                    <label>Full Name *</label>
                    <input
                      type="text"
                      value={orderData.name}
                      onChange={(e) => setOrderData({ ...orderData, name: e.target.value })}
                      required
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div className="form-group">
                    <label>Delivery Address *</label>
                    <textarea
                      value={orderData.address}
                      onChange={(e) => setOrderData({ ...orderData, address: e.target.value })}
                      required
                      placeholder="House/Unit No., Street, Barangay, City"
                      rows="3"
                    />
                  </div>

                  <div className="form-group">
                    <label>Contact Number *</label>
                    <input
                      type="tel"
                      value={orderData.contact}
                      onChange={(e) => setOrderData({ ...orderData, contact: e.target.value })}
                      required
                      placeholder="09XX XXX XXXX"
                    />
                  </div>

                  <div className="form-group">
                    <label>Order Notes (Optional)</label>
                    <textarea
                      value={orderData.notes}
                      onChange={(e) => setOrderData({ ...orderData, notes: e.target.value })}
                      placeholder="Special instructions"
                      rows="2"
                    />
                  </div>

                  <button type="button" className="btn-save-address" onClick={saveNewAddress}>
                    💾 Save this address
                  </button>
                </div>
              )}

              <div className="payment-section">
                <h3>Payment Method</h3>
                <div className="payment-method-card">
                  <span className="payment-icon">💳</span>
                  <span>GCash QR Payment</span>
                </div>

                <div className="qr-container">
                  {qrCode ? (
                    <div className="qr-wrapper">
                      <img
                        src={`http://localhost:5001${qrCode}`}
                        alt="GCash QR Code"
                        className="qr-code"
                      />
                      <p className="qr-instruction">Scan with GCash app</p>
                    </div>
                  ) : (
                    <p className="no-qr">QR code not available</p>
                  )}
                </div>

                <div className="payment-total">
                  <span>Total Amount</span>
                  <span className="amount">₱{totalPrice.toFixed(2)}</span>
                </div>

                <div className="proof-of-payment-section">
                  <h4>Upload Proof of Payment *</h4>
                  <p className="proof-instruction">
                    Upload screenshot of GCash payment receipt
                  </p>
                  
                  {!proofPreview ? (
                    <div className="upload-area">
                      <input
                        type="file"
                        id="proof-upload"
                        accept="image/*"
                        onChange={handleProofFileChange}
                        style={{ display: 'none' }}
                      />
                      <label htmlFor="proof-upload" className="upload-label">
                        <div className="upload-icon">📸</div>
                        <span>Click to upload</span>
                        <span className="upload-hint">PNG, JPG (Max 5MB)</span>
                      </label>
                    </div>
                  ) : (
                    <div className="proof-preview">
                      <img src={proofPreview} alt="Proof" />
                      <button 
                        type="button" 
                        className="btn-remove-proof"
                        onClick={removeProofOfPayment}
                      >
                        ✕ Remove
                      </button>
                    </div>
                  )}
                </div>

                <div className="payment-confirmation">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={confirmPayment}
                      onChange={() => setConfirmPayment(!confirmPayment)}
                      disabled={!proofOfPayment}
                      required
                    />
                    <span>I confirm payment and uploaded proof</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                onClick={() => setShowCheckoutModal(false)}
                className="btn-cancel"
                disabled={uploadingProof}
              >
                Cancel
              </button>
              <button
                onClick={placeOrder}
                className="btn-confirm"
                disabled={
                  !confirmPayment || 
                  selectedCartItems.length === 0 || 
                  !orderData.name || 
                  !orderData.address || 
                  !orderData.contact ||
                  !proofOfPayment ||
                  uploadingProof
                }
              >
                {uploadingProof ? "Processing..." : "Place Order"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;