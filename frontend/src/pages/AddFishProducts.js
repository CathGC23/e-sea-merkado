import React, { useState, useEffect, useRef } from "react";
import "./AddFishProducts.css";

function AddFishProducts() {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [categories, setCategories] = useState([]);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [seller_id, setSellerId] = useState(null);
  const fileInputRef = useRef(null);

  // Load seller ID
  useEffect(() => {
    const id = localStorage.getItem("seller_unique_id");
    if (!id) {
      alert("Seller not logged in! Redirecting...");
      window.location.href = "/seller-login";
    } else {
      setSellerId(id);
    }
  }, []);

  // Load categories
  useEffect(() => {
    if (!seller_id) return;
    loadCategories();
  }, [seller_id]);

  const loadCategories = async () => {
    try {
      const res = await fetch(
        `http://localhost:5001/api/seller/categories?seller_id=${seller_id}`
      );
      const data = await res.json();
      setCategories(data);
      if (data.length > 0 && !category) {
        setCategory(data[0].category_name);
      }
    } catch (err) {
      console.error("Error loading categories:", err);
      alert("Error loading categories");
    }
  };

  // Image preview
  useEffect(() => {
    if (!imageFile) {
      setImagePreview(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result);
    reader.readAsDataURL(imageFile);
  }, [imageFile]);

  // Reset form
  const resetForm = () => {
    setName("");
    setCategory(categories.length > 0 ? categories[0].category_name : "");
    setPrice("");
    setStock("");
    setImageFile(null);
    setImagePreview(null);
    setEditingId(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Add new category
  const handleAddCategory = async () => {
    if (!newCategory.trim()) {
      alert("Please enter a category name");
      return;
    }

    try {
      const res = await fetch("http://localhost:5001/api/seller/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category_name: newCategory.trim(),
          seller_id: seller_id,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        await loadCategories();
        setCategory(newCategory.trim());
        setNewCategory("");
        setShowAddCategory(false);
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error("Error adding category:", err);
      alert("Error adding category");
    }
  };

  // Submit form (add or update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!seller_id) return;

    if (!category) {
      alert("Please select a category");
      return;
    }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("category", category);
    formData.append("unit", "kg");
    formData.append("price", price);
    formData.append("stock", stock);
    formData.append("seller_id", seller_id);
    if (imageFile) formData.append("image", imageFile);

    setLoading(true);

    try {
      let res;
      if (editingId) {
        res = await fetch(`http://localhost:5001/api/seller/fish/${editingId}`, {
          method: "PUT",
          body: formData,
        });
      } else {
        res = await fetch("http://localhost:5001/api/seller/add-fish", {
          method: "POST",
          body: formData,
        });
      }

      const data = await res.json();

      if (res.ok) {
        alert(data.message);
        resetForm();
      } else {
        alert(data.message || "Error saving product");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-fish-container">
      <h2>{editingId ? "Edit Fish Product" : "Add Fish Product"}</h2>

      <form onSubmit={handleSubmit} className="fish-form">

        {/* NAME */}
        <div className="form-group">
          <label>Fish Name *</label>
          <input
            placeholder="e.g., Tilapia, Bangus, Tuna"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        {/* CATEGORY */}
        <div className="form-group">
          <label>Category *</label>
          <div className="category-section">
            <div className="category-input-group">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              >
                <option value="">Select Category</option>
                {categories.map((cat, idx) => (
                  <option key={idx} value={cat.category_name}>
                    {cat.category_name}
                  </option>
                ))}
              </select>

              <button
                type="button"
                className="add-category-btn"
                onClick={() => setShowAddCategory(!showAddCategory)}
              >
                {showAddCategory ? "✕" : "+ Add"}
              </button>
            </div>

            {showAddCategory && (
              <div className="new-category-input">
                <input
                  type="text"
                  placeholder="New category name"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                />
                <button type="button" onClick={handleAddCategory}>
                  Save
                </button>
              </div>
            )}
          </div>
        </div>

        {/* PRICE */}
        <div className="form-group">
          <label>Price per Kilogram (₱) *</label>
          <input
            type="number"
            placeholder="150.00"
            step="0.01"
            min="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
        </div>

        {/* STOCK */}
        <div className="form-group">
          <label>Stock (kg) *</label>
          <input
            type="number"
            placeholder="50"
            min="0"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            required
          />
        </div>

        {/* IMAGE UPLOAD */}
        <div className="form-group">
          <label>Product Image *</label>

          <button
            type="button"
            className="upload-btn"
            onClick={() => fileInputRef.current.click()}
          >
            📤 Upload Image
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => setImageFile(e.target.files[0])}
          />

          {imagePreview && (
            <div className="image-preview-box">
              <img src={imagePreview} alt="preview" />
              <button
                type="button"
                className="remove-image-btn"
                onClick={() => {
                  setImageFile(null);
                  setImagePreview(null);
                  fileInputRef.current.value = "";
                }}
              >
                Remove Image
              </button>
            </div>
          )}
        </div>

        {/* ACTION BUTTONS */}
        <div className="form-actions">
          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? "Saving..." : editingId ? "Save Changes" : "Add Product"}
          </button>

          <button type="button" className="reset-btn" onClick={resetForm}>
            Reset
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddFishProducts;
