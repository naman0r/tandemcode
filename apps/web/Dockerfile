# Vite bakes VITE_* variables into the bundle, so they are build arguments
# here rather than runtime environment.
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts
COPY . .
ARG VITE_CLERK_PUBLISHABLE_KEY
ARG VITE_BACKEND_URL
ENV VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY \
    VITE_BACKEND_URL=$VITE_BACKEND_URL
RUN test -n "$VITE_CLERK_PUBLISHABLE_KEY" || (echo "VITE_CLERK_PUBLISHABLE_KEY build arg is required" && exit 1)
RUN npm run build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
