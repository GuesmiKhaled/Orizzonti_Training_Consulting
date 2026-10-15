FROM node:22-alpine AS build
WORKDIR /workspace
COPY apps/frontend/package*.json ./apps/frontend/
WORKDIR /workspace/apps/frontend
RUN npm ci
WORKDIR /workspace
COPY apps/frontend ./apps/frontend
COPY img ./img
COPY css ./css
COPY other ./other
WORKDIR /workspace/apps/frontend
RUN npm run build

FROM nginx:1.27-alpine AS runtime
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /workspace/apps/frontend/dist/frontend/browser /usr/share/nginx/html
COPY apps/frontend/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh
EXPOSE 80
ENTRYPOINT ["/docker-entrypoint.sh"]
