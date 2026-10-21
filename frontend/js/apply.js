"use strict";

/* =====================================================
   ScholarBridge AI - APPLICATION FORM
   File: js/apply.js

   APIs:
   GET  /api/scholarships/:id
   POST /api/applications
===================================================== */

document.addEventListener("DOMContentLoaded", initializeApplicationPage);

let selectedScholarship = null;
let isSubmittingApplication = false;

const applicationForm = document.getElementById("applicationForm");
const scholarshipNameElement = document.getElementById("scholarshipName");
const scholarshipProviderElement = document.getElementById("scholarshipProvider");
const scholarshipAmountElement = document.getElementById("scholarshipAmount");
const pageMessageElement = document.getElementById("pageMessage");
const submitButton = document.getElementById("submitApplication");


/* =====================================================
   1. INITIALIZE PAGE
===================================================== */

async function initializeApplicationPage() {
    const currentYearElement = document.getElementById("currentYear");

    if (currentYearElement) {
        currentYearElement.textContent = new Date().getFullYear();
    }

    // Require an authenticated student.
    if (typeof requireLogin !== "function" ||
        typeof getCurrentUser !== "function") {
        showPageMessage(
            "Authentication service could not be loaded. Please refresh the page.",
            "error"
        );

        if (applicationForm) {
            applicationForm.hidden = true;
        }

        return;
    }

    if (!requireLogin()) {
        return;
    }

    if (!applicationForm) {
        console.error("Application form element was not found.");
        return;
    }

    const currentUser = getCurrentUser();

    if (currentUser) {
        fillStudentDetails(currentUser);
    }

    setupMobileValidation();
    applicationForm.addEventListener("submit", handleApplicationSubmit);

    await loadSelectedScholarship();
}


/* =====================================================
   2. STUDENT DETAILS
===================================================== */

function fillStudentDetails(user) {
    // Support common response formats without assuming
    // a single user model structure.
    const student = user.user || user.student || user;

    const fullName =
        student.fullName ||
        student.name ||
        student.username ||
        "";

    const email = student.email || "";

    const mobile =
        student.mobile ||
        student.phone ||
        student.phoneNumber ||
        "";

    const category = student.category || "";

    setFieldValue("fullName", fullName);
    setFieldValue("email", email);
    setFieldValue("mobile", normalizeMobile(mobile));
    setFieldValue("category", category);
}

function setFieldValue(fieldId, value) {
    const field = document.getElementById(fieldId);

    if (field && value !== undefined && value !== null) {
        field.value = String(value);
    }
}

function normalizeMobile(value) {
    const digits = String(value || "").replace(/\D/g, "");

    // Handle a saved Indian number that includes country code.
    if (digits.length === 12 && digits.startsWith("91")) {
        return digits.slice(2);
    }

    return digits;
}

function setupMobileValidation() {
    const mobileInput = document.getElementById("mobile");

    if (!mobileInput) {
        return;
    }

    mobileInput.addEventListener("input", function () {
        this.value = this.value.replace(/\D/g, "").slice(0, 10);
    });
}


/* =====================================================
   3. LOAD SELECTED SCHOLARSHIP
===================================================== */

async function loadSelectedScholarship() {
    const params = new URLSearchParams(window.location.search);

    const scholarshipId = params.get("id");

    if (!scholarshipId) {
        showPageMessage(
            "No scholarship was selected. Please return to the Scholarships page and select a scholarship.",
            "error"
        );

        disableApplicationForm();
        return;
    }

    if (typeof apiGet !== "function") {
        showPageMessage(
            "The API service could not be loaded. Please refresh the page.",
            "error"
        );

        disableApplicationForm();
        return;
    }

    try {
        showPageMessage("Loading scholarship details...", "info");

        const response = await apiGet(
            "/scholarships/" + encodeURIComponent(scholarshipId)
        );

        const scholarship =
            response.scholarship ||
            response.data?.scholarship ||
            response.data ||
            response;

        if (!scholarship || !(scholarship._id || scholarship.scholarshipId)) {
            throw new Error("The selected scholarship could not be found.");
        }

        selectedScholarship = scholarship;

        renderScholarshipDetails(scholarship);
        hidePageMessage();

        const deadline = scholarship.deadline
            ? new Date(scholarship.deadline)
            : null;

        if (deadline && !Number.isNaN(deadline.getTime())) {
            const deadlineEnd = new Date(deadline);
            deadlineEnd.setHours(23, 59, 59, 999);

            if (deadlineEnd < new Date()) {
                showPageMessage(
                    "The application deadline for this scholarship has passed. You cannot apply through this form.",
                    "error"
                );

                disableApplicationForm();
                return;
            }
        }

        const status = String(scholarship.status || "Active").toLowerCase();

        if (status !== "active") {
            showPageMessage(
                "This scholarship is not currently accepting applications.",
                "error"
            );

            disableApplicationForm();
        }
    } catch (error) {
        console.error("Could not load scholarship:", error);

        showPageMessage(
            error.message || "Could not load scholarship details.",
            "error"
        );

        disableApplicationForm();
    }
}

function renderScholarshipDetails(scholarship) {
    const name =
        scholarship.title ||
        scholarship.name ||
        scholarship.scholarshipName ||
        "Selected Scholarship";

    const provider =
        scholarship.provider ||
        scholarship.organization ||
        "";

    const amount =
        scholarship.amount ??
        scholarship.awardAmount;

    if (scholarshipNameElement) {
        scholarshipNameElement.textContent = name;
    }

    if (scholarshipProviderElement) {
        scholarshipProviderElement.textContent = provider
            ? "Provided by " + provider
            : "";
    }

    if (scholarshipAmountElement) {
        scholarshipAmountElement.textContent =
            amount !== undefined && amount !== null && amount !== ""
                ? "Award: " + formatCurrency(amount)
                : "";
    }
}

function formatCurrency(value) {
    const amount = Number(value);

    if (!Number.isFinite(amount)) {
        return String(value);
    }

    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0
    }).format(amount);
}


/* =====================================================
   4. FORM SUBMISSION
===================================================== */

async function handleApplicationSubmit(event) {
    event.preventDefault();

    if (isSubmittingApplication) {
        return;
    }

    if (!selectedScholarship) {
        showPageMessage(
            "Scholarship details are not available. Please reload the page.",
            "error"
        );

        return;
    }

    if (!applicationForm.reportValidity()) {
        return;
    }

    const mobile = document.getElementById("mobile").value.trim();

    if (!/^[6-9]\d{9}$/.test(mobile)) {
        showPageMessage(
            "Please enter a valid 10-digit Indian mobile number.",
            "error"
        );

        document.getElementById("mobile").focus();
        return;
    }

    const purpose = document.getElementById("purpose").value.trim();

    if (purpose.length < 20) {
        showPageMessage(
            "Please write at least 20 characters in your application statement.",
            "error"
        );

        document.getElementById("purpose").focus();
        return;
    }

    const currentUser = getCurrentUser();

    if (!currentUser || !getAuthToken()) {
        showPageMessage(
            "Your login session is missing. Please log in again.",
            "error"
        );

        return;
    }

    const scholarshipId =
        selectedScholarship.scholarshipId ||
        selectedScholarship._id;

    const scholarshipName =
        selectedScholarship.title ||
        selectedScholarship.name ||
        selectedScholarship.scholarshipName;

    const payload = {
        scholarshipId: scholarshipId,
        scholarshipName: scholarshipName,

        fullName: document.getElementById("fullName").value.trim(),
        email: document.getElementById("email").value.trim().toLowerCase(),
        mobile: mobile,

        category: document.getElementById("category").value,
        course: document.getElementById("course").value.trim(),
        institution: document.getElementById("institution").value.trim(),
        academicYear: document.getElementById("academicYear").value,
        familyIncome: document.getElementById("familyIncome").value,

        address: document.getElementById("address").value.trim(),
        purpose: purpose,

        additionalDetails: "",
        documentDetails: "",
        documents: []
    };

    isSubmittingApplication = true;
    setSubmitButtonState(true);

    showPageMessage("Submitting your application...", "info");

    try {
        const response = await apiPost("/applications", payload);

        if (response.success === false) {
            throw new Error(
                response.message || "Application submission failed."
            );
        }

        showPageMessage(
            response.message || "Your application was submitted successfully!",
            "success"
        );

        applicationForm.reset();

        // The user details are not cleared from localStorage.
        // Restore the saved details after resetting the form.
        fillStudentDetails(currentUser);

        const application = response.application || response.data?.application;

        if (application && application._id) {
            sessionStorage.setItem(
                "scholarBridgeLastApplicationId",
                application._id
            );
        }

        if (submitButton) {
            submitButton.innerHTML =
                '<i class="fa-solid fa-check"></i> Application Submitted';

            submitButton.disabled = true;
        }

        // Redirect only after a successful API response.
        window.setTimeout(function () {
            window.location.href = "applications.html";
        }, 1500);

    } catch (error) {
        console.error("Application submission error:", error);

        showPageMessage(
            error.message || "Unable to submit your application. Please try again.",
            "error"
        );

        isSubmittingApplication = false;
        setSubmitButtonState(false);
    }
}


/* =====================================================
   5. UI HELPERS
===================================================== */

function showPageMessage(message, type) {
    if (!pageMessageElement) {
        console.log(message);
        return;
    }

    pageMessageElement.textContent = message;
    pageMessageElement.className = "form-message " + (type || "info");
    pageMessageElement.hidden = false;
}

function hidePageMessage() {
    if (!pageMessageElement) {
        return;
    }

    pageMessageElement.textContent = "";
    pageMessageElement.hidden = true;
    pageMessageElement.className = "form-message";
}

function disableApplicationForm() {
    if (!applicationForm) {
        return;
    }

    applicationForm.querySelectorAll("input, select, textarea, button")
        .forEach(function (element) {
            element.disabled = true;
        });
}

function setSubmitButtonState(isLoading) {
    if (!submitButton) {
        return;
    }

    submitButton.disabled = isLoading;

    submitButton.innerHTML = isLoading
        ? '<i class="fa-solid fa-spinner fa-spin"></i> Submitting...'
        : '<span>Submit Application</span><i class="fa-solid fa-arrow-right"></i>';
}