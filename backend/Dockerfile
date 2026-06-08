FROM python:3.12-slim

WORKDIR /app

# Install system dependencies if any are needed for psycopg2 (optional, slim base is usually fine for binary)
# COPY requirements first to cache pip install layer
COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

# Also install httpx since starlette testclient/some testing hooks use it, and keep container tidy
RUN pip install --no-cache-dir httpx

COPY . .

EXPOSE 8000

# Start server using uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
