# RootLab Frontend

This is the first working RootLab frontend scaffold. It is built with Next.js, TypeScript, Tailwind CSS, Framer Motion, and xterm, and it is visually aligned to the `frontendexample/` reference while pushing further into the RootLab ops-console identity.

## Included Today

- terminal-first session workspace
- left mission operations rail
- live network intelligence panel
- bottom operations drawer for notes, loot, and timeline
- deterministic local demo simulation for the Orion mission flow

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Verification

These commands pass for the current scaffold:

```bash
npm run lint
npm run typecheck
npm run build
```

## Important Note

The current terminal experience is still backed by a local demo simulator in `lib/demo-session.ts`. It is intentionally shaped so a real backend session engine can replace it later without redesigning the UI shell.
