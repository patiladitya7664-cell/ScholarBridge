/* =========================================================
   SCHOLARBRIDGE - PROFILE PAGE
   File: profile.js

   Features:
   1. Load profile data
   2. Edit profile
   3. Validate form fields
   4. Save profile in localStorage
   5. Cancel changes
   6. Profile photo preview
   7. Profile completion percentage
   8. Update profile overview
   9. Toast notifications

   NOTE:
   This version saves demo data in the current browser.
   Backend integration is required for real account updates.
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    // =====================================================
    // 1. CONFIGURATION
    // =====================================================

    const STORAGE_KEY = "scholarBridgeProfileDemo";

    const PHOTO_STORAGE_KEY = "scholarBridgeProfilePhotoDemo";

    const MAX_PHOTO_SIZE = 2 * 1024 * 1024;

    const ALLOWED_PHOTO_TYPES = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ];

    const CURRENT_YEAR = new Date().getFullYear();


    // =====================================================
    // 2. DOM ELEMENTS
    // =====================================================

    const profileForm = document.getElementById("profileForm");

    const editProfileButton =
        document.getElementById("editProfileButton");

    const cancelProfileButton =
        document.getElementById("cancelProfileButton");

    const saveProfileButton =
        document.getElementById("saveProfileButton");

    const profileFormActions =
        document.getElementById("profileFormActions");

    const profilePhotoInput =
        document.getElementById("profilePhotoInput");

    const profilePhotoPreview =
        document.getElementById("profilePhotoPreview");

    const profileDisplayName =
        document.getElementById("profileDisplayName");

    const profileDisplayEmail =
        document.getElementById("profileDisplayEmail");

    const profileDisplayEducation =
        document.getElementById("profileDisplayEducation");

    const profileDisplayLocation =
        document.getElementById("profileDisplayLocation");

    const profileCompletionCircle =
        document.getElementById("profileCompletionCircle");

    const profileCompletionPercent =
        document.getElementById("profileCompletionPercent");

    const headerAvatar =
        document.getElementById("headerAvatar");

    const headerUserName =
        document.getElementById("headerUserName");

    const profileToast =
        document.getElementById("profileToast");

    const profileToastMessage =
        document.getElementById("profileToastMessage");

    const currentYearElement =
        document.getElementById("currentYear");


    // =====================================================
    // 3. FORM FIELD DEFINITIONS
    // =====================================================

    const FIELD_NAMES = [
        "firstName",
        "lastName",
        "email",
        "phone",
        "dateOfBirth",
        "gender",
        "educationLevel",
        "course",
        "institution",
        "studyYear",
        "graduationYear",
        "academicScore",
        "fieldOfStudy",
        "address",
        "city",
        "state",
        "postalCode",
        "country"
    ];

    const REQUIRED_FIELDS = [
        "firstName",
        "email"
    ];

    const formFields = {};

    FIELD_NAMES.forEach(fieldName => {
        formFields[fieldName] = document.getElementById(fieldName);
    });


    // =====================================================
    // 4. STATE
    // =====================================================

    let profileData = {};

    let originalProfileData = {};

    let isEditing = false;

    let selectedPhotoData = null;

    let originalPhotoData = null;

    let toastTimer = null;


    // =====================================================
    // 5. HELPERS
    // =====================================================

    function getFieldValue(fieldName) {
        const field = formFields[fieldName];

        if (!field) {
            return "";
        }

        return field.value.trim();
    }


    function setFieldValue(fieldName, value) {
        const field = formFields[fieldName];

        if (!field) {
            return;
        }

        field.value = value == null ? "" : String(value);
    }


    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, character => {
            const entities = {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#039;"
            };

            return entities[character];
        });
    }


    function getFullName(data) {
        const firstName = String(data.firstName || "").trim();

        const lastName = String(data.lastName || "").trim();

        return `${firstName} ${lastName}`.trim();
    }


    function getInitials(name) {
        const words = String(name || "")
            .trim()
            .split(/\s+/)
            .filter(Boolean);

        if (words.length === 0) {
            return "";
        }

        return words
            .slice(0, 2)
            .map(word => word.charAt(0).toUpperCase())
            .join("");
    }


    function getEducationLabel(value) {
        const labels = {
            school: "School Student",
            "higher-secondary": "Higher Secondary",
            diploma: "Diploma Student",
            undergraduate: "Undergraduate Student",
            postgraduate: "Postgraduate Student",
            doctoral: "Doctoral Student",
            other: "Other Education"
        };

        return labels[value] || "";
    }


    function getLocation(data) {
        return [
            data.city,
            data.state,
            data.country
        ]
            .map(value => String(value || "").trim())
            .filter(Boolean)
            .join(", ");
    }


    // =====================================================
    // 6. TOAST NOTIFICATION
    // =====================================================

    function showToast(message, type = "success") {
        if (!profileToast || !profileToastMessage) {
            console.log(message);
            return;
        }

        clearTimeout(toastTimer);

        const icon = profileToast.querySelector("i");

        if (icon) {
            icon.className = type === "error"
                ? "fa-solid fa-circle-exclamation"
                : "fa-solid fa-circle-check";
        }

        profileToastMessage.textContent = message;

        profileToast.hidden = false;

        toastTimer = setTimeout(() => {
            profileToast.hidden = true;
        }, 3500);
    }


    // =====================================================
    // 7. DEFAULT PROFILE
    // =====================================================

    function createDefaultProfile() {
        return {
            firstName: "",
            lastName: "",
            email: "",
            phone: "",
            dateOfBirth: "",
            gender: "",

            educationLevel: "",
            course: "",
            institution: "",
            studyYear: "",
            graduationYear: "",
            academicScore: "",
            fieldOfStudy: "",

            address: "",
            city: "",
            state: "",
            postalCode: "",
            country: ""
        };
    }


    // =====================================================
    // 8. LOAD SAVED PROFILE
    // =====================================================

    function loadSavedProfile() {
        let savedProfile = null;

        try {
            const rawData = localStorage.getItem(STORAGE_KEY);

            if (rawData) {
                savedProfile = JSON.parse(rawData);
            }

        } catch (error) {
            console.error(
                "ScholarBridge: Could not load saved profile.",
                error
            );
        }

        profileData = createDefaultProfile();

        if (
            savedProfile &&
            typeof savedProfile === "object" &&
            !Array.isArray(savedProfile)
        ) {
            FIELD_NAMES.forEach(fieldName => {
                if (
                    Object.prototype.hasOwnProperty.call(
                        savedProfile,
                        fieldName
                    )
                ) {
                    profileData[fieldName] =
                        String(savedProfile[fieldName] ?? "");
                }
            });
        }

        /*
         * Optional compatibility:
         * Use an existing locally saved user object to prefill
         * empty fields. Do not overwrite an explicitly saved profile.
         */
        const possibleUserKeys = [
            "scholarBridgeCurrentUser",
            "scholarBridgeUser",
            "user"
        ];

        for (const key of possibleUserKeys) {
            try {
                const rawUser = localStorage.getItem(key);

                if (!rawUser) {
                    continue;
                }

                const user = JSON.parse(rawUser);

                if (!user || typeof user !== "object") {
                    continue;
                }

                const possibleName = String(
                    user.name || user.fullName || ""
                ).trim();

                if (!profileData.firstName && possibleName) {
                    const nameParts = possibleName.split(/\s+/);

                    profileData.firstName = nameParts.shift() || "";

                    profileData.lastName = nameParts.join(" ");
                }

                if (!profileData.email && user.email) {
                    profileData.email = String(user.email);
                }

                if (!profileData.phone && user.phone) {
                    profileData.phone = String(user.phone);
                }

                break;

            } catch (error) {
                // Ignore incompatible user data.
            }
        }

        originalProfileData = { ...profileData };
    }


    // =====================================================
    // 9. LOAD PROFILE PHOTO
    // =====================================================

    function loadSavedPhoto() {
        try {
            const photo = localStorage.getItem(PHOTO_STORAGE_KEY);

            if (
                photo &&
                /^data:image\/(jpeg|png|webp);base64,/i.test(photo)
            ) {
                selectedPhotoData = photo;
                originalPhotoData = photo;
            }

        } catch (error) {
            console.warn(
                "ScholarBridge: Profile photo could not be loaded."
            );
        }
    }


    // =====================================================
    // 10. FILL FORM
    // =====================================================

    function fillForm(data) {
        FIELD_NAMES.forEach(fieldName => {
            setFieldValue(fieldName, data[fieldName]);
        });

        clearAllErrors();
    }


    // =====================================================
    // 11. ENABLE / DISABLE EDIT MODE
    // =====================================================

    function setEditing(enabled) {
        isEditing = enabled;

        FIELD_NAMES.forEach(fieldName => {
            const field = formFields[fieldName];

            if (!field) {
                return;
            }

            /*
             * Email is displayed as registered account information.
             * Editing the registered email requires backend verification.
             */
            if (fieldName === "email") {
                field.disabled = true;
                return;
            }

            field.disabled = !enabled;
        });

        if (profilePhotoInput) {
            profilePhotoInput.disabled = !enabled;
        }

        if (profileFormActions) {
            profileFormActions.hidden = !enabled;
        }

        if (editProfileButton) {
            editProfileButton.hidden = enabled;
        }

        if (profileForm) {
            profileForm.setAttribute(
                "aria-busy",
                "false"
            );
        }
    }


    // =====================================================
    // 12. FIELD ERROR HELPERS
    // =====================================================

    function setFieldError(fieldName, message) {
        const field = formFields[fieldName];

        const errorElement = document.getElementById(
            `${fieldName}Error`
        );

        if (field) {
            field.setAttribute(
                "aria-invalid",
                message ? "true" : "false"
            );
        }

        if (errorElement) {
            errorElement.textContent = message;
        }
    }


    function clearFieldError(fieldName) {
        setFieldError(fieldName, "");
    }


    function clearAllErrors() {
        FIELD_NAMES.forEach(fieldName => {
            clearFieldError(fieldName);
        });
    }


    // =====================================================
    // 13. VALIDATE PROFILE
    // =====================================================

    function validateProfile() {
        clearAllErrors();

        let isValid = true;

        for (const fieldName of REQUIRED_FIELDS) {
            const value = getFieldValue(fieldName);

            if (!value) {
                setFieldError(
                    fieldName,
                    "This field is required."
                );

                isValid = false;
            }
        }

        const firstName = getFieldValue("firstName");

        const lastName = getFieldValue("lastName");

        if (firstName && firstName.length > 60) {
            setFieldError(
                "firstName",
                "First name cannot exceed 60 characters."
            );

            isValid = false;
        }

        if (lastName && lastName.length > 60) {
            setFieldError(
                "lastName",
                "Last name cannot exceed 60 characters."
            );

            isValid = false;
        }

        const email = getFieldValue("email");

        if (
            email &&
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
        ) {
            setFieldError(
                "email",
                "Enter a valid email address."
            );

            isValid = false;
        }

        const phone = getFieldValue("phone");

        if (phone) {
            const digits = phone.replace(/\D/g, "");

            if (digits.length < 7 || digits.length > 15) {
                setFieldError(
                    "phone",
                    "Enter a valid phone number."
                );

                isValid = false;
            }
        }

        const dateOfBirth = getFieldValue("dateOfBirth");

        if (dateOfBirth) {
            const selectedDate = new Date(
                `${dateOfBirth}T00:00:00`
            );

            const today = new Date();

            today.setHours(23, 59, 59, 999);

            if (
                Number.isNaN(selectedDate.getTime()) ||
                selectedDate > today
            ) {
                setFieldError(
                    "dateOfBirth",
                    "Date of birth cannot be in the future."
                );

                isValid = false;
            }
        }

        const graduationYear = getFieldValue("graduationYear");

        if (graduationYear) {
            const year = Number(graduationYear);

            if (
                !Number.isInteger(year) ||
                year < 2000 ||
                year > 2100
            ) {
                setFieldError(
                    "graduationYear",
                    "Enter a valid graduation year."
                );

                isValid = false;
            }
        }

        const academicScore = getFieldValue("academicScore");

        if (academicScore !== "") {
            const score = Number(academicScore);

            if (
                !Number.isFinite(score) ||
                score < 0 ||
                score > 100
            ) {
                setFieldError(
                    "academicScore",
                    "Academic score must be between 0 and 100."
                );

                isValid = false;
            }
        }

        if (!isValid) {
            const firstInvalidField = profileForm
                ? profileForm.querySelector(
                    '[aria-invalid="true"]'
                )
                : null;

            if (firstInvalidField) {
                firstInvalidField.focus();

                firstInvalidField.scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                });
            }
        }

        return isValid;
    }


    // =====================================================
    // 14. READ FORM DATA
    // =====================================================

    function readFormData() {
        const result = {};

        FIELD_NAMES.forEach(fieldName => {
            result[fieldName] = getFieldValue(fieldName);
        });

        return result;
    }


    // =====================================================
    // 15. PROFILE COMPLETION
    // =====================================================

    function calculateCompletion(data) {
        const completionFields = [
            "firstName",
            "lastName",
            "email",
            "phone",
            "dateOfBirth",
            "gender",
            "educationLevel",
            "course",
            "institution",
            "studyYear",
            "graduationYear",
            "academicScore",
            "fieldOfStudy",
            "address",
            "city",
            "state",
            "postalCode",
            "country"
        ];

        const completedCount = completionFields.filter(
            fieldName => {
                return String(data[fieldName] || "").trim() !== "";
            }
        ).length;

        return Math.round(
            (completedCount / completionFields.length) * 100
        );
    }


    function updateCompletion(data) {
        const percentage = calculateCompletion(data);

        if (profileCompletionPercent) {
            profileCompletionPercent.textContent =
                `${percentage}%`;
        }

        if (profileCompletionCircle) {
            profileCompletionCircle.style.setProperty(
                "--completion",
                `${percentage}%`
            );

            profileCompletionCircle.setAttribute(
                "role",
                "progressbar"
            );

            profileCompletionCircle.setAttribute(
                "aria-valuemin",
                "0"
            );

            profileCompletionCircle.setAttribute(
                "aria-valuemax",
                "100"
            );

            profileCompletionCircle.setAttribute(
                "aria-valuenow",
                String(percentage)
            );

            profileCompletionCircle.setAttribute(
                "aria-label",
                `Profile ${percentage}% complete`
            );
        }
    }


    // =====================================================
    // 16. RENDER PROFILE PHOTO
    // =====================================================

    function renderProfilePhoto() {
        if (!profilePhotoPreview) {
            return;
        }

        if (selectedPhotoData) {
            const image = document.createElement("img");

            image.src = selectedPhotoData;

            image.alt = "Profile photo";

            profilePhotoPreview.replaceChildren(image);

        } else {
            const icon = document.createElement("i");

            icon.className = "fa-solid fa-user";

            icon.setAttribute("aria-hidden", "true");

            profilePhotoPreview.replaceChildren(icon);
        }

        if (headerAvatar) {
            if (selectedPhotoData) {
                const image = document.createElement("img");

                image.src = selectedPhotoData;

                image.alt = "";

                headerAvatar.replaceChildren(image);

            } else {
                const icon = document.createElement("i");

                icon.className = "fa-solid fa-user";

                icon.setAttribute("aria-hidden", "true");

                headerAvatar.replaceChildren(icon);
            }
        }
    }


    // =====================================================
    // 17. UPDATE PROFILE OVERVIEW
    // =====================================================

    function updateProfileOverview(data) {
        const fullName = getFullName(data);

        if (profileDisplayName) {
            profileDisplayName.textContent =
                fullName || "Your Name";
        }

        if (profileDisplayEmail) {
            profileDisplayEmail.textContent =
                data.email || "Email not added";
        }

        if (profileDisplayEducation) {
            const education = [
                getEducationLabel(data.educationLevel),
                data.course
            ]
                .filter(Boolean)
                .join(" · ");

            profileDisplayEducation.textContent =
                education || "Education not added";
        }

        if (profileDisplayLocation) {
            profileDisplayLocation.textContent =
                getLocation(data) || "Location not added";
        }

        if (headerUserName) {
            headerUserName.textContent =
                fullName || "My Account";
        }

        updateCompletion(data);

        renderProfilePhoto();
    }


    // =====================================================
    // 18. SAVE PROFILE TO BROWSER STORAGE
    // =====================================================

    function saveProfileToStorage(data) {
        const previousData = localStorage.getItem(STORAGE_KEY);

        try {
            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(data)
            );

            if (selectedPhotoData) {
                localStorage.setItem(
                    PHOTO_STORAGE_KEY,
                    selectedPhotoData
                );
            } else {
                localStorage.removeItem(PHOTO_STORAGE_KEY);
            }

            return true;

        } catch (error) {
            console.error(
                "ScholarBridge: Could not save profile.",
                error
            );

            /*
             * Best-effort rollback of the profile record.
             * This cannot guarantee rollback if browser storage is full.
             */
            try {
                if (previousData === null) {
                    localStorage.removeItem(STORAGE_KEY);
                } else {
                    localStorage.setItem(
                        STORAGE_KEY,
                        previousData
                    );
                }
            } catch (rollbackError) {
                console.error(
                    "ScholarBridge: Profile rollback failed.",
                    rollbackError
                );
            }

            return false;
        }
    }


    // =====================================================
    // 19. EDIT PROFILE
    // =====================================================

    function startEditing() {
        originalProfileData = { ...profileData };

        originalPhotoData = selectedPhotoData;

        fillForm(profileData);

        setEditing(true);

        const firstNameField = formFields.firstName;

        if (firstNameField) {
            firstNameField.focus();
        }

        showToast(
            "Edit mode enabled. Update your profile details."
        );
    }


    if (editProfileButton) {
        editProfileButton.addEventListener(
            "click",
            startEditing
        );
    }


    // =====================================================
    // 20. CANCEL CHANGES
    // =====================================================

    function cancelEditing() {
        const confirmed = window.confirm(
            "Discard your unsaved profile changes?"
        );

        if (!confirmed) {
            return;
        }

        profileData = { ...originalProfileData };

        selectedPhotoData = originalPhotoData;

        fillForm(profileData);

        setEditing(false);

        updateProfileOverview(profileData);

        if (profilePhotoInput) {
            profilePhotoInput.value = "";
        }

        showToast("Your changes have been discarded.");
    }


    if (cancelProfileButton) {
        cancelProfileButton.addEventListener(
            "click",
            cancelEditing
        );
    }


    // =====================================================
    // 21. SAVE PROFILE
    // =====================================================

    if (profileForm) {
        profileForm.addEventListener("submit", event => {
            event.preventDefault();

            if (!isEditing) {
                return;
            }

            if (!validateProfile()) {
                showToast(
                    "Please correct the highlighted fields.",
                    "error"
                );

                return;
            }

            const newProfileData = readFormData();

            if (!saveProfileToStorage(newProfileData)) {
                showToast(
                    "Could not save changes. Browser storage may be full or unavailable.",
                    "error"
                );

                return;
            }

            profileData = { ...newProfileData };

            originalProfileData = { ...newProfileData };

            originalPhotoData = selectedPhotoData;

            fillForm(profileData);

            setEditing(false);

            updateProfileOverview(profileData);

            if (profilePhotoInput) {
                profilePhotoInput.value = "";
            }

            showToast("Profile updated successfully.");
        });
    }


    // =====================================================
    // 22. PROFILE PHOTO PREVIEW
    // =====================================================

    if (profilePhotoInput) {
        profilePhotoInput.addEventListener("change", event => {
            if (!isEditing) {
                profilePhotoInput.value = "";
                return;
            }

            const file = event.target.files
                ? event.target.files[0]
                : null;

            if (!file) {
                return;
            }

            if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
                showToast(
                    "Choose a JPG, PNG, or WEBP image.",
                    "error"
                );

                profilePhotoInput.value = "";

                return;
            }

            if (file.size > MAX_PHOTO_SIZE) {
                showToast(
                    "Profile photo must be 2 MB or smaller.",
                    "error"
                );

                profilePhotoInput.value = "";

                return;
            }

            const reader = new FileReader();

            reader.onload = () => {
                if (
                    typeof reader.result !== "string" ||
                    !reader.result.startsWith("data:image/")
                ) {
                    showToast(
                        "Could not preview this image.",
                        "error"
                    );

                    return;
                }

                selectedPhotoData = reader.result;

                renderProfilePhoto();

                showToast(
                    "Photo preview updated. Save changes to keep it."
                );
            };

            reader.onerror = () => {
                showToast(
                    "Could not read the selected image.",
                    "error"
                );
            };

            reader.readAsDataURL(file);
        });
    }


    // =====================================================
    // 23. CLEAR FIELD ERROR WHEN USER TYPES
    // =====================================================

    FIELD_NAMES.forEach(fieldName => {
        const field = formFields[fieldName];

        if (!field) {
            return;
        }

        field.addEventListener("input", () => {
            clearFieldError(fieldName);
        });

        field.addEventListener("change", () => {
            clearFieldError(fieldName);
        });
    });


    // =====================================================
    // 24. PROFILE SIDEBAR NAVIGATION
    // =====================================================

    const profileSidebarLinks = document.querySelectorAll(
        ".profile-sidebar-nav a[href^='#']"
    );

    profileSidebarLinks.forEach(link => {
        link.addEventListener("click", () => {
            profileSidebarLinks.forEach(otherLink => {
                otherLink.classList.remove("active");
            });

            link.classList.add("active");
        });
    });


    // =====================================================
    // 25. FOOTER YEAR
    // =====================================================

    if (currentYearElement) {
        currentYearElement.textContent = CURRENT_YEAR;
    }


    // =====================================================
    // 26. INITIALIZE PAGE
    // =====================================================

    loadSavedProfile();

    loadSavedPhoto();

    fillForm(profileData);

    setEditing(false);

    updateProfileOverview(profileData);

    console.log(
        "ScholarBridge Profile initialized successfully."
    );

});