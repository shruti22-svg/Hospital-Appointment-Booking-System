if (!HABS.requirePatient()) {
    throw new Error("redirect");
}

HABS.renderHeader("dashboard");

const patient = HABS.getPatient();
document.getElementById("welcome-title").textContent = `Dashboard displayed — Welcome, ${patient.name}`;

async function loadDashboard() {
    const [doctors, appointments] = await Promise.all([
        HABS.api("/api/doctors"),
        HABS.api(`/api/appointments/patient/${patient.id}`)
    ]);
    const booked = appointments.filter((item) => item.status === "Booked").length;
    document.getElementById("dashboard-stats").innerHTML = `
        <div class="stat"><span>Doctors</span><strong>${doctors.length}</strong></div>
        <div class="stat"><span>Your bookings</span><strong>${appointments.length}</strong></div>
        <div class="stat"><span>Active</span><strong>${booked}</strong></div>
    `;
}

loadDashboard().catch((error) => {
    document.getElementById("dashboard-stats").innerHTML = `<p class="message err">${error.message}</p>`;
});
