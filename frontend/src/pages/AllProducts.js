import React, { useEffect, useState } from "react";
import EditProductModal from "./EditProductModal";
import "./AllProducts.css";

function AllProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState(null);

  const seller_id = localStorage.getItem("seller_unique_id");

  useEffect(() => {
    if (!seller_id) {
      window.location.href = "/seller-login";
      return;
    }
    loadData();
  }, [seller_id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const catRes = await fetch(
        `http://localhost:5001/api/seller/categories?seller_id=${seller_id}`
      );
      const catData = await catRes.json();
      setCategories(catData);

      const prodRes = await fetch(
        `http://localhost:5001/api/seller/fish?seller_id=${seller_id}`
      );
      const prodData = await prodRes.json();
      setProducts(prodData);
    } catch (err) {
      console.error("Failed to load data:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts =
    selectedCategory === "All"
      ? products
      : products.filter((p) => p.category === selectedCategory);

  const getCategoryCount = (name) =>
    name === "All"
      ? products.length
      : products.filter((p) => p.category === name).length;

  if (loading) {
    return (
      <div className="ap-container">
        <div className="ap-loading">Loading products...</div>
      </div>
    );
  }

  return (
    <div className="ap-container">
      
      {/* HEADER */}
      <div className="ap-header">
        <h2>All Products</h2>
        <div className="ap-product-count">
          {filteredProducts.length}{" "}
          {filteredProducts.length === 1 ? "Product" : "Products"}
        </div>
      </div>

      {/* CATEGORY FILTER */}
      <div className="ap-category-filter">
        <button
          className={`ap-category-btn ${
            selectedCategory === "All" ? "active" : ""
          }`}
          onClick={() => setSelectedCategory("All")}
        >
          All ({products.length})
        </button>

        {categories.map((cat) => (
          <button
            key={cat.id}
            className={`ap-category-btn ${
              selectedCategory === cat.category_name ? "active" : ""
            }`}
            onClick={() => setSelectedCategory(cat.category_name)}
          >
            {cat.category_name} ({getCategoryCount(cat.category_name)})
          </button>
        ))}
      </div>

      {/* TABLE */}
      {filteredProducts.length === 0 ? (
        <div className="ap-no-products">
          <p>No products in "{selectedCategory}" category.</p>
          <button
            className="ap-view-all-btn"
            onClick={() => setSelectedCategory("All")}
          >
            View All Products
          </button>
        </div>
      ) : (
        <div className="ap-table-wrapper">
          <table className="ap-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Name</th>
                <th>Category</th>
                <th>Price (₱/kg)</th>
                <th>Stock</th>
                <th>Previous Price</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredProducts.map((p) => {
                let stockStatus = "high";
                if (p.stock < 5) stockStatus = "critical";
                else if (p.stock <= 20) stockStatus = "low";

                return (
                  <tr key={p.id}>
                    <td>
                      {p.image_url ? (
                        <img
                          src={`http://localhost:5001/uploads/${p.image_url}`}
                          alt={p.name}
                          className="ap-product-img"
                        />
                      ) : (
                        <div className="ap-no-image">📷</div>
                      )}
                    </td>

                    <td>{p.name}</td>
                    <td>{p.category}</td>
                    <td>₱{Number(p.price).toFixed(2)}</td>

                    <td className={`ap-stock-cell ${stockStatus}`}>
                      {p.stock} {p.unit || "kg"}
                    </td>

                    <td>
                      {p.previous_price &&
                      p.previous_price !== p.price
                        ? `₱${Number(p.previous_price).toFixed(2)}`
                        : "-"}
                    </td>

                    {/* EDIT BUTTON */}
                    <td>
                      <button
                        className="ap-edit-btn"
                        onClick={() => setEditingProduct(p)}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {editingProduct && (
        <EditProductModal
          product={editingProduct}
          categories={categories}
          seller_id={seller_id}
          onClose={() => setEditingProduct(null)}
          onUpdated={loadData}
        />
      )}
    </div>
  );
}

export default AllProducts;