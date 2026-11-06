if (!HABS.requirePatient()) {
    throw new Error("redirect");
}

HABS.renderHeader("doctors");

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

HABS.api("/api/doctors")
    .then((doctors) => {
        document.getElementById("all-doctors").innerHTML = doctors.map(doctorCard).join("");
    })
    .catch((error) => {
        document.getElementById("all-doctors").innerHTML = `<p class="message err">${error.message}</p>`;
    });
