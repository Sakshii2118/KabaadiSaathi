# Frontend Dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json .
RUN npm ci
COPY . .
# VITE_API_URL is injected at build time so the JS bundle has the correct base URL.
# Pass it via docker compose build args or --build-arg VITE_API_URL=...
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
# nginx.conf contains ${BACKEND_URL} placeholder; envsubst replaces it at startup.
COPY nginx.conf /etc/nginx/conf.d/default.conf.template
EXPOSE 80
# envsubst replaces ${BACKEND_URL} then starts nginx
CMD ["/bin/sh", "-c", "envsubst '${BACKEND_URL}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
