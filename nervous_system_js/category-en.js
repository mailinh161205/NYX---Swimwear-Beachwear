// category.js - Handles product display by category and pagination
document.addEventListener("DOMContentLoaded", function () {
  console.log("🛍️ Initializing category page...");

  // Global variables
  let currentPage = 1;
  let productsPerPage = 12;
  let allProducts = [];
  let filteredProducts = [];
  let currentCategory = "";

  // Elements
  const productsGrid = document.getElementById("products-grid");
  const pagination = document.getElementById("pagination");
  const loadingSpinner = document.getElementById("loading-spinner");
  const productsCount = document.getElementById("products-count");
  const sortSelect = document.getElementById("sort-select");
  const filterForm = document.getElementById("filter-form");
  const categoryTitle = document.getElementById("category-title");

  // Get parameters from URL
  const urlParams = new URLSearchParams(window.location.search);
  const categoryFromUrl = urlParams.get("type") || "";
  currentCategory = categoryFromUrl;

  console.log("📍 Category from URL:", currentCategory);

  // Initialize page
  initPage();

  function initPage() {
    // Update title based on URL or current page
    updatePageTitle();

    // Check radio button if category is present in URL
    if (currentCategory) {
      const radioButton = document.querySelector(
        `input[name="category"][value="${currentCategory}"]`
      );
      if (radioButton) {
        radioButton.checked = true;
        console.log(`✅ Radio button checked for category: ${currentCategory}`);
      } else {
        console.warn(
          `⚠️ Radio button not found for category: ${currentCategory}`
        );
      }
    }

    loadProducts();
    setupEventListeners();
  }

  function setupEventListeners() {
    // Sorting
    if (sortSelect) {
      sortSelect.addEventListener("change", function () {
        currentPage = 1;
        applyFiltersAndSort();
      });
    }

    // Filtering
    if (filterForm) {
      filterForm.addEventListener("submit", function (e) {
        e.preventDefault();
        currentPage = 1;
        applyFiltersAndSort();
      });

      // Reset filters
      document
        .getElementById("reset-filters")
        ?.addEventListener("click", function () {
          filterForm.reset();
          currentPage = 1;
          currentCategory = "";
          updatePageTitle();
          applyFiltersAndSort();
        });
    }

    // Event listeners for category radio buttons
    document.querySelectorAll('input[name="category"]').forEach((radio) => {
      radio.addEventListener("change", function () {
        console.log(`🎯 Category changed to: ${this.value}`);
        currentPage = 1;
        currentCategory = this.value;
        updatePageTitle();
        applyFiltersAndSort();
      });
    });
  }

  function updatePageTitle() {
    if (!categoryTitle) return;

    const isCollectionPage =
      window.location.pathname.includes("collection.html");

    if (isCollectionPage) {
      if (currentCategory) {
        const categoryNames = {
          bikini: "Women's Bikini",
          monokini: "One-Piece Swimwear",
          men: "Men's Fashion",
          kid: "Kids' Swimwear",
          accessory: "Beach Accessories",
        };
        categoryTitle.textContent =
          categoryNames[currentCategory] || "Collection";
      } else {
        categoryTitle.textContent = "Collection";
      }
    } else {
      if (currentCategory) {
        const categoryNames = {
          bikini: "Women's Bikini",
          monokini: "One-Piece Swimwear",
          men: "Men's Fashion",
          kid: "Kids' Swimwear",
          accessory: "Beach Accessories",
        };
        categoryTitle.textContent =
          categoryNames[currentCategory] || "Products";
      } else {
        categoryTitle.textContent = "All Products"; // ĐÃ SỬA
      }
    }
  }

  function loadProducts() {
    showLoading(true);

    // Create API URL with parameters
    let apiUrl = "../brain_php/get_products.php?";

    // DO NOT add category to URL - filtering will be done client-side
    apiUrl += `limit=200`; // Fetch many products for pagination and filtering

    console.log("📍 Calling API:", apiUrl);

    fetch(apiUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP Error: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        if (data.status === "success") {
          allProducts = data.data;
          console.log(`✅ Loaded ${allProducts.length} products`);

          // Debug categories
          debugCategories();

          applyFiltersAndSort();
        } else {
          throw new Error(data.message || "Error from server");
        }
      })
      .catch((error) => {
        console.error("💥 Error loading products:", error);
        showError(`Error loading products: ${error.message}`);
      })
      .finally(() => {
        showLoading(false);
      });
  }

  function applyFiltersAndSort() {
    // Filter products
    filteredProducts = [...allProducts];

    // Apply filters from form (if any)
    applyFilters();

    // Apply sorting
    applySorting();

    // Update product count
    updateProductsCount();

    // Display products for the current page
    displayCurrentPage();

    // Create pagination
    createPagination();
  }

  function applyFilters() {
    // Reset to all products first
    filteredProducts = [...allProducts];

    console.log("🔍 Applying filters...");
    console.log("📍 Initial total products:", allProducts.length);
    console.log("📍 Current category:", currentCategory);

    // Filter by category
    if (currentCategory && currentCategory !== "") {
      const beforeCategoryFilter = filteredProducts.length;
      filteredProducts = filteredProducts.filter((product) => {
        const match = product.category === currentCategory;
        if (!match) {
          console.log(
            `❌ Product ${product.id} - category: ${product.category} does not match ${currentCategory}`
          );
        }
        return match;
      });
      console.log(
        `✅ Filtered by category "${currentCategory}": ${beforeCategoryFilter} → ${filteredProducts.length} products`
      );
    } else {
      console.log("ℹ️ Not filtering by category (showing all)");
    }

    // Filter by price
    const priceRange = document.getElementById("price-range")?.value;
    if (priceRange) {
      const [minPrice, maxPrice] = priceRange.split("-").map(Number);
      const beforePriceFilter = filteredProducts.length;
      filteredProducts = filteredProducts.filter(
        (product) => product.price >= minPrice && product.price <= maxPrice
      );
      console.log(
        `💰 Filtered by price ${minPrice}-${maxPrice}: ${beforePriceFilter} → ${filteredProducts.length} products`
      );
    }

    // Filter by rating
    const minRating = document.getElementById("min-rating")?.value;
    if (minRating) {
      const beforeRatingFilter = filteredProducts.length;
      filteredProducts = filteredProducts.filter(
        (product) => product.rating >= parseFloat(minRating)
      );
      console.log(
        `⭐ Filtered by rating >= ${minRating}: ${beforeRatingFilter} → ${filteredProducts.length} products`
      );
    }

    // Filter sale products
    const onSaleOnly = document.getElementById("on-sale")?.checked;
    if (onSaleOnly) {
      const beforeSaleFilter = filteredProducts.length;
      filteredProducts = filteredProducts.filter(
        (product) => product.old_price && product.old_price > product.price
      );
      console.log(
        `🏷️ Filtered sale products: ${beforeSaleFilter} → ${filteredProducts.length} products`
      );
    }

    console.log(`🎯 Final result: ${filteredProducts.length} products`);
  }

  function applySorting() {
    const sortBy = sortSelect?.value || "newest";

    switch (sortBy) {
      case "price-asc":
        filteredProducts.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        filteredProducts.sort((a, b) => b.price - a.price);
        break;
      case "popular":
        filteredProducts.sort((a, b) => b.sold - a.sold);
        break;
      case "rating":
        filteredProducts.sort((a, b) => b.rating - a.rating);
        break;
      case "newest":
      default:
        filteredProducts.sort((a, b) => b.id - a.id);
        break;
    }
  }

  function displayCurrentPage() {
    const startIndex = (currentPage - 1) * productsPerPage;
    const endIndex = startIndex + productsPerPage;
    const productsToShow = filteredProducts.slice(startIndex, endIndex);

    console.log(
      `📄 Displaying page ${currentPage}: products ${
        startIndex + 1
      }-${endIndex} (${productsToShow.length} products)`
    );

    if (productsToShow.length === 0) {
      showNoProducts();
      return;
    }

    renderProducts(productsToShow);
  }

  function renderProducts(products) {
    if (products.length === 0) {
      showNoProducts();
      return;
    }

    let html = "";

    // Create 4 rows, 3 products per row
    for (let i = 0; i < products.length; i += 3) {
      const rowProducts = products.slice(i, i + 3);

      html += `<div class="row g-4 mb-4">`; // Each row is a row

      rowProducts.forEach((product) => {
        // MAIN IMAGE
        const mainImage = product.image_main
          ? "../" + product.image_main
          : "../img/no-image.jpg";

        // HOVER IMAGE
        let hoverImage = mainImage;
        if (product.images) {
          try {
            const imagesArray = JSON.parse(product.images);
            if (imagesArray.length >= 1 && imagesArray[0]) {
              hoverImage = "../" + imagesArray[0];
            }
          } catch (e) {
            console.error("Error parsing images JSON:", e);
          }
        }

        const price = new Intl.NumberFormat("vi-VN", {
          style: "currency",
          currency: "VND",
        }).format(product.price);

        const oldPrice = product.old_price
          ? new Intl.NumberFormat("vi-VN", {
              style: "currency",
              currency: "VND",
            }).format(product.old_price)
          : null;

        html += `
                        <div class="col-lg-4 col-md-6 col-sm-6">
                            <div class="card h-100 product-card border-0 shadow-sm hover-lift">
                                <div class="product-image-wrapper position-relative overflow-hidden">
                                    <a href="product-detail.html?id=${
                                      product.id
                                    }" class="text-decoration-none d-block">
                                        <img src="${mainImage}" 
                                            class="card-img-top product-image-home" 
                                            alt="${product.name}"
                                            style="height: 300px; object-fit: cover;"
                                            onerror="this.src='../img/no-image.jpg'">
                                        
                                        <img src="${hoverImage}" 
                                            class="card-img-top product-image-hover position-absolute top-0 start-0" 
                                            alt="${product.name} - Hover"
                                            style="height: 300px; object-fit: cover;"
                                            onerror="this.style.display='none'">
                                        
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
                                      oldPrice
                                        ? `
                                            <small class="text-muted text-decoration-line-through">${oldPrice}</small>
                                        `
                                        : ""
                                    }
                                    ${
                                      product.sold
                                        ? `
                                            <div class="mt-1">
                                                <small class="text-success">
                                                    <i class="fas fa-fire me-1"></i>Sold: ${product.sold}
                                                </small>
                                            </div>
                                        `
                                        : ""
                                    }
                                </div>
                            </div>
                        </div>
                    `;
      });

      html += `</div>`; // Close row
    }

    productsGrid.innerHTML = html;
    initProductHoverEffects();
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

  function initProductHoverEffects() {
    const productWrappers = document.querySelectorAll(".product-image-wrapper");

    productWrappers.forEach((wrapper) => {
      const actions = wrapper.querySelector(".product-actions");

      wrapper.addEventListener("mouseenter", function () {
        if (actions) {
          actions.style.transform = "translateY(0)";
        }
      });

      wrapper.addEventListener("mouseleave", function () {
        if (actions) {
          actions.style.transform = "translateY(100%)";
        }
      });
    });

    // Handle add to cart button
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

    setTimeout(() => {
      toast.remove();
    }, 3000);

    console.log(`Adding product ${productId} to cart`);
    // TODO: Call API to add to cart
  }

  function createPagination() {
    const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

    if (totalPages <= 1) {
      pagination.innerHTML = "";
      return;
    }

    let html = "";
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // Previous Button
    html += `
            <li class="page-item ${currentPage === 1 ? "disabled" : ""}">
                <a class="page-link" href="#" data-page="${
                  currentPage - 1
                }">Previous</a>
            </li>
        `;

    // Page buttons
    for (let i = startPage; i <= endPage; i++) {
      html += `
                <li class="page-item ${i === currentPage ? "active" : ""}">
                    <a class="page-link" href="#" data-page="${i}">${i}</a>
                </li>
            `;
    }

    // Next Button
    html += `
            <li class="page-item ${
              currentPage === totalPages ? "disabled" : ""
            }">
                <a class="page-link" href="#" data-page="${
                  currentPage + 1
                }">Next</a>
            </li>
        `;

    pagination.innerHTML = html;

    // Add event listeners for pagination
    pagination.querySelectorAll(".page-link").forEach((link) => {
      link.addEventListener("click", function (e) {
        e.preventDefault();
        const page = parseInt(this.getAttribute("data-page"));
        if (page >= 1 && page <= totalPages && page !== currentPage) {
          currentPage = page;
          displayCurrentPage();
          createPagination();
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      });
    });
  }

  function updateProductsCount() {
    if (productsCount) {
      const start = (currentPage - 1) * productsPerPage + 1;
      const end = Math.min(
        currentPage * productsPerPage,
        filteredProducts.length
      );

      productsCount.textContent = `Showing ${start}-${end} of ${filteredProducts.length} products`;
    }
  }

  function showLoading(show) {
    if (loadingSpinner) {
      loadingSpinner.style.display = show ? "block" : "none";
    }
    if (productsGrid) {
      productsGrid.style.display = show ? "none" : "block";
    }
  }

  function showNoProducts() {
    productsGrid.innerHTML = `
        <div class="col-12 text-center py-5">
            <div class="alert alert-info">
                <i class="fas fa-info-circle fa-2x mb-3"></i>
                <h5>No products found</h5>
                <p class="mb-0">Try adjusting your filters or search with different criteria.</p>
            </div>
        </div>
    `;
  }

  function showError(message) {
    productsGrid.innerHTML = `
            <div class="col-12 text-center py-5">
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle fa-2x mb-3"></i>
                    <h5>An error occurred</h5>
                    <p class="mb-0">${message}</p>
                    <button class="btn btn-primary mt-3" onclick="location.reload()">Try again</button>
                </div>
            </div>
        `;
  }

  function debugCategories() {
    console.log("🔍 DEBUG - Analyzing categories in the database:");
    const categories = {};

    allProducts.forEach((product) => {
      if (!categories[product.category]) {
        categories[product.category] = 0;
      }
      categories[product.category]++;
    });

    console.log("📊 Category statistics:", categories);
    console.log(
      "🎯 Categories present in the database:",
      Object.keys(categories)
    );

    // CORRECTED: Using actual categories from the database
    const expectedCategories = Object.keys(categories);
    const missingCategories = [
      "bikini",
      "monokini",
      "men",
      "kid",
      "accessory",
    ].filter((cat) => !expectedCategories.includes(cat));

    if (missingCategories.length > 0) {
      console.warn(
        `⚠️ Categories missing from the database:`,
        missingCategories
      );
    }
  }
});
