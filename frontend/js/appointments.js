if (!HABS.requirePatient()) {
    throw new Error("redirect");
}

HABS.renderHeader("appointments");

const patient = HABS.getPatient();

function renderRows(rows) {
    if (!rows.length) {
        document.getElementById("appointments-table").innerHTML = "<p>No appointments found.</p>";
        return;
    }

    document.getElementById("appointments-table").innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Doctor</th>
                    <th>Specialization</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Status</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
                ${rows.map((row) => `
                    <tr>
                        <td>${row.id}</td>
                        <td>${row.doctor_name}</td>
                        <td>${row.specialization}</td>
                        <td>${row.appointment_date}</td>
                        <td>${row.appointment_time}</td>
                        <td><span class="badge ${row.status}">${row.status}</span></td>
                        <td>
                            ${row.status === "Booked"
                                ? `<button class="danger" data-cancel="${row.id}">Cancel</button>`
                                : "-"}
                        </td>
                    </tr>
                `).join("")}
            </tbody>
        </table>
    `;
}

async function loadAppointments() {
    const rows = await HABS.api(`/api/appointments/patient/${patient.id}`);
    renderRows(rows);
}

document.getElementById("appointments-table").addEventListener("click", async (event) => {
    const button = event.target.closest("[data-cancel]");
    if (!button) {
        return;
    }
    try {
        const data = await HABS.api(`/api/appointments/${button.dataset.cancel}/cancel`, {
            method: "POST",
            body: JSON.stringify({ patient_id: patient.id })
        });
        HABS.setMessage("appointments-message", data.message, "ok");
        await loadAppointments();
    } catch (error) {
        HABS.setMessage("appointments-message", error.message, "err");
    }
});

if (HABS.queryParam("cancelled") === "1") {
    HABS.setMessage("appointments-message", "Appointment cancelled", "ok");
}

loadAppointments().catch((error) => {
    HABS.setMessage("appointments-message", error.message, "err");
});
