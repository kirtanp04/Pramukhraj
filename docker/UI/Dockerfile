# Build Stage
FROM node:24-alpine AS build

WORKDIR /app

# Copy package files
COPY pramukhraj-foods/package*.json ./
COPY pramukhraj-foods/vite.config.* ./
COPY pramukhraj-foods/tsconfig*.json ./

# Install dependencies
RUN npm install

# Copy the entire React application
COPY pramukhraj-foods/ .

# Increase Node heap size
ENV NODE_OPTIONS="--max-old-space-size=2048"

# Production API URL
ARG VITE_API_URL="http://65.2.33.245/api"
ENV VITE_API_URL=${VITE_API_URL}

# Build application
RUN npm run build

# Production Stage
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY pramukhraj-foods/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]