if (!HABS.requirePatient()) {
    throw new Error("redirect");
}

HABS.renderHeader("search");

function doctorCard(doctor) {
    return `
        <article class="card">
            <h3>${doctor.name}</h3>
            <p><strong>${doctor.specialization}</strong></p>
            <p>${doctor.qualification || ""}</p>
            <p>${doctor.experience_years || 0} years experience · Fee ₹${doctor.consultation_fee || 0}</p>
            <a class="btn" href="/doctor.html?id=${doctor.id}">View details & book</a>
        </article>
    `;
}

async function runSearch(specialization) {
    const doctors = await HABS.api(`/api/doctors/search?specialization=${encodeURIComponent(specialization)}`);
    if (!doctors.length) {
        HABS.setMessage("search-message", "No doctors found", "err");
        document.getElementById("doctor-results").innerHTML = "";
        return;
    }
    HABS.setMessage("search-message", "Doctor details displayed", "ok");
    document.getElementById("doctor-results").innerHTML = doctors.map(doctorCard).join("");
}

document.getElementById("search-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const specialization = document.getElementById("specialization-input").value.trim();
    location.href = `/search.html?specialization=${encodeURIComponent(specialization)}`;
});

const preset = HABS.queryParam("specialization");
if (preset) {
    document.getElementById("specialization-input").value = preset;
    runSearch(preset).catch((error) => HABS.setMessage("search-message", error.message, "err"));
}
