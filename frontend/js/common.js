const API = location.protocol === "file:" ? "http://localhost:5000" : "";

function getPatient() {
    try {
        return JSON.parse(localStorage.getItem("habs_user") || "null");
    } catch (error) {
        return null;
    }
}

function getAdmin() {
    try {
        return JSON.parse(localStorage.getItem("habs_admin") || "null");
    } catch (error) {
        return null;
    }
}

function setPatient(patient) {
    localStorage.setItem("habs_user", JSON.stringify(patient));
    localStorage.removeItem("habs_admin");
}

function setAdmin(admin) {
    localStorage.setItem("habs_admin", JSON.stringify(admin));
    localStorage.removeItem("habs_user");
}

function logout() {
    localStorage.removeItem("habs_user");
    localStorage.removeItem("habs_admin");
    location.href = "/index.html";
}

function queryParam(name) {
    return new URLSearchParams(location.search).get(name);
}

function requirePatient() {
    if (!getPatient()) {
        location.href = "/login.html";
        return false;
    }
    return true;
}

function requireAdmin() {
    if (!getAdmin()) {
        location.href = "/admin-login.html";
        return false;
    }
    return true;
}

async function api(path, options = {}) {
    const response = await fetch(`${API}${path}`, {
        headers: { "Content-Type": "application/json", ...(options.headers || {}) },
        ...options
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        const error = new Error(data.message || "Request failed");
        error.status = response.status;
        error.data = data;
        throw error;
    }
    return data;
}

function setMessage(id, text, type) {
    const el = document.getElementById(id);
    if (!el) {
        return;
    }
    el.textContent = text || "";
    el.className = `message ${type || ""}`;
}

function renderHeader(active) {
    const patient = getPatient();
    const admin = getAdmin();
    const header = document.getElementById("site-header");
    if (!header) {
        return;
    }

    const links = admin
        ? `
                <a class="${active === "admin" ? "active" : ""}" href="/admin.html">Admin appointments</a>
                <a class="${active === "doctors" ? "active" : ""}" href="/doctors.html">Doctors</a>
              `
        : patient
            ? `
                <a class="${active === "dashboard" ? "active" : ""}" href="/dashboard.html">Dashboard</a>
                <a class="${active === "doctors" ? "active" : ""}" href="/doctors.html">Doctor details</a>
                <a class="${active === "search" ? "active" : ""}" href="/search.html">Search doctors</a>
                <a class="${active === "appointments" ? "active" : ""}" href="/appointments.html">My appointments</a>
              `
            : `
                <a class="${active === "register" ? "active" : ""}" href="/register.html">Patient register</a>
                <a class="${active === "login" ? "active" : ""}" href="/login.html">Patient login</a>
                <a class="${active === "admin-register" ? "active" : ""}" href="/admin-register.html">Admin register</a>
                <a class="${active === "admin-login" ? "active" : ""}" href="/admin-login.html">Admin login</a>
              `;

    header.innerHTML = `
        <div class="brand">
            <a class="logo" href="/index.html">+</a>
            <div>
                <strong><a href="/index.html">CareSlot Hospital</a></strong>
                <small>Appointment Booking System</small>
            </div>
        </div>
        <nav class="nav">
            ${links}
            ${patient || admin ? `<button class="ghost" id="logout-btn" type="button">Logout</button>` : ""}
        </nav>
    `;

    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", logout);
    }
}

window.HABS = {
    API,
    getPatient,
    getAdmin,
    setPatient,
    setAdmin,
    logout,
    queryParam,
    requirePatient,
    requireAdmin,
    api,
    setMessage,
    renderHeader
};
