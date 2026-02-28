# Kabadi — Digital KYC & Reward Platform

## Overview
The Kabadi platform semi-formalises India's informal waste recycler (kabadi-wala) ecosystem. Citizens sell waste to kabadi-walas, who earn K-Coins that can be redeemed for map priority and commodity discounts.

## Tech Stack
- **Frontend**: React 18 + Vite + Framer Motion + Leaflet + react-i18next
- **Backend**: Spring Boot 3.2 + Spring Security (JWT) + Spring Data JPA + Flyway
- **Database**: PostgreSQL 15
- **DevOps**: Docker + Docker Compose

## Quick Start

### Option 1: Docker Compose (recommended)
```bash
docker-compose up --build
```
- Frontend: http://localhost:3000
- Backend: http://localhost:8080
- API Health: http://localhost:8080/api/health

### Option 2: Local Development

**Backend** (requires Java 17 + PostgreSQL running):
```bash
cd backend
./mvnw spring-boot:run
```

**Frontend**:
```bash
cd frontend
npm install
npm run dev
```
Frontend: http://localhost:5173

## Demo Credentials
- **Admin**: username=`admin`, password=`admin123`
- **Demo Citizens**: mobile `9876543210`, `9876543211`, `9876543212` (OTP is logged to console in dev)
- **Demo Kabadis**: mobile `9800000001`, `9800000002`, `9800000003`

> ⚠️ OTP is printed to the backend console log — no SMS gateway is wired yet.

## Project Structure
```
Kabadi/
├── frontend/          # React + Vite
│   └── src/
│       ├── api/       # Axios API modules
│       ├── components/# Shared components (Navbar, OtpInput, LanguageSwitcher, Confetti)
│       ├── context/   # AuthContext
│       ├── i18n/      # Translations (en, hi, bn, ta, mr)
│       └── pages/     # citizen/ kabadi/ admin/ auth/ LandingPage
├── backend/           # Spring Boot
│   └── src/main/java/com/kabadi/
│       ├── controller/
│       ├── service/
│       ├── repository/
│       ├── model/     # entity/ dto/ response/
│       ├── config/    # SecurityConfig, JwtAuthFilter
│       ├── scheduler/ # KCoinScheduler
│       └── util/      # JwtUtil, DataSeeder
├── docker-compose.yml
└── README.md
```

## Key Features
- OTP-based auth (Citizen, Kabadi-wala, Admin)
- Citizen registration with address + pincode (mandatory)
- K-Coin engine with daily threshold unlock (20 kg) and scheduled jobs
- Two-phase kabadi-wala discovery (priority 5km window → normal 2km search)
- Booking system with address auto-fill from citizen profile
- Multilingual UI: English, हिन्दी, বাংলা, தமிழ், मराठी
- Admin dashboard with live config editing
