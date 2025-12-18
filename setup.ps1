# Save this as setup.ps1 in C:\Users\mpfof\Desktop\dummybank
Write-Host "Setting up Dummy Banking System..." -ForegroundColor Green

# Create necessary directories
New-Item -ItemType Directory -Force -Path "backend\app"
New-Item -ItemType Directory -Force -Path "frontend\src"

# Create Backend Dockerfile
$backendDockerfile = @"
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
"@
$backendDockerfile | Out-File -FilePath "backend\Dockerfile" -Encoding UTF8

# Create Frontend Dockerfile
$frontendDockerfile = @"
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
"@
$frontendDockerfile | Out-File -FilePath "frontend\Dockerfile" -Encoding UTF8

# Create docker-compose.yml
$dockerCompose = @"
version: '3.8'

services:
  postgres:
    image: postgres:15
    container_name: bank-postgres
    environment:
      POSTGRES_DB: dummybank
      POSTGRES_USER: dummybank
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U dummybank"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build: ./backend
    container_name: bank-backend
    ports:
      - "8000:8000"
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      DATABASE_URL: postgresql://dummybank:password@postgres:5432/dummybank
      SECRET_KEY: dummy-secret-key-change-in-production
    volumes:
      - ./backend:/app
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

  frontend:
    build: ./frontend
    container_name: bank-frontend
    ports:
      - "3000:3000"
    depends_on:
      - backend
    environment:
      REACT_APP_API_URL: http://localhost:8000/api
    volumes:
      - ./frontend:/app
      - /app/node_modules
    stdin_open: true
    tty: true

volumes:
  postgres_data:
"@
$dockerCompose | Out-File -FilePath "docker-compose.yml" -Encoding UTF8

# Create backend requirements.txt
$requirements = @"
fastapi==0.104.1
uvicorn[standard]==0.24.0
sqlalchemy==2.0.23
psycopg2-binary==2.9.9
python-dotenv==1.0.0
pydantic==2.5.0
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
"@
$requirements | Out-File -FilePath "backend\requirements.txt" -Encoding UTF8

# Create backend .env file
$envFile = @"
DATABASE_URL=postgresql://dummybank:password@postgres:5432/dummybank
SECRET_KEY=dummy-secret-key-change-in-production
"@
$envFile | Out-File -FilePath "backend\.env" -Encoding UTF8

Write-Host "Setup complete!" -ForegroundColor Green
Write-Host "Now run: docker-compose up --build" -ForegroundColor Yellow