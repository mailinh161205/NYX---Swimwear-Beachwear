document.addEventListener("DOMContentLoaded", function () {
  console.log("🎯 Initializing product loading...");

  const grid = document.getElementById("new-products-grid");
  if (!grid) {
    console.error("❌ Product grid not found");
    return;
  }

  // AUTOMATICALLY SELECT API URL BASED ON CURRENT HOST
  const getApiBaseUrl = () => {
    const { hostname, port, protocol } = window.location;

    if (hostname === "127.0.0.1" && port === "5500") {
      return `${protocol}//localhost/nyx_store/brain_php`;
    }

    if (hostname === "localhost") {
      return "../brain_php";
    }

    return "../brain_php";
  };

  const apiBase = getApiBaseUrl();
  const apiUrl = `${apiBase}/get_products.php?sort=newest&limit=4`;

  console.log("📍 Current Host:", window.location.host);
  console.log("📍 API Base URL:", apiBase);
  console.log("📍 Calling API:", apiUrl);

  fetch(apiUrl)
    .then((response) => {
      console.log("📡 HTTP Status:", response.status, response.statusText);
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }
      return response.text();
    })
    .then((text) => {
      console.log("📦 Response (100 characters):", text.substring(0, 100));

      if (text.includes("<?php") || text.includes("require_once")) {
        throw new Error(
          `PHP is not processed. Please access via: http://localhost/nyx_store/skeleton_html/index.html`
        );
      }

      try {
        const data = JSON.parse(text);
        renderProducts(data.data);
      } catch (e) {
        throw new Error("Failed to parse JSON: " + text.substring(0, 100));
      }
    })
    .catch((error) => {
      console.error("💥 Error:", error);
      grid.innerHTML = `
                <div class="col-12 text-center">
                    <div class="alert alert-warning">
                        <h5><i class="fas fa-info-circle"></i> Important Notice</h5>
                        <p class="mb-2">${error.message}</p>
                        <p class="small mb-3">VS Code's Live Server cannot run PHP.</p>
                        <div class="mt-2">
                            <a href="http://localhost/nyx_store/skeleton_html/index.html" 
                                class="btn btn-success btn-sm">
                                <i class="fas fa-external-link-alt me-1"></i>
                                Access the correct path
                            </a>
                        </div>
                    </div>
                </div>
            `;
    });

  function renderProducts(products) {
    if (!products || products.length === 0) {
      grid.innerHTML =
        '<div class="col-12 text-center text-muted">No products available yet</div>';
      return;
    }

    let html = "";
    products.forEach((product) => {
      // MAIN IMAGE - from image_main field
      const mainImage = product.image_main
        ? "../" + product.image_main
        : "../img/no-image.jpg";

      // HOVER IMAGE - Get from images array (FIRST element)
      let hoverImage = mainImage; // Default to main image if no hover image
      let hasHoverImage = false;

      if (product.images) {
        try {
          const imagesArray = JSON.parse(product.images);
          console.log(`📸 Product ${product.id} images:`, imagesArray);

          // CORRECTED: Get the FIRST element of the array as the hover image
          if (imagesArray.length >= 1 && imagesArray[0]) {
            hoverImage = "../" + imagesArray[0];
            hasHoverImage = true;
            console.log(
              `✅ Product ${product.id} has hover image:`,
              hoverImage
            );
          }
        } catch (e) {
          console.error("Error parsing images JSON:", e);
        }
      }

      if (!hasHoverImage) {
        console.warn(
          `⚠️ Product ${product.id} does not have a hover image, using main image`
        );
      }

      const price = new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(product.price);

      html += `
            <div class="col">
                <div class="card h-100 product-card border-0 shadow-sm hover-lift">
                    <div class="product-image-wrapper position-relative overflow-hidden">
                        <a href="product-detail.html?id=${
                          product.id
                        }" class="text-decoration-none d-block">
                            <img src="${mainImage}" 
                                class="card-img-top product-image-home" 
                                alt="${product.name}"
                                onerror="this.src='../img/no-image.jpg'"
                                data-product-id="${product.id}">
                            
                            <img src="${hoverImage}" 
                                class="card-img-top product-image-hover position-absolute top-0 start-0" 
                                alt="${product.name} - Hover"
                                onerror="
                                    console.error('Failed to load hover image: ${hoverImage}');
                                    this.style.display='none';
                                "
                                data-product-id="${product.id}">
                            
                            ${
                              product.status === "sale"
                                ? `<span class="position-absolute top-0 start-0 bg-danger text-white px-2 py-1 m-2 small rounded">
                                        <i class="fas fa-tag me-1"></i>SALE
                                    </span>`
                                : ""
                            }
                            ${
                              product.status === "new"
                                ? `<span class="position-absolute top-0 start-0 bg-success text-white px-2 py-1 m-2 small rounded">
                                        <i class="fas fa-star me-1"></i>NEW
                                    </span>`
                                : ""
                            }
                        </a>
                        
                        <div class="product-actions position-absolute bottom-0 start-0 end-0 bg-light bg-opacity-90 p-2 text-center">
                            <button class="btn btn-dark btn-sm me-1" onclick="location.href='product-detail.html?id=${
                              product.id
                            }'">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn btn-outline-dark btn-sm quick-cart-btn" data-product-id="${
                              product.id
                            }">
                                <i class="fas fa-shopping-cart"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div class="card-body text-center p-3">
                        <h6 class="fw-bold text-dark mb-1 product-title">${
                          product.name
                        }</h6>
                        <div class="rating mb-2">
                            ${renderRatingStars(product.rating)}
                            <small class="text-muted ms-1">(${
                              product.rating
                            })</small>
                        </div>
                        <p class="text-danger fw-bold fs-5 mb-0">${price}</p>
                        ${
                          product.old_price
                            ? `<small class="text-muted text-decoration-line-through">
                                    ${new Intl.NumberFormat("vi-VN", {
                                      style: "currency",
                                      currency: "VND",
                                    }).format(product.old_price)}
                                </small>`
                            : ""
                        }
                        ${
                          product.sold
                            ? `<div class="mt-1">
                                    <small class="text-success">
                                        <i class="fas fa-fire me-1"></i>Sold: ${product.sold}
                                    </small>
                                </div>`
                            : ""
                        }
                    </div>
                </div>
            </div>
        `;
    });

    grid.innerHTML = html;

    // Add event listeners for hover effect
    initHoverEffects();

    console.log(`✅ Displayed ${products.length} products with hover effects`);
  }

  function renderRatingStars(rating) {
    let stars = "";
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5 ? 1 : 0;
    const emptyStars = 5 - fullStars - halfStar;

    for (let i = 0; i < fullStars; i++) {
      stars += '<i class="fas fa-star text-warning small"></i>';
    }
    if (halfStar) {
      stars += '<i class="fas fa-star-half-alt text-warning small"></i>';
    }
    for (let i = 0; i < emptyStars; i++) {
      stars += '<i class="far fa-star text-warning small"></i>';
    }
    return stars;
  }

  function initHoverEffects() {
    const productCards = document.querySelectorAll(".product-image-wrapper");

    productCards.forEach((container) => {
      const actions = container.querySelector(".product-actions");

      container.addEventListener("mouseenter", function () {
        if (actions) {
          actions.style.transform = "translateY(0)";
        }
      });

      container.addEventListener("mouseleave", function () {
        if (actions) {
          actions.style.transform = "translateY(100%)";
        }
      });
    });

    // Handle quick add to cart button
    document.querySelectorAll(".quick-cart-btn").forEach((btn) => {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        const productId = this.getAttribute("data-product-id");
        addToCart(productId);
      });
    });
  }

  function addToCart(productId) {
    // Display temporary toast notification
    const toast = document.createElement("div");
    toast.className = "position-fixed bottom-0 end-0 m-3 alert alert-success";
    toast.innerHTML = `
            <i class="fas fa-check-circle me-2"></i>
            Product added to cart!
            <button type="button" class="btn-close ms-2" data-bs-dismiss="alert"></button>
        `;
    document.body.appendChild(toast);

    // Automatically hide after 3 seconds
    setTimeout(() => {
      toast.remove();
    }, 3000);

    console.log(`Adding product ${productId} to cart`);
    // TODO: Call API to add to cart
  }
});
