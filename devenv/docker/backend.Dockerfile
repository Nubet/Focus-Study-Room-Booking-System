FROM node:22.22-alpine

WORKDIR /app

COPY backend/package*.json ./
RUN npm install

COPY backend/. ./
COPY devenv/scripts/backend-start.sh ./start.sh

RUN npx prisma generate
RUN npm run build

RUN sed -i 's/\r$//' start.sh
RUN chmod +x start.sh

EXPOSE 3001

CMD ["sh", "./start.sh"]
