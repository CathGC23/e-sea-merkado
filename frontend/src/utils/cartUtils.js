/**
 * Cart Utilities
 * Handles user-specific cart storage
 * Uses sessionStorage for customer_id (tab-specific)
 * Uses localStorage for cart data (persistent)
 */

/**
 * Get the current logged-in customer ID from sessionStorage (tab-specific)
 * @returns {string|null} Customer ID or null if not logged in
 */
export const getCustomerId = () => {
  // ✅ Use sessionStorage for tab-specific customer ID
  const customerId = sessionStorage.getItem("customer_id");
  
  if (!customerId) {
    console.warn("⚠️ No customer_id found in sessionStorage");
    console.warn("   User might not be logged in this tab");
    return null;
  }
  
  console.log("✅ Customer ID (from sessionStorage):", customerId);
  return customerId;
};

/**
 * Get the cart key for the current user
 * @returns {string} Cart key like "cart_1", "cart_2", etc.
 */
const getCartKey = () => {
  const customerId = getCustomerId();
  
  if (!customerId) {
    console.warn("⚠️ Using guest cart (not logged in)");
    return "cart_guest";
  }
  
  return `cart_${customerId}`;
};

/**
 * Get cart items for the current user
 * @returns {Array} Array of cart items
 */
export const getCart = () => {
  const cartKey = getCartKey();
  // ✅ Cart data stays in localStorage for persistence
  const cartData = localStorage.getItem(cartKey);
  
  if (!cartData) {
    console.log("📦 No cart found for key:", cartKey);
    return [];
  }
  
  try {
    const cart = JSON.parse(cartData);
    console.log(`📦 Loaded ${cart.length} items from ${cartKey}`);
    return Array.isArray(cart) ? cart : [];
  } catch (error) {
    console.error("❌ Error parsing cart data:", error);
    return [];
  }
};

/**
 * Save cart items for the current user
 * @param {Array} cart - Array of cart items to save
 */
export const saveCart = (cart) => {
  const cartKey = getCartKey();
  
  if (!Array.isArray(cart)) {
    console.error("❌ Invalid cart data: must be an array");
    return;
  }
  
  try {
    // ✅ Cart data stays in localStorage for persistence
    localStorage.setItem(cartKey, JSON.stringify(cart));
    console.log(`✅ Saved ${cart.length} items to ${cartKey}`);
  } catch (error) {
    console.error("❌ Error saving cart:", error);
  }
};

/**
 * Add item to cart for the current user
 * @param {Object} item - Product item to add
 * @param {number} quantity - Quantity to add (default: 1)
 */
export const addToCart = (item, quantity = 1) => {
  const customerId = getCustomerId();
  
  if (!customerId) {
    console.error("❌ Cannot add to cart: User not logged in");
    alert("Please login first to add items to cart");
    return false;
  }
  
  const cart = getCart();
  const existingIndex = cart.findIndex(cartItem => cartItem.id === item.id);
  
  if (existingIndex !== -1) {
    // Item exists, update quantity
    cart[existingIndex].quantity += quantity;
    console.log(`📦 Updated quantity for item ${item.id}`);
  } else {
    // New item, add to cart
    cart.push({ ...item, quantity });
    console.log(`📦 Added new item ${item.id} to cart`);
  }
  
  saveCart(cart);
  return true;
};

/**
 * Remove item from cart
 * @param {number} productId - ID of product to remove
 */
export const removeFromCart = (productId) => {
  const cart = getCart();
  const updatedCart = cart.filter(item => item.id !== productId);
  saveCart(updatedCart);
  console.log(`🗑️ Removed item ${productId} from cart`);
};

/**
 * Clear entire cart for current user
 */
export const clearCart = () => {
  const cartKey = getCartKey();
  localStorage.removeItem(cartKey);
  console.log(`🧹 Cleared cart: ${cartKey}`);
};

/**
 * Get cart item count for current user
 * @returns {number} Total number of items in cart
 */
export const getCartCount = () => {
  const cart = getCart();
  return cart.reduce((total, item) => total + (item.quantity || 1), 0);
};

/**
 * Migrate old cart data (if any) to user-specific storage
 * Call this after login to preserve any items added before login
 */
export const migrateOldCart = () => {
  const customerId = getCustomerId();
  
  if (!customerId) {
    console.warn("⚠️ Cannot migrate cart: No customer ID");
    return;
  }
  
  // Check for old cart (before user-specific implementation)
  const oldCart = localStorage.getItem("cart");
  const guestCart = localStorage.getItem("cart_guest");
  
  if (oldCart || guestCart) {
    try {
      const existingCart = getCart();
      const oldItems = JSON.parse(oldCart || guestCart || "[]");
      
      if (oldItems.length > 0) {
        console.log(`🔄 Migrating ${oldItems.length} items from old cart`);
        
        // Merge old items with existing user cart
        const mergedCart = [...existingCart];
        
        oldItems.forEach(oldItem => {
          const existingIndex = mergedCart.findIndex(item => item.id === oldItem.id);
          if (existingIndex !== -1) {
            // Item exists, add quantities
            mergedCart[existingIndex].quantity += oldItem.quantity || 1;
          } else {
            // New item, add to cart
            mergedCart.push(oldItem);
          }
        });
        
        saveCart(mergedCart);
        
        // Clean up old cart data
        localStorage.removeItem("cart");
        localStorage.removeItem("cart_guest");
        
        console.log("✅ Cart migration complete");
      }
    } catch (error) {
      console.error("❌ Error migrating cart:", error);
    }
  }
};