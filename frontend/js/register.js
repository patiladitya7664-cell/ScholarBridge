"use strict";

/* =========================================================
   ScholarBridgee AI — REGISTRATION & EMAIL OTP
   File: frontend/js/register.js

   Backend is not modified by this file.
========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    /* =====================================================
       1. DOM ELEMENTS
    ===================================================== */

    const registerForm = document.getElementById("registerForm");
    const fullNameInput = document.getElementById("fullName");
    const emailInput = document.getElementById("email");
    const mobileInput = document.getElementById("mobile");
    const categoryInput = document.getElementById("category");

    const passwordInput = document.getElementById("password");
    const confirmPasswordInput = document.getElementById("confirmPassword");
    const termsInput = document.getElementById("terms");

    const registerButton = document.getElementById("registerButton");
    const registerMessage = document.getElementById("registerMessage");

    const otpSection = document.getElementById("otpSection");
    const otpForm = document.getElementById("otpForm");
    const otpInput = document.getElementById("registrationOtp");
    const otpEmailDisplay = document.getElementById("otpEmailDisplay");

    const verifyOtpButton = document.getElementById("verifyOtpButton");
    const resendOtpButton = document.getElementById("resendOtpButton");
    const backToRegistrationButton =
        document.getElementById("backToRegistration");

    const authTitle = document.getElementById("authTitle");
    const authDescription = document.getElementById("authDescription");
    const authIcon = document.getElementById("authIcon");
    const authDivider = document.getElementById("authDivider");
    const authSwitch = document.getElementById("authSwitch");
    const currentYear = document.getElementById("currentYear");

    /* =====================================================
       2. CONFIGURATION
    ===================================================== */

    const API_BASE_URL = "http://localhost:5000/api";
    const RESEND_COOLDOWN = 60;

    let pendingEmail = "";
    let resendTimer = null;
    let resendSeconds = 0;

    let registrationInProgress = false;
    let verificationInProgress = false;
    let resendInProgress = false;

    const REGISTER_BUTTON_HTML =
        '<span>Create Account</span>' +
        '<i class="fa-solid fa-arrow-right"></i>';

    const VERIFY_BUTTON_HTML =
        '<span>Verify OTP</span>' +
        '<i class="fa-solid fa-check"></i>';

    /* =====================================================
       3. INITIALIZATION
    ===================================================== */

    if (currentYear) {
        currentYear.textContent = new Date().getFullYear();
    }

    if (
        !registerForm ||
        !fullNameInput ||
        !emailInput ||
        !mobileInput ||
        !categoryInput ||
        !passwordInput ||
        !confirmPasswordInput ||
        !termsInput ||
        !registerButton ||
        !registerMessage ||
        !otpSection ||
        !otpForm ||
        !otpInput ||
        !verifyOtpButton ||
        !resendOtpButton ||
        !backToRegistrationButton
    ) {
        console.error(
            "ScholarBridgee AI: Required registration HTML elements are missing."
        );
        return;
    }

    /* =====================================================
       4. MESSAGE HELPERS
    ===================================================== */

    function showMessage(message, type = "error") {

        registerMessage.textContent = message;

        registerMessage.className = "form-message " + type;

        registerMessage.style.display = "block";

        registerMessage.setAttribute("role", "alert");

    }

    function clearMessage() {

        registerMessage.textContent = "";

        registerMessage.className = "form-message";

        registerMessage.style.display = "none";

    }

    function showOtpMessage(message, type = "error") {

        /*
         * The existing HTML has one message element.
         * Reuse it in the currently visible section.
         */

        showMessage(message, type);

        if (otpSection.hidden) {
            return;
        }

        const otpHeading = otpSection.querySelector("h2");

        if (otpHeading && registerMessage.parentElement === registerForm) {
            otpSection.insertBefore(registerMessage, otpHeading);
        }

    }

    function restoreMessageLocation() {

        const heading = document.querySelector(".auth-heading");

        if (heading && registerMessage.parentElement !== heading.parentElement) {
            heading.insertAdjacentElement("afterend", registerMessage);
        }

    }

    /* =====================================================
       5. API HELPER
    ===================================================== */

    async function apiRequest(endpoint, payload) {

        let response;

        try {

            response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(payload)
            });

        } catch (error) {

            throw new Error(
                "Backend se connection nahi ho raha. " +
                "Please check whether the server is running on port 5000."
            );

        }

        let data;

        try {

            data = await response.json();

        } catch (error) {

            throw new Error(
                "Server ka response samajh nahi aaya. Please try again."
            );

        }

        if (!response.ok || data.success === false) {

            const requestError = new Error(
                data.message || "Request failed. Please try again."
            );

            requestError.status = response.status;
            requestError.data = data;

            throw requestError;

        }

        return data;

    }

    /* =====================================================
       6. BUTTON LOADING
    ===================================================== */

    function setButtonLoading(
        button,
        loading,
        loadingText,
        normalHTML
    ) {

        if (!button) return;

        button.disabled = loading;

        if (loading) {

            button.innerHTML =
                '<i class="fa-solid fa-spinner fa-spin"></i> ' +
                loadingText;

        } else {

            button.innerHTML = normalHTML;

        }

    }

    /* =====================================================
       7. PASSWORD VISIBILITY
    ===================================================== */

    document.querySelectorAll(".password-toggle").forEach(function (button) {

        button.addEventListener("click", function () {

            const targetId = button.dataset.target;

            const input = document.getElementById(targetId);

            if (!input) return;

            const showPassword = input.type === "password";

            input.type = showPassword ? "text" : "password";

            button.innerHTML = showPassword
                ? '<i class="fa-regular fa-eye-slash"></i>'
                : '<i class="fa-regular fa-eye"></i>';

            button.setAttribute(
                "aria-label",
                showPassword ? "Hide password" : "Show password"
            );

        });

    });

    /* =====================================================
       8. MOBILE AND OTP INPUT
    ===================================================== */

    mobileInput.addEventListener("input", function () {

        mobileInput.value = mobileInput.value
            .replace(/\D/g, "")
            .slice(0, 10);

    });

    otpInput.addEventListener("input", function () {

        otpInput.value = otpInput.value
            .replace(/\D/g, "")
            .slice(0, 6);

        clearMessage();

    });

    registerForm.addEventListener("input", clearMessage);
    registerForm.addEventListener("change", clearMessage);

    /* =====================================================
       9. REGISTRATION VALIDATION
    ===================================================== */

    function validateRegistrationForm() {

        const fullName = fullNameInput.value.trim();
        const email = emailInput.value.trim().toLowerCase();
        const mobile = mobileInput.value.trim();
        const category = categoryInput.value;
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        if (fullName.length < 2 || fullName.length > 100) {

            showMessage(
                "Full name must contain between 2 and 100 characters."
            );

            fullNameInput.focus();

            return null;

        }

        if (!email || !emailInput.validity.valid) {

            showMessage("Please enter a valid email address.");

            emailInput.focus();

            return null;

        }

        if (!/^[6-9]\d{9}$/.test(mobile)) {

            showMessage(
                "Please enter a valid 10-digit Indian mobile number."
            );

            mobileInput.focus();

            return null;

        }

        const allowedCategories = [
            "ST",
            "SC",
            "OBC",
            "General",
            "Other"
        ];

        if (!allowedCategories.includes(category)) {

            showMessage("Please select your student category.");

            categoryInput.focus();

            return null;

        }

        if (password.length < 8 || password.length > 128) {

            showMessage(
                "Password must contain between 8 and 128 characters."
            );

            passwordInput.focus();

            return null;

        }

        if (password !== confirmPassword) {

            showMessage("Passwords do not match.");

            confirmPasswordInput.focus();

            return null;

        }

        if (!termsInput.checked) {

            showMessage(
                "Please agree to the Terms of Use and Privacy Policy."
            );

            termsInput.focus();

            return null;

        }

        return {
            fullName,
            email,
            mobile,
            category,
            password,
            confirmPassword
        };

    }

    /* =====================================================
       10. OTP TIMER
    ===================================================== */

    function stopResendTimer() {

        if (resendTimer !== null) {

            clearInterval(resendTimer);

            resendTimer = null;

        }

    }

    function updateResendButton() {

        if (resendSeconds > 0) {

            resendOtpButton.textContent =
                `Resend OTP in ${resendSeconds}s`;

            resendOtpButton.disabled = true;

        } else {

            resendOtpButton.textContent = "Resend OTP";

            resendOtpButton.disabled = resendInProgress;

        }

    }

    function startResendTimer(seconds = RESEND_COOLDOWN) {

        stopResendTimer();

        resendSeconds = Math.max(
            0,
            Math.ceil(Number(seconds) || RESEND_COOLDOWN)
        );

        updateResendButton();

        if (resendSeconds === 0) return;

        resendTimer = setInterval(function () {

            resendSeconds--;

            if (resendSeconds <= 0) {

                resendSeconds = 0;

                stopResendTimer();

            }

            updateResendButton();

        }, 1000);

    }

    /* =====================================================
       11. SHOW OTP SECTION
    ===================================================== */

    function showOtpSection(email) {

        pendingEmail = email;

        registerForm.hidden = true;

        otpSection.hidden = false;

        if (otpEmailDisplay) {
            otpEmailDisplay.textContent = email;
        }

        if (authTitle) {
            authTitle.textContent = "Verify Your Email";
        }

        if (authDescription) {

            authDescription.textContent =
                "Complete email verification to create your ScholarBridgee AI account.";

        }

        if (authIcon) {

            authIcon.innerHTML =
                '<i class="fa-solid fa-envelope-circle-check"></i>';

        }

        if (authDivider) authDivider.hidden = true;

        if (authSwitch) authSwitch.hidden = true;

        otpInput.value = "";

        restoreMessageLocation();

        clearMessage();

        startResendTimer(RESEND_COOLDOWN);

        otpInput.focus();

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    }

    /* =====================================================
       12. SHOW REGISTRATION FORM
    ===================================================== */

    function showRegistrationForm() {

        stopResendTimer();

        otpSection.hidden = true;

        registerForm.hidden = false;

        if (authTitle) {
            authTitle.textContent = "Create Account";
        }

        if (authDescription) {

            authDescription.textContent =
                "Join ScholarBridgee AI and discover scholarship opportunities for your education.";

        }

        if (authIcon) {

            authIcon.innerHTML =
                '<i class="fa-solid fa-user-plus"></i>';

        }

        if (authDivider) authDivider.hidden = false;

        if (authSwitch) authSwitch.hidden = false;

        restoreMessageLocation();

        clearMessage();

        emailInput.focus();

    }

    /* =====================================================
       13. REGISTRATION SUBMISSION
    ===================================================== */

    registerForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        if (registrationInProgress) return;

        clearMessage();

        const formData = validateRegistrationForm();

        if (!formData) return;

        registrationInProgress = true;

        setButtonLoading(
            registerButton,
            true,
            "Sending verification OTP...",
            REGISTER_BUTTON_HTML
        );

        try {

            const data = await apiRequest(
                "/auth/register",
                formData
            );

            showOtpSection(formData.email);

            showOtpMessage(
                data.message ||
                "Verification OTP sent. Please check your email.",
                "success"
            );

        } catch (error) {

            console.error("Registration error:", error);

            showMessage(
                error.message ||
                "Unable to start registration. Please try again.",
                "error"
            );

        } finally {

            registrationInProgress = false;

            setButtonLoading(
                registerButton,
                false,
                "",
                REGISTER_BUTTON_HTML
            );

        }

    });

    /* =====================================================
       14. VERIFY REGISTRATION OTP
    ===================================================== */

    otpForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        if (verificationInProgress) return;

        clearMessage();

        const otp = otpInput.value.trim();

        if (!pendingEmail) {

            showOtpMessage(
                "Registration session not found. Please register again."
            );

            showRegistrationForm();

            return;

        }

        if (!/^\d{6}$/.test(otp)) {

            showOtpMessage("Please enter a valid 6-digit OTP.");

            otpInput.focus();

            return;

        }

        verificationInProgress = true;

        setButtonLoading(
            verifyOtpButton,
            true,
            "Verifying OTP...",
            VERIFY_BUTTON_HTML
        );

        try {

            const data = await apiRequest(
                "/auth/verify-registration-otp",
                {
                    email: pendingEmail,
                    otp
                }
            );

            stopResendTimer();

            showOtpMessage(
                data.message ||
                "Email verified successfully. Your account has been created.",
                "success"
            );

            otpInput.disabled = true;

            resendOtpButton.disabled = true;

            backToRegistrationButton.disabled = true;

            setTimeout(function () {

                window.location.href = "login.html";

            }, 1500);

        } catch (error) {

            console.error("OTP verification error:", error);

            showOtpMessage(
                error.message ||
                "OTP verification failed. Please try again."
            );

            otpInput.focus();

            otpInput.select();

        } finally {

            verificationInProgress = false;

            setButtonLoading(
                verifyOtpButton,
                false,
                "",
                VERIFY_BUTTON_HTML
            );

        }

    });

    /* =====================================================
       15. RESEND REGISTRATION OTP
    ===================================================== */

    resendOtpButton.addEventListener("click", async function () {

        if (
            resendInProgress ||
            resendSeconds > 0 ||
            verificationInProgress
        ) {
            return;
        }

        if (!pendingEmail) {

            showOtpMessage(
                "Registration session not found. Please register again."
            );

            return;

        }

        resendInProgress = true;

        resendOtpButton.disabled = true;

        clearMessage();

        resendOtpButton.textContent = "Sending OTP...";

        try {

            const data = await apiRequest(
                "/auth/resend-registration-otp",
                {
                    email: pendingEmail
                }
            );

            otpInput.value = "";

            startResendTimer(
                Number(data.resendAfter) > 0
                    ? Number(data.resendAfter)
                    : RESEND_COOLDOWN
            );

            showOtpMessage(
                data.message ||
                "A new verification OTP has been sent to your email.",
                "success"
            );

            otpInput.focus();

        } catch (error) {

            console.error("Resend OTP error:", error);

            if (error.status === 429) {

                startResendTimer(RESEND_COOLDOWN);

            } else {

                resendSeconds = 0;

                updateResendButton();

            }

            showOtpMessage(
                error.message ||
                "Unable to resend OTP. Please try again."
            );

        } finally {

            resendInProgress = false;

            updateResendButton();

        }

    });

    /* =====================================================
       16. BACK TO REGISTRATION
    ===================================================== */

    backToRegistrationButton.addEventListener("click", function () {

        if (verificationInProgress || resendInProgress) return;

        /*
         * Keep the entered form details intact.
         * The user can correct them and submit again.
         */

        showRegistrationForm();

        showMessage(
            "Review your details and submit the form again if needed.",
            "success"
        );

    });

    /* =====================================================
       17. TERMS AND PRIVACY LINKS
    ===================================================== */

    const termsLink = document.getElementById("termsLink");
    const privacyLink = document.getElementById("privacyLink");

    if (termsLink) {

        termsLink.addEventListener("click", function (event) {

            event.preventDefault();

            showMessage(
                "The Terms of Use page will be available here soon.",
                "success"
            );

        });

    }

    if (privacyLink) {

        privacyLink.addEventListener("click", function (event) {

            event.preventDefault();

            showMessage(
                "The Privacy Policy page will be available here soon.",
                "success"
            );

        });

    }

    /* =====================================================
       18. CLEANUP
    ===================================================== */

    window.addEventListener("pagehide", stopResendTimer);

});