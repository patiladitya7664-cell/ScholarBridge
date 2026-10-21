"use strict";

const API = "http://localhost:5000/api";
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];

let scholarships = [];
let applications = [];

function getToken() {
    return localStorage.getItem("scholarBridgeToken") ||
           localStorage.getItem("token") || "";
}

function getUser() {
    try {
        return JSON.parse(
            localStorage.getItem("ScholarBridgeeCurrentUser") ||
            localStorage.getItem("user") || "null"
        );
    } catch {
        return null;
    }
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;",
        '"': "&quot;", "'": "&#39;"
    })[character]);
}

async function api(endpoint, options = {}) {
    const headers = new Headers(options.headers || {});
    headers.set("Authorization", `Bearer ${getToken()}`);

    if (options.body) {
        headers.set("Content-Type", "application/json");
    }

    const response = await fetch(API + endpoint, {
        ...options,
        headers
    });

    const data = response.status === 204
        ? { success: true }
        : await response.json().catch(() => ({}));

    if (!response.ok || data.success === false) {
        throw new Error(data.message || `Request failed: ${response.status}`);
    }

    return data;
}

function listFrom(data, keys) {
    if (Array.isArray(data)) return data;

    for (const key of keys) {
        if (Array.isArray(data?.[key])) return data[key];
    }

    if (data?.data) return listFrom(data.data, keys);

    return [];
}

function recordId(item) {
    return item?._id || item?.id || item?.scholarshipId || "";
}

function scholarshipName(item) {
    return item?.title || item?.name || item?.scholarshipName || "Untitled";
}

function applicationStatus(item) {
    return item?.status || "Pending";
}

function showMessage(message, type = "") {
    const element = $("#globalMessage");
    element.textContent = message;
    element.className = type;
}

function makeTable(headers, rows, emptyMessage) {
    if (!rows.length) {
        return `<p class="empty">${escapeHTML(emptyMessage)}</p>`;
    }

    return `<table>
        <thead><tr>${headers.map(h => `<th>${escapeHTML(h)}</th>`).join("")}</tr></thead>
        <tbody>${rows.join("")}</tbody>
    </table>`;
}

function dateText(value) {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? escapeHTML(value) : date.toLocaleDateString();
}

function badge(status) {
    return `<span class="badge">${escapeHTML(status || "Pending")}</span>`;
}

function renderStats() {
    $("#statScholarships").textContent = scholarships.length;
    $("#statApplications").textContent = applications.length;

    $("#statPending").textContent = applications.filter(item =>
        ["pending", "under review"].includes(
            applicationStatus(item).toLowerCase()
        )
    ).length;

    $("#statApproved").textContent = applications.filter(item =>
        applicationStatus(item).toLowerCase() === "approved"
    ).length;
}

function renderScholarships() {
    $("#scholarshipTable").innerHTML = makeTable(
        ["Scholarship", "Provider", "Amount", "Deadline", "Status", "Actions"],
        scholarships.map(item => `
            <tr>
                <td>${escapeHTML(scholarshipName(item))}</td>
                <td>${escapeHTML(item.provider || item.organization || "—")}</td>
                <td>${escapeHTML(item.amount || item.awardAmount || "—")}</td>
                <td>${dateText(item.deadline)}</td>
                <td>${badge(item.status || "Active")}</td>
                <td>
                    <button class="btn secondary small-btn"
                        data-edit="${escapeHTML(recordId(item))}">Edit</button>
                    <button class="btn danger small-btn"
                        data-delete="${escapeHTML(recordId(item))}">Delete</button>
                </td>
            </tr>
        `),
        "No scholarships found. Use Add Scholarship to create one."
    );
}

function renderApplications() {
    const query = ($("#applicationSearch")?.value || "").toLowerCase().trim();

    const filtered = applications.filter(item => {
        const name = item.fullName || item.name || item.email || "";
        const scholarship = item.scholarshipName || "";
        return `${name} ${scholarship} ${item.status || ""}`
            .toLowerCase().includes(query);
    });

    $("#applicationTable").innerHTML = makeTable(
        ["Student", "Scholarship", "Email", "Submitted", "Status", "Update status"],
        filtered.map(item => {
            const id = recordId(item);
            const name = item.fullName || item.name || "Student";
            const status = applicationStatus(item);

            return `
                <tr>
                    <td>${escapeHTML(name)}</td>
                    <td>${escapeHTML(item.scholarshipName || "—")}</td>
                    <td>${escapeHTML(item.email || "—")}</td>
                    <td>${dateText(item.createdAt)}</td>
                    <td>${badge(status)}</td>
                    <td>
                        <select data-status="${escapeHTML(id)}">
                            ${["Pending","Under Review","Approved","Rejected","Completed"]
                                .map(s => `<option ${s === status ? "selected" : ""}>${s}</option>`)
                                .join("")}
                        </select>
                        <button class="btn primary small-btn"
                            data-save-status="${escapeHTML(id)}">Save</button>
                    </td>
                </tr>
            `;
        }),
        "No applications found."
    );
}

function renderDocuments() {
    const rows = [];

    applications.forEach(application => {
        const docs = application.documentDetails || application.documents || [];

        if (Array.isArray(docs)) {
            docs.forEach(doc => {
                rows.push(`
                    <tr>
                        <td>${escapeHTML(application.fullName || application.name || "Student")}</td>
                        <td>${escapeHTML(application.scholarshipName || "—")}</td>
                        <td>${escapeHTML(doc.originalName || doc.originalname || doc.name || doc.filename || "Document")}</td>
                        <td>${doc.url || doc.path
                            ? `<a href="${escapeHTML(doc.url || doc.path)}" target="_blank" rel="noopener noreferrer">Open file</a>`
                            : "No file URL returned"}</td>
                    </tr>
                `);
            });
        }
    });

    $("#documentTable").innerHTML = makeTable(
        ["Student", "Scholarship", "Document", "File"],
        rows,
        "No document metadata was returned by the applications API."
    );
}

function renderRecent() {
    const recent = [...applications]
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        .slice(0, 5);

    $("#recentApplications").innerHTML = makeTable(
        ["Student", "Scholarship", "Date", "Status"],
        recent.map(item => `
            <tr>
                <td>${escapeHTML(item.fullName || item.name || "Student")}</td>
                <td>${escapeHTML(item.scholarshipName || "—")}</td>
                <td>${dateText(item.createdAt)}</td>
                <td>${badge(applicationStatus(item))}</td>
            </tr>
        `),
        "No applications have been returned by the API."
    );
}

async function loadData() {
    showMessage("Loading data...");

    const results = await Promise.allSettled([
        api("/scholarships"),
        api("/applications")
    ]);

    if (results[0].status === "fulfilled") {
        scholarships = listFrom(results[0].value, ["scholarships", "results"]);
    } else {
        scholarships = [];
    }

    if (results[1].status === "fulfilled") {
        applications = listFrom(results[1].value, ["applications", "results"]);
    } else {
        applications = [];
    }

    renderStats();
    renderScholarships();
    renderApplications();
    renderDocuments();
    renderRecent();

    const errors = results
        .filter(result => result.status === "rejected")
        .map(result => result.reason.message);

    showMessage(errors.length
        ? "Some data could not be loaded: " + errors.join(" | ")
        : "Dashboard data refreshed successfully."
    );
}

function setView(name) {
    $$(".view").forEach(view =>
        view.classList.toggle("active", view.id === `view-${name}`)
    );

    $$(".nav-item").forEach(button =>
        button.classList.toggle("active", button.dataset.view === name)
    );

    const titles = {
        overview: "Overview",
        scholarships: "Scholarships",
        applications: "Applications",
        documents: "Document Review"
    };

    $("#pageTitle").textContent = titles[name] || "Admin";
    $("#sidebar").classList.remove("open");
}

function openScholarship(item = null) {
    $("#scholarshipForm").reset();

    $("#scholarshipId").value = item ? recordId(item) : "";
    $("#dialogTitle").textContent = item ? "Edit Scholarship" : "Add Scholarship";

    $("#title").value = item ? scholarshipName(item) : "";
    $("#provider").value = item?.provider || item?.organization || "";
    $("#category").value = item?.category || "";
    $("#educationLevel").value = item?.educationLevel || "";
    $("#amount").value = item?.amount || item?.awardAmount || "";
    $("#deadline").value = item?.deadline?.slice(0, 10) || "";
    $("#status").value = item?.status || "Active";
    $("#description").value = item?.description || "";
    $("#eligibility").value = item?.eligibility || item?.eligibilityCriteria || "";
    $("#requiredDocuments").value = Array.isArray(item?.requiredDocuments)
        ? item.requiredDocuments.join(", ")
        : "";
    $("#applicationUrl").value = item?.applicationUrl || item?.website || "";
    $("#scholarshipMessage").textContent = "";

    $("#scholarshipDialog").showModal();
}

async function saveScholarship(event) {
    event.preventDefault();

    const id = $("#scholarshipId").value;

    const body = {
        title: $("#title").value.trim(),
        name: $("#title").value.trim(),
        provider: $("#provider").value.trim(),
        organization: $("#provider").value.trim(),
        category: $("#category").value.trim(),
        educationLevel: $("#educationLevel").value.trim(),
        amount: $("#amount").value.trim(),
        deadline: $("#deadline").value || null,
        status: $("#status").value,
        description: $("#description").value.trim(),
        eligibility: $("#eligibility").value.trim(),
        requiredDocuments: $("#requiredDocuments").value
            .split(",").map(value => value.trim()).filter(Boolean),
        applicationUrl: $("#applicationUrl").value.trim()
    };

    try {
        await api(
            id ? `/scholarships/${encodeURIComponent(id)}` : "/scholarships",
            {
                method: id ? "PUT" : "POST",
                body: JSON.stringify(body)
            }
        );

        $("#scholarshipDialog").close();
        await loadData();

    } catch (error) {
        $("#scholarshipMessage").textContent = error.message;
    }
}

async function deleteScholarship(id) {
    if (!id || !confirm("Are you sure you want to delete this scholarship?")) {
        return;
    }

    try {
        await api(`/scholarships/${encodeURIComponent(id)}`, {
            method: "DELETE"
        });
        await loadData();
    } catch (error) {
        showMessage(error.message);
    }
}

async function updateStatus(id) {
    const select = document.querySelector(`[data-status="${CSS.escape(id)}"]`);
    if (!select || !id) return;

    try {
        await api(`/applications/${encodeURIComponent(id)}/status`, {
            method: "PUT",
            body: JSON.stringify({ status: select.value })
        });

        await loadData();
    } catch (error) {
        showMessage(
            "Status update failed. Check the backend application status route: " +
            error.message
        );
    }
}

const user = getUser();

if (!getToken() || !user || user.role !== "admin") {
    window.location.replace("login.html");
} else {
    $("#adminName").textContent = user.fullName || user.email || "Administrator";
    loadData().catch(error => showMessage(error.message));
}

$$(".nav-item").forEach(button => {
    button.addEventListener("click", () => setView(button.dataset.view));
});

$("#refreshButton").addEventListener("click", () => loadData());
$("#addScholarshipButton").addEventListener("click", () => openScholarship());
$("#closeDialog").addEventListener("click", () => $("#scholarshipDialog").close());
$("#scholarshipForm").addEventListener("submit", saveScholarship);
$("#applicationSearch").addEventListener("input", renderApplications);
$("#menuButton").addEventListener("click", () => $("#sidebar").classList.toggle("open"));

$("#logoutButton").addEventListener("click", () => {
    ["token", "scholarBridgeToken", "authToken", "jwtToken",
     "user", "ScholarBridgeeCurrentUser"]
        .forEach(key => localStorage.removeItem(key));

    window.location.href = "login.html";
});

document.addEventListener("click", event => {
    const edit = event.target.closest("[data-edit]");
    const remove = event.target.closest("[data-delete]");
    const saveStatus = event.target.closest("[data-save-status]");

    if (edit) {
        const item = scholarships.find(s => recordId(s) === edit.dataset.edit);
        if (item) openScholarship(item);
    }

    if (remove) deleteScholarship(remove.dataset.delete);
    if (saveStatus) updateStatus(saveStatus.dataset.saveStatus);
});
