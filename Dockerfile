FROM node:20-slim

# Create workspace directory
RUN mkdir -p /workspace
WORKDIR /app

COPY package.json .
RUN npm install

COPY . .

ENV WORKER_WS=""
ENV SESSION_ID=""

CMD ["node", "index.js"]
