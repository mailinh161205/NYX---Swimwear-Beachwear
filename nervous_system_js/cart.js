// THIS FILE IS ONLY FOR cart.html
document.addEventListener("DOMContentLoaded", () => {
  const cartContent = document.getElementById("cart-content");
  const cartLoader = document.getElementById("cart-loader");
  const alertContainer = document.getElementById("alert-container");

  // ALERT DISPLAY FUNCTION
  const showAlert = (message, type = "success") => {
    // Remove old alert
    const oldAlert = alertContainer.querySelector(".alert");
    if (oldAlert) oldAlert.remove();

    const alertClass = `alert alert-${type} alert-dismissible fade show`;
    const icon =
      type === "success"
        ? "fa-check-circle"
        : type === "danger"
        ? "fa-exclamation-circle"
        : "fa-info-circle";

    const alertDiv = document.createElement("div");
    alertDiv.className = alertClass;
    alertDiv.innerHTML = `
            <i class="fas ${icon} me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

    alertContainer.appendChild(alertDiv);
    window.scrollTo(0, 0);

    // Auto remove after 5 seconds
    setTimeout(() => {
      if (alertDiv.parentNode) alertDiv.remove();
    }, 5000);
  };

  // IMAGE PATH FIX FUNCTION
  const fixImagePath = (imgPath) => {
    if (!imgPath) return "../img/no-image.jpg";
    if (imgPath.startsWith("../")) return imgPath;
    if (imgPath.startsWith("img/")) return "../" + imgPath;
    if (imgPath.startsWith("./img/")) return "../img/" + imgPath.substring(6);
    return "../" + imgPath;
  };

  // CURRENCY FORMATTING FUNCTION
  if (typeof window.formatCurrency === "undefined") {
    window.formatCurrency = (amount) => {
      return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(amount);
    };
  }

  // CART DISPLAY FUNCTION
  const renderCart = (data) => {
    console.log("Cart data:", data);

    // Handle login error
    if (!data.success) {
      cartContent.innerHTML = `
                <div class="col-12 text-center py-5">
                    <div class="alert alert-warning">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        ${data.message}
                    </div>
                    <a href="login.html" class="btn btn-primary mt-3">
                        <i class="fas fa-sign-in-alt me-2"></i>Log in now
                    </a>
                </div>`;
      return;
    }

    // Handle empty cart
    if (!data.cart || data.cart.length === 0) {
      cartContent.innerHTML = `
                <div class="col-12 text-center py-5">
                    <div class="empty-cart-icon mb-3">
                        <i class="fas fa-shopping-cart fa-4x text-muted"></i>
                    </div>
                    <h4 class="text-muted mb-3">Your cart is empty</h4>
                    <p class="text-muted mb-4">Explore our latest products!</p>
                    <a href="category.html" class="btn btn-primary btn-lg">
                        <i class="fas fa-shopping-bag me-2"></i>Continue shopping
                    </a>
                </div>`;
      updateCartCount(0);
      return;
    }

    let itemsHTML = "";
    let totalPrice = 0;
    let totalItems = 0;

    // Create HTML for each product
    data.cart.forEach((item) => {
      const itemPrice = item.price * item.quantity;
      totalPrice += itemPrice;
      totalItems += item.quantity;

      const fixedImage = fixImagePath(item.image_main);

      itemsHTML += `
                <div class="card mb-3 shadow-sm border-0 cart-item-row" data-cart-id="${
                  item.cart_id
                }">
                    <div class="row g-0 align-items-center">
                        <div class="col-md-2 col-4">
                            <a href="product-detail.html?id=${item.product_id}">
                                <img src="${fixedImage}" 
                                    class="img-fluid rounded-start cart-item-image" 
                                    alt="${item.name}"
                                    onerror="this.src='../img/no-image.jpg'">
                            </a>
                        </div>
                        <div class="col-md-7 col-5">
                            <div class="card-body py-2 px-3">
                                <h6 class="card-title fw-bold mb-1">
                                    <a href="product-detail.html?id=${
                                      item.product_id
                                    }" 
                                        class="text-dark text-decoration-none product-name-link">
                                        ${item.name}
                                    </a>
                                </h6>
                                <div class="product-details small text-muted mb-2">
                                    ${
                                      item.size && item.size !== "Freesize"
                                        ? `<span class="me-3"><strong>Size:</strong> ${item.size}</span>`
                                        : ""
                                    }
                                    ${
                                      item.color
                                        ? `<span><strong>Color:</strong> ${item.color}</span>`
                                        : ""
                                    }
                                </div>
                                <p class="card-text fw-bold text-danger mb-2 item-price">
                                    ${window.formatCurrency(item.price)}
                                </p>
                                <div class="quantity-controls d-flex align-items-center">
                                    <label class="form-label small me-2 mb-0">Quantity:</label>
                                    <div class="input-group input-group-sm">
                                        <button class="btn btn-outline-secondary btn-minus" type="button" 
                                            data-cart-id="${item.cart_id}">
                                            <i class="fas fa-minus"></i>
                                        </button>
                                        <input type="number" 
                                            class="form-control text-center item-quantity-input" 
                                            value="${item.quantity}" 
                                            min="1" max="10"
                                            data-cart-id="${item.cart_id}">
                                        <button class="btn btn-outline-secondary btn-plus" type="button" 
                                            data-cart-id="${item.cart_id}">
                                            <i class="fas fa-plus"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3 col-3 text-end">
                            <div class="item-total-price fw-bold text-danger mb-2">
                                ${window.formatCurrency(itemPrice)}
                            </div>
                            <button class="btn btn-outline-danger btn-sm btn-remove-cart" 
                                data-cart-id="${item.cart_id}"
                                title="Remove product">
                                <i class="fas fa-trash"></i> Remove
                            </button>
                        </div>
                    </div>
                </div>
            `;
    });

    // Create overall HTML structure
    cartContent.innerHTML = `
            <div class="col-lg-8" id="cart-items-list">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h5 class="fw-bold mb-0">Products (${totalItems})</h5>
                    <button class="btn btn-outline-danger btn-sm" id="clear-cart-btn">
                        <i class="fas fa-trash me-1"></i>Clear all
                    </button>
                </div>
                ${itemsHTML}
            </div>
            <div class="col-lg-4" id="cart-summary">
                <div class="card shadow-sm border-0 sticky-summary">
                    <div class="card-body p-4">
                        <h5 class="fw-bold border-bottom pb-2 mb-3">ORDER SUMMARY</h5>
                        <div class="d-flex justify-content-between mb-2">
                            <span class="text-muted">Subtotal (${totalItems} items):</span>
                            <span class="fw-bold" id="subtotal-price">${window.formatCurrency(
                              totalPrice
                            )}</span>
                        </div>
                        <div class="d-flex justify-content-between mb-2">
                            <span class="text-muted">Shipping fee:</span>
                            <span class="fw-bold text-success">Free</span>
                        </div>
                        <div class="d-flex justify-content-between mb-3">
                            <span class="text-muted">Discount:</span>
                            <span class="fw-bold text-success">0đ</span>
                        </div>
                        <hr>
                        <div class="d-flex justify-content-between fs-5 mb-4">
                            <span class="fw-bold">TOTAL:</span>
                            <span class="fw-bold text-danger" id="total-price">${window.formatCurrency(
                              totalPrice
                            )}</span>
                        </div>
                        <button class="btn btn-primary w-100 btn-lg mt-2" id="checkout-btn">
                            <i class="fas fa-credit-card me-2"></i>PROCEED TO CHECKOUT
                        </button>
                        <div class="text-center mt-3">
                            <a href="category.html" class="text-decoration-none">
                                <i class="fas fa-arrow-left me-1"></i>Continue shopping
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        `;

    addCartEvents();
    updateCartCount(totalItems);
  };

  // UPDATE CART COUNT ON ICON FUNCTION
  const updateCartCount = (count) => {
    const cartCountElement = document.getElementById("cartCount");
    if (cartCountElement) {
      cartCountElement.textContent = count;
      cartCountElement.style.display = count > 0 ? "inline" : "none";
    }
  };

  // LOAD CART FUNCTION
  const loadCart = async () => {
    cartLoader.style.display = "block";
    try {
      const response = await fetch("../brain_php/get_cart.php");
      if (!response.ok) throw new Error("Network response was not ok");

      const data = await response.json();
      cartLoader.style.display = "none";
      renderCart(data);
    } catch (error) {
      console.error("Error loading cart:", error);
      cartLoader.style.display = "none";
      cartContent.innerHTML = `
                <div class="col-12 text-center py-5">
                    <div class="alert alert-danger">
                        <i class="fas fa-exclamation-circle me-2"></i>
                        Could not load cart. Please try again later.
                    </div>
                    <button class="btn btn-primary mt-3" onclick="location.reload()">
                        <i class="fas fa-redo me-2"></i>Reload page
                    </button>
                </div>`;
    }
  };

  // UPDATE QUANTITY FUNCTION
  const updateCartQuantity = async (cart_id, quantity) => {
    try {
      const response = await fetch("../brain_php/cart_action.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          cart_id: cart_id,
          quantity: quantity,
        }),
      });

      const result = await response.json();

      if (result.success) {
        loadCart(); // Reload cart
      } else {
        showAlert(
          result.message || "An error occurred while updating the cart",
          "danger"
        );
      }
    } catch (error) {
      console.error("Error updating cart:", error);
      showAlert("Could not connect to server", "danger");
    }
  };

  // REMOVE PRODUCT FUNCTION
  const removeFromCart = async (cart_id) => {
    if (!confirm("Are you sure you want to remove this product from the cart?"))
      return;

    try {
      const response = await fetch("../brain_php/cart_action.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "remove", cart_id: cart_id }),
      });

      const result = await response.json();

      if (result.success) {
        showAlert("Product removed from cart", "success");
        loadCart();
      } else {
        showAlert(
          result.message || "An error occurred while removing the product",
          "danger"
        );
      }
    } catch (error) {
      console.error("Error removing from cart:", error);
      showAlert("Could not connect to server", "danger");
    }
  };

  // CLEAR ALL FUNCTION
  const clearCart = async () => {
    if (!confirm("Are you sure you want to remove all products from the cart?"))
      return;

    try {
      const cartItems = document.querySelectorAll(".cart-item-row");
      const deletePromises = Array.from(cartItems).map((item) => {
        const cart_id = item.dataset.cartId;
        return fetch("../brain_php/cart_action.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "remove", cart_id: cart_id }),
        });
      });

      await Promise.all(deletePromises);
      showAlert("All products removed from cart", "success");
      loadCart();
    } catch (error) {
      console.error("Error clearing cart:", error);
      showAlert("Could not clear cart", "danger");
    }
  };

  // ADD EVENTS FUNCTION
  const addCartEvents = () => {
    // Quantity change event via input
    document.querySelectorAll(".item-quantity-input").forEach((input) => {
      input.addEventListener("change", (e) => {
        const cart_id = e.target.dataset.cartId;
        const quantity = parseInt(e.target.value);

        if (quantity >= 1 && quantity <= 10) {
          updateCartQuantity(cart_id, quantity);
        } else {
          e.target.value = 1;
          showAlert("Quantity must be between 1 and 10", "warning");
        }
      });
    });

    // Decrement quantity button event
    document.querySelectorAll(".btn-minus").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const cart_id = e.currentTarget.dataset.cartId;
        const input = document.querySelector(
          `.item-quantity-input[data-cart-id="${cart_id}"]`
        );
        let quantity = parseInt(input.value) - 1;

        if (quantity >= 1) {
          input.value = quantity;
          updateCartQuantity(cart_id, quantity);
        }
      });
    });

    // Increment quantity button event
    document.querySelectorAll(".btn-plus").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const cart_id = e.currentTarget.dataset.cartId;
        const input = document.querySelector(
          `.item-quantity-input[data-cart-id="${cart_id}"]`
        );
        let quantity = parseInt(input.value) + 1;

        if (quantity <= 10) {
          input.value = quantity;
          updateCartQuantity(cart_id, quantity);
        } else {
          showAlert("Maximum quantity is 10", "warning");
        }
      });
    });

    // Remove product event
    document.querySelectorAll(".btn-remove-cart").forEach((button) => {
      button.addEventListener("click", (e) => {
        const cart_id = e.currentTarget.dataset.cartId;
        removeFromCart(cart_id);
      });
    });

    // Clear all event
    const clearCartBtn = document.getElementById("clear-cart-btn");
    if (clearCartBtn) {
      clearCartBtn.addEventListener("click", clearCart);
    }

    // Checkout event
    const checkoutBtn = document.getElementById("checkout-btn");
    if (checkoutBtn) {
      checkoutBtn.addEventListener("click", () => {
        showAlert("Checkout feature is currently under development", "info");
      });
    }
  };

  // INITIALIZE
  loadCart();
});
