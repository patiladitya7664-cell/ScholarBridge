"use strict";

/* =========================================================
   ScholarBridge AI - LOGIN & PASSWORD RECOVERY
   Frontend: HTML, CSS, JavaScript
   Backend: Node.js + Express + MongoDB
========================================================= */

document.addEventListener("DOMContentLoaded", function () {
  /* =====================================================
       1. DOM ELEMENTS
    ===================================================== */

  const loginForm = document.getElementById("loginForm");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const togglePassword = document.getElementById("togglePassword");
  const loginButton = document.getElementById("loginButton");
  const loginMessage = document.getElementById("loginMessage");
  const forgotPassword = document.getElementById("forgotPassword");
  const rememberMe = document.getElementById("rememberMe");
  const currentYear = document.getElementById("currentYear");

  // Recovery sections
  const forgotPasswordSection = document.getElementById(
    "forgotPasswordSection",
  );

  const resetOtpSection = document.getElementById("resetOtpSection");

  const newPasswordSection = document.getElementById("newPasswordSection");

  // Forgot password
  const forgotPasswordForm = document.getElementById("forgotPasswordForm");

  const resetEmailInput = document.getElementById("resetEmail");

  const sendResetOtpButton = document.getElementById("sendResetOtpButton");

  const resetEmailMessage = document.getElementById("resetEmailMessage");

  // OTP
  const resetOtpForm = document.getElementById("resetOtpForm");

  const resetOtpInput = document.getElementById("resetOtp");

  const verifyResetOtpButton = document.getElementById("verifyResetOtpButton");

  const resendResetOtpButton = document.getElementById("resendResetOtpButton");

  // Correct HTML ID
  const resendCountdown = document.getElementById("resetResendCountdown");

  const resetOtpEmailDisplay = document.getElementById("resetOtpEmailDisplay");

  const resetOtpMessage = document.getElementById("resetOtpMessage");

  // New password
  const newPasswordForm = document.getElementById("newPasswordForm");

  const newPasswordInput = document.getElementById("newPassword");

  const confirmNewPasswordInput = document.getElementById("confirmNewPassword");

  const resetPasswordButton = document.getElementById("resetPasswordButton");

  const newPasswordMessage = document.getElementById("newPasswordMessage");

  // Back buttons
  const backToLoginFromForgot = document.getElementById(
    "backToLoginFromForgot",
  );

  const backToForgotPassword = document.getElementById("backToForgotPassword");

  const backToResetOtp = document.getElementById("backToResetOtp");

  /* =====================================================
       2. CONFIGURATION
    ===================================================== */

  const API_BASE_URL = "http://localhost:5000/api";
  const RESEND_COOLDOWN_SECONDS = 60;
  const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  let pendingResetEmail = "";
  let verifiedResetToken = "";
  let resendTimer = null;
  let resendSecondsRemaining = 0;

  /* =====================================================
       3. INITIAL SETUP
    ===================================================== */

  if (currentYear) {
    currentYear.textContent = new Date().getFullYear();
  }

  if (rememberMe) {
    rememberMe.checked =
      localStorage.getItem("ScholarBridgeRemember") === "true";
  }

  /* =====================================================
       4. API HELPER
    ===================================================== */

  async function apiRequest(endpoint, options = {}) {
    let response;

    try {
      response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...(options.headers || {}),
        },
      });
    } catch (error) {
      throw new Error(
        "Cannot connect to the backend. Please make sure the server is running on port 5000.",
      );
    }

    let data;

    try {
      data = await response.json();
    } catch (error) {
      throw new Error("Invalid server response. Please try again later.");
    }

    if (!response.ok || data.success === false) {
      const error = new Error(
        data.message || "Request failed. Please try again.",
      );

      error.status = response.status;
      error.data = data;

      throw error;
    }

    return data;
  }

  /* =====================================================
       5. MESSAGE HELPERS
    ===================================================== */

  function showMessage(element, message, type = "error") {
    if (!element) {
      console.warn(message);
      return;
    }

    element.textContent = message;
    element.className = `form-message ${type}`;
    element.style.display = "block";
  }

  function clearMessage(element) {
    if (!element) return;

    element.textContent = "";
    element.className = "form-message";
    element.style.display = "";
  }

  function clearAllMessages() {
    [
      loginMessage,
      resetEmailMessage,
      resetOtpMessage,
      newPasswordMessage,
    ].forEach(clearMessage);
  }

  function setButtonLoading(button, loading, loadingText, defaultHTML) {
    if (!button) return;

    if (loading) {
      if (!button.dataset.originalHTML) {
        button.dataset.originalHTML = button.innerHTML;
      }

      button.disabled = true;

      button.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ${loadingText}`;
    } else {
      button.disabled = false;

      if (button.dataset.originalHTML) {
        button.innerHTML = button.dataset.originalHTML;
        delete button.dataset.originalHTML;
      } else if (defaultHTML) {
        button.innerHTML = defaultHTML;
      }
    }
  }

  /* =====================================================
       6. PASSWORD VISIBILITY
    ===================================================== */

  function setupPasswordToggle(button, input) {
    if (!button || !input) return;

    button.addEventListener("click", function (event) {
      event.preventDefault();

      const isHidden = input.type === "password";

      input.type = isHidden ? "text" : "password";

      button.innerHTML = isHidden
        ? '<i class="fa-regular fa-eye-slash"></i>'
        : '<i class="fa-regular fa-eye"></i>';

      button.setAttribute(
        "aria-label",
        isHidden ? "Hide password" : "Show password",
      );
    });
  }

  setupPasswordToggle(togglePassword, passwordInput);

  // New password and confirm password toggles
  document
    .querySelectorAll(".password-toggle[data-target]")
    .forEach(function (button) {
      const targetId = button.getAttribute("data-target");
      const targetInput = document.getElementById(targetId);

      setupPasswordToggle(button, targetInput);
    });

  /* =====================================================
       7. SECTION NAVIGATION
    ===================================================== */

  function hideAllSections() {
    if (loginForm) loginForm.hidden = true;
    if (forgotPassword) forgotPassword.hidden = true;

    if (forgotPasswordSection) {
      forgotPasswordSection.hidden = true;
    }

    if (resetOtpSection) {
      resetOtpSection.hidden = true;
    }

    if (newPasswordSection) {
      newPasswordSection.hidden = true;
    }
  }

  function showLoginSection() {
    stopResendTimer();
    hideAllSections();

    if (loginForm) loginForm.hidden = false;
    if (forgotPassword) forgotPassword.hidden = false;

    clearAllMessages();

    pendingResetEmail = "";
    verifiedResetToken = "";

    if (resetEmailInput) resetEmailInput.value = "";
    if (resetOtpInput) resetOtpInput.value = "";
    if (newPasswordInput) newPasswordInput.value = "";
    if (confirmNewPasswordInput) {
      confirmNewPasswordInput.value = "";
    }

    if (resendCountdown) {
      resendCountdown.textContent = "";
    }
  }

  function showForgotPasswordSection() {
    hideAllSections();

    if (forgotPasswordSection) {
      forgotPasswordSection.hidden = false;
    }

    clearAllMessages();

    if (resetEmailInput && emailInput) {
      resetEmailInput.value = emailInput.value.trim().toLowerCase();
    }

    if (resetEmailInput) {
      resetEmailInput.focus();
    }
  }

  function showResetOtpSection() {
    hideAllSections();

    if (resetOtpSection) {
      resetOtpSection.hidden = false;
    }

    if (resetOtpEmailDisplay) {
      resetOtpEmailDisplay.textContent = pendingResetEmail;
    }

    clearMessage(resetOtpMessage);

    if (resetOtpInput) {
      resetOtpInput.value = "";
      resetOtpInput.focus();
    }
  }

  function showNewPasswordSection() {
    hideAllSections();

    if (newPasswordSection) {
      newPasswordSection.hidden = false;
    }

    clearMessage(newPasswordMessage);

    if (newPasswordInput) {
      newPasswordInput.focus();
    }
  }

  /* =====================================================
       8. LOGIN
    ===================================================== */

  if (loginForm) {
    loginForm.addEventListener("submit", async function (event) {
      event.preventDefault();
      clearMessage(loginMessage);

      const email = emailInput ? emailInput.value.trim().toLowerCase() : "";

      const password = passwordInput ? passwordInput.value : "";

      if (!email || !password) {
        showMessage(
          loginMessage,
          "Please enter your email address and password.",
        );
        return;
      }

      if (!EMAIL_PATTERN.test(email)) {
        showMessage(loginMessage, "Please enter a valid email address.");
        return;
      }

      if (password.length < 8) {
        showMessage(
          loginMessage,
          "Password must contain at least 8 characters.",
        );
        return;
      }

      setButtonLoading(
        loginButton,
        true,
        "Signing in...",
        '<span>Sign In</span><i class="fa-solid fa-arrow-right"></i>',
      );

      try {
        const data = await apiRequest("/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });

        if (!data.token) {
          throw new Error(
            "Authentication token was not received from the server.",
          );
        }

        localStorage.setItem("token", data.token);
        localStorage.setItem("authToken", data.token);
        localStorage.setItem("jwtToken", data.token);

        if (data.user) {
          const userJSON = JSON.stringify(data.user);

          localStorage.setItem("ScholarBridgeCurrentUser", userJSON);

          localStorage.setItem("user", userJSON);
        }

        if (rememberMe && rememberMe.checked) {
          localStorage.setItem("ScholarBridgeRemember", "true");
        } else {
          localStorage.removeItem("ScholarBridgeRemember");
        }

        showMessage(
          loginMessage,
          "Login successful! Redirecting...",
          "success",
        );

        // Student dashboard is the current frontend destination.
        setTimeout(function () {
          window.location.href = "dashboard.html";
        }, 700);
      } catch (error) {
        console.error("Login error:", error);

        showMessage(
          loginMessage,
          error.message || "Login failed. Please try again.",
        );
      } finally {
        setButtonLoading(
          loginButton,
          false,
          "",
          '<span>Sign In</span><i class="fa-solid fa-arrow-right"></i>',
        );
      }
    });
  }

  /* =====================================================
       9. OPEN FORGOT PASSWORD
    ===================================================== */

  if (forgotPassword) {
    forgotPassword.addEventListener("click", function (event) {
      event.preventDefault();
      showForgotPasswordSection();
    });
  }

  /* =====================================================
       10. SEND RESET OTP
    ===================================================== */

  async function sendResetOtp() {
    clearMessage(resetEmailMessage);

    const email = resetEmailInput
      ? resetEmailInput.value.trim().toLowerCase()
      : "";

    if (!email) {
      showMessage(
        resetEmailMessage,
        "Please enter your registered email address.",
      );
      return;
    }

    if (!EMAIL_PATTERN.test(email)) {
      showMessage(resetEmailMessage, "Please enter a valid email address.");
      return;
    }

    setButtonLoading(
      sendResetOtpButton,
      true,
      "Sending OTP...",
      '<span>Send OTP</span><i class="fa-solid fa-paper-plane"></i>',
    );

    try {
      await apiRequest("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });

      pendingResetEmail = email;
      verifiedResetToken = "";

      showResetOtpSection();

      showMessage(
        resetOtpMessage,
        "If the account is eligible, an OTP will be sent to the registered email.",
        "success",
      );

      startResendTimer();
    } catch (error) {
      console.error("Send reset OTP error:", error);

      showMessage(
        resetEmailMessage,
        error.message || "Unable to send the OTP.",
      );
    } finally {
      setButtonLoading(
        sendResetOtpButton,
        false,
        "",
        '<span>Send OTP</span><i class="fa-solid fa-paper-plane"></i>',
      );
    }
  }

  if (forgotPasswordForm) {
    forgotPasswordForm.addEventListener("submit", function (event) {
      event.preventDefault();
      sendResetOtp();
    });
  } else if (sendResetOtpButton) {
    sendResetOtpButton.addEventListener("click", function (event) {
      event.preventDefault();
      sendResetOtp();
    });
  }

  /* =====================================================
       11. VERIFY RESET OTP
    ===================================================== */

  if (resetOtpForm) {
    resetOtpForm.addEventListener("submit", async function (event) {
      event.preventDefault();
      clearMessage(resetOtpMessage);

      const otp = resetOtpInput ? resetOtpInput.value.trim() : "";

      if (!pendingResetEmail) {
        showMessage(
          resetOtpMessage,
          "Please restart the password recovery process.",
        );
        return;
      }

      if (!/^\d{6}$/.test(otp)) {
        showMessage(resetOtpMessage, "Please enter the valid 6-digit OTP.");
        return;
      }

      setButtonLoading(
        verifyResetOtpButton,
        true,
        "Verifying OTP...",
        '<span>Verify OTP</span><i class="fa-solid fa-check"></i>',
      );

      try {
        const data = await apiRequest("/auth/verify-reset-otp", {
          method: "POST",
          body: JSON.stringify({
            email: pendingResetEmail,
            otp,
          }),
        });

        if (!data.resetToken) {
          throw new Error("The server did not return a password reset token.");
        }

        verifiedResetToken = data.resetToken;

        stopResendTimer();
        showNewPasswordSection();
      } catch (error) {
        console.error("Verify reset OTP error:", error);

        showMessage(
          resetOtpMessage,
          error.message || "OTP verification failed.",
        );
      } finally {
        setButtonLoading(
          verifyResetOtpButton,
          false,
          "",
          '<span>Verify OTP</span><i class="fa-solid fa-check"></i>',
        );
      }
    });
  }

  /* =====================================================
       12. RESEND RESET OTP
    ===================================================== */

  if (resendResetOtpButton) {
    resendResetOtpButton.addEventListener("click", async function (event) {
      event.preventDefault();

      clearMessage(resetOtpMessage);

      if (!pendingResetEmail) {
        showMessage(
          resetOtpMessage,
          "Please restart the password recovery process.",
        );
        return;
      }

      if (resendSecondsRemaining > 0) {
        showMessage(
          resetOtpMessage,
          `Please wait ${resendSecondsRemaining} seconds before requesting another OTP.`,
        );
        return;
      }

      setButtonLoading(
        resendResetOtpButton,
        true,
        "Resending...",
        "<span>Resend OTP</span>",
      );

      try {
        await apiRequest("/auth/resend-reset-otp", {
          method: "POST",
          body: JSON.stringify({
            email: pendingResetEmail,
          }),
        });

        if (resetOtpInput) {
          resetOtpInput.value = "";
        }

        showMessage(
          resetOtpMessage,
          "If the account is eligible, a new OTP will be sent to the registered email.",
          "success",
        );

        startResendTimer();
      } catch (error) {
        console.error("Resend reset OTP error:", error);

        showMessage(
          resetOtpMessage,
          error.message || "Unable to resend the OTP.",
        );
      } finally {
        setButtonLoading(
          resendResetOtpButton,
          false,
          "",
          "<span>Resend OTP</span>",
        );

        // Keep the button disabled if the timer is still active.
        if (resendSecondsRemaining > 0) {
          resendResetOtpButton.disabled = true;
        }
      }
    });
  }

  /* =====================================================
       13. SET NEW PASSWORD
    ===================================================== */

  if (newPasswordForm) {
    newPasswordForm.addEventListener("submit", async function (event) {
      event.preventDefault();
      clearMessage(newPasswordMessage);

      const password = newPasswordInput ? newPasswordInput.value : "";

      const confirmPassword = confirmNewPasswordInput
        ? confirmNewPasswordInput.value
        : "";

      if (!pendingResetEmail || !verifiedResetToken) {
        showMessage(
          newPasswordMessage,
          "Please verify your password reset OTP first.",
        );
        return;
      }

      if (password.length < 8) {
        showMessage(
          newPasswordMessage,
          "Your new password must contain at least 8 characters.",
        );
        return;
      }

      if (password !== confirmPassword) {
        showMessage(newPasswordMessage, "The passwords do not match.");
        return;
      }

      setButtonLoading(
        resetPasswordButton,
        true,
        "Updating password...",
        '<span>Reset Password</span><i class="fa-solid fa-lock"></i>',
      );

      try {
        await apiRequest("/auth/reset-password", {
          method: "POST",
          body: JSON.stringify({
            email: pendingResetEmail,
            newPassword: password,
            confirmPassword,
            resetToken: verifiedResetToken,
          }),
        });

        showMessage(
          newPasswordMessage,
          "Password changed successfully. You can now sign in.",
          "success",
        );

        stopResendTimer();

        const resetEmail = pendingResetEmail;

        verifiedResetToken = "";

        setTimeout(function () {
          showLoginSection();

          if (emailInput) {
            emailInput.value = resetEmail;
          }

          if (passwordInput) {
            passwordInput.value = "";
          }

          showMessage(
            loginMessage,
            "Your password has been reset. Please sign in with your new password.",
            "success",
          );
        }, 1200);
      } catch (error) {
        console.error("Reset password error:", error);

        showMessage(
          newPasswordMessage,
          error.message || "Unable to reset your password.",
        );
      } finally {
        setButtonLoading(
          resetPasswordButton,
          false,
          "",
          '<span>Reset Password</span><i class="fa-solid fa-lock"></i>',
        );
      }
    });
  }

  /* =====================================================
       14. OTP RESEND TIMER
    ===================================================== */

  function startResendTimer() {
    stopResendTimer();

    resendSecondsRemaining = RESEND_COOLDOWN_SECONDS;

    if (resendResetOtpButton) {
      resendResetOtpButton.disabled = true;
    }

    updateResendCountdown();

    resendTimer = setInterval(function () {
      resendSecondsRemaining--;

      updateResendCountdown();

      if (resendSecondsRemaining <= 0) {
        stopResendTimer();

        if (resendResetOtpButton) {
          resendResetOtpButton.disabled = false;
          resendResetOtpButton.innerHTML = "<span>Resend OTP</span>";
        }
      }
    }, 1000);
  }

  function updateResendCountdown() {
    const seconds = Math.max(0, resendSecondsRemaining);

    if (resendCountdown) {
      resendCountdown.textContent = seconds > 0 ? `${seconds}s` : "";
    }

    if (resendResetOtpButton && seconds > 0) {
      resendResetOtpButton.disabled = true;

      resendResetOtpButton.innerHTML = `<span>Resend OTP (${seconds}s)</span>`;
    }
  }

  function stopResendTimer() {
    if (resendTimer) {
      clearInterval(resendTimer);
      resendTimer = null;
    }

    resendSecondsRemaining = 0;

    if (resendCountdown) {
      resendCountdown.textContent = "";
    }

    if (resendResetOtpButton) {
      resendResetOtpButton.disabled = false;
    }
  }

  /* =====================================================
       15. BACK BUTTONS
    ===================================================== */

  if (backToLoginFromForgot) {
    backToLoginFromForgot.addEventListener("click", function (event) {
      event.preventDefault();
      showLoginSection();
    });
  }

  if (backToForgotPassword) {
    backToForgotPassword.addEventListener("click", function (event) {
      event.preventDefault();

      stopResendTimer();
      showForgotPasswordSection();
    });
  }

  if (backToResetOtp) {
    backToResetOtp.addEventListener("click", function (event) {
      event.preventDefault();

      if (pendingResetEmail) {
        showResetOtpSection();
        startResendTimer();
      } else {
        showForgotPasswordSection();
      }
    });
  }

  /* =====================================================
       16. INPUT VALIDATION / MESSAGE CLEARING
    ===================================================== */

  [emailInput, passwordInput].forEach(function (input) {
    if (input) {
      input.addEventListener("input", function () {
        clearMessage(loginMessage);
      });
    }
  });

  if (resetEmailInput) {
    resetEmailInput.addEventListener("input", function () {
      clearMessage(resetEmailMessage);
    });
  }

  if (resetOtpInput) {
    resetOtpInput.addEventListener("input", function () {
      resetOtpInput.value = resetOtpInput.value.replace(/\D/g, "").slice(0, 6);

      clearMessage(resetOtpMessage);
    });
  }

  [newPasswordInput, confirmNewPasswordInput].forEach(function (input) {
    if (input) {
      input.addEventListener("input", function () {
        clearMessage(newPasswordMessage);
      });
    }
  });

  /* =====================================================
       17. INITIAL PAGE STATE
    ===================================================== */

  if (forgotPasswordSection) {
    forgotPasswordSection.hidden = true;
  }

  if (resetOtpSection) {
    resetOtpSection.hidden = true;
  }

  if (newPasswordSection) {
    newPasswordSection.hidden = true;
  }

  if (loginForm) {
    loginForm.hidden = false;
  }

  if (forgotPassword) {
    forgotPassword.hidden = false;
  }

  console.log("ScholarBridge AI login page initialized.");
});
