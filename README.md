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

## Docker

```bash
docker compose up --build
```

App: http://localhost:5000

CI Selenium stack:

```bash
docker compose -f docker-compose.ci.yml up --build --abort-on-container-exit --exit-code-from tests
```

## Jenkins

1. Push this repo to GitHub.
2. In Jenkins, create a **Pipeline** job.
3. Set SCM to this GitHub repository.
4. Script path: `Jenkinsfile`.
5. Jenkins agent needs Node.js, Docker, and Docker Compose.

The pipeline installs dependencies, runs API tests, builds the Docker image, then runs Selenium tests in Docker.
