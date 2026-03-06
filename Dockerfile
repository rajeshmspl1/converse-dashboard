FROM node:20-alpine
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package*.json ./
RUN npm ci
COPY . .
ENV NODE_ENV=production
RUN NEXT_PUBLIC_SERVICE_I_URL=http://service-i:8004 npm run build
EXPOSE 3000
CMD ["npm", "start"]
