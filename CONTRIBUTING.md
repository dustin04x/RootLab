# Contributing to RootLab

## Principles

RootLab is intended to be a safe, open-source cybersecurity learning platform. Contributions should improve realism, education value, accessibility, reliability, or developer experience without weakening the simulation safety model.

## Contribution areas

- Frontend experience and accessibility
- Backend APIs and persistence
- Simulation engine features
- Mission design and validation
- Documentation and classroom tooling
- Test coverage and observability

## Ground rules

- Do not add features that execute real player commands on the host machine.
- Do not introduce real-world offensive payload generation targeting live systems.
- Keep missions deterministic and schema-validated.
- Prefer small, reviewable pull requests with tests where practical.

## Suggested workflow

1. Open an issue or discussion for large architectural changes.
2. Keep interfaces typed and documented.
3. Add or update tests for engine, API, or mission behavior.
4. Update docs when behavior or schemas change.

## Initial references

- [Project overview](README.md)
- [Technical specification](docs/technical-spec.md)
- [Mission authoring guide](docs/mission-authoring-guide.md)
