if (!HABS.requireAdmin()) {
    throw new Error("redirect");
}

HABS.renderHeader("admin");

const admin = HABS.getAdmin();
document.getElementById("admin-title").textContent =
    `Admin appointment management — ${admin.name}`;

let allAppointments = [];

function renderRows(rows) {
    if (!rows.length) {
        document.getElementById("admin-table").innerHTML = "<p>No appointments found.</p>";
        return;
    }

    document.getElementById("admin-table").innerHTML = `
        <table id="appointments-grid">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Patient</th>
                    <th>Doctor</th>
                    <th>Specialization</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Status</th>
                    <th>Update</th>
                </tr>
            </thead>
            <tbody>
                ${rows.map((row) => `
                    <tr>
                        <td>${row.id}</td>
                        <td>${row.patient_name}<br><small>${row.patient_email}</small></td>
                        <td>${row.doctor_name}</td>
                        <td>${row.specialization}</td>
                        <td>${row.appointment_date}</td>
                        <td>${row.appointment_time}</td>
                        <td><span class="badge ${row.status}">${row.status}</span></td>
                        <td>
                            <select data-admin-status="${row.id}">
                                <option ${row.status === "Booked" ? "selected" : ""}>Booked</option>
                                <option ${row.status === "Completed" ? "selected" : ""}>Completed</option>
                                <option ${row.status === "Cancelled" ? "selected" : ""}>Cancelled</option>
                            </select>
                        </td>
                    </tr>
                `).join("")}
            </tbody>
        </table>
    `;
}

function applyFilter() {
    const status = document.getElementById("status-filter").value;
    const rows = status
        ? allAppointments.filter((item) => item.status === status)
        : allAppointments;
    renderRows(rows);
}

async function loadAdminAppointments() {
    allAppointments = await HABS.api("/api/admin/appointments");
    const booked = allAppointments.filter((item) => item.status === "Booked").length;
    const cancelled = allAppointments.filter((item) => item.status === "Cancelled").length;
    const completed = allAppointments.filter((item) => item.status === "Completed").length;
    document.getElementById("admin-stats").innerHTML = `
        <div class="stat"><span>Total</span><strong>${allAppointments.length}</strong></div>
        <div class="stat"><span>Booked</span><strong>${booked}</strong></div>
        <div class="stat"><span>Completed</span><strong>${completed}</strong></div>
        <div class="stat"><span>Cancelled</span><strong>${cancelled}</strong></div>
    `;
    applyFilter();
}

async function loadPatients() {
    const patients = await HABS.api("/api/admin/patients");
    if (!patients.length) {
        document.getElementById("patients-table").innerHTML = "<p>No patients registered yet.</p>";
        return;
    }
    document.getElementById("patients-table").innerHTML = `
        <table>
            <thead><tr><th>ID</th><th>Name</th><th>Email</th></tr></thead>
            <tbody>
                ${patients.map((row) => `
                    <tr><td>${row.id}</td><td>${row.name}</td><td>${row.email}</td></tr>
                `).join("")}
            </tbody>
        </table>
    `;
}

async function loadDoctors() {
    const doctors = await HABS.api("/api/doctors");
    document.getElementById("admin-doctors").innerHTML = doctors.map((doctor) => `
        <article class="card">
            <h3>${doctor.name}</h3>
            <p>${doctor.specialization}</p>
            <p>${doctor.qualification || ""}</p>
        </article>
    `).join("");
}

document.getElementById("filter-form").addEventListener("submit", (event) => {
    event.preventDefault();
    applyFilter();
});

document.getElementById("admin-table").addEventListener("change", async (event) => {
    if (!event.target.dataset.adminStatus) {
        return;
    }
    try {
        const data = await HABS.api(`/api/admin/appointments/${event.target.dataset.adminStatus}`, {
            method: "PATCH",
            body: JSON.stringify({ status: event.target.value })
        });
        HABS.setMessage("admin-message", data.message, "ok");
        await loadAdminAppointments();
    } catch (error) {
        HABS.setMessage("admin-message", error.message, "err");
        await loadAdminAppointments();
    }
});

document.getElementById("add-doctor-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.target);
    try {
        const data = await HABS.api("/api/admin/doctors", {
            method: "POST",
            body: JSON.stringify({
                name: form.get("name"),
                specialization: form.get("specialization"),
                qualification: form.get("qualification"),
                experience_years: form.get("experience_years"),
                consultation_fee: form.get("consultation_fee")
            })
        });
        HABS.setMessage("admin-message", data.message, "ok");
        event.target.reset();
        await loadDoctors();
    } catch (error) {
        HABS.setMessage("admin-message", error.message, "err");
    }
});

Promise.all([loadAdminAppointments(), loadPatients(), loadDoctors()]).catch((error) => {
    HABS.setMessage("admin-message", error.message, "err");
});
