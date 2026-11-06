if (!HABS.requirePatient()) {
    throw new Error("redirect");
}

HABS.renderHeader("doctors");

const doctorId = HABS.queryParam("id");
const patient = HABS.getPatient();
let selectedSlot = null;

if (!doctorId) {
    location.href = "/doctors.html";
}

async function loadSlots() {
    const date = document.getElementById("book-date").value;
    const data = await HABS.api(`/api/doctors/${doctorId}/slots?date=${date}`);
    document.getElementById("slot-list").innerHTML = data.slots.map((slot) => `
        <button type="button" class="slot ${selectedSlot === slot.time ? "selected" : ""}"
            data-slot="${slot.time}" ${slot.available ? "" : "disabled"}>
            ${slot.time}${slot.available ? "" : " (occupied)"}
        </button>
    `).join("");
}

async function loadDoctor() {
    const doctor = await HABS.api(`/api/doctors/${doctorId}`);
    document.getElementById("book-title").textContent = `${doctor.name} — ${doctor.specialization}`;
    document.getElementById("doctor-detail").innerHTML = `
        <h2>Doctor details displayed</h2>
        <p><strong>Name:</strong> ${doctor.name}</p>
        <p><strong>Specialization:</strong> ${doctor.specialization}</p>
        <p><strong>Qualification:</strong> ${doctor.qualification || "-"}</p>
        <p><strong>Experience:</strong> ${doctor.experience_years || 0} years</p>
        <p><strong>Consultation fee:</strong> ₹${doctor.consultation_fee || 0}</p>
    `;
    const dateInput = document.getElementById("book-date");
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    dateInput.min = tomorrow.toISOString().slice(0, 10);
    if (!dateInput.value) {
        dateInput.value = dateInput.min;
    }
    await loadSlots();
}

document.getElementById("slot-list").addEventListener("click", (event) => {
    const button = event.target.closest("[data-slot]");
    if (!button || button.disabled) {
        return;
    }
    selectedSlot = button.dataset.slot;
    document.getElementById("selected-slot").value = selectedSlot;
    loadSlots().catch(() => {});
});

document.getElementById("book-date").addEventListener("change", () => {
    selectedSlot = null;
    document.getElementById("selected-slot").value = "";
    loadSlots().catch((error) => HABS.setMessage("book-message", error.message, "err"));
});

document.getElementById("book-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!selectedSlot) {
        HABS.setMessage("book-message", "Select an available slot first", "err");
        return;
    }

    const date = document.getElementById("book-date").value;
    try {
        const data = await HABS.api("/api/appointments", {
            method: "POST",
            body: JSON.stringify({
                patient_id: patient.id,
                doctor_id: Number(doctorId),
                appointment_date: date,
                appointment_time: selectedSlot
            })
        });
        const doctorName = encodeURIComponent(data.appointment.doctor_name);
        location.href = `/confirmation.html?id=${data.appointment.id}&date=${date}&time=${selectedSlot}&doctor=${doctorName}`;
    } catch (error) {
        HABS.setMessage("book-message", error.message, "err");
        await loadSlots();
    }
});

loadDoctor().catch((error) => {
    document.getElementById("doctor-detail").innerHTML = `<p class="message err">${error.message}</p>`;
});
