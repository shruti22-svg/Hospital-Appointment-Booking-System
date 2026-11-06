FROM node:20-bookworm-slim

WORKDIR /tests
COPY tests/selenium/package.json ./
RUN npm install --omit=dev
COPY tests/selenium ./

CMD ["node", "run.js"]
