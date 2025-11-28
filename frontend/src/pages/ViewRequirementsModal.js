import React from "react";
import "./ViewRequirementsModal.css";

const ViewRequirementsModal = ({ seller, onClose }) => {
  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h3>Requirements for {seller.firstName} {seller.lastName}</h3>
        {Object.keys(seller.requirements).map((key) => (
          <div key={key} className="requirement-item">
            <div className={`circle ${seller.requirements[key] ? "active" : ""}`}></div>
            <span>{key.replace(/([A-Z])/g, " $1")}</span>
          </div>
        ))}
        <button onClick={onClose} className="close-btn">Close</button>
      </div>
    </div>
  );
};

export default ViewRequirementsModal;
