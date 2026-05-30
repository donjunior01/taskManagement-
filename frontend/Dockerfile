# ---- Build stage ----
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- Runtime stage (nginx serving the built SPA) ----
FROM nginx:alpine
# Angular (application builder) emits the SPA under dist/frontend/browser.
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
