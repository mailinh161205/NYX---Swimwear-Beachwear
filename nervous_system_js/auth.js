// auth.js - Handles registration and login with validation
document.addEventListener("DOMContentLoaded", function () {
  // Check if it is the registration page
  const registerForm = document.querySelector('form[action="register"]');
  if (registerForm) {
    initRegisterValidation();
    handleRegisterForm();
  }

  // Check if it is the login page
  const loginForm = document.querySelector('form[action="login"]');
  if (loginForm) {
    initLoginValidation();
    handleLoginForm();
  }

  // If already logged in, redirect away from login/register page
  checkAndRedirect();
});

// =================================
// REGISTER VALIDATION
// =================================
function initRegisterValidation() {
  const nameInput = document.getElementById("nameInput");
  const emailInput = document.getElementById("emailRegInput");
  const passwordInput = document.getElementById("passwordRegInput");
  const confirmPasswordInput = document.getElementById("confirmPasswordInput");
  const agreeTerms = document.getElementById("agreeTerms");
  const registerBtn = document.getElementById("registerBtn");

  // Real-time validation
  nameInput.addEventListener("input", () => validateNameField());
  nameInput.addEventListener("blur", () => validateNameField());

  emailInput.addEventListener("input", () => validateEmailField());
  emailInput.addEventListener("blur", () => validateEmailField());

  passwordInput.addEventListener("input", () => {
    validatePasswordField();
    updatePasswordStrength();
  });
  passwordInput.addEventListener("blur", () => validatePasswordField());

  confirmPasswordInput.addEventListener("input", () =>
    validateConfirmPasswordField()
  );
  confirmPasswordInput.addEventListener("blur", () =>
    validateConfirmPasswordField()
  );

  agreeTerms.addEventListener("change", validateRegisterForm);

  // Validate all fields on load
  validateRegisterForm();
}

function validateNameField() {
  const nameInput = document.getElementById("nameInput");
  const nameError = document.getElementById("nameError");
  const name = nameInput.value.trim();

  if (!name) {
    setFieldError(nameInput, nameError, "Please enter full name");
    return false;
  }

  if (name.length < 2) {
    setFieldError(
      nameInput,
      nameError,
      "Full name must be at least 2 characters long"
    );
    return false;
  }

  // Check valid name: contains only letters, spaces, and some basic special characters
  const nameRegex = /^[a-zA-ZÀ-ỹ\s]+$/;
  if (!nameRegex.test(name)) {
    setFieldError(
      nameInput,
      nameError,
      "Name must not contain numbers or special characters"
    );
    return false;
  }

  setFieldValid(nameInput, nameError);
  return true;
}

function validateEmailField() {
  const emailInput = document.getElementById("emailRegInput");
  const emailError = document.getElementById("emailRegError");
  const email = emailInput.value.trim();

  if (!email) {
    setFieldError(emailInput, emailError, "Please enter email");
    return false;
  }

  if (!isValidEmail(email)) {
    setFieldError(emailInput, emailError, "Invalid email address");
    return false;
  }

  setFieldValid(emailInput, emailError);
  return true;
}

function validatePasswordField() {
  const passwordInput = document.getElementById("passwordRegInput");
  const passwordError = document.getElementById("passwordRegError");
  const password = passwordInput.value;

  if (!password) {
    setFieldError(passwordInput, passwordError, "Please enter password");
    return false;
  }

  if (password.length < 6) {
    setFieldError(
      passwordInput,
      passwordError,
      "Password must be at least 6 characters long"
    );
    return false;
  }

  // Check password strength
  if (!isStrongPassword(password)) {
    setFieldError(
      passwordInput,
      passwordError,
      "Password should include both letters and numbers"
    );
    return false;
  }

  setFieldValid(passwordInput, passwordError);
  return true;
}

function validateConfirmPasswordField() {
  const confirmPasswordInput = document.getElementById("confirmPasswordInput");
  const confirmPasswordError = document.getElementById("confirmPasswordError");
  const password = document.getElementById("passwordRegInput").value;
  const confirmPassword = confirmPasswordInput.value;

  if (!confirmPassword) {
    setFieldError(
      confirmPasswordInput,
      confirmPasswordError,
      "Please confirm password"
    );
    return false;
  }

  if (password !== confirmPassword) {
    setFieldError(
      confirmPasswordInput,
      confirmPasswordError,
      "Confirmation password does not match"
    );
    return false;
  }

  setFieldValid(confirmPasswordInput, confirmPasswordError);
  return true;
}

function updatePasswordStrength() {
  const password = document.getElementById("passwordRegInput").value;
  const strengthBar = document.getElementById("passwordStrength");

  if (!strengthBar) return;

  let strength = 0;
  let className = "";
  let width = "0%";

  if (password.length >= 6) strength += 25;
  if (/[a-z]/.test(password)) strength += 25;
  if (/[A-Z]/.test(password)) strength += 25;
  if (/[0-9]/.test(password)) strength += 25;

  switch (true) {
    case strength >= 75:
      className = "strength-strong";
      width = "100%";
      break;
    case strength >= 50:
      className = "strength-good";
      width = "75%";
      break;
    case strength >= 25:
      className = "strength-fair";
      width = "50%";
      break;
    default:
      className = "strength-weak";
      width = "25%";
  }

  strengthBar.className = `password-strength ${className}`;
  strengthBar.style.width = width;
}

// =================================
// LOGIN VALIDATION
// =================================
function initLoginValidation() {
  const emailInput = document.getElementById("emailInput");
  const passwordInput = document.getElementById("passwordInput");
  const loginBtn = document.getElementById("loginBtn");

  emailInput.addEventListener("input", validateLoginForm);
  emailInput.addEventListener("blur", () => validateLoginEmailField());

  passwordInput.addEventListener("input", validateLoginForm);
  passwordInput.addEventListener("blur", () => validateLoginPasswordField());

  validateLoginForm();
}

function validateLoginEmailField() {
  const emailInput = document.getElementById("emailInput");
  const emailError = document.getElementById("emailError");
  const email = emailInput.value.trim();

  if (!email) {
    setFieldError(emailInput, emailError, "Please enter email");
    return false;
  }

  if (!isValidEmail(email)) {
    setFieldError(emailInput, emailError, "Invalid email address");
    return false;
  }

  setFieldValid(emailInput, emailError);
  return true;
}

function validateLoginPasswordField() {
  const passwordInput = document.getElementById("passwordInput");
  const passwordError = document.getElementById("passwordError");
  const password = passwordInput.value;

  if (!password) {
    setFieldError(passwordInput, passwordError, "Please enter password");
    return false;
  }

  if (password.length < 6) {
    setFieldError(
      passwordInput,
      passwordError,
      "Password must be at least 6 characters long"
    );
    return false;
  }

  setFieldValid(passwordInput, passwordError);
  return true;
}

// =================================
// FORM VALIDATION UTILITIES
// =================================
function validateRegisterForm() {
  const isNameValid = validateNameField();
  const isEmailValid = validateEmailField();
  const isPasswordValid = validatePasswordField();
  const isConfirmPasswordValid = validateConfirmPasswordField();
  const agreeTerms = document.getElementById("agreeTerms").checked;
  const registerBtn = document.getElementById("registerBtn");

  const isValid =
    isNameValid &&
    isEmailValid &&
    isPasswordValid &&
    isConfirmPasswordValid &&
    agreeTerms;

  if (registerBtn) {
    registerBtn.disabled = !isValid;
  }

  return isValid;
}

function validateLoginForm() {
  const isEmailValid = validateLoginEmailField();
  const isPasswordValid = validateLoginPasswordField();
  const loginBtn = document.getElementById("loginBtn");

  const isValid = isEmailValid && isPasswordValid;

  if (loginBtn) {
    loginBtn.disabled = !isValid;
  }

  return isValid;
}

function setFieldError(input, errorElement, message) {
  input.classList.remove("is-valid");
  input.classList.add("is-invalid");
  errorElement.textContent = message;
  errorElement.style.display = "block";
}

function setFieldValid(input, errorElement) {
  input.classList.remove("is-invalid");
  input.classList.add("is-valid");
  errorElement.style.display = "none";
}

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isStrongPassword(password) {
  // At least 6 characters, with at least 1 letter and 1 number
  const strongPasswordRegex = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/;
  return strongPasswordRegex.test(password);
}

// =================================
// FORM SUBMISSION HANDLERS
// =================================
function handleRegisterForm() {
  const form = document.querySelector('form[action="register"]');

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    if (!validateRegisterForm()) {
      showError("Please check your registration information!");
      return;
    }

    // Get values from form
    const name = document.getElementById("nameInput").value.trim();
    const email = document.getElementById("emailRegInput").value.trim();
    const password = document.getElementById("passwordRegInput").value;
    const agreeTerms = document.getElementById("agreeTerms").checked;

    // Show loading
    showLoading("Processing registration...");

    try {
      // Call registration API
      const response = await fetch("../brain_php/register.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name,
          email: email,
          password: password,
        }),
      });

      const data = await response.json();

      if (data.status === "success") {
        showSuccess("Registration successful! Redirecting...");
        setTimeout(() => {
          window.location.href = "login.html";
        }, 2000);
      } else {
        showError(data.message || "Registration failed!");
      }
    } catch (error) {
      console.error("Error:", error);
      showError("An error occurred, please try again!");
    } finally {
      hideLoading();
    }
  });
}

function handleLoginForm() {
  const form = document.querySelector('form[action="login"]');

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    if (!validateLoginForm()) {
      showError("Please check your login information!");
      return;
    }

    // Get values from form
    const email = document.getElementById("emailInput").value.trim();
    const password = document.getElementById("passwordInput").value;
    const rememberMe = document.getElementById("rememberMe").checked;

    // Show loading
    showLoading("Processing login...");

    try {
      // Call login API
      const response = await fetch("../brain_php/login.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          password: password,
          remember: rememberMe,
        }),
      });

      const data = await response.json();

      if (data.status === "success") {
        showSuccess("Login successful!");

        // Save user info to localStorage (fallback)
        if (data.user) {
          localStorage.setItem("user", JSON.stringify(data.user));
          if (rememberMe) {
            localStorage.setItem("rememberMe", "true");
          }
        }

        setTimeout(() => {
          // Redirect to the previous page or homepage
          const urlParams = new URLSearchParams(window.location.search);
          const redirect = urlParams.get("redirect") || "index.html";
          window.location.href = redirect;
        }, 1500);
      } else {
        showError(data.message || "Login failed!");
      }
    } catch (error) {
      console.error("Error:", error);
      showError("An error occurred, please try again!");
    } finally {
      hideLoading();
    }
  });
}

// =================================
// HELPER FUNCTIONS (keep unchanged)
// =================================
function checkAndRedirect() {
  // Check if logged in then redirect away from login/register page
  const checkAuth = async () => {
    try {
      const response = await fetch("../brain_php/get_user.php");
      const data = await response.json();

      if (data.loggedIn) {
        window.location.href = "index.html";
      }
    } catch (error) {
      // Fallback: check localStorage
      const user = JSON.parse(localStorage.getItem("user"));
      if (user) {
        window.location.href = "index.html";
      }
    }
  };

  checkAuth();
}

function showLoading(message = "Processing...") {
  let loadingOverlay = document.getElementById("loading-overlay");
  if (!loadingOverlay) {
    loadingOverlay = document.createElement("div");
    loadingOverlay.id = "loading-overlay";
    loadingOverlay.className = "loading-overlay";
    loadingOverlay.innerHTML = `
            <div class="loading-content">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-2">${message}</p>
            </div>
        `;
    document.body.appendChild(loadingOverlay);

    const style = document.createElement("style");
    style.textContent = `
            .loading-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 9999;
            }
            .loading-content {
                background: white;
                padding: 2rem;
                border-radius: 10px;
                text-align: center;
                box-shadow: 0 0 20px rgba(0,0,0,0.3);
            }
        `;
    document.head.appendChild(style);
  }
}

function hideLoading() {
  const loadingOverlay = document.getElementById("loading-overlay");
  if (loadingOverlay) {
    loadingOverlay.remove();
  }
}

function showSuccess(message) {
  showAlert(message, "success");
}

function showError(message) {
  showAlert(message, "danger");
}

function showAlert(message, type) {
  const oldAlert = document.querySelector(".alert-dismissible");
  if (oldAlert) {
    oldAlert.remove();
  }

  const alertClass = type === "success" ? "alert-success" : "alert-danger";
  const icon = type === "success" ? "fa-check-circle" : "fa-exclamation-circle";

  const alertDiv = document.createElement("div");
  alertDiv.className = `alert ${alertClass} alert-dismissible fade show position-fixed`;
  alertDiv.style.cssText = `
        top: 20px;
        right: 20px;
        z-index: 9999;
        min-width: 300px;
    `;
  alertDiv.innerHTML = `
        <i class="fas ${icon} me-2"></i>
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

  document.body.appendChild(alertDiv);

  setTimeout(() => {
    if (alertDiv.parentNode) {
      alertDiv.remove();
    }
  }, 5000);
}
