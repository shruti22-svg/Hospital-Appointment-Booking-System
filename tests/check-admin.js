(async () => {
    const email = `liveadmin${Date.now()}@test.com`;
    const register = await fetch("http://localhost:5000/api/admin/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            name: "Live Admin",
            email,
            password: "Password1"
        })
    });
    const registerData = await register.json();
    const login = await fetch("http://localhost:5000/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: "Password1" })
    });
    const loginData = await login.json();
    const page = await fetch("http://localhost:5000/admin-register.html");
    const html = await page.text();
    console.log("register", register.status, registerData.message);
    console.log("login", login.status, loginData.message, loginData.admin && loginData.admin.email);
    console.log("admin-register page", page.status, html.includes("Admin registration"));
})().catch((error) => {
    console.error(error);
    process.exit(1);
});
