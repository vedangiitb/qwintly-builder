FROM node:20-slim

# Create workspace directory
RUN mkdir -p /workspace
WORKDIR /app

COPY package.json .
RUN npm install

# Build the application
COPY . .
RUN npm run build

CMD ["node", "dist/index.js"]