const pages = [
    "/",
    "/register.html",
    "/login.html",
    "/dashboard.html",
    "/search.html",
    "/doctors.html",
    "/doctor.html",
    "/appointments.html",
    "/admin-login.html",
    "/admin.html",
    "/confirmation.html"
];

(async () => {
    for (const page of pages) {
        const response = await fetch(`http://localhost:5000${page}`);
        const text = await response.text();
        const title = (text.match(/<title>([^<]+)/) || [])[1];
        console.log(
            response.status,
            page,
            "|",
            title,
            "| register-form:",
            text.includes('id="register-form"'),
            "| login-form:",
            text.includes('id="login-form"'),
            "| welcome:",
            text.includes('id="welcome-title"'),
            "| admin-table:",
            text.includes('id="admin-table"')
        );
        if (!response.ok) {
            throw new Error(`${page} failed`);
        }
    }

    const email = `flow${Date.now()}@test.com`;
    const register = await fetch("http://localhost:5000/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            name: "Flow User",
            email,
            password: "Password1"
        })
    });
    const registerData = await register.json();
    const login = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: "Password1" })
    });
    const loginData = await login.json();
    console.log("register", register.status, registerData.message);
    console.log("login", login.status, loginData.message);
})().catch((error) => {
    console.error(error);
    process.exit(1);
});
