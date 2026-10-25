# ===================================================
# Multi-stage Dockerfile for Car Dealership System
# ===================================================

# 1. Build Frontend
FROM node:22-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# 2. Build Backend & Production Runner
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000

# Install backend dependencies
WORKDIR /app/backend
COPY backend/package*.json ./
# tsx runs the TypeScript sources directly, so dev dependencies are needed at runtime
RUN npm ci

# Copy backend source code & database directory
COPY backend/ ./
RUN mkdir -p /app/backend/data

# Copy the built frontend; the API serves it from the same origin
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

EXPOSE 4000
CMD ["npm", "start"]
