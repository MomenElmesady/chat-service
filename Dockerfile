FROM node:18

WORKDIR /app

COPY package*.json ./

# Prevent native build conflicts like bcrypt and peer dependency issues
RUN npm install --legacy-peer-deps

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
