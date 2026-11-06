# Hospital Appointment Booking System

Multi-page hospital booking app with patient and admin registration/login, doctor search, booking, cancellation, and admin appointment management. Includes API tests, Selenium tests, Docker, and Jenkins.

## Run locally

```bash
cd backend
npm install
npm start
```

Open http://localhost:5000

### Patient
- Register: `/register.html`
- Login: `/login.html`
- Dashboard, search, doctor details, booking, cancel, view appointments

### Admin
- Register: `/admin-register.html`
- Login: `/admin-login.html`
- Admin page: all appointments, status updates, patients, doctors, add doctor
- Optional demo admin: `admin@hospital.com` / `Admin@123`

## Tests

API tests (TC01–TC10):

```bash
cd backend
npm test
```

Selenium UI tests (need Chrome and the app running):

```bash
cd tests/selenium
npm install
npm test
```

## Docker + Jenkins (automated)

1. Start **Docker Desktop** and wait until it is running.
2. From the project folder run:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-devops.ps1
```

That script starts Docker if needed, builds the app container, and starts Jenkins.

- App: http://localhost:5000
- Jenkins: http://localhost:8081
- Jenkins login: `admin` / `admin123`
- Pipeline job: `hospital-booking` → **Build Now**

Manual commands:

```powershell
docker compose up -d --build
docker compose -f docker-compose.jenkins.yml up -d --build
```

CI tests only:

```powershell
docker compose -f docker-compose.ci.yml up --build --abort-on-container-exit --exit-code-from tests
```
