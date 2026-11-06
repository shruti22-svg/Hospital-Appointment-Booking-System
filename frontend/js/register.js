HABS.renderHeader("register");

document.getElementById("register-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.target);
    try {
        await HABS.api("/api/register", {
            method: "POST",
            body: JSON.stringify({
                name: form.get("name"),
                email: form.get("email"),
                password: form.get("password")
            })
        });
        location.href = "/login.html?registered=1";
    } catch (error) {
        HABS.setMessage("register-message", error.message, "err");
    }
});
