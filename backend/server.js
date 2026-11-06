const express = require("express");
const cors = require("cors");
const path = require("path");
const bcrypt = require("bcryptjs");
const db = require("./db");

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const HOST = process.env.HOST || "0.0.0.0";

function validateAccount(body) {
    const { name, email, password } = body || {};
    if (
        typeof name !== "string" ||
        typeof email !== "string" ||
        typeof password !== "string" ||
        !name.trim() ||
        !email.trim() ||
        password.length < 8
    ) {
        return null;
    }
    return {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password
    };
}
const TIME_SLOTS = [
    "09:00",
    "10:00",
    "11:00",
    "12:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00"
];

app.use(cors());
app.use(express.json());
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
        return res.status(400).json({ message: "Invalid JSON" });
    }
    next(err);
});
app.use(express.static(path.join(__dirname, "../frontend")));

function isValidDate(value) {
    return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isValidTime(value) {
    return TIME_SLOTS.includes(value);
}

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

app.get("/api/health", (req, res) => {
    res.json({
        status: "OK",
        service: "Hospital Appointment Booking System"
    });
});

app.post("/api/register", async (req, res) => {
    const { name, email, password } = req.body || {};

    if (
        typeof name !== "string" ||
        typeof email !== "string" ||
        typeof password !== "string" ||
        !name.trim() ||
        !email.trim() ||
        password.length < 8
    ) {
        return res.status(400).json({
            message: "Enter a valid name, email, and password of at least 8 characters"
        });
    }

    const normalizedEmail = email.trim().toLowerCase();

    try {
        await db.ready;
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await db.runAsync(
            `INSERT INTO patients (name, email, password) VALUES (?, ?, ?)`,
            [name.trim(), normalizedEmail, hashedPassword]
        );

        res.status(201).json({
            message: "Registration successful",
            patientId: result.lastID
        });
    } catch (error) {
        if (error.code === "SQLITE_CONSTRAINT") {
            return res.status(409).json({
                message: "Email already registered"
            });
        }

        res.status(500).json({
            message: "Registration failed"
        });
    }
});

app.post("/api/login", async (req, res) => {
    const { email, password } = req.body || {};

    if (
        typeof email !== "string" ||
        typeof password !== "string" ||
        !email.trim() ||
        !password
    ) {
        return res.status(400).json({
            message: "Email and password are required"
        });
    }

    try {
        await db.ready;
        const patient = await db.getAsync(
            "SELECT * FROM patients WHERE email = ?",
            [email.trim().toLowerCase()]
        );

        if (!patient) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const validPassword = await bcrypt.compare(password, patient.password);

        if (!validPassword) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        res.json({
            message: "Login successful",
            patient: {
                id: patient.id,
                name: patient.name,
                email: patient.email
            }
        });
    } catch (error) {
        res.status(500).json({
            message: "Login failed"
        });
    }
});

app.post("/api/admin/register", async (req, res) => {
    const account = validateAccount(req.body);

    if (!account) {
        return res.status(400).json({
            message: "Enter a valid name, email, and password of at least 8 characters"
        });
    }

    try {
        await db.ready;
        const hashedPassword = await bcrypt.hash(account.password, 10);
        const result = await db.runAsync(
            `INSERT INTO admins (name, email, password) VALUES (?, ?, ?)`,
            [account.name, account.email, hashedPassword]
        );

        res.status(201).json({
            message: "Admin registration successful",
            adminId: result.lastID
        });
    } catch (error) {
        if (error.code === "SQLITE_CONSTRAINT") {
            return res.status(409).json({
                message: "Admin email already registered"
            });
        }

        res.status(500).json({
            message: "Admin registration failed"
        });
    }
});

app.post("/api/admin/login", async (req, res) => {
    const { email, password } = req.body || {};

    if (
        typeof email !== "string" ||
        typeof password !== "string" ||
        !email.trim() ||
        !password
    ) {
        return res.status(400).json({
            message: "Email and password are required"
        });
    }

    try {
        await db.ready;
        const admin = await db.getAsync(
            "SELECT * FROM admins WHERE email = ?",
            [email.trim().toLowerCase()]
        );

        if (!admin) {
            return res.status(401).json({
                message: "Invalid admin credentials"
            });
        }

        const validPassword = await bcrypt.compare(password, admin.password);

        if (!validPassword) {
            return res.status(401).json({
                message: "Invalid admin credentials"
            });
        }

        res.json({
            message: "Admin login successful",
            admin: {
                id: admin.id,
                name: admin.name,
                email: admin.email
            }
        });
    } catch (error) {
        res.status(500).json({
            message: "Admin login failed"
        });
    }
});

app.get("/api/doctors", async (req, res) => {
    try {
        await db.ready;
        const doctors = await db.allAsync(
            `SELECT id, name, specialization, qualification,
                    experience_years, consultation_fee
             FROM doctors
             ORDER BY name`
        );
        res.json(doctors);
    } catch (error) {
        res.status(500).json({ message: "Database error" });
    }
});

app.get("/api/doctors/search", async (req, res) => {
    const specialization = req.query.specialization;

    if (typeof specialization !== "string" || !specialization.trim()) {
        return res.status(400).json({
            message: "Specialization is required"
        });
    }

    try {
        await db.ready;
        const doctors = await db.allAsync(
            `SELECT id, name, specialization, qualification,
                    experience_years, consultation_fee
             FROM doctors
             WHERE specialization LIKE ? COLLATE NOCASE
             ORDER BY name`,
            [`%${specialization.trim()}%`]
        );
        res.json(doctors);
    } catch (error) {
        res.status(500).json({ message: "Database error" });
    }
});

app.get("/api/doctors/:id", async (req, res) => {
    try {
        await db.ready;
        const doctor = await db.getAsync(
            `SELECT id, name, specialization, qualification,
                    experience_years, consultation_fee
             FROM doctors
             WHERE id = ?`,
            [req.params.id]
        );

        if (!doctor) {
            return res.status(404).json({ message: "Doctor not found" });
        }

        res.json(doctor);
    } catch (error) {
        res.status(500).json({ message: "Database error" });
    }
});

app.get("/api/doctors/:id/slots", async (req, res) => {
    const date = req.query.date;

    if (!isValidDate(date)) {
        return res.status(400).json({ message: "Valid date (YYYY-MM-DD) is required" });
    }

    try {
        await db.ready;
        const doctor = await db.getAsync(
            "SELECT id FROM doctors WHERE id = ?",
            [req.params.id]
        );

        if (!doctor) {
            return res.status(404).json({ message: "Doctor not found" });
        }

        const booked = await db.allAsync(
            `SELECT appointment_time
             FROM appointments
             WHERE doctor_id = ? AND appointment_date = ? AND status = 'Booked'`,
            [req.params.id, date]
        );

        const bookedTimes = new Set(booked.map((row) => row.appointment_time));
        const slots = TIME_SLOTS.map((time) => ({
            time,
            available: !bookedTimes.has(time)
        }));

        res.json({ date, slots });
    } catch (error) {
        res.status(500).json({ message: "Database error" });
    }
});

app.post("/api/appointments", async (req, res) => {
    const { patient_id, doctor_id, appointment_date, appointment_time } =
        req.body || {};

    if (!patient_id || !doctor_id || !isValidDate(appointment_date) || !isValidTime(appointment_time)) {
        return res.status(400).json({
            message: "Patient, doctor, date, and a valid time slot are required"
        });
    }

    try {
        await db.ready;

        const patient = await db.getAsync(
            "SELECT id FROM patients WHERE id = ?",
            [patient_id]
        );
        const doctor = await db.getAsync(
            "SELECT id, name FROM doctors WHERE id = ?",
            [doctor_id]
        );

        if (!patient) {
            return res.status(404).json({ message: "Patient not found" });
        }

        if (!doctor) {
            return res.status(404).json({ message: "Doctor not found" });
        }

        const occupied = await db.getAsync(
            `SELECT id FROM appointments
             WHERE doctor_id = ? AND appointment_date = ? AND appointment_time = ?
               AND status = 'Booked'`,
            [doctor_id, appointment_date, appointment_time]
        );

        if (occupied) {
            return res.status(409).json({
                message: "Booking rejected",
                reason: "Slot already occupied"
            });
        }

        const result = await db.runAsync(
            `INSERT INTO appointments
             (patient_id, doctor_id, appointment_date, appointment_time, status)
             VALUES (?, ?, ?, ?, 'Booked')`,
            [patient_id, doctor_id, appointment_date, appointment_time]
        );

        res.status(201).json({
            message: "Appointment confirmed",
            appointment: {
                id: result.lastID,
                patient_id,
                doctor_id,
                doctor_name: doctor.name,
                appointment_date,
                appointment_time,
                status: "Booked"
            }
        });
    } catch (error) {
        if (error.code === "SQLITE_CONSTRAINT") {
            return res.status(409).json({
                message: "Booking rejected",
                reason: "Slot already occupied"
            });
        }

        res.status(500).json({ message: "Booking failed" });
    }
});

app.get("/api/appointments/patient/:patientId", async (req, res) => {
    try {
        await db.ready;
        const appointments = await db.allAsync(
            `SELECT a.id, a.appointment_date, a.appointment_time, a.status,
                    d.name AS doctor_name, d.specialization
             FROM appointments a
             JOIN doctors d ON d.id = a.doctor_id
             WHERE a.patient_id = ?
             ORDER BY a.appointment_date DESC, a.appointment_time DESC`,
            [req.params.patientId]
        );
        res.json(appointments);
    } catch (error) {
        res.status(500).json({ message: "Database error" });
    }
});

app.post("/api/appointments/:id/cancel", async (req, res) => {
    const patientId = req.body && req.body.patient_id;

    try {
        await db.ready;
        const appointment = await db.getAsync(
            "SELECT * FROM appointments WHERE id = ?",
            [req.params.id]
        );

        if (!appointment) {
            return res.status(404).json({ message: "Appointment not found" });
        }

        if (patientId && Number(appointment.patient_id) !== Number(patientId)) {
            return res.status(403).json({ message: "Not allowed to cancel this appointment" });
        }

        if (appointment.status === "Cancelled") {
            return res.status(400).json({ message: "Appointment already cancelled" });
        }

        await db.runAsync(
            "UPDATE appointments SET status = 'Cancelled' WHERE id = ?",
            [req.params.id]
        );

        res.json({
            message: "Appointment cancelled",
            appointmentId: Number(req.params.id)
        });
    } catch (error) {
        res.status(500).json({ message: "Cancellation failed" });
    }
});

app.get("/api/admin/appointments", async (req, res) => {
    try {
        await db.ready;
        const appointments = await db.allAsync(
            `SELECT a.id, a.appointment_date, a.appointment_time, a.status,
                    p.name AS patient_name, p.email AS patient_email,
                    d.name AS doctor_name, d.specialization
             FROM appointments a
             JOIN patients p ON p.id = a.patient_id
             JOIN doctors d ON d.id = a.doctor_id
             ORDER BY a.appointment_date DESC, a.appointment_time DESC`
        );
        res.json(appointments);
    } catch (error) {
        res.status(500).json({ message: "Database error" });
    }
});

app.patch("/api/admin/appointments/:id", async (req, res) => {
    const status = req.body && req.body.status;
    const allowed = ["Booked", "Completed", "Cancelled"];

    if (!allowed.includes(status)) {
        return res.status(400).json({
            message: "Status must be Booked, Completed, or Cancelled"
        });
    }

    try {
        await db.ready;
        const appointment = await db.getAsync(
            "SELECT * FROM appointments WHERE id = ?",
            [req.params.id]
        );

        if (!appointment) {
            return res.status(404).json({ message: "Appointment not found" });
        }

        if (status === "Booked") {
            const occupied = await db.getAsync(
                `SELECT id FROM appointments
                 WHERE doctor_id = ? AND appointment_date = ? AND appointment_time = ?
                   AND status = 'Booked' AND id != ?`,
                [
                    appointment.doctor_id,
                    appointment.appointment_date,
                    appointment.appointment_time,
                    req.params.id
                ]
            );

            if (occupied) {
                return res.status(409).json({
                    message: "Booking rejected",
                    reason: "Slot already occupied"
                });
            }
        }

        await db.runAsync(
            "UPDATE appointments SET status = ? WHERE id = ?",
            [status, req.params.id]
        );

        res.json({
            message: "Appointment updated",
            appointmentId: Number(req.params.id),
            status
        });
    } catch (error) {
        if (error.code === "SQLITE_CONSTRAINT") {
            return res.status(409).json({
                message: "Booking rejected",
                reason: "Slot already occupied"
            });
        }

        res.status(500).json({ message: "Update failed" });
    }
});

app.get("/api/admin/patients", async (req, res) => {
    try {
        await db.ready;
        const patients = await db.allAsync(
            `SELECT id, name, email FROM patients ORDER BY name`
        );
        res.json(patients);
    } catch (error) {
        res.status(500).json({ message: "Database error" });
    }
});

app.post("/api/admin/doctors", async (req, res) => {
    const { name, specialization, qualification, experience_years, consultation_fee } =
        req.body || {};

    if (
        typeof name !== "string" ||
        typeof specialization !== "string" ||
        !name.trim() ||
        !specialization.trim()
    ) {
        return res.status(400).json({
            message: "Doctor name and specialization are required"
        });
    }

    try {
        await db.ready;
        const result = await db.runAsync(
            `INSERT INTO doctors
             (name, specialization, qualification, experience_years, consultation_fee)
             VALUES (?, ?, ?, ?, ?)`,
            [
                name.trim(),
                specialization.trim(),
                typeof qualification === "string" ? qualification.trim() : "",
                Number(experience_years) || 0,
                Number(consultation_fee) || 0
            ]
        );

        res.status(201).json({
            message: "Doctor added",
            doctorId: result.lastID
        });
    } catch (error) {
        res.status(500).json({ message: "Could not add doctor" });
    }
});

function start() {
    return db.ready.then(() => {
        return new Promise((resolve) => {
            const server = app.listen(PORT, HOST, () => {
                console.log(`Server running at http://${HOST}:${PORT}`);
                resolve(server);
            });
        });
    });
}

if (require.main === module) {
    start().catch((error) => {
        console.error(error);
        process.exit(1);
    });
}

module.exports = { app, start, TIME_SLOTS };
