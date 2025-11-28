import React, { useState, useEffect, useRef } from "react";
import "./EditProductModal.css";

function EditProductModal({ product, categories, seller_id, onClose, onUpdated }) {
  const [name, setName] = useState(product.name);
  const [category, setCategory] = useState(product.category);
  const [price, setPrice] = useState(product.price);
  const [stock, setStock] = useState(product.stock);
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (imageFile) {
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result);
      reader.readAsDataURL(imageFile);
    }
  }, [imageFile]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("name", name);
    formData.append("category", category);
    formData.append("price", price);
    formData.append("stock", stock);
    formData.append("unit", "kg");
    formData.append("seller_id", seller_id);
    if (imageFile) formData.append("image", imageFile);

    try {
      const res = await fetch(
        `http://localhost:5001/api/seller/fish/${product.id}`,
        { method: "PUT", body: formData }
      );

      const data = await res.json();

      if (res.ok) {
        alert("Product updated successfully!");
        onUpdated();
        onClose();
      } else {
        alert(data.message || "Update failed");
      }
    } catch (err) {
      console.error(err);
      alert("Error updating product");
    }
  };

  return (
    <div className="edit-modal-overlay">
      <div className="edit-modal">
        <h3>Edit Product</h3>

        <form onSubmit={handleSubmit}>
          <label>Name *</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required />

          <label>Category *</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} required>
            {categories.map((c) => (
              <option key={c.id} value={c.category_name}>
                {c.category_name}
              </option>
            ))}
          </select>

          <label>Price *</label>
          <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} required />

          <label>Stock *</label>
          <input type="number" value={stock} onChange={(e) => setStock(e.target.value)} required />

          <label>Change Image</label>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={(e) => setImageFile(e.target.files[0])}
          />

          {(preview || product.image_url) && (
            <img
              className="preview-img"
              src={preview || `http://localhost:5001/uploads/${product.image_url}`}
              alt="preview"
            />
          )}

          <div className="modal-actions">
            <button className="save-btn" type="submit">Save</button>
            <button className="cancel-btn" type="button" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditProductModal;
