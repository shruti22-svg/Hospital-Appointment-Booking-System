HABS.renderHeader("admin-register");

document.getElementById("admin-register-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.target);
    try {
        await HABS.api("/api/admin/register", {
            method: "POST",
            body: JSON.stringify({
                name: form.get("name"),
                email: form.get("email"),
                password: form.get("password")
            })
        });
        location.href = "/admin-login.html?registered=1";
    } catch (error) {
        HABS.setMessage("admin-register-message", error.message, "err");
    }
});
