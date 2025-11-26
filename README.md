# LiftLog

LiftLog is a full-stack fitness logging app that allows users to track workouts, exercises, and sets.  
The project is structured into a **backend** (Next.js + Prisma + PostgreSQL) and a **frontend** (Expo + React Native + TypeScript), with a shared folder for TypeScript types.

---

## Project Structure
```bash
LiftLog
├─ backend # Next.js API + Prisma
├─ frontend # Expo + React Native app
└─ shared # Shared TypeScript types
```
---

## Backend

The backend is built with **Next.js**, **Prisma**, and connects to a **PostgreSQL** database (Neon). It exposes API routes for creating and fetching workouts.

### Prerequisites

- Node.js >= 20.x  
- npm or yarn  
- PostgreSQL database (Neon or local)

### Setup

1. Navigate to the backend folder:

```bash
cd LiftLog/backend
```
2. Install dependencies:

```bash
npm install
```
3. Create a .env file in backend/ (if not already present) and add:
```bash
DATABASE_URL='postgresql://<user>:<password>@<host>/<database>?sslmode=require&channel_binding=require'
BACKEND_URL='http://localhost:3000'
```
Ensure Prisma can read the environment variables by installing dotenv:

```bash
npm install dotenv
```
If you have a prisma.config.ts, make sure it loads dotenv:
```bash
import 'dotenv/config'; // Loads .env automatically
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  engine: "classic",
  datasource: {
    url: env("DATABASE_URL"),
  },
});
```
Prisma Setup
Generate Prisma client:

```bash
npx prisma generate
```
Run migrations:

```bash
npx prisma migrate dev --name init
```
Optional: open Prisma Studio to view database:

```bash
npx prisma studio
```
Running the Backend
```bash
npm run dev
```
API routes are available at http://localhost:3000/api/.

Frontend
The frontend is built with Expo and React Native, using TypeScript. It consumes the backend API to create and fetch workouts.

Prerequisites
Node.js >= 20.x

npm or yarn

Expo CLI (npm install -g expo-cli)

Expo Go app (for mobile testing) or web browser

Setup
Navigate to the frontend folder:

```bash
cd LiftLog/frontend
```
Install dependencies:

```bash
npm install
```
Make sure your .env for the frontend (if needed) points to the backend:

```bash
# If using Expo config for environment variables
BACKEND_URL=http://localhost:3000
```
Configure app.config.js or app.json to read the environment variable:

```bash
import 'dotenv/config';

export default {
  expo: {
    name: "LiftLog Mobile",
    slug: "mobile",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "liftlog",
    userInterfaceStyle: "automatic",
    platforms: ["ios", "android", "web"],
    extra: {
      BACKEND_URL: process.env.BACKEND_URL
    }
  }
};
```
Running the Frontend
```bash
# Start Expo dev server
npm start

# Open in web browser
npm run web

# Or launch on Android/iOS device
npm run android
npm run ios
```
The app will fetch workouts from BACKEND_URL and allow creation of new workouts.

Shared Types
The shared/types.ts folder contains TypeScript interfaces for shared data models like Workout, Exercise, Set, and User. Both frontend and backend import from this folder to ensure type safety.

🛠️ Tools & Libraries Used
Backend
Next.js (App Router + API routes)

Prisma ORM (Database client & migrations)

PostgreSQL (Neon - serverless PostgreSQL)

JWT (JSON Web Tokens for authentication)

bcrypt (Password hashing)

cookie (HTTP cookie handling)

dotenv (Environment variable management)

TypeScript (Type safety)

Frontend
Expo + React Native (Cross-platform mobile development)

TypeScript (Type safety)

React Navigation (Navigation handling)

Expo Router (File-based routing)

React Native Paper (UI components)

Axios (HTTP client for API calls)

React Context (State management for auth)

Security Features
JWT with HttpOnly cookies (Secure authentication)

Password hashing with bcrypt

CORS configuration (Cross-origin resource sharing)

Input validation (Request data sanitization)

Development & Deployment
Git (Version control)

Neon (PostgreSQL hosting)

Vercel (Backend deployment - planned)

Expo EAS (App building & deployment - planned)

Notes
The backend URL is stored in an environment variable and used in the frontend to prevent exposing sensitive info.

Prisma automatically loads .env if prisma.config.ts is not interfering.

For mobile testing, make sure your backend is accessible on the same network (use your LAN IP).

Quick Commands
Backend
```bash
Copy code
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```
Frontend
```bash
Copy code
cd frontend
npm install
npm start
npm run web
npm run android
npm run ios
```
Author
Marton

Project for personal use / demonstration
