FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci

RUN npm install -g typescript \
    && npm install -g @types/node @types/react @types/react-dom
    
COPY . .

RUN npm run build

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1


CMD ["node", "dist/index.js"]
