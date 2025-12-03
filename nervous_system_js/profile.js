// profile.js - Profile page handling
document.addEventListener("DOMContentLoaded", function () {
  // Check authentication and load profile
  checkAuthAndLoadProfile();
  setupEventListeners();
});

function checkAuthAndLoadProfile() {
  fetch("../brain_php/get_user.php")
    .then((response) => response.json())
    .then((data) => {
      if (!data.loggedIn) {
        window.location.href = "login.html?redirect=profile.html";
        return;
      }
      // Logged in, load profile information
      loadProfile();
    })
    .catch((error) => {
      console.error("Auth check error:", error);
      window.location.href = "login.html?redirect=profile.html";
    });
}

function setupEventListeners() {
  // Form submit
  const profileForm = document.getElementById("profileForm");
  if (profileForm) {
    profileForm.addEventListener("submit", handleProfileSubmit);
  }

  // Reset form
  const resetBtn = document.getElementById("resetForm");
  if (resetBtn) {
    resetBtn.addEventListener("click", resetForm);
  }

  // Avatar upload
  const avatarInput = document.getElementById("avatarInput");
  if (avatarInput) {
    avatarInput.addEventListener("change", handleAvatarUpload);
  }

  // Sidebar logout
  const sidebarLogout = document.getElementById("sidebarLogout");
  if (sidebarLogout) {
    sidebarLogout.addEventListener("click", handleLogout);
  }

  // Real-time email validation
  const emailInput = document.getElementById("email");
  if (emailInput) {
    emailInput.addEventListener("blur", validateEmailField);
  }
}

function loadProfile() {
  // Display loader
  document.getElementById("profile-loader").style.display = "block";
  document.getElementById("profile-content").style.display = "none";

  fetch("../brain_php/get_profile.php")
    .then((response) => response.json())
    .then((data) => {
      if (data.loggedIn && data.user) {
        // Populate form with data from database
        populateForm(data.user);

        // Hide loader and display content
        document.getElementById("profile-loader").style.display = "none";
        document.getElementById("profile-content").style.display = "flex";
      } else {
        throw new Error("Could not load user information");
      }
    })
    .catch((error) => {
      console.error("Profile load error:", error);
      document.getElementById("profile-loader").style.display = "none";
      showAlert("Failed to load user information!", "danger");
    });
}

function populateForm(userData) {
  // Populate form data
  document.getElementById("fullName").value = userData.name || "";
  document.getElementById("email").value = userData.email || "";
  document.getElementById("phone").value = userData.phone || "";
  document.getElementById("gender").value = userData.gender || "";
  document.getElementById("dob").value = userData.date_of_birth || "";
  document.getElementById("address").value = userData.address || "";
  document.getElementById("joinDate").value = userData.join_date || "";

  // Display avatar if available
  const defaultAvatar = document.querySelector(".default-avatar");
  const userAvatar = document.querySelector(".user-avatar");
  if (userData.avatar) {
    // Create full URL for avatar
    const avatarUrl = userData.avatar.startsWith("http")
      ? userData.avatar
      : `../${userData.avatar}`;

    userAvatar.src = avatarUrl;
    userAvatar.style.display = "block";
    defaultAvatar.style.display = "none";
  } else {
    userAvatar.style.display = "none";
    defaultAvatar.style.display = "block";
  }
}

function handleProfileSubmit(e) {
  e.preventDefault();

  const submitBtn = e.target.querySelector('button[type="submit"]');
  const originalText = submitBtn.innerHTML;

  // Display loading
  submitBtn.disabled = true;
  submitBtn.innerHTML =
    '<i class="fas fa-spinner fa-spin me-1"></i>Processing...';

  // Create FormData object to send both file and text
  const formData = new FormData();

  // Add data fields to FormData
  formData.append("name", document.getElementById("fullName").value.trim());
  formData.append("email", document.getElementById("email").value.trim());
  formData.append("phone", document.getElementById("phone").value.trim());
  formData.append("gender", document.getElementById("gender").value);
  formData.append("dob", document.getElementById("dob").value);
  formData.append("address", document.getElementById("address").value.trim());

  // Add avatar file if present
  const avatarInput = document.getElementById("avatarInput");
  if (avatarInput.files[0]) {
    formData.append("avatar", avatarInput.files[0]);
  }

  // Basic data validation
  const name = formData.get("name");
  const email = formData.get("email");
  const phone = formData.get("phone");

  if (!validateForm({ name, email, phone })) {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;
    return;
  }

  // Call actual API to update
  updateProfile(formData)
    .then((result) => {
      if (result.status === "success") {
        showAlert("Profile updated successfully!", "success");
        // Reset file input
        avatarInput.value = "";
        // Reload profile information
        setTimeout(() => {
          loadProfile();
        }, 1000);
      } else {
        throw new Error(result.message);
      }
    })
    .catch((error) => {
      console.error("Update error:", error);
      showAlert(
        error.message || "An error occurred while updating the profile!",
        "danger"
      );
    })
    .finally(() => {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    });
}

function updateProfile(formData) {
  return fetch("../brain_php/update_profile.php", {
    method: "POST",
    body: formData, // DO NOT set Content-Type, browser will set it automatically
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then((data) => {
      if (data.status === "success") {
        // Update localStorage
        const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
        if (currentUser.email) {
          currentUser.email = formData.get("email");
          currentUser.name = formData.get("name");
          localStorage.setItem("user", JSON.stringify(currentUser));
        }

        // Reload user menu
        if (window.checkLoginStatus) {
          window.checkLoginStatus();
        }
      }
      return data;
    })
    .catch((error) => {
      console.error("Error updating profile:", error);
      throw error;
    });
}

function validateForm(data) {
  // Validate full name
  if (!data.name) {
    showAlert("Please enter your full name!", "danger");
    return false;
  }

  // Validate email
  if (!data.email) {
    showAlert("Please enter your email!", "danger");
    return false;
  }

  if (!isValidEmail(data.email)) {
    showAlert("Invalid email!", "danger");
    return false;
  }

  // Validate phone number
  if (data.phone && !isValidPhone(data.phone)) {
    showAlert("Invalid phone number!", "danger");
    return false;
  }

  return true;
}

// Real-time email validation function
function validateEmailField() {
  const emailInput = document.getElementById("email");
  const email = emailInput.value.trim();

  if (email && !isValidEmail(email)) {
    emailInput.classList.add("is-invalid");
    showFieldError(emailInput, "Invalid email!");
  } else {
    emailInput.classList.remove("is-invalid");
    clearFieldError(emailInput);
  }
}

function showFieldError(field, message) {
  clearFieldError(field);
  const errorDiv = document.createElement("div");
  errorDiv.className = "invalid-feedback";
  errorDiv.textContent = message;
  field.parentNode.appendChild(errorDiv);
}

function clearFieldError(field) {
  const existingError = field.parentNode.querySelector(".invalid-feedback");
  if (existingError) {
    existingError.remove();
  }
}

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidPhone(phone) {
  const phoneRegex = /^(0[3|5|7|8|9])+([0-9]{8})$/;
  return phoneRegex.test(phone);
}

function resetForm() {
  if (confirm("Are you sure you want to revert changes?")) {
    loadProfile();
    showAlert("Changes reverted!", "info");
  }
}

function handleAvatarUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  // Validate
  if (!validateImage(file)) {
    e.target.value = ""; // Reset file input if invalid
    return;
  }

  // Display preview
  const reader = new FileReader();
  reader.onload = function (e) {
    const defaultAvatar = document.querySelector(".default-avatar");
    const userAvatar = document.querySelector(".user-avatar");

    userAvatar.src = e.target.result;
    userAvatar.style.display = "block";
    defaultAvatar.style.display = "none";
  };
  reader.readAsDataURL(file);

  // Notify that image is ready for upload
  showAlert("Avatar is ready, click 'Update Profile' to save!", "info");
}

function validateImage(file) {
  const validTypes = ["image/jpeg", "image/jpg", "image/png"];
  const maxSize = 2 * 1024 * 1024; // 2MB

  if (!validTypes.includes(file.type)) {
    showAlert("Only JPG, PNG image formats are accepted!", "danger");
    return false;
  }

  if (file.size > maxSize) {
    showAlert("Image size cannot exceed 2MB!", "danger");
    return false;
  }

  return true;
}

function showAlert(message, type) {
  const alertContainer = document.getElementById("alert-container");
  if (!alertContainer) return;

  // Remove old alert
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

  // Auto-hide after 5 seconds
  setTimeout(() => {
    if (alertDiv.parentNode) {
      alertDiv.remove();
    }
  }, 5000);
}

// Logout function (if needed)
function handleLogout() {
  // Execute logout
  fetch("../brain_php/logout.php")
    .then(() => {
      localStorage.removeItem("user");
      window.location.href = "login.html";
    })
    .catch((error) => {
      console.error("Logout error:", error);
    });
}
