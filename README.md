# Focus Study Room - Booking System

> **Academic Context:** This final project for the Software Engineering labs demonstrates the practical application of system design, UML modeling, TDD, and modern software architecture principles covered throughout the semester.

Web application for booking study rooms on a university campus.
App combines a searchable room explorer, a step-by-step booking wizard, and a moderator panel for managing campus infrastructure.

## What you get
- **Room Explorer**  
  Search rooms by code or building name, filter by availability, time window, and sort results.
- **Booking Wizard**  
  Intuitive 3-step process to select a room, choose a 24h time slot, and confirm with a virtual ticket.
- **Moderator Panel**  
  Create new rooms and rename existing ones to manage campus infrastructure.
- **Role Simulation**  
  Easily switch between User and Admin roles or simulate different accounts (e.g., `student-1`) without a auth setup.

## User roles
The app uses a simplified role-based flow for the prototype:
- **USER**: Can browse rooms, check availability, and make reservations.
- **ADMIN**: Can access the Moderator Panel to manage rooms.
Role and active user ID can be toggled directly in the UI.

## Tech stack
- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Node.js + Fastify + Prisma ORM
- **Language**: TypeScript

## Quick start

### Requirements
- Node.js
- Docker Desktop

### 1) Start backend (Docker)
```bash
cd devenv/compose
docker compose up --build
```

### 2) Start frontend (Local)
```bash
cd frontend
npm install
npm run dev
```

Then open `http://localhost:5173` in your browser.

## Local setup (No Docker)
If you prefer to run everything locally without Docker:

```bash
# Terminal 1: Backend
cd backend
npm install
npm run dev

# Terminal 2: Frontend
cd frontend
npm install
npm run dev
```

## Troubleshooting
- **Database issues**
  - Stop the backend, delete `backend/dev.db`, and restart `npm run dev` to recreate and re-seed the database.
- **Ports already in use**
  - Ensure ports 3001 (Backend API) and 5173 (Frontend) are available.

## Data and persistence
- On backend startup (`npm run dev`), the Prisma schema is pushed to a local SQLite database (`backend/dev.db`).
- The database is automatically seeded with initial campus buildings, rooms, and sample reservations via `backend/prisma/seed.ts`.
- Changes made in the app (new bookings, renamed rooms) are persisted in the local SQLite file.

---
## Author
**Norbert Fila** 257185  
**IFE, Lodz University of Technology**

<img width="300" alt="logo-politechnika-lodzka" src="https://github.com/user-attachments/assets/93cd13c9-a74e-45d5-a02c-6a11db1795d3" />
