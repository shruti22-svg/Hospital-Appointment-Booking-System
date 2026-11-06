HABS.renderHeader("login");

if (HABS.queryParam("registered") === "1") {
    HABS.setMessage("banner", "Registration successful. Please login.", "ok");
}

if (HABS.getPatient()) {
    location.href = "/dashboard.html";
}

document.getElementById("login-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.target);
    try {
        const data = await HABS.api("/api/login", {
            method: "POST",
            body: JSON.stringify({
                email: form.get("email"),
                password: form.get("password")
            })
        });
        HABS.setPatient(data.patient);
        location.href = "/dashboard.html";
    } catch (error) {
        HABS.setMessage("login-message", error.message, "err");
    }
});
