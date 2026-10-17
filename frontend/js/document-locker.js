/* =========================================================
   SCHOLARBRIDGE - DOCUMENT LOCKER
   File: document-locker.js

   Features:
   - Document upload and file validation
   - Document search
   - Category filtering
   - Document statistics
   - Document deletion
   - Document preview
   - Local browser storage for frontend demo

   SECURITY NOTICE:
   This is a frontend demo, not secure document storage.
   Do not upload real Aadhaar cards, bank documents,
   or other sensitive personal information.
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    // =====================================================
    // 1. DOM ELEMENTS
    // =====================================================

    const uploadForm = document.getElementById("documentUploadForm");
    const documentType = document.getElementById("documentType");
    const documentTitle = document.getElementById("documentTitle");
    const academicYear = document.getElementById("documentAcademicYear");
    const documentFile = document.getElementById("documentFile");

    const documentDropZone = document.getElementById("documentDropZone");
    const fileUploadTitle = document.getElementById("fileUploadTitle");
    const fileUploadDescription = document.getElementById(
        "fileUploadDescription"
    );

    const uploadMessage = document.getElementById(
        "documentUploadMessage"
    );

    const uploadButton = document.getElementById(
        "uploadDocumentButton"
    );

    const documentsGrid = document.getElementById("documentsGrid");
    const documentCount = document.getElementById("documentCount");

    const totalDocumentsElement = document.getElementById("totalDocuments");
    const verifiedDocumentsElement = document.getElementById("verifiedDocuments");
    const pendingDocumentsElement = document.getElementById("pendingDocuments");

    const documentSearch = document.getElementById("documentSearch");
    const categoryFilter = document.getElementById(
        "documentCategoryFilter"
    );

    const resetFiltersButton = document.getElementById(
        "resetDocumentFilters"
    );

    const emptyState = document.getElementById("documentEmptyState");
    const emptyTitle = document.getElementById("documentEmptyTitle");
    const emptyDescription = document.getElementById(
        "documentEmptyDescription"
    );

    const resetFormButton = document.getElementById("resetDocumentForm");
    const currentYear = document.getElementById("currentYear");

    // =====================================================
    // 2. CONFIGURATION
    // =====================================================

    const STORAGE_KEY = "scholarBridgeDocumentLockerDemo";

    const MAX_FILE_SIZE = 5 * 1024 * 1024;

    const ALLOWED_TYPES = [
        "application/pdf",
        "image/jpeg",
        "image/png"
    ];

    const ALLOWED_EXTENSIONS = [
        "pdf",
        "jpg",
        "jpeg",
        "png"
    ];

    const DOCUMENT_TYPES = {
        aadhaar: {
            label: "Aadhaar Card",
            icon: "fa-id-card"
        },
        income: {
            label: "Income Certificate",
            icon: "fa-file-invoice-dollar"
        },
        caste: {
            label: "Caste Certificate",
            icon: "fa-certificate"
        },
        domicile: {
            label: "Domicile Certificate",
            icon: "fa-house"
        },
        marksheet: {
            label: "Marksheet",
            icon: "fa-graduation-cap"
        },
        bank: {
            label: "Bank Passbook",
            icon: "fa-building-columns"
        },
        admission: {
            label: "Admission Letter",
            icon: "fa-envelope-open-text"
        },
        photo: {
            label: "Passport Size Photograph",
            icon: "fa-image"
        },
        other: {
            label: "Other Document",
            icon: "fa-file-lines"
        }
    };

    let documents = [];
    let selectedFile = null;
    let storageAvailable = true;

    // =====================================================
    // 3. INITIAL PAGE SETUP
    // =====================================================

    if (currentYear) {
        currentYear.textContent = new Date().getFullYear();
    }

    // =====================================================
    // 4. HTML ESCAPE HELPER
    // =====================================================

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

    // =====================================================
    // 5. MESSAGE HELPER
    // =====================================================

    function showMessage(message, type = "success") {
        if (!uploadMessage) {
            window.alert(message);
            return;
        }

        uploadMessage.textContent = message;
        uploadMessage.className = `document-upload-message ${type}`;
        uploadMessage.hidden = false;
    }

    function hideMessage() {
        if (uploadMessage) {
            uploadMessage.textContent = "";
            uploadMessage.hidden = true;
            uploadMessage.className = "document-upload-message";
        }
    }

    // =====================================================
    // 6. FILE HELPERS
    // =====================================================

    function getFileExtension(filename) {
        const parts = String(filename).toLowerCase().split(".");

        return parts.length > 1 ? parts.pop() : "";
    }

    function isAllowedFile(file) {
        if (!file) {
            return {
                valid: false,
                message: "Please select a document."
            };
        }

        const extension = getFileExtension(file.name);

        if (!ALLOWED_EXTENSIONS.includes(extension)) {
            return {
                valid: false,
                message: "Only PDF, JPG, JPEG and PNG files are allowed."
            };
        }

        if (file.size <= 0) {
            return {
                valid: false,
                message: "The selected file is empty."
            };
        }

        if (file.size > MAX_FILE_SIZE) {
            return {
                valid: false,
                message: "File size must not exceed 5 MB."
            };
        }

        if (file.type && !ALLOWED_TYPES.includes(file.type)) {
            return {
                valid: false,
                message: "The selected file type is not supported."
            };
        }

        return {
            valid: true,
            message: ""
        };
    }

    function formatFileSize(bytes) {
        if (!bytes) {
            return "0 KB";
        }

        if (bytes < 1024 * 1024) {
            return `${Math.max(1, Math.round(bytes / 1024))} KB`;
        }

        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    }

    function formatDate(dateString) {
        const date = new Date(dateString);

        if (Number.isNaN(date.getTime())) {
            return "Unknown date";
        }

        return date.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    }

    function getDocumentTypeInfo(type) {
        return DOCUMENT_TYPES[type] || DOCUMENT_TYPES.other;
    }

    // =====================================================
    // 7. LOAD DEMO DOCUMENT METADATA
    // =====================================================

    function loadDocuments() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);

            if (!saved) {
                documents = [];
                return;
            }

            const parsed = JSON.parse(saved);

            if (!Array.isArray(parsed)) {
                documents = [];
                return;
            }

            // Store metadata only. File contents are not persisted.
            documents = parsed.filter(item => {
                return (
                    item &&
                    typeof item.id === "string" &&
                    typeof item.title === "string" &&
                    typeof item.type === "string"
                );
            });

        } catch (error) {
            storageAvailable = false;
            documents = [];

            console.warn(
                "ScholarBridge: Unable to read demo document storage.",
                error
            );
        }
    }

    // =====================================================
    // 8. SAVE DEMO DOCUMENT METADATA
    // =====================================================

    function saveDocuments() {
        try {
            const metadata = documents.map(document => ({
                id: document.id,
                title: document.title,
                type: document.type,
                academicYear: document.academicYear || "",
                fileName: document.fileName,
                fileSize: document.fileSize,
                uploadedAt: document.uploadedAt,
                status: document.status
            }));

            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(metadata)
            );

            storageAvailable = true;
            return true;

        } catch (error) {
            storageAvailable = false;

            console.error(
                "ScholarBridge: Could not save demo document metadata.",
                error
            );

            return false;
        }
    }

    // =====================================================
    // 9. UPDATE STATISTICS
    // =====================================================

    function updateStatistics() {
        const total = documents.length;

        // No verification service is connected yet.
        const verified = documents.filter(
            item => item.status === "verified"
        ).length;

        const pending = documents.filter(
            item => item.status === "pending"
        ).length;

        if (totalDocumentsElement) {
            totalDocumentsElement.textContent = total;
        }

        if (verifiedDocumentsElement) {
            verifiedDocumentsElement.textContent = verified;
        }

        if (pendingDocumentsElement) {
            pendingDocumentsElement.textContent = pending;
        }
    }

    // =====================================================
    // 10. UPDATE FILE SELECTION DISPLAY
    // =====================================================

    function updateFileDisplay(file) {
        if (!fileUploadTitle || !fileUploadDescription) {
            return;
        }

        if (!file) {
            fileUploadTitle.textContent = "Click to select a file";
            fileUploadDescription.textContent = "PDF, JPG or PNG";

            if (documentDropZone) {
                documentDropZone.classList.remove("file-selected");
            }

            return;
        }

        fileUploadTitle.textContent = file.name;

        fileUploadDescription.textContent =
            `${formatFileSize(file.size)} selected`;

        if (documentDropZone) {
            documentDropZone.classList.add("file-selected");
        }
    }

    // =====================================================
    // 11. HANDLE FILE SELECTION
    // =====================================================

    if (documentFile) {
        documentFile.addEventListener("change", () => {
            hideMessage();

            const file = documentFile.files
                ? documentFile.files[0]
                : null;

            if (!file) {
                selectedFile = null;
                updateFileDisplay(null);
                return;
            }

            const validation = isAllowedFile(file);

            if (!validation.valid) {
                selectedFile = null;
                documentFile.value = "";
                updateFileDisplay(null);

                showMessage(validation.message, "error");
                return;
            }

            selectedFile = file;
            updateFileDisplay(file);

            if (documentTitle && !documentTitle.value.trim()) {
                const nameWithoutExtension = file.name.replace(/\.[^.]+$/, "");

                documentTitle.value = nameWithoutExtension;
            }
        });
    }

    // =====================================================
    // 12. DOCUMENT CARD
    // =====================================================

    function createDocumentCard(document) {
        const typeInfo = getDocumentTypeInfo(document.type);

        const status = document.status || "pending";

        const statusLabel = status === "verified"
            ? "Verified"
            : "Pending Verification";

        const statusClass = status === "verified"
            ? "verified"
            : "pending";

        const yearHTML = document.academicYear
            ? `
                <div class="document-card-meta-item">
                    <i class="fa-solid fa-calendar"></i>
                    <span>${escapeHTML(document.academicYear)}</span>
                </div>
            `
            : "";

        return `
            <article class="document-card" data-document-id="${escapeHTML(document.id)}">

                <div class="document-card-top">

                    <div class="document-card-icon">
                        <i class="fa-solid ${typeInfo.icon}"></i>
                    </div>

                    <button
                        type="button"
                        class="document-delete-button"
                        data-action="delete"
                        data-id="${escapeHTML(document.id)}"
                        aria-label="Delete ${escapeHTML(document.title)}"
                        title="Delete document record"
                    >
                        <i class="fa-solid fa-trash"></i>
                    </button>

                </div>

                <div class="document-card-content">

                    <span class="document-card-type">
                        ${escapeHTML(typeInfo.label)}
                    </span>

                    <h3>${escapeHTML(document.title)}</h3>

                    <div class="document-card-meta">

                        <div class="document-card-meta-item">
                            <i class="fa-solid fa-file"></i>
                            <span>${escapeHTML(document.fileName)}</span>
                        </div>

                        <div class="document-card-meta-item">
                            <i class="fa-solid fa-hard-drive"></i>
                            <span>${escapeHTML(formatFileSize(document.fileSize))}</span>
                        </div>

                        <div class="document-card-meta-item">
                            <i class="fa-solid fa-calendar-days"></i>
                            <span>${escapeHTML(formatDate(document.uploadedAt))}</span>
                        </div>

                        ${yearHTML}

                    </div>

                </div>

                <div class="document-card-footer">

                    <span class="document-verification-status ${statusClass}">
                        <i class="fa-solid ${
                            status === "verified"
                                ? "fa-circle-check"
                                : "fa-clock"
                        }"></i>

                        ${statusLabel}
                    </span>

                    <span class="document-demo-label">
                        Metadata only
                    </span>

                </div>

                <p class="document-card-notice">
                    The file itself is not saved by this frontend demo.
                </p>

            </article>
        `;
    }

    // =====================================================
    // 13. FILTER DOCUMENTS
    // =====================================================

    function getFilteredDocuments() {
        const searchTerm = documentSearch
            ? documentSearch.value.trim().toLowerCase()
            : "";

        const selectedCategory = categoryFilter
            ? categoryFilter.value
            : "all";

        return documents.filter(document => {
            const searchableText = [
                document.title,
                document.fileName,
                document.type,
                getDocumentTypeInfo(document.type).label,
                document.academicYear
            ]
                .join(" ")
                .toLowerCase();

            const matchesSearch = searchableText.includes(searchTerm);

            const matchesCategory =
                selectedCategory === "all" ||
                document.type === selectedCategory;

            return matchesSearch && matchesCategory;
        });
    }

    // =====================================================
    // 14. EMPTY STATE
    // =====================================================

    function showEmptyState(isFiltered) {
        if (documentsGrid) {
            documentsGrid.innerHTML = "";
        }

        if (emptyState) {
            emptyState.hidden = false;
        }

        if (emptyTitle) {
            emptyTitle.textContent = isFiltered
                ? "No matching documents"
                : "Your document locker is empty";
        }

        if (emptyDescription) {
            emptyDescription.textContent = isFiltered
                ? "Try a different search term or document category."
                : "Add a document record using the form above. Actual file storage requires backend integration.";
        }
    }

    function hideEmptyState() {
        if (emptyState) {
            emptyState.hidden = true;
        }
    }

    // =====================================================
    // 15. RENDER DOCUMENTS
    // =====================================================

    function renderDocuments() {
        updateStatistics();

        if (!documentsGrid) {
            console.error(
                "ScholarBridge: documentsGrid element was not found."
            );

            return;
        }

        const filteredDocuments = getFilteredDocuments();

        if (filteredDocuments.length === 0) {
            const isFiltered = documents.length > 0;

            showEmptyState(isFiltered);

            if (documentCount) {
                documentCount.textContent = "0 documents";
            }

            return;
        }

        hideEmptyState();

        documentsGrid.innerHTML = filteredDocuments
            .map(createDocumentCard)
            .join("");

        if (documentCount) {
            const count = filteredDocuments.length;

            documentCount.textContent =
                `${count} ${count === 1 ? "document" : "documents"}`;
        }
    }

    // =====================================================
    // 16. RESET UPLOAD FORM
    // =====================================================

    function resetUploadForm() {
        selectedFile = null;

        if (uploadForm) {
            uploadForm.reset();
        }

        if (documentFile) {
            documentFile.value = "";
        }

        updateFileDisplay(null);
        hideMessage();
    }

    if (uploadForm) {
        uploadForm.addEventListener("reset", () => {
            window.setTimeout(() => {
                selectedFile = null;
                updateFileDisplay(null);
                hideMessage();
            }, 0);
        });
    }

    if (resetFormButton) {
        resetFormButton.addEventListener("click", () => {
            window.setTimeout(() => {
                selectedFile = null;
                updateFileDisplay(null);
                hideMessage();
            }, 0);
        });
    }

    // =====================================================
    // 17. ADD DOCUMENT RECORD
    // =====================================================

    if (uploadForm) {
        uploadForm.addEventListener("submit", event => {
            event.preventDefault();
            hideMessage();

            if (!documentType || !documentType.value) {
                showMessage("Please select a document type.", "error");
                return;
            }

            if (!documentTitle || !documentTitle.value.trim()) {
                showMessage("Please enter a document name.", "error");
                return;
            }

            if (!documentFile || !documentFile.files[0]) {
                showMessage("Please select a document file.", "error");
                return;
            }

            const file = documentFile.files[0];
            const validation = isAllowedFile(file);

            if (!validation.valid) {
                showMessage(validation.message, "error");
                return;
            }

            if (!storageAvailable) {
                showMessage(
                    "Browser storage is unavailable. The document record cannot be saved.",
                    "error"
                );

                return;
            }

            const newDocument = {
                id: (
                    window.crypto &&
                    typeof window.crypto.randomUUID === "function"
                )
                    ? window.crypto.randomUUID()
                    : `doc-${Date.now()}-${Math.random().toString(16).slice(2)}`,

                title: documentTitle.value.trim(),
                type: documentType.value,
                academicYear: academicYear
                    ? academicYear.value
                    : "",

                fileName: file.name,
                fileSize: file.size,

                uploadedAt: new Date().toISOString(),

                // This frontend demo cannot actually verify documents.
                status: "pending"
            };

            documents.unshift(newDocument);

            if (!saveDocuments()) {
                documents.shift();

                showMessage(
                    "Unable to save this demo record in browser storage.",
                    "error"
                );

                return;
            }

            resetUploadForm();
            renderDocuments();

            showMessage(
                "Demo document record added. The actual file was not uploaded or stored.",
                "success"
            );

            console.info(
                "ScholarBridge demo: document metadata saved; file contents were not stored."
            );
        });
    }

    // =====================================================
    // 18. DELETE DOCUMENT RECORD
    // =====================================================

    if (documentsGrid) {
        documentsGrid.addEventListener("click", event => {
            const button = event.target.closest(
                '[data-action="delete"]'
            );

            if (!button) {
                return;
            }

            const documentId = button.dataset.id;

            const documentRecord = documents.find(
                item => item.id === documentId
            );

            if (!documentRecord) {
                return;
            }

            const confirmed = window.confirm(
                `Delete the demo record "${documentRecord.title}"?`
            );

            if (!confirmed) {
                return;
            }

            const previousDocuments = [...documents];

            documents = documents.filter(
                item => item.id !== documentId
            );

            if (!saveDocuments()) {
                documents = previousDocuments;

                showMessage(
                    "Unable to delete the record from browser storage.",
                    "error"
                );

                return;
            }

            renderDocuments();

            showMessage(
                "Demo document record deleted. No uploaded file was stored.",
                "success"
            );
        });
    }

    // =====================================================
    // 19. SEARCH
    // =====================================================

    if (documentSearch) {
        documentSearch.addEventListener("input", renderDocuments);
    }

    // =====================================================
    // 20. CATEGORY FILTER
    // =====================================================

    if (categoryFilter) {
        categoryFilter.addEventListener("change", renderDocuments);
    }

    // =====================================================
    // 21. RESET FILTERS
    // =====================================================

    function resetFilters() {
        if (documentSearch) {
            documentSearch.value = "";
        }

        if (categoryFilter) {
            categoryFilter.value = "all";
        }

        renderDocuments();
    }

    if (resetFiltersButton) {
        resetFiltersButton.addEventListener("click", resetFilters);
    }

    // =====================================================
    // 22. INITIALIZE
    // =====================================================

    loadDocuments();
    renderDocuments();

    console.log("ScholarBridge Document Locker initialized.");
});