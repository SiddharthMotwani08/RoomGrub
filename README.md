# Pocket

Pocket is a minimal roommate expense splitting app. Goal: any roommate can instantly see who owes whom, exact amount, and minimum transactions needed to settle.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS with shadcn-style primitives
- PostgreSQL + Prisma
- Auth.js credentials auth
- Jest for balance math tests

## Setup

```bash
npm install
cp .env.example .env.local
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

Dev server runs on `http://localhost:3001`.

## Environment

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/pocket"
NEXTAUTH_URL="http://localhost:3001"
NEXTAUTH_SECRET="replace-with-random-secret"
NEXT_PUBLIC_SITE_URL="http://localhost:3001"
```

## Demo Data

Seed creates:

- Sid: `sid@pocket.test`
- Rahul: `rahul@pocket.test`
- Aman: `aman@pocket.test`
- Neha: `neha@pocket.test`

Password for all demo users: `password123`.

Group: `Flatmates` with multiple expenses and non-zero balances.

## Core Rules

- Money stored as integer paise.
- Unequal split must sum exactly to total expense.
- Balances derive from expenses, splits, and settlements.
- Settlement suggestions minimize transactions with debtor-creditor matching.
- No push notifications, wallet, chat, crypto, or banking integrations.

## Commands

```bash
npm run dev
npm run build
npm start
npm test
npm run db:generate
npm run db:push
npm run db:seed
```
