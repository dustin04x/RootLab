# RootLab

RootLab is a browser-based cybersecurity learning simulator built around terminal-first, mission-driven offensive security training. It is designed as an open-source platform for universities, clubs, bootcamps, and self-learners who need realistic, replayable cyber operations scenarios without touching live infrastructure.

This repository now contains the product specification plus the first Next.js frontend scaffold for the RootLab operations interface.

## Core Goals

- Realistic hacking workflows inside a safe simulated environment
- Gamified progression with missions, flags, XP, badges, and rankings
- Modular scenario authoring for official and community-created content
- Production-grade architecture suitable for collaborative open-source development

## Documents

- [Technical specification](docs/technical-spec.md)
- [Frontend style brief](docs/frontend-style-brief.md)
- [Example mission: Orion Data Breach](missions/examples/orion-data-breach.yaml)
- [Example mission: Northbridge Relay](missions/examples/northbridge-relay.yaml)

## Current Status

- `frontend/` contains a working Next.js app inspired by `frontendexample/`
- The current UI ships a terminal-first demo session with deterministic local simulation state
- Backend, persistence, and engine services are still specified in docs and not implemented yet

## Running The Frontend

```bash
cd frontend
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Proposed Stack

- Frontend: Next.js, TypeScript, Tailwind CSS, Framer Motion, xterm.js
- Backend: FastAPI, Pydantic, SQLAlchemy, WebSockets
- Data: PostgreSQL
- Runtime: Docker Compose for development, container-first deployment
- Optional supporting services: Redis for active session state and pub/sub, object storage for assets

## Product Shape

Players choose a mission, read the briefing, enter a simulated network, enumerate hosts and services, exploit vulnerabilities, escalate privileges, collect flags, and complete objectives. Every action is interpreted by a simulation engine, not a real shell, which keeps the experience safe, deterministic, and portable.
