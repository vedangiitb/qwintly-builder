FROM node:20

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

COPY templates /templates

RUN npm run build

# Create build workspace
RUN mkdir -p /workspace

EXPOSE 7777

CMD ["npm", "start"]
