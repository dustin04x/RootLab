# RootLab Mission Authoring Guide

## Purpose

RootLab missions are data-driven scenario definitions that describe a story, simulated network, vulnerabilities, objectives, flags, hints, and scoring rules. Authors should design missions that teach a specific concept chain while remaining safe, deterministic, and replayable.

## Authoring workflow

1. Pick a learning outcome.
2. Define the intended exploit path and any optional side paths.
3. Model the network, hosts, files, users, and services.
4. Add vulnerabilities with clear triggers and consequences.
5. Define objectives, flags, and hints in escalating order.
6. Validate the mission against the schema.
7. Run the mission in preview mode and confirm that the intended path is achievable.

## Content rules

- Missions must never depend on real shell execution or real outbound network access.
- Every objective should map to a teachable skill or observable milestone.
- Hints should escalate from directional guidance to procedural guidance.
- Final objectives should require evidence of compromise, not only reconnaissance.
- Difficulty should reflect the number of steps, ambiguity, and required concepts.

## Design checklist

- Is the briefing clear about the user's role and goal?
- Can the player discover the first foothold through available evidence?
- Does each vulnerability have at least one discovery clue?
- Are privilege escalation paths realistic for the target difficulty?
- Do hints preserve challenge without becoming spoilers too early?
- Can the session be replayed deterministically from the same mission version and seed?

## Mission layout

Store official missions in difficulty-tiered folders under `missions/official/`. Use `missions/examples/` for references and tests. Keep one mission version per file and prefer YAML for readability.

## Testing expectations

- Validate schema and references
- Run deterministic replay tests
- Confirm all flags are reachable
- Confirm no objective is impossible after the intended path
- Confirm hint ordering matches objective progression
