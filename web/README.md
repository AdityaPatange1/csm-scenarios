# CSM Scenarios Web

Enterprise web application for `CSM Scenarios`, built with Next.js App Router.  
This project includes:

- marketing landing page
- stateful authentication (signup/login/logout)
- protected dashboard
- AI-powered scenario, interview, and conversation modules
- MongoDB-backed persistence for sessions, events, and contact submissions

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Requirements](#requirements)
- [Environment Variables](#environment-variables)
- [Local Development](#local-development)
- [Available Scripts](#available-scripts)
- [Application Architecture](#application-architecture)
- [API Endpoints](#api-endpoints)
- [Security Notes](#security-notes)
- [Production Deployment](#production-deployment)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## Overview

`CSM Scenarios Web` provides a complete browser-based interface for customer success readiness:

- users can create accounts and log in securely
- teams can generate scenarios and interview packs on demand
- users can run a conversation simulator for incident-response practice
- dashboard analytics provide visibility into usage and training activity

The AI features are powered by OpenAI using the Vercel AI SDK.

## Tech Stack

- **Framework:** Next.js 16 (App Router, TypeScript)
- **UI:** React 19 + Tailwind CSS 4
- **Database:** MongoDB
- **AI:** Vercel AI SDK (`ai`) + `@ai-sdk/openai`
- **Icons:** `lucide-react`
- **Runtime:** Node.js

## Requirements

- Node.js 20+
- npm 10+
- MongoDB database (local or hosted)
- OpenAI API key

## Environment Variables

Copy and configure:

```bash
cp .env.local.example .env.local
```

Required:

- `OPENAI_API_KEY` - OpenAI API key
- `OPENAI_BASE_URL` - OpenAI-compatible endpoint (default OpenAI URL recommended)
- `OPENAI_MODEL` - model id (for example `gpt-4o-mini`)
- `MONGODB_URI` - MongoDB connection string
- `MONGODB_DB` - MongoDB database name

Example:

```env
OPENAI_API_KEY=your_key_here
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o-mini
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=csm_scenarios
```

## Local Development

Install dependencies:

```bash
npm install
```

Start development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Available Scripts

- `npm run dev` - start local dev server
- `npm run lint` - run ESLint checks
- `npm run build` - create production build
- `npm run start` - run production server from build output

## Application Architecture

### App Pages

- `app/page.tsx` - landing page and contact form
- `app/login/page.tsx` - login form
- `app/signup/page.tsx` - signup form
- `app/dashboard/page.tsx` - protected app workspace with sidebar modules

### API Routes

- `app/api/auth/*` - signup/login/logout/me
- `app/api/dashboard/stats` - dashboard analytics
- `app/api/ai/*` - scenario/interview/conversation generation
- `app/api/contact` - contact form ingestion

### Core Libraries

- `lib/mongodb.ts` - MongoDB client and DB accessor
- `lib/auth.ts` - password hashing, verification, session token generation
- `lib/session.ts` - session cookie constants
- `lib/server-auth.ts` - current-user resolution from session cookie
- `lib/ai.ts` - shared OpenAI generation and AI event logging

## API Endpoints

### Authentication

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### AI Features

- `POST /api/ai/scenario` - generate scenario pack
- `POST /api/ai/interview` - generate interview pack
- `POST /api/ai/conversation` - continue role-play conversation

### Dashboard and Contact

- `GET /api/dashboard/stats` - aggregate event stats
- `POST /api/contact` - store contact submissions

All protected API routes require a valid session cookie.

## Security Notes

- Session cookies are `httpOnly` and expire automatically.
- Passwords are never stored in plaintext; hashes are generated with `scrypt` + per-user salt.
- API routes validate required payload fields and return explicit error responses.
- Secrets must be stored in `.env.local` and never committed.

For production hardening, recommended next steps:

- rate limiting on auth and AI routes
- CSRF mitigation strategy for mutation endpoints
- audit logging and alerting for failed auth spikes

## Production Deployment

1. Set environment variables in your deployment platform.
2. Build:

```bash
npm run build
```

3. Start:

```bash
npm run start
```

Deployments on Vercel are fully supported.

## Troubleshooting

- **401 Unauthorized on dashboard/API:** check login flow and session cookie.
- **Mongo errors:** verify `MONGODB_URI` and `MONGODB_DB`.
- **AI fallback responses:** verify `OPENAI_API_KEY`, `OPENAI_BASE_URL`, and model availability.
- **Build issues:** run `npm run lint` and resolve all type/lint errors before `npm run build`.

## Contributing

Contributions are welcome under the MIT License.

Suggested workflow:

1. Create a feature branch.
2. Run `npm run lint` and `npm run build`.
3. Open a pull request with:
   - concise summary
   - testing notes
   - screenshots for UI changes

## License

This project is licensed under the **MIT License**.  
See the repository root `LICENSE` file for full text.
