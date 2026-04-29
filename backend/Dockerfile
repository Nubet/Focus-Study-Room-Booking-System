FROM node:22.22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npx prisma generate
RUN npm run build

RUN chmod +x start.sh

EXPOSE 3001

CMD ["./start.sh"]
