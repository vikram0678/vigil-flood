# ==============================================================================
# Multi-Stage Production Dockerfile for VIGIL-FLOOD
# Unified Full-Stack (React 18 + FastAPI + PyTorch/XGBoost ML Models)
# ==============================================================================

# --- Stage 1: Build React TSX Frontend ---
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend_react

COPY frontend_react/package*.json ./
RUN npm install

COPY frontend_react/ ./
RUN npm run build

# --- Stage 2: Production Python Backend & Serving ---
FROM python:3.10-slim AS runner

# Install system dependencies (build essentials, curl for healthcheck)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements & install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy backend code, models, and static assets
COPY backend/ ./backend/
COPY frontend/ ./frontend/
COPY run.py .

# Copy compiled React build from Stage 1 into frontend_react/dist
COPY --from=frontend-builder /app/frontend_react/dist ./frontend_react/dist

# Set default environment variables
ENV PYTHONUNBUFFERED=1 \
    PORT=8000

EXPOSE 8000

# Healthcheck to ensure FastAPI responds
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:${PORT}/api/health || exit 1

# Start the unified FastAPI application using Uvicorn
CMD ["sh", "-c", "uvicorn backend.app.main:app --host 0.0.0.0 --port ${PORT}"]
