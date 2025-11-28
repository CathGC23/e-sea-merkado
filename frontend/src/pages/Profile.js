import React, { useEffect, useState } from "react";
import "./SellerProfile.css";

function SellerProfile() {
  const [sellerInfo, setSellerInfo] = useState({
    unique_id: "",
    first_name: "",
    middle_name: "",
    last_name: "",
    shop_name: "",
    street: "",
    barangay: "",
    municipality: "",
    province: "",
  });

  const [profileImages, setProfileImages] = useState({
    logo: "",
    qr: "",
  });

  const [selectedLogo, setSelectedLogo] = useState(null);
  const [selectedQr, setSelectedQr] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [qrPreview, setQrPreview] = useState(null);
  const [loading, setLoading] = useState(true);

  const seller_id = localStorage.getItem("seller_unique_id");

  // Load seller information from admin_db
  useEffect(() => {
    if (!seller_id) {
      alert("Seller not logged in!");
      window.location.href = "/seller-login";
      return;
    }
    loadSellerData();
  }, [seller_id]);

  const loadSellerData = async () => {
    setLoading(true);
    try {
      const infoRes = await fetch(
        `http://localhost:5001/api/seller/info/${seller_id}`
      );
      const infoData = await infoRes.json();
      
      if (infoRes.ok) {
        setSellerInfo(infoData);
      }

      const profileRes = await fetch(
        `http://localhost:5001/api/seller/profile/${seller_id}`
      );
      const profileData = await profileRes.json();
      
      setProfileImages({
        logo: profileData.logo || "",
        qr: profileData.qr || "",
      });
    } catch (err) {
      console.error("Failed to load seller data:", err);
      alert("Error loading profile information");
    } finally {
      setLoading(false);
    }
  };

  // Previews
  useEffect(() => {
    if (!selectedLogo) {
      setLogoPreview(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(reader.result);
    reader.readAsDataURL(selectedLogo);
  }, [selectedLogo]);

  useEffect(() => {
    if (!selectedQr) {
      setQrPreview(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setQrPreview(reader.result);
    reader.readAsDataURL(selectedQr);
  }, [selectedQr]);

  // Upload Logic
  const uploadFile = async (file, type) => {
    if (!file) {
      alert(`Please select a ${type === "logo" ? "logo" : "QR code"} first.`);
      return;
    }

    const formData = new FormData();
    formData.append(type, file);

    try {
      const res = await fetch(
        `http://localhost:5001/api/seller/upload-${type}/${seller_id}`,
        {
          method: "POST",
          body: formData,
        }
      );
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Upload failed");

      alert(data.message);

      if (type === "logo") {
        setProfileImages((prev) => ({ ...prev, logo: data.logo }));
        setSelectedLogo(null);
        setLogoPreview(null);
      }
      if (type === "qr") {
        setProfileImages((prev) => ({ ...prev, qr: data.qr }));
        setSelectedQr(null);
        setQrPreview(null);
      }
    } catch (err) {
      console.error(`${type} upload failed:`, err);
      alert(`Error uploading ${type}: ${err.message}`);
    }
  };

  const getFileUrl = (path) => {
    if (!path) return null;
    const normalized = path.startsWith("/") ? path : "/" + path;
    return `http://localhost:5001${normalized}`;
  };

  const getFullAddress = () => {
    const parts = [
      sellerInfo.street,
      sellerInfo.barangay,
      sellerInfo.municipality,
      sellerInfo.province,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : "N/A";
  };

  const getFullName = () => {
    const parts = [
      sellerInfo.first_name,
      sellerInfo.middle_name,
      sellerInfo.last_name,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(" ") : "N/A";
  };

  if (loading) {
    return (
      <div className="seller-profile-container">
        <div className="seller-profile-loading">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="seller-profile-container">
      <h2 className="seller-profile-header">Seller Profile</h2>

      {/* Personal Information Section */}
      <div className="seller-profile-card">
        <h3 className="seller-profile-card-title">
          <span className="seller-profile-icon">👤</span>
          Personal Information
        </h3>
        <div className="seller-profile-grid">
          <div className="seller-profile-item">
            <label>Seller ID</label>
            <div className="seller-profile-value">{sellerInfo.unique_id || "N/A"}</div>
          </div>
          <div className="seller-profile-item">
            <label>Full Name</label>
            <div className="seller-profile-value">{getFullName()}</div>
          </div>
          <div className="seller-profile-item seller-profile-full-width">
            <label>Shop Name</label>
            <div className="seller-profile-value seller-profile-shop-name">
              {sellerInfo.shop_name || "N/A"}
            </div>
          </div>
          <div className="seller-profile-item seller-profile-full-width">
            <label>Address</label>
            <div className="seller-profile-value">{getFullAddress()}</div>
          </div>
        </div>
        <div className="seller-profile-notice">
          <span className="seller-profile-notice-icon">ℹ️</span>
          <p>
            This information cannot be changed. Please contact the administrator
            if you need to update your details.
          </p>
        </div>
      </div>

      {/* Shop Logo Section */}
      <div className="seller-profile-card">
        <h3 className="seller-profile-card-title">
          <span className="seller-profile-icon">🏪</span>
          Shop Logo
        </h3>
        <div className="seller-profile-upload-area">
          <div className="seller-profile-preview-box">
            {logoPreview || getFileUrl(profileImages.logo) ? (
              <img
                src={logoPreview || getFileUrl(profileImages.logo)}
                alt="Shop Logo"
                className="seller-profile-img"
              />
            ) : (
              <div className="seller-profile-placeholder">
                <span className="seller-profile-placeholder-icon">📷</span>
                <p>No logo uploaded</p>
              </div>
            )}
          </div>
          <div className="seller-profile-controls">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setSelectedLogo(e.target.files[0])}
              id="logo-input"
              className="seller-profile-file-input"
            />
            <label htmlFor="logo-input" className="seller-profile-file-label">
              Choose Logo
            </label>
            {selectedLogo && (
              <div className="seller-profile-selected-file">
                <span>✓</span> {selectedLogo.name}
              </div>
            )}
            <button
              onClick={() => uploadFile(selectedLogo, "logo")}
              className="seller-profile-btn"
              disabled={!selectedLogo}
            >
              Upload Logo
            </button>
          </div>
        </div>
      </div>

      {/* GCash QR Code Section */}
      <div className="seller-profile-card">
        <h3 className="seller-profile-card-title">
          <span className="seller-profile-icon">💳</span>
          GCash QR Code
        </h3>
        <div className="seller-profile-upload-area">
          <div className="seller-profile-preview-box qr-mode">
            {qrPreview || getFileUrl(profileImages.qr) ? (
              <img
                src={qrPreview || getFileUrl(profileImages.qr)}
                alt="GCash QR"
                className="seller-profile-img"
              />
            ) : (
              <div className="seller-profile-placeholder">
                <span className="seller-profile-placeholder-icon">📱</span>
                <p>No QR code uploaded</p>
              </div>
            )}
          </div>
          <div className="seller-profile-controls">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setSelectedQr(e.target.files[0])}
              id="qr-input"
              className="seller-profile-file-input"
            />
            <label htmlFor="qr-input" className="seller-profile-file-label">
              Choose QR Code
            </label>
            {selectedQr && (
              <div className="seller-profile-selected-file">
                <span>✓</span> {selectedQr.name}
              </div>
            )}
            <button
              onClick={() => uploadFile(selectedQr, "qr")}
              className="seller-profile-btn"
              disabled={!selectedQr}
            >
              Upload QR Code
            </button>
          </div>
        </div>
        <div className="seller-profile-notice success-mode">
          <span className="seller-profile-notice-icon">💡</span>
          <p>
            Upload your GCash QR code so customers can pay directly when placing
            orders.
          </p>
        </div>
      </div>
    </div>
  );
}

export default SellerProfile;