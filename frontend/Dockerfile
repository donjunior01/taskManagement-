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
# Placed under /etc/nginx/templates so the nginx image substitutes ${PORT} and ${BACKEND_URL}
# at container start (envsubst). nginx's own $host/$uri/etc. are left untouched.
COPY nginx.conf /etc/nginx/templates/default.conf.template
# Defaults for docker-compose; PaaS platforms override these env vars at deploy time.
ENV PORT=80
ENV BACKEND_URL=http://backend:8073
EXPOSE 80
