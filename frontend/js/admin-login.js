HABS.renderHeader("admin-login");

if (HABS.queryParam("registered") === "1") {
    HABS.setMessage("banner", "Admin registration successful. Please login.", "ok");
}

if (HABS.getAdmin()) {
    location.href = "/admin.html";
}

document.getElementById("admin-login-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.target);
    try {
        const data = await HABS.api("/api/admin/login", {
            method: "POST",
            body: JSON.stringify({
                email: form.get("email"),
                password: form.get("password")
            })
        });
        HABS.setAdmin(data.admin);
        location.href = "/admin.html";
    } catch (error) {
        HABS.setMessage("admin-login-message", error.message, "err");
    }
});
