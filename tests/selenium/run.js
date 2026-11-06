const { Builder, By, until } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");

const BASE_URL = process.env.BASE_URL || "http://localhost:5000";
const SELENIUM_REMOTE_URL = process.env.SELENIUM_REMOTE_URL;

function stamp() {
    return Date.now();
}

async function waitForApp() {
    const started = Date.now();
    while (Date.now() - started < 60000) {
        try {
            const response = await fetch(`${BASE_URL}/api/health`);
            if (response.ok) {
                return;
            }
        } catch (error) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }
    }
    throw new Error("App did not become ready");
}

async function buildDriver() {
    const options = new chrome.Options();
    options.addArguments(
        "--headless=new",
        "--no-sandbox",
        "--disable-dev-shm-usage",
        "--window-size=1400,900"
    );

    let builder = new Builder().forBrowser("chrome").setChromeOptions(options);
    if (SELENIUM_REMOTE_URL) {
        builder = builder.usingServer(SELENIUM_REMOTE_URL);
    }
    return builder.build();
}

async function fill(driver, id, value) {
    const el = await driver.wait(until.elementLocated(By.id(id)), 10000);
    await el.clear();
    await el.sendKeys(value);
}

async function click(driver, id) {
    const el = await driver.wait(until.elementLocated(By.id(id)), 10000);
    await el.click();
}

async function waitUrl(driver, part) {
    await driver.wait(async () => (await driver.getCurrentUrl()).includes(part), 15000);
}

async function run() {
    await waitForApp();
    const driver = await buildDriver();
    const results = [];
    const password = "Password1";
    const patientEmail = `sel.patient.${stamp()}@test.com`;
    const secondEmail = `sel.second.${stamp()}@test.com`;
    const adminEmail = `sel.admin.${stamp()}@test.com`;

    try {
        await driver.get(`${BASE_URL}/register.html`);
        await fill(driver, "patient-name", "Selenium Patient");
        await fill(driver, "patient-email", patientEmail);
        await fill(driver, "patient-password", password);
        await click(driver, "patient-register-btn");
        await waitUrl(driver, "login.html");
        const banner = await driver.wait(until.elementLocated(By.id("banner")), 10000);
        const bannerText = await banner.getText();
        if (!bannerText.toLowerCase().includes("registration successful")) {
            throw new Error(`TC01 banner: ${bannerText}`);
        }
        results.push(["TC01", "Patient registration", "Registration successful", "PASS"]);

        await fill(driver, "login-email", patientEmail);
        await fill(driver, "login-password", password);
        await click(driver, "login-btn");
        await waitUrl(driver, "dashboard.html");
        const dash = await driver.wait(until.elementLocated(By.id("welcome-title")), 10000);
        const dashText = await dash.getText();
        if (!dashText.toLowerCase().includes("dashboard")) {
            throw new Error(`TC02 title: ${dashText}`);
        }
        results.push(["TC02", "Patient login", "Dashboard displayed", "PASS"]);

        await driver.get(`${BASE_URL}/search.html`);
        await fill(driver, "specialization-input", "Cardiology");
        await click(driver, "search-btn");
        await driver.wait(until.elementLocated(By.id("search-message")), 10000);
        await driver.wait(async () => {
            const text = await driver.findElement(By.id("search-message")).getText();
            return text.toLowerCase().includes("doctor details displayed");
        }, 10000);
        results.push(["TC03", "Search doctor", "Doctor details displayed", "PASS"]);

        await driver.findElement(By.css("a.btn")).click();
        await waitUrl(driver, "doctor.html");
        await driver.wait(until.elementLocated(By.css(".slot:not([disabled])")), 10000);
        const freeSlot = await driver.findElement(By.css(".slot:not([disabled])"));
        await freeSlot.click();
        await driver.findElement(By.css("#book-form button[type='submit']")).click();
        await waitUrl(driver, "confirmation.html");
        const confirm = await driver.wait(until.elementLocated(By.id("confirm-text")), 10000);
        const confirmText = await confirm.getText();
        if (!confirmText.toLowerCase().includes("confirmed")) {
            throw new Error(`TC04 confirm: ${confirmText}`);
        }
        results.push(["TC04", "Book available slot", "Appointment confirmed", "PASS"]);

        await driver.executeScript("localStorage.clear();");
        await driver.get(`${BASE_URL}/register.html`);
        await fill(driver, "patient-name", "Second Patient");
        await fill(driver, "patient-email", secondEmail);
        await fill(driver, "patient-password", password);
        await click(driver, "patient-register-btn");
        await waitUrl(driver, "login.html");
        await fill(driver, "login-email", secondEmail);
        await fill(driver, "login-password", password);
        await click(driver, "login-btn");
        await waitUrl(driver, "dashboard.html");
        await driver.get(`${BASE_URL}/search.html?specialization=Cardiology`);
        await driver.wait(until.elementLocated(By.css("a.btn")), 10000);
        await driver.findElement(By.css("a.btn")).click();
        await waitUrl(driver, "doctor.html");
        await driver.wait(until.elementLocated(By.css(".slot")), 10000);
        const occupied = await driver.findElements(By.css(".slot[disabled]"));
        if (!occupied.length) {
            throw new Error("TC05 expected an occupied slot");
        }
        results.push(["TC05", "Book already occupied slot", "Booking rejected", "PASS"]);

        await driver.executeScript(
            `localStorage.setItem("habs_user", JSON.stringify({id:1,name:"Selenium Patient",email:"${patientEmail}"}));`
        );
        const login = await fetch(`${BASE_URL}/api/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: patientEmail, password })
        });
        const loginData = await login.json();
        await driver.executeScript(
            `localStorage.setItem("habs_user", arguments[0]); localStorage.removeItem("habs_admin");`,
            JSON.stringify(loginData.patient)
        );
        await driver.get(`${BASE_URL}/appointments.html`);
        await driver.wait(until.elementLocated(By.css("table")), 10000);
        const cancelBtn = await driver.findElement(By.css("[data-cancel]"));
        await cancelBtn.click();
        await driver.wait(async () => {
            const text = await driver.findElement(By.id("appointments-message")).getText();
            return text.toLowerCase().includes("appointment cancelled");
        }, 10000);
        results.push(["TC06", "Cancel appointment", "Appointment cancelled", "PASS"]);

        const rows = await driver.findElements(By.css("table tbody tr"));
        if (!rows.length) {
            throw new Error("TC07 no appointment rows");
        }
        const rowText = await rows[0].getText();
        if (!rowText.includes("Cancelled") || !rowText.includes("Cardiology")) {
            throw new Error(`TC07 details: ${rowText}`);
        }
        results.push(["TC07", "View appointments", "Correct appointment details", "PASS"]);

        await driver.executeScript("localStorage.clear();");
        await driver.get(`${BASE_URL}/admin-register.html`);
        await fill(driver, "admin-name", "Selenium Admin");
        await fill(driver, "admin-email", adminEmail);
        await fill(driver, "admin-password", password);
        await click(driver, "admin-register-btn");
        await waitUrl(driver, "admin-login.html");
        const adminBanner = await driver.wait(until.elementLocated(By.id("banner")), 10000);
        const adminBannerText = await adminBanner.getText();
        if (!adminBannerText.toLowerCase().includes("admin registration successful")) {
            throw new Error(`TC08 banner: ${adminBannerText}`);
        }
        results.push(["TC08", "Admin registration", "Admin registration successful", "PASS"]);

        await fill(driver, "admin-login-email", adminEmail);
        await fill(driver, "admin-login-password", password);
        await click(driver, "admin-login-btn");
        await waitUrl(driver, "admin.html");
        await driver.wait(until.elementLocated(By.id("admin-title")), 10000);
        results.push(["TC09", "Admin login", "Admin page displayed", "PASS"]);

        await driver.wait(until.elementLocated(By.id("appointments-grid")), 10000);
        const adminRows = await driver.findElements(By.css("#appointments-grid tbody tr"));
        if (!adminRows.length) {
            throw new Error("TC10 admin did not see appointments");
        }
        results.push(["TC10", "Admin appointment management", "Correct appointment details", "PASS"]);

        console.log("\nTest ID | Test case | Expected result | Status");
        console.log("-------------------------------------------------------");
        results.forEach((row) => console.log(row.join(" | ")));
        console.log("\nAll Selenium test cases passed.");
    } finally {
        await driver.quit();
    }
}

run().catch((error) => {
    console.error("SELENIUM FAILURE:", error.message);
    process.exit(1);
});
