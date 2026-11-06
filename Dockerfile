FROM node:20-bookworm-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY backend/package.json backend/package-lock.json ./backend/
ENV npm_config_build_from_source=true
RUN cd backend && npm ci --omit=dev

COPY backend ./backend
COPY frontend ./frontend
RUN mkdir -p /app/database
COPY database/ /app/database/

ENV PORT=5000
ENV HOST=0.0.0.0
ENV HOSPITAL_DB=/app/database/hospital.db

EXPOSE 5000
CMD ["node", "backend/server.js"]
