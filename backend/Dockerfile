FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create uploads directory and set permissions
RUN mkdir -p /app/uploads && \
    useradd --create-home appuser && \
    chown -R appuser:appuser /app
USER appuser

# Expose port (Render uses PORT env var, Docker Compose uses 8000)
EXPOSE ${PORT:-8000}

# Health check (for Docker Compose; Render uses its own healthcheck)
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:${PORT:-8000}/health || exit 1

# Start with gunicorn — respects PORT env var for cloud platforms like Render
CMD gunicorn -k uvicorn.workers.UvicornWorker -w 2 -b 0.0.0.0:${PORT:-8000} --timeout 120 --graceful-timeout 30 --access-logfile - app.main:app
