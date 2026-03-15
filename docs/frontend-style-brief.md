# RootLab Frontend Style Brief

## Design Reference

`frontendexample/` is the primary local visual reference for RootLab's first frontend implementation. The production app should not copy it verbatim, but it should preserve the same overall mood and interaction language:

- operations-console layout
- terminal-first center stage
- slim chrome and dense information hierarchy
- dark graphite surfaces with acid green and cyan accents
- monospaced telemetry labels and restrained motion

## What We Are Keeping

- Three-panel desktop layout with a persistent mission panel on the left, terminal in the center, and network intelligence on the right
- Compact top status bar with product mark, connection state, XP, and mission progress
- Thin borders, low-radius cards, and a flat control-room aesthetic instead of glossy game UI
- Subtle scanline and grid treatments to make the interface feel simulated without becoming noisy
- Green for success and compromise state, cyan for discovery and systems state, amber for caution and hints
- Mono-forward labels for terminal, status tags, IPs, flags, and telemetry

## RootLab-Specific Upgrades

- Replace the prototype's generic dashboard feel with a more distinct cyber-operations identity tuned to training
- Use `JetBrains Mono` for terminal and telemetry, and a sharper heading font such as `Space Grotesk` for page titles and section labels
- Make the terminal feel more authentic with xterm.js, richer prompts, host context, and streamed output
- Expand the right rail from a static node display into a true intelligence panel with discovered hosts, pivot paths, and service metadata
- Turn the left rail into a mission operations stack with briefing, objective state, flags, inventory, notes, and hint escalation
- Add stronger page-level atmosphere through radial gradients, faint topology patterns, and animated signal pulses

## Layout Rules

### Desktop

- Header height: compact, around 48 to 56 px
- Left rail: fixed mission operations column
- Center: dominant terminal workspace
- Right rail: fixed network intelligence column
- Bottom drawer: collapsible notes, credentials, artifacts, and hints

### Tablet

- Keep terminal dominant
- Convert one side rail into collapsible tabs
- Preserve always-visible objective and network summaries

### Mobile

- Terminal remains primary
- Mission and network panels become sheets or segmented drawers
- Status bar compresses to only the highest-value telemetry

## Visual Tokens

Suggested starting palette inspired by `frontendexample/`:

- background: near-black graphite
- card: slightly lifted charcoal
- primary: vivid terminal green
- accent: electric cyan
- warning: warm amber
- border: muted slate linework

Suggested shape and effects:

- radius: 2 px to 4 px
- borders: visible 1 px separators
- shadows: soft glow only for active or important states
- animation: subtle pulse, scan sweep, and node signal propagation

## Interaction Principles

- The terminal is the hero, not a decorative element
- Supporting panels should inform the player's next move, not compete for attention
- Motion should communicate discovery, compromise, and progression
- Dense interfaces are welcome, but every dense area must stay readable at a glance
- Accessibility matters: strong contrast, keyboard navigation, and readable type scales are mandatory

## Build Mapping

Prototype inspiration to RootLab implementation:

- `frontendexample/components/Header.tsx` -> session status bar and global ops header
- `frontendexample/components/MissionSidebar.tsx` -> mission operations rail
- `frontendexample/components/Terminal.tsx` -> xterm.js-backed terminal workspace
- `frontendexample/components/NetworkMap.tsx` -> live network intelligence panel

## Guardrail

When design choices are unclear, prefer "close to `frontendexample/` but more intentional and more immersive" over inventing a completely different aesthetic.
