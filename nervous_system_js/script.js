// THIS FILE IS LOADED ON EVERY PAGE
document.addEventListener("DOMContentLoaded", () => {
  const userMenu = document.getElementById("userMenu");
  const welcomeText = document.getElementById("welcomeText");

  // Utility function to generate stars (page-wide use)
  window.renderRatingStars = (rating) => {
    let stars = "";
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5 ? 1 : 0;
    const emptyStars = 5 - fullStars - halfStar;

    for (let i = 0; i < fullStars; i++) {
      stars += '<i class="fas fa-star text-warning"></i>';
    }
    if (halfStar) {
      stars += '<i class="fas fa-star-half-alt text-warning"></i>';
    }
    for (let i = 0; i < emptyStars; i++) {
      stars += '<i class="far fa-star text-warning"></i>';
    }
    return stars;
  };

  // Utility function to format currency (page-wide use)
  window.formatCurrency = (number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(number);
  };

  // Function to check login status (Backend Session)
  const checkLoginStatus = async () => {
    try {
      const response = await fetch("../brain_php/get_user.php");
      const data = await response.json();

      if (data.loggedIn) {
        // Logged in - Backend Session
        if (welcomeText) {
          welcomeText.textContent = `Welcome, ${data.fullname}!`;
        }
        if (userMenu) {
          userMenu.innerHTML = `
                        <li><a class="dropdown-item" href="profile.html"><i class="fas fa-user me-2"></i>My Profile</a></li>
                        <li><hr class="dropdown-divider"></li>
                        <li><a class="dropdown-item text-danger" href="#" id="logoutBtn"><i class="fas fa-sign-out-alt me-2"></i>Logout</a></li>
                    `;

          // Add event listener for the logout button
          setTimeout(() => {
            const logoutBtn = document.getElementById("logoutBtn");
            if (logoutBtn) {
              logoutBtn.addEventListener("click", handleLogout);
            }
          }, 100);
        }
      } else {
        // Not logged in
        if (welcomeText) {
          welcomeText.textContent = "";
        }
        if (userMenu) {
          userMenu.innerHTML = `
                        <li><a class="dropdown-item" href="login.html"><i class="fas fa-sign-in-alt me-2"></i>Login</a></li>
                        <li><a class="dropdown-item" href="register.html"><i class="fas fa-user-plus me-2"></i>Register</a></li>
                    `;
        }
      }
    } catch (error) {
      console.error("Error checking login status:", error);
      // Fallback: Check localStorage if fetch fails
      checkLocalStorageStatus();
    }
  };

  // Function to check login status (Fallback - LocalStorage)
  const checkLocalStorageStatus = () => {
    const user = JSON.parse(localStorage.getItem("user"));
    const userMenu = document.getElementById("userMenu");
    const welcomeText = document.getElementById("welcomeText");

    if (user && userMenu) {
      // User is logged in (LocalStorage)
      userMenu.innerHTML = `
                <li><a class="dropdown-item" href="profile.html"><i class="fas fa-user me-2"></i>My Profile</a></li>
                <li><hr class="dropdown-divider"></li>
                <li><a class="dropdown-item text-danger" href="#" id="logoutBtn"><i class="fas fa-sign-out-alt me-2"></i>Logout</a></li>
            `;

      if (welcomeText) {
        welcomeText.textContent = `Welcome, ${user.name}!`;
      }

      // Add event listener for the logout button
      setTimeout(() => {
        const logoutBtn = document.getElementById("logoutBtn");
        if (logoutBtn) {
          logoutBtn.addEventListener("click", handleLogout);
        }
      }, 100);
    } else {
      // Not logged in
      if (userMenu) {
        userMenu.innerHTML = `
                    <li><a class="dropdown-item" href="login.html"><i class="fas fa-sign-in-alt me-2"></i>Login</a></li>
                    <li><a class="dropdown-item" href="register.html"><i class="fas fa-user-plus me-2"></i>Register</a></li>
                `;
      }
    }
  };

  // Function to handle logout
  window.handleLogout = async (e) => {
    if (e) e.preventDefault();

    try {
      // Call backend logout
      const response = await fetch("../brain_php/logout.php");
      const data = await response.json();

      if (data.status === "success") {
        showSuccess("Logged out successfully!");
      }
    } catch (error) {
      console.error("Error logging out backend:", error);
      // Fallback: Clear localStorage
      localStorage.removeItem("user");
      localStorage.removeItem("rememberMe");
      showSuccess("Logged out successfully!");
    }

    // Reload page after 1.5 seconds
    setTimeout(() => {
      window.location.href = "../skeleton_html/index.html";
    }, 1500);
  };

  // Function to display notification
  const showSuccess = (message) => {
    // Remove old alerts
    const oldAlerts = document.querySelectorAll(".alert-position-fixed");
    oldAlerts.forEach((alert) => alert.remove());

    const toast = document.createElement("div");
    toast.className =
      "alert alert-success alert-dismissible fade show position-fixed alert-position-fixed";
    toast.style.cssText =
      "top: 20px; right: 20px; z-index: 9999; min-width: 300px;";
    toast.innerHTML = `
            <i class="fas fa-check-circle me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
    document.body.appendChild(toast);

    // Auto-hide after 5 seconds
    setTimeout(() => {
      if (toast.parentNode) {
        toast.remove();
      }
    }, 5000);
  };

  // Run login status check
  checkLoginStatus();

  // Run setActiveMenu
  setActiveMenu();
});

// =================================
// ACTIVE MENU HIGHLIGHT - AUTOMATICALLY HIGHLIGHT CURRENT MENU ITEM
// =================================
function setActiveMenu() {
  const currentPage = window.location.pathname.split("/").pop();
  const urlParams = new URLSearchParams(window.location.search);
  const currentType = urlParams.get("type");

  console.log("📍 Current page:", currentPage);
  console.log("📍 Current type:", currentType);

  // Remove all old active classes
  document.querySelectorAll(".navbar-nav .nav-link").forEach((link) => {
    link.classList.remove("active");
  });

  // Active menu based on current page
  switch (currentPage) {
    case "index.html":
    case "":
      document
        .querySelector('.nav-link[href="index.html"]')
        ?.classList.add("active");
      break;

    case "category.html":
      if (
        currentType &&
        ["bikini", "monokini", "men", "kid", "accessory"].includes(currentType)
      ) {
        document
          .querySelector('.nav-link[href="collection.html"]')
          ?.classList.add("active");
      } else {
        document
          .querySelector('.nav-link[href="category.html"]')
          ?.classList.add("active");
      }
      break;

    case "about.html":
      document
        .querySelector('.nav-link[href="about.html"]')
        ?.classList.add("active");
      break;

    case "collection.html":
      document
        .querySelector('.nav-link[href="collection.html"]')
        ?.classList.add("active");
      break;

    case "profile.html":
      // Profile page is not in the main menu
      break;
  }

  console.log("✅ Set active menu for:", currentPage);
}
