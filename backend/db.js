const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcryptjs");

const databaseFolder = path.join(__dirname, "../database");
fs.mkdirSync(databaseFolder, { recursive: true });

const dbPath =
    process.env.HOSPITAL_DB || path.join(databaseFolder, "hospital.db");

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("Database connection error:", err.message);
    } else {
        console.log("Connected to SQLite database");
    }
});

function runAsync(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) {
                reject(err);
            } else {
                resolve(this);
            }
        });
    });
}

function getAsync(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
}

function allAsync(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

const ready = new Promise((resolve, reject) => {
    db.serialize(async () => {
        try {
            await runAsync("PRAGMA foreign_keys = ON");

            await runAsync(`
                CREATE TABLE IF NOT EXISTS patients (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    email TEXT NOT NULL UNIQUE,
                    password TEXT NOT NULL
                )
            `);

            await runAsync(`
                CREATE TABLE IF NOT EXISTS admins (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    email TEXT NOT NULL UNIQUE,
                    password TEXT NOT NULL
                )
            `);

            await runAsync(`
                CREATE TABLE IF NOT EXISTS doctors (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    specialization TEXT NOT NULL,
                    qualification TEXT,
                    experience_years INTEGER,
                    consultation_fee INTEGER
                )
            `);

            const extraDoctorColumns = [
                ["qualification", "TEXT"],
                ["experience_years", "INTEGER"],
                ["consultation_fee", "INTEGER"]
            ];

            for (const [column, type] of extraDoctorColumns) {
                try {
                    await runAsync(`ALTER TABLE doctors ADD COLUMN ${column} ${type}`);
                } catch (error) {
                    if (!String(error.message).includes("duplicate column name")) {
                        throw error;
                    }
                }
            }

            await runAsync(`
                CREATE TABLE IF NOT EXISTS appointments (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    patient_id INTEGER NOT NULL,
                    doctor_id INTEGER NOT NULL,
                    appointment_date TEXT NOT NULL,
                    appointment_time TEXT NOT NULL,
                    status TEXT DEFAULT 'Booked',
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (patient_id) REFERENCES patients(id),
                    FOREIGN KEY (doctor_id) REFERENCES doctors(id)
                )
            `);

            await runAsync(`
                CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_booked_slot
                ON appointments(doctor_id, appointment_date, appointment_time)
                WHERE status = 'Booked'
            `);

            const sampleDoctors = [
                ["Dr. Anjali Sharma", "Cardiology", "MD, DM Cardiology", 12, 800],
                ["Dr. Rahul Verma", "Dermatology", "MD Dermatology", 8, 600],
                ["Dr. Priya Reddy", "Neurology", "MD, DM Neurology", 10, 900],
                ["Dr. Arjun Mehta", "Orthopedics", "MS Orthopedics", 15, 750],
                ["Dr. Sneha Iyer", "Pediatrics", "MD Pediatrics", 9, 500],
                ["Dr. Vikram Singh", "General Medicine", "MBBS, MD", 11, 400]
            ];

            for (const doctor of sampleDoctors) {
                const existing = await getAsync(
                    "SELECT id FROM doctors WHERE name = ? AND specialization = ?",
                    [doctor[0], doctor[1]]
                );

                if (!existing) {
                    await runAsync(
                        `INSERT INTO doctors
                         (name, specialization, qualification, experience_years, consultation_fee)
                         VALUES (?, ?, ?, ?, ?)`,
                        doctor
                    );
                } else {
                    await runAsync(
                        `UPDATE doctors
                         SET qualification = ?, experience_years = ?, consultation_fee = ?
                         WHERE id = ?`,
                        [doctor[2], doctor[3], doctor[4], existing.id]
                    );
                }
            }

            const adminEmail = "admin@hospital.com";
            const existingAdmin = await getAsync(
                "SELECT id FROM admins WHERE email = ?",
                [adminEmail]
            );

            if (!existingAdmin) {
                const hashed = bcrypt.hashSync("Admin@123", 10);
                await runAsync(
                    `INSERT INTO admins (name, email, password) VALUES (?, ?, ?)`,
                    ["Hospital Admin", adminEmail, hashed]
                );
            }

            resolve();
        } catch (error) {
            reject(error);
        }
    });
});

db.runAsync = runAsync;
db.getAsync = getAsync;
db.allAsync = allAsync;
db.ready = ready;

module.exports = db;
