const path = require("path");
const os = require("os");
const fs = require("fs");
const { spawn } = require("child_process");

const PORT = 5055;
const dbFile = path.join(os.tmpdir(), `hospital-test-${Date.now()}.db`);
const base = `http://127.0.0.1:${PORT}`;

function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

async function waitForServer() {
    const started = Date.now();
    while (Date.now() - started < 15000) {
        try {
            const response = await fetch(`${base}/api/health`);
            if (response.ok) {
                return;
            }
        } catch (error) {
            await new Promise((resolve) => setTimeout(resolve, 200));
        }
    }
    throw new Error("Server did not start in time");
}

async function json(pathName, options = {}) {
    const response = await fetch(`${base}${pathName}`, {
        headers: { "Content-Type": "application/json", ...(options.headers || {}) },
        ...options
    });
    const data = await response.json().catch(() => ({}));
    return { status: response.status, data };
}

async function run() {
    const results = [];
    const email = `patient${Date.now()}@test.com`;
    const password = "Password1";
    let patientId;
    let doctorId;
    let appointmentId;
    const date = new Date();
    date.setDate(date.getDate() + 2);
    const appointmentDate = date.toISOString().slice(0, 10);
    const time = "10:00";

    const tc01 = await json("/api/register", {
        method: "POST",
        body: JSON.stringify({ name: "Test Patient", email, password })
    });
    assert(tc01.status === 201, "TC01 expected 201");
    assert(tc01.data.message === "Registration successful", "TC01 message");
    patientId = tc01.data.patientId;
    results.push(["TC01", "Patient registration", "Registration successful", "PASS"]);

    const tc02 = await json("/api/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
    });
    assert(tc02.status === 200, "TC02 expected 200");
    assert(tc02.data.patient && tc02.data.patient.id === patientId, "TC02 dashboard user");
    results.push(["TC02", "Patient login", "Dashboard displayed", "PASS"]);

    const tc03 = await json("/api/doctors/search?specialization=Cardiology");
    assert(tc03.status === 200, "TC03 expected 200");
    assert(Array.isArray(tc03.data) && tc03.data.length > 0, "TC03 doctors displayed");
    assert(tc03.data[0].name && tc03.data[0].specialization, "TC03 doctor details");
    doctorId = tc03.data[0].id;
    results.push(["TC03", "Search doctor", "Doctor details displayed", "PASS"]);

    const tc04 = await json("/api/appointments", {
        method: "POST",
        body: JSON.stringify({
            patient_id: patientId,
            doctor_id: doctorId,
            appointment_date: appointmentDate,
            appointment_time: time
        })
    });
    assert(tc04.status === 201, "TC04 expected 201");
    assert(tc04.data.message === "Appointment confirmed", "TC04 confirmed");
    appointmentId = tc04.data.appointment.id;
    results.push(["TC04", "Book available slot", "Appointment confirmed", "PASS"]);

    const otherEmail = `second${Date.now()}@test.com`;
    const other = await json("/api/register", {
        method: "POST",
        body: JSON.stringify({ name: "Second Patient", email: otherEmail, password })
    });
    const tc05 = await json("/api/appointments", {
        method: "POST",
        body: JSON.stringify({
            patient_id: other.data.patientId,
            doctor_id: doctorId,
            appointment_date: appointmentDate,
            appointment_time: time
        })
    });
    assert(tc05.status === 409, "TC05 expected 409");
    assert(tc05.data.message === "Booking rejected", "TC05 rejected");
    results.push(["TC05", "Book already occupied slot", "Booking rejected", "PASS"]);

    const tc06 = await json(`/api/appointments/${appointmentId}/cancel`, {
        method: "POST",
        body: JSON.stringify({ patient_id: patientId })
    });
    assert(tc06.status === 200, "TC06 expected 200");
    assert(tc06.data.message === "Appointment cancelled", "TC06 cancelled");
    results.push(["TC06", "Cancel appointment", "Appointment cancelled", "PASS"]);

    const tc07 = await json(`/api/appointments/patient/${patientId}`);
    assert(tc07.status === 200, "TC07 expected 200");
    const viewed = tc07.data.find((row) => row.id === appointmentId);
    assert(viewed, "TC07 appointment present");
    assert(viewed.doctor_name, "TC07 doctor name");
    assert(viewed.appointment_date === appointmentDate, "TC07 date");
    assert(viewed.appointment_time === time, "TC07 time");
    assert(viewed.status === "Cancelled", "TC07 status");
    results.push(["TC07", "View appointments", "Correct appointment details", "PASS"]);

    const adminEmail = `admin${Date.now()}@test.com`;
    const tc08 = await json("/api/admin/register", {
        method: "POST",
        body: JSON.stringify({
            name: "Test Admin",
            email: adminEmail,
            password
        })
    });
    assert(tc08.status === 201, "TC08 expected 201");
    assert(tc08.data.message === "Admin registration successful", "TC08 message");
    results.push(["TC08", "Admin registration", "Admin registration successful", "PASS"]);

    const tc09 = await json("/api/admin/login", {
        method: "POST",
        body: JSON.stringify({ email: adminEmail, password })
    });
    assert(tc09.status === 200, "TC09 expected 200");
    assert(tc09.data.admin && tc09.data.admin.email === adminEmail, "TC09 admin login");
    results.push(["TC09", "Admin login", "Admin page displayed", "PASS"]);

    const tc10 = await json("/api/admin/appointments");
    assert(tc10.status === 200, "TC10 expected 200");
    const adminView = tc10.data.find((row) => row.id === appointmentId);
    assert(adminView, "TC10 appointment visible to admin");
    assert(adminView.patient_name, "TC10 patient name");
    assert(adminView.doctor_name, "TC10 doctor name");
    assert(adminView.status === "Cancelled", "TC10 status");
    results.push(["TC10", "Admin appointment management", "Correct appointment details", "PASS"]);

    return results;
}

const child = spawn(process.execPath, ["server.js"], {
    cwd: path.join(__dirname, "../backend"),
    env: {
        ...process.env,
        PORT: String(PORT),
        HOSPITAL_DB: dbFile
    },
    stdio: "pipe"
});

child.stderr.on("data", (chunk) => process.stderr.write(chunk));

waitForServer()
    .then(run)
    .then((results) => {
        console.log("\nTest ID | Test case | Expected result | Status");
        console.log("-------------------------------------------------------");
        results.forEach((row) => console.log(row.join(" | ")));
        console.log("\nAll required test cases passed.");
    })
    .catch((error) => {
        console.error("TEST FAILURE:", error.message);
        process.exitCode = 1;
    })
    .finally(() => {
        child.kill();
        fs.rm(dbFile, { force: true }, () => {});
    });
