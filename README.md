# Crewmates - Team Project Management Platform
This project was created for the 2024 edition of HackitAll

Crewmates is a modern team project management platform built with Next.js, Prisma, and TypeScript. It helps teams track projects, manage sprints, and reward achievements through a gamified experience, all while being a fun and engaging way to work together. Everybody wins!

## Here's what makes Crewmates unique:

- 🏆 Sprint-based Project Management
- 🎯 Project Rankings and Leaderboards
- 🎁 Achievement System with Badges and Prizes
- 👥 Team Management
- 💬 Real-time Project Chat
- 🔐 Role-based Access Control
- 📊 Progress Tracking
- 🎨 Modern UI with Tailwind CSS

## Tech Stack

- **Framework:** Next.js 14
- **Language:** TypeScript
- **Database:** SQLite with Prisma ORM
- **Styling:** Tailwind CSS
- **Authentication:** Custom JWT with HTTP-only Cookies
- **State Management:** React Context
- **UI Components:** Custom Components

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository: 
```bash
git clone https://github.com/amuzant/Crewmates.git
cd Crewmates
```
2. Install dependencies:
```bash
npm install
```
3. Set up environment variables:
```bash
cp .env.example .env
```
4. Initialize Prisma:
```bash
npx prisma migrate dev
```
5. Start the development server:
```bash
npm run dev
```