// THIS FILE IS ONLY USED FOR product-detail.html
document.addEventListener("DOMContentLoaded", () => {
  const productContent = document.getElementById("product-detail-content");
  const loadingSpinner = document.getElementById("product-loading");
  const alertContainer = document.getElementById("alert-container");

  let currentProductId = null;
  let selectedSize = null;
  let selectedColor = null;

  // FUNCTION TO MAP VIETNAMESE COLOR NAMES TO CSS HEX CODES
  const mapColorToHex = (colorName) => {
    const colorMap = {
      // Basic colors
      đỏ: "#FF0000",
      Đỏ: "#FF0000",
      "đỏ đậm": "#8B0000",
      "Đỏ đậm": "#8B0000",

      "xanh dương": "#0000FF",
      "Xanh dương": "#0000FF",
      "xanh da trời": "#1E90FF",
      "Xanh da trời": "#1E90FF",
      "xanh da trời đậm": "#00008B",
      "Xanh da trời đậm": "#00008B",
      "xanh nước biển": "#0000FF",
      "Xanh nước biển": "#0000FF",

      "xanh lá": "#00FF00",
      "Xanh lá": "#00FF00",
      "xanh lá cây": "#008000",
      "Xanh lá cây": "#008000",
      "xanh lá đậm": "#006400",
      "Xanh lá đậm": "#006400",

      vàng: "#FFFF00",
      Vàng: "#FFFF00",
      "vàng cam": "#FFA500",
      "Vàng cam": "#FFA500",

      cam: "#FF4500",
      Cam: "#FF4500",
      "cam đậm": "#FF8C00",
      "Cam đậm": "#FF8C00",

      hồng: "#FF69B4",
      Hồng: "#FF69B4",
      "hồng pastel": "#FFB6C1",
      "Hồng pastel": "#FFB6C1",

      tím: "#800080",
      Tím: "#800080",
      "tím lavender": "#E6E6FA",
      "Tím lavender": "#E6E6FA",

      nâu: "#8B4513",
      Nâu: "#8B4513",
      "nâu đất": "#A0522D",
      "Nâu đất": "#A0522D",

      đen: "#000000",
      Đen: "#000000",

      trắng: "#FFFFFF",
      Trắng: "#FFFFFF",

      xám: "#808080",
      Xám: "#808080",
      "xám đậm": "#696969",
      "Xám đậm": "#696969",
      "xám nhạt": "#D3D3D3",
      "Xám nhạt": "#D3D3D3",

      bạc: "#C0C0C0",
      Bạc: "#C0C0C0",

      be: "#F5F5DC",
      Be: "#F5F5DC",
      kem: "#FFFDD0",
      Kem: "#FFFDD0",
    };

    // Return the hex code if found, otherwise return a default gray color
    return colorMap[colorName] || "#CCCCCC";
  };

  const showAlert = (message, type = "success") => {
    const oldAlert = alertContainer.querySelector(".alert");
    if (oldAlert) {
      oldAlert.remove();
    }

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

    setTimeout(() => {
      if (alertDiv.parentNode) {
        alertDiv.remove();
      }
    }, 5000);
  };

  // FUNCTION TO FIX IMAGE PATH IN JAVASCRIPT (BACKUP)
  const fixImagePath = (imgPath) => {
    if (!imgPath) return "../img/no-image.jpg";

    // If it already has ../, keep it
    if (imgPath.startsWith("../")) return imgPath;

    // If it starts with img/, add ../
    if (imgPath.startsWith("img/")) {
      return "../" + imgPath;
    }

    // If it starts with ./img/, change it to ../img/
    if (imgPath.startsWith("./img/")) {
      return "../img/" + imgPath.substring(6);
    }

    // Default: add ../
    return "../" + imgPath;
  };

  // --- RENDERING FUNCTION ---
  const renderProductDetail = (product) => {
    currentProductId = product.id;
    document.title = `${product.name} | NYX`;

    console.log("=== PRODUCT DATA RECEIVED ===", product);
    console.log("📸 Images:", product.images);
    console.log("🎨 Colors:", product.colors);
    console.log("📏 Sizes:", product.sizes);
    console.log("🖼️ Image main:", product.image_main);

    // 1. IMAGE HANDLING
    let allImages = [];

    // Add main image if available
    if (product.image_main) {
      const fixedMainImage = fixImagePath(product.image_main);
      allImages.push(fixedMainImage);
      console.log("✅ Added main image:", fixedMainImage);
    }

    // Add all images from the images array
    if (product.images && Array.isArray(product.images)) {
      console.log(`📸 Processing ${product.images.length} images from array`);
      product.images.forEach((img, index) => {
        const fixedImg = fixImagePath(img);
        if (fixedImg && !allImages.includes(fixedImg)) {
          allImages.push(fixedImg);
          console.log(`✅ Added image ${index + 1}:`, fixedImg);
        }
      });
    }

    // If no images are found, use the default image
    if (allImages.length === 0) {
      allImages.push("../img/no-image.jpg");
      console.log("⚠️ No images found, using default");
    }

    console.log("🖼️ Final images to display:", allImages);

    const thumbnailsHTML = allImages
      .map(
        (img, index) => `
            <img src="${img}" alt="thumbnail ${index + 1}" 
                class="detail-gallery-thumbnail ${index === 0 ? "active" : ""}" 
                data-src="${img}"
                onerror="this.src='../img/no-image.jpg'">
        `
      )
      .join("");

    // 2. Price
    const priceHTML = `<span class="fs-3 fw-bold text-danger">${window.formatCurrency(
      product.price
    )}</span>`;
    const oldPriceHTML =
      product.old_price && product.old_price > product.price
        ? `<span class="fs-5 text-muted text-decoration-line-through ms-2">${window.formatCurrency(
            product.old_price
          )}</span>`
        : "";

    // 3. Rating
    const ratingHTML =
      product.rating > 0
        ? `${window.renderRatingStars(
            product.rating
          )} <span class="text-muted small ms-2">(${
            product.sold || 0
          } sold)</span>`
        : '<span class="text-muted small">No reviews yet</span>';

    // 4. SIZE - PRECISELY HANDLE DATA FROM DATABASE
    let sizesHTML = "";
    let hasSizes = false;
    selectedSize = null;

    console.log("🔍 RAW SIZES DATA:", product.sizes);
    console.log("🔍 Sizes type:", typeof product.sizes);
    console.log("🔍 Is array?", Array.isArray(product.sizes));

    // THOROUGHLY CHECK SIZES DATA
    if (
      product.sizes &&
      Array.isArray(product.sizes) &&
      product.sizes.length > 0
    ) {
      // Filter out null/undefined/empty elements
      const validSizes = product.sizes.filter(
        (size) => size && typeof size === "string" && size.trim() !== ""
      );

      if (validSizes.length > 0) {
        hasSizes = true;
        console.log(`✅ Displaying ${validSizes.length} sizes:`, validSizes);

        sizesHTML = validSizes
          .map((size, index) => {
            const sizeValue = size.trim();
            if (index === 0) selectedSize = sizeValue;

            return `<button class="btn btn-outline-secondary btn-sm product-size-btn ${
              index === 0 ? "active" : ""
            }" data-size="${sizeValue}">${sizeValue}</button>`;
          })
          .join("");
      }
    }

    // If no valid sizes, use Freesize
    if (!hasSizes) {
      console.log("📏 Using default Freesize");
      sizesHTML = `<button class="btn btn-outline-secondary btn-sm product-size-btn active" data-size="Freesize">Freesize</button>`;
      selectedSize = "Freesize";
    }

    // 5. COLOR - PRECISELY HANDLE DATA FROM DATABASE
    let colorsHTML = "";
    let hasColors = false;
    selectedColor = null;

    console.log("🔍 RAW COLORS DATA:", product.colors);
    console.log("🔍 Colors type:", typeof product.colors);
    console.log("🔍 Is array?", Array.isArray(product.colors));

    // THOROUGHLY CHECK COLORS DATA
    if (
      product.colors &&
      Array.isArray(product.colors) &&
      product.colors.length > 0
    ) {
      // Filter out null/undefined/empty elements
      const validColors = product.colors.filter(
        (color) => color && typeof color === "string" && color.trim() !== ""
      );

      if (validColors.length > 0) {
        hasColors = true;
        console.log(`✅ Displaying ${validColors.length} colors:`, validColors);

        colorsHTML = validColors
          .map((color, index) => {
            const colorValue = color.trim();
            if (index === 0) selectedColor = colorValue;
            const hexColor = mapColorToHex(colorValue);

            return `<button class="product-color-btn ${
              index === 0 ? "active" : ""
            }" style="background-color: ${hexColor}; border: 2px solid ${
              index === 0 ? "#000" : "#ddd"
            }" title="${colorValue}" data-color="${colorValue}"></button>`;
          })
          .join("");
      }
    }

    // 6. Product Status Badge
    let statusBadge = "";
    switch (product.status) {
      case "hot":
        statusBadge = '<span class="badge bg-danger ms-2">Hot</span>';
        break;
      case "bestseller":
        statusBadge = '<span class="badge bg-success ms-2">Bán chạy</span>';
        break;
      case "new":
        statusBadge = '<span class="badge bg-info ms-2">Mới</span>';
        break;
      case "promo":
      case "sale":
        statusBadge = '<span class="badge bg-warning ms-2">Khuyến mãi</span>';
        break;
    }

    // 7. Create complete HTML
    const productHTML = `
            <div class="col-lg-6">
                <img src="${allImages[0]}" alt="${product.name}" 
                    class="img-fluid detail-gallery-main" id="main-product-image"
                    onerror="this.src='../img/no-image.jpg'">
                <div class="d-flex flex-wrap gap-2 mt-2" id="product-thumbnails">
                    ${thumbnailsHTML}
                </div>
            </div>
            <div class="col-lg-6">
                <div class="d-flex align-items-center mb-2">
                    <h1 class="fw-bold" id="product-name">${product.name}</h1>
                    ${statusBadge}
                </div>
                
                <div class="text-warning mb-2" id="product-rating">${ratingHTML}</div>
                
                <div class="mb-3">
                    <span class="text-muted">Category:</span>
                    <span class="badge bg-secondary ms-2">${
                      product.category
                    }</span>
                </div>
                
                <p class="mb-3" id="product-price">${priceHTML} ${oldPriceHTML}</p>

                ${
                  hasSizes
                    ? `
                <div class="mb-3">
                    <h6 class="fw-bold">Size</h6>
                    <div class="d-flex flex-wrap gap-2" id="product-sizes">${sizesHTML}</div>
                </div>
                `
                    : ""
                }
                
                ${
                  hasColors
                    ? `
                <div class="mb-3">
                    <h6 class="fw-bold">Color</h6>
                    <div class="d-flex flex-wrap gap-2" id="product-colors">${colorsHTML}</div>
                </div>
                `
                    : ""
                }

                <div class="d-flex align-items-center mb-4">
                    <h6 class="fw-bold me-3 mb-0">Quantity</h6>
                    <input type="number" class="form-control" value="1" min="1" max="10" style="width: 100px;" id="product-quantity">
                </div>

                <button class="btn btn-primary btn-lg w-100 mb-3" id="add-to-cart-btn">
                    <i class="fas fa-cart-plus me-2"></i> Add to cart
                </button>
                
                <div class="product-info mt-4">
                    <div class="row small text-muted">
                        <div class="col-6">
                            <i class="fas fa-shopping-bag me-1"></i> Sold: ${
                              product.sold || 0
                            }
                        </div>
                        <div class="col-6">
                            <i class="fas fa-calendar-alt me-1"></i> Date Added: ${
                              product.date_added_formatted || "N/A"
                            }
                        </div>
                    </div>
                </div>
            </div>
        `;

    loadingSpinner.remove();
    productContent.innerHTML = productHTML;
    addPageEvents();
  };

  // --- EVENT ATTACHMENT FUNCTION ---
  const addPageEvents = () => {
    // Thumbnail event
    const mainImage = document.getElementById("main-product-image");
    document.querySelectorAll(".detail-gallery-thumbnail").forEach((thumb) => {
      thumb.addEventListener("click", () => {
        mainImage.src = thumb.dataset.src;
        document
          .querySelectorAll(".detail-gallery-thumbnail")
          .forEach((t) => t.classList.remove("active"));
        thumb.classList.add("active");
      });
    });

    // Select size event
    document.querySelectorAll(".product-size-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        document
          .querySelectorAll(".product-size-btn")
          .forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        selectedSize = btn.dataset.size;
        console.log("Selected size:", selectedSize);
      });
    });

    // Select color event
    document.querySelectorAll(".product-color-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".product-color-btn").forEach((b) => {
          b.style.border = "2px solid #ddd";
        });
        btn.style.border = "2px solid #000";
        document
          .querySelectorAll(".product-color-btn")
          .forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        selectedColor = btn.dataset.color;
        console.log("Selected color:", selectedColor);
      });
    });

    // Add to cart event
    document
      .getElementById("add-to-cart-btn")
      .addEventListener("click", handleAddToCart);
  };

  // --- CART HANDLING FUNCTION ---
  const handleAddToCart = async () => {
    // Validate size if multiple sizes exist
    const sizeButtons = document.querySelectorAll(".product-size-btn");
    if (sizeButtons.length > 1 && !selectedSize) {
      showAlert("Please select a size.", "danger");
      return;
    }

    // Validate color if multiple colors exist
    const colorButtons = document.querySelectorAll(".product-color-btn");
    if (colorButtons.length > 0 && !selectedColor) {
      showAlert("Please select a color.", "danger");
      return;
    }

    const quantity = parseInt(
      document.getElementById("product-quantity").value
    );
    if (quantity < 1 || quantity > 10) {
      showAlert("Quantity must be between 1 and 10.", "danger");
      return;
    }

    const data = {
      action: "add",
      product_id: currentProductId,
      quantity: quantity,
      size: selectedSize,
      color: selectedColor,
    };

    console.log("Adding to cart:", data);

    try {
      const response = await fetch("../brain_php/cart_action.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        showAlert("Product added to cart!", "success");
        if (window.updateCartCount) {
          window.updateCartCount();
        }
      } else {
        showAlert(result.message || "Error. Please try again.", "danger");
        if (result.message && result.message.includes("đăng nhập")) {
          // checking for "login" message
          setTimeout(() => {
            window.location.href = "login.html";
          }, 2000);
        }
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      showAlert("Cannot connect to server.", "danger");
    }
  };

  // --- PRODUCT LOADING FUNCTION ---
  const loadProduct = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get("id");

    if (!productId) {
      productContent.innerHTML = `
                <div class="col-12 text-center">
                    <p class="text-danger">Product ID not found.</p>
                    <a href="category.html" class="btn btn-primary mt-2">Back to category</a>
                </div>
            `;
      loadingSpinner.remove();
      return;
    }

    try {
      console.log(`🔄 Loading product ID: ${productId}`);

      const apiUrl = `../brain_php/get_product_detail.php?id=${productId}`;
      console.log(`📡 Calling API: ${apiUrl}`);

      const response = await fetch(apiUrl);

      console.log(`📡 Response status: ${response.status}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Product does not exist`);
      }

      const product = await response.json();

      console.log(`✅ Product data received:`, product);

      if (product.error) {
        throw new Error(product.error);
      }

      if (!product.id || !product.name) {
        throw new Error("Invalid product data");
      }

      console.log(`🎉 Rendering product: ${product.name}`);
      renderProductDetail(product);
    } catch (error) {
      console.error("💥 Product loading error:", error);
      loadingSpinner.remove();
      productContent.innerHTML = `
                <div class="col-12 text-center">
                    <p class="text-danger">${error.message}</p>
                    <a href="category.html" class="btn btn-primary mt-2">Back to category</a>
                </div>
            `;
    }
  };

  // Start execution
  loadProduct();
});
