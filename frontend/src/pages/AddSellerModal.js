import React, { useState } from "react";
import "./AddSellerModal.css";

const AddSellerModal = ({ onClose, onAddSeller }) => {
  const [form, setForm] = useState({
    lastName: "",
    firstName: "",
    middleName: "",
    shopName: "",
    street: "",
    barangay: "",
    municipality: "",
    province: "",
    uniqueId: "",
    requirements: {
      businessPermit: false,
      barangayClearance: false,
      idProof: false,
    },
  });

  const generateUniqueId = () => {
    const id = "SELL-" + Math.random().toString(36).substring(2, 8).toUpperCase();
    setForm({ ...form, uniqueId: id });
  };

  const toggleRequirement = (key) => {
    setForm({
      ...form,
      requirements: { ...form.requirements, [key]: !form.requirements[key] },
    });
  };

  const handleSubmit = () => {
    const complete = Object.values(form.requirements).every(Boolean);
    const status = complete ? "accepted" : "pending"; 
    
    onAddSeller({ 
      last_name: form.lastName,
      first_name: form.firstName,
      middle_name: form.middleName,
      shop_name: form.shopName,
      street: form.street,
      barangay: form.barangay,
      municipality: form.municipality,
      province: form.province,
      unique_id: form.uniqueId,
      requirements: form.requirements,
      status, 
      created_at: new Date().toISOString(), 
    });
    
    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h3>Add Seller</h3>

        <label>Last Name</label>
        <input
          type="text"
          value={form.lastName}
          onChange={(e) => setForm({ ...form, lastName: e.target.value })}
        />

        <label>First Name</label>
        <input
          type="text"
          value={form.firstName}
          onChange={(e) => setForm({ ...form, firstName: e.target.value })}
        />

        <label>Middle Name</label>
        <input
          type="text"
          value={form.middleName}
          onChange={(e) => setForm({ ...form, middleName: e.target.value })}
        />

        <label>Shop Name</label>
        <input
          type="text"
          value={form.shopName}
          onChange={(e) => setForm({ ...form, shopName: e.target.value })}
        />

        <h4>Address</h4>
        <label>Street</label>
        <input
          type="text"
          value={form.street}
          onChange={(e) => setForm({ ...form, street: e.target.value })}
        />

        <label>Barangay</label>
        <input
          type="text"
          value={form.barangay}
          onChange={(e) => setForm({ ...form, barangay: e.target.value })}
        />

        <label>Municipality</label>
        <input
          type="text"
          value={form.municipality}
          onChange={(e) => setForm({ ...form, municipality: e.target.value })}
        />

        <label>Province</label>
        <input
          type="text"
          value={form.province}
          onChange={(e) => setForm({ ...form, province: e.target.value })}
        />

        <div className="unique-id-section">
          <label>Generated Unique ID</label>
          <input type="text" value={form.uniqueId} readOnly />
          <button className="generate-btn" onClick={generateUniqueId}>
            Generate
          </button>
        </div>

        <div className="requirements-section">
          <p>Requirements</p>
          {Object.keys(form.requirements).map((key) => (
            <div key={key} className="requirement-item">
              <div
                className={`circle ${form.requirements[key] ? "active" : ""}`}
                onClick={() => toggleRequirement(key)}
              ></div>
              <span>{key.replace(/([A-Z])/g, " $1")}</span>
            </div>
          ))}
        </div>

        <div className="modal-actions">
          <button onClick={handleSubmit} className="save-btn">
            Add Seller
          </button>
          <button onClick={onClose} className="cancel-btn">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddSellerModal;