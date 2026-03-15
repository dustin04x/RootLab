# RootLab Technical Specification

## 1. Product Summary

RootLab is a browser-based cyber operations simulator that teaches offensive security through mission-based gameplay. Players interact with simulated Linux hosts, services, filesystems, and vulnerable applications through a terminal-first interface backed by a deterministic simulation engine. The platform is intended for individual learners, teams, instructors, and open-source contributors.

### Primary outcomes

- Deliver realistic but safe hacking workflows entirely inside a simulation layer
- Support structured learning across reconnaissance, exploitation, privilege escalation, pivoting, forensics, cryptography, and reverse engineering fundamentals
- Provide a scalable content model for official and community-authored missions
- Offer an extensible architecture that can start as a modular monolith and evolve into separately scaled services

### Design principles

- Simulation over virtualization: no user commands execute on real infrastructure
- Terminal first: the terminal is the main interaction model, with supporting visual panels
- Deterministic state: session behavior is reproducible for testing, replay, and anti-cheat telemetry
- Data-driven missions: all content is versioned, inspectable, and authored through schemas
- Open-source ergonomics: local development, clear boundaries, and contributor-friendly documentation

## 2. High-Level System Architecture

### Recommended architecture style

RootLab should begin as a modular monolith with clean internal boundaries, then split high-load concerns into dedicated services as adoption grows. This avoids premature operational complexity while preserving future service extraction paths.

### Core runtime components

1. `frontend` (Next.js)
   - Delivers the web application, mission catalog, player dashboard, and in-session UI
   - Hosts the xterm.js terminal, network visualization, notes, objectives, hints, and editor experiences
2. `backend` (FastAPI)
   - Exposes REST APIs for authentication, missions, sessions, progression, community features, and admin workflows
   - Terminates WebSocket connections for live terminal sessions and real-time UI events
3. `engine` (Python package and optionally separate service)
   - Interprets commands
   - Simulates hosts, filesystems, services, vulnerabilities, and network relationships
   - Applies state transitions and emits structured events
4. `postgres`
   - Stores users, missions, progression, snapshots, leaderboards, classroom data, and content metadata
5. `redis` (recommended)
   - Caches active session state
   - Supports pub/sub for real-time updates and multi-instance WebSocket coordination
6. `object storage` (optional but recommended)
   - Stores uploaded assets for missions, writeups, avatars, and editor attachments

### Logical architecture

```text
+-------------------+        HTTPS / WebSocket        +----------------------+
| Next.js Frontend  | <-----------------------------> | FastAPI Platform API |
+-------------------+                                  +----------+-----------+
                                                                   |
                                                                   | internal calls
                                                                   v
                                                        +----------+-----------+
                                                        | Simulation Engine    |
                                                        | Command Interpreter  |
                                                        +----------+-----------+
                                                                   |
                           +----------------------------+----------+-----------+-------------------+
                           |                            |                      |                   |
                           v                            v                      v                   v
                     +-----------+                +-----------+          +-----------+       +-------------+
                     | Postgres  |                | Redis     |          | Object    |       | Metrics /   |
                     | metadata  |                | sessions  |          | Storage   |       | Logging     |
                     +-----------+                +-----------+          +-----------+       +-------------+
```

### Deployment topology

- Development: Docker Compose with one frontend container, one backend container, one PostgreSQL container, and one Redis container
- Production starter deployment: frontend on Vercel or container platform, backend and engine on container service, PostgreSQL managed or self-hosted, Redis managed or self-hosted
- Large-scale deployment: separate API, session gateway, engine worker pool, and background job workers with horizontal autoscaling

## 3. Service Architecture

### Frontend service

Responsibilities:

- Mission browsing and onboarding
- Real-time terminal session rendering with xterm.js
- Network map, objectives, hints, inventory, and progression UI
- Community mission discovery, writeups, rankings, and user profiles
- Mission editor interface for scenario authors

Key modules:

- `app/`
- `features/session/`
- `features/missions/`
- `features/community/`
- `features/editor/`
- `components/ui/`

### Platform API service

Responsibilities:

- Authentication and authorization
- Mission catalog and version management
- Session lifecycle management
- Progression, XP, achievements, and leaderboards
- Community content moderation and publishing workflows
- Instructor and classroom features

Internal modules:

- `auth`
- `users`
- `missions`
- `sessions`
- `progression`
- `community`
- `classrooms`
- `admin`
- `telemetry`

### Simulation engine service

Responsibilities:

- Parse commands into tokens and execution intents
- Resolve the active host, current user, filesystem location, and network visibility
- Execute simulated commands against a virtual state graph
- Evaluate vulnerability preconditions and apply exploit consequences
- Produce deterministic outputs, exit codes, and events

Internal modules:

- `parser`
- `runtime`
- `filesystem`
- `network`
- `services`
- `vulnerabilities`
- `objectives`
- `state`
- `renderers`

### Background worker service

Responsibilities:

- Snapshot persistence
- Replay generation
- Leaderboard recomputation
- Achievement backfills
- Mission publishing validation
- AI mentor hint generation and moderation queues

### Recommended extraction path

Start with one FastAPI application plus the engine as an internal package. Extract the engine into a dedicated service only when one of these becomes true:

- Active concurrent sessions exceed what one API instance can simulate comfortably
- Community mission validation requires isolated execution workers
- Session replay and telemetry analysis become materially expensive

## 4. Domain Model

### Core entities

- `User`: learner, creator, instructor, or administrator
- `Profile`: display identity, preferences, progression summary
- `Team`: group of users competing or learning together
- `Mission`: published scenario identity
- `MissionVersion`: immutable content revision of a mission
- `MissionSession`: one player or team attempt against a mission version
- `SimulationState`: authoritative state for a running or resumable session
- `SimulationEvent`: append-only command and state transition event
- `Objective`: tracked task within a mission
- `Flag`: collectible progress artifact with validation rules
- `Achievement`: reusable milestone definition
- `XpLedgerEntry`: immutable record of progression rewards
- `Writeup`: user-generated explanation or solution review
- `Classroom`: instructor-managed cohort

## 5. Database Schema Design

PostgreSQL is the system of record. Hot session state may be mirrored in Redis, but persistent progress and content metadata remain in Postgres.

### Relational schema

#### `users`

- `id` UUID PK
- `email` CITEXT UNIQUE NOT NULL
- `password_hash` TEXT NULL for SSO-only accounts
- `display_name` VARCHAR(80) NOT NULL
- `role` VARCHAR(24) NOT NULL
- `status` VARCHAR(24) NOT NULL
- `created_at` TIMESTAMPTZ NOT NULL
- `updated_at` TIMESTAMPTZ NOT NULL
- `last_login_at` TIMESTAMPTZ NULL

#### `profiles`

- `user_id` UUID PK FK -> users.id
- `handle` CITEXT UNIQUE NOT NULL
- `bio` TEXT NULL
- `avatar_url` TEXT NULL
- `country_code` CHAR(2) NULL
- `timezone` VARCHAR(64) NULL
- `xp_total` INT NOT NULL DEFAULT 0
- `level` INT NOT NULL DEFAULT 1
- `settings_json` JSONB NOT NULL DEFAULT '{}'

#### `teams`

- `id` UUID PK
- `name` VARCHAR(120) UNIQUE NOT NULL
- `visibility` VARCHAR(24) NOT NULL
- `owner_user_id` UUID FK -> users.id
- `created_at` TIMESTAMPTZ NOT NULL

#### `team_members`

- `team_id` UUID FK -> teams.id
- `user_id` UUID FK -> users.id
- `team_role` VARCHAR(24) NOT NULL
- `joined_at` TIMESTAMPTZ NOT NULL
- PK (`team_id`, `user_id`)

#### `missions`

- `id` UUID PK
- `slug` CITEXT UNIQUE NOT NULL
- `title` VARCHAR(160) NOT NULL
- `summary` TEXT NOT NULL
- `difficulty` VARCHAR(24) NOT NULL
- `category` VARCHAR(48) NOT NULL
- `visibility` VARCHAR(24) NOT NULL
- `author_user_id` UUID FK -> users.id NULL
- `maintainer_type` VARCHAR(24) NOT NULL
- `status` VARCHAR(24) NOT NULL
- `current_version_id` UUID NULL
- `created_at` TIMESTAMPTZ NOT NULL
- `updated_at` TIMESTAMPTZ NOT NULL

#### `mission_versions`

- `id` UUID PK
- `mission_id` UUID FK -> missions.id
- `version` VARCHAR(32) NOT NULL
- `schema_version` VARCHAR(16) NOT NULL
- `content_yaml` TEXT NOT NULL
- `content_json` JSONB NOT NULL
- `checksum` VARCHAR(128) NOT NULL
- `is_published` BOOLEAN NOT NULL DEFAULT FALSE
- `published_at` TIMESTAMPTZ NULL
- `created_by_user_id` UUID FK -> users.id
- `created_at` TIMESTAMPTZ NOT NULL
- UNIQUE (`mission_id`, `version`)

#### `mission_dependencies`

- `mission_id` UUID FK -> missions.id
- `depends_on_mission_id` UUID FK -> missions.id
- `dependency_type` VARCHAR(24) NOT NULL
- PK (`mission_id`, `depends_on_mission_id`)

#### `mission_tags`

- `mission_id` UUID FK -> missions.id
- `tag` VARCHAR(48) NOT NULL
- PK (`mission_id`, `tag`)

#### `mission_sessions`

- `id` UUID PK
- `mission_version_id` UUID FK -> mission_versions.id
- `user_id` UUID FK -> users.id NULL
- `team_id` UUID FK -> teams.id NULL
- `status` VARCHAR(24) NOT NULL
- `started_at` TIMESTAMPTZ NOT NULL
- `completed_at` TIMESTAMPTZ NULL
- `last_active_at` TIMESTAMPTZ NOT NULL
- `seed` BIGINT NOT NULL
- `current_host_id` VARCHAR(128) NULL
- `current_user_name` VARCHAR(64) NULL
- `cwd` TEXT NULL
- `score` INT NOT NULL DEFAULT 0
- `hint_count` INT NOT NULL DEFAULT 0
- `snapshot_version` INT NOT NULL DEFAULT 0
- `engine_state_json` JSONB NOT NULL
- CHECK ((user_id IS NOT NULL) <> (team_id IS NOT NULL))

#### `session_events`

- `id` BIGSERIAL PK
- `session_id` UUID FK -> mission_sessions.id
- `sequence_no` INT NOT NULL
- `event_type` VARCHAR(48) NOT NULL
- `command_text` TEXT NULL
- `payload_json` JSONB NOT NULL
- `created_at` TIMESTAMPTZ NOT NULL
- UNIQUE (`session_id`, `sequence_no`)

#### `session_flags`

- `session_id` UUID FK -> mission_sessions.id
- `flag_id` VARCHAR(128) NOT NULL
- `captured_by_user_id` UUID FK -> users.id NULL
- `captured_at` TIMESTAMPTZ NOT NULL
- PK (`session_id`, `flag_id`)

#### `achievements`

- `id` UUID PK
- `code` VARCHAR(64) UNIQUE NOT NULL
- `name` VARCHAR(120) NOT NULL
- `description` TEXT NOT NULL
- `icon` VARCHAR(64) NOT NULL
- `xp_reward` INT NOT NULL
- `criteria_json` JSONB NOT NULL

#### `user_achievements`

- `user_id` UUID FK -> users.id
- `achievement_id` UUID FK -> achievements.id
- `earned_at` TIMESTAMPTZ NOT NULL
- `context_json` JSONB NOT NULL
- PK (`user_id`, `achievement_id`)

#### `xp_ledger`

- `id` BIGSERIAL PK
- `user_id` UUID FK -> users.id
- `source_type` VARCHAR(32) NOT NULL
- `source_id` VARCHAR(128) NOT NULL
- `delta` INT NOT NULL
- `created_at` TIMESTAMPTZ NOT NULL
- `metadata_json` JSONB NOT NULL DEFAULT '{}'

#### `classrooms`

- `id` UUID PK
- `name` VARCHAR(160) NOT NULL
- `owner_user_id` UUID FK -> users.id
- `invite_code` VARCHAR(32) UNIQUE NOT NULL
- `created_at` TIMESTAMPTZ NOT NULL

#### `classroom_members`

- `classroom_id` UUID FK -> classrooms.id
- `user_id` UUID FK -> users.id
- `role` VARCHAR(24) NOT NULL
- `joined_at` TIMESTAMPTZ NOT NULL
- PK (`classroom_id`, `user_id`)

#### `leaderboard_seasons`

- `id` UUID PK
- `name` VARCHAR(120) NOT NULL
- `starts_at` TIMESTAMPTZ NOT NULL
- `ends_at` TIMESTAMPTZ NOT NULL
- `rules_json` JSONB NOT NULL

#### `leaderboard_entries`

- `season_id` UUID FK -> leaderboard_seasons.id
- `scope_type` VARCHAR(24) NOT NULL
- `scope_id` UUID NOT NULL
- `rank` INT NOT NULL
- `score` INT NOT NULL
- `metadata_json` JSONB NOT NULL
- PK (`season_id`, `scope_type`, `scope_id`)

#### `writeups`

- `id` UUID PK
- `mission_id` UUID FK -> missions.id
- `author_user_id` UUID FK -> users.id
- `title` VARCHAR(160) NOT NULL
- `content_md` TEXT NOT NULL
- `status` VARCHAR(24) NOT NULL
- `created_at` TIMESTAMPTZ NOT NULL
- `updated_at` TIMESTAMPTZ NOT NULL

#### `audit_logs`

- `id` BIGSERIAL PK
- `actor_user_id` UUID FK -> users.id NULL
- `action` VARCHAR(128) NOT NULL
- `target_type` VARCHAR(64) NOT NULL
- `target_id` VARCHAR(128) NOT NULL
- `payload_json` JSONB NOT NULL
- `created_at` TIMESTAMPTZ NOT NULL

### Indexing strategy

- GIN indexes on frequently queried JSONB columns: `mission_versions.content_json`, `mission_sessions.engine_state_json`
- Composite indexes on mission browse filters: `missions(status, visibility, difficulty, category)`
- Composite indexes on session lookups: `mission_sessions(user_id, status, last_active_at DESC)` and `mission_sessions(team_id, status, last_active_at DESC)`
- Unique ordered index on `session_events(session_id, sequence_no)`

## 6. Backend API Specification

The platform should expose REST for content and account operations, plus WebSocket for real-time sessions.

### Authentication

#### `POST /api/v1/auth/register`

Creates a user account.

Request body:

```json
{
  "email": "learner@example.com",
  "password": "redacted",
  "display_name": "analyst01"
}
```

#### `POST /api/v1/auth/login`

Returns JWT access and refresh tokens.

#### `POST /api/v1/auth/refresh`

Rotates tokens.

#### `POST /api/v1/auth/logout`

Invalidates the refresh token.

### User and progression

#### `GET /api/v1/me`

Returns profile, progression summary, unlocked missions, and active sessions.

#### `PATCH /api/v1/me`

Updates display settings and profile metadata.

#### `GET /api/v1/me/achievements`

Returns earned achievements and pending milestones.

#### `GET /api/v1/me/xp-ledger`

Returns XP history.

### Mission catalog

#### `GET /api/v1/missions`

Query params:

- `difficulty`
- `category`
- `tag`
- `search`
- `visibility`
- `status`
- `page`
- `page_size`

#### `GET /api/v1/missions/{slug}`

Returns briefing, prerequisites, objectives summary, rewards, and latest published version metadata.

#### `GET /api/v1/missions/{slug}/versions/{version}`

Admin and author-only endpoint for a specific version.

#### `POST /api/v1/missions`

Creates a draft mission.

#### `POST /api/v1/missions/{mission_id}/versions`

Uploads or saves a mission definition draft.

#### `POST /api/v1/missions/{mission_id}/publish`

Validates and publishes the selected version.

### Session lifecycle

#### `POST /api/v1/missions/{slug}/sessions`

Creates a mission session.

Request body:

```json
{
  "mode": "solo",
  "resume": false
}
```

Response body:

```json
{
  "session_id": "8c8ef1c8-0e32-4b50-a2d7-d7b0dc799c07",
  "status": "active",
  "terminal_ws_url": "/api/v1/sessions/8c8ef1c8-0e32-4b50-a2d7-d7b0dc799c07/terminal",
  "initial_context": {
    "host": "kali-sim",
    "cwd": "/home/player",
    "user": "player"
  }
}
```

#### `GET /api/v1/sessions/{session_id}`

Returns current session metadata, objectives, captured flags, and resumable UI state.

#### `POST /api/v1/sessions/{session_id}/pause`

Persists a snapshot and marks the session idle.

#### `POST /api/v1/sessions/{session_id}/resume`

Rehydrates a paused session.

#### `POST /api/v1/sessions/{session_id}/submit-flag`

Allows explicit flag submission if the mission uses manual capture.

#### `GET /api/v1/sessions/{session_id}/events`

Returns paginated command and system event history.

### Real-time terminal protocol

#### `GET /api/v1/sessions/{session_id}/terminal` (WebSocket)

Client to server message types:

```json
{ "type": "command.submit", "line": "nmap 10.0.0.5" }
{ "type": "terminal.resize", "cols": 120, "rows": 32 }
{ "type": "hint.request" }
```

Server to client message types:

```json
{
  "type": "command.result",
  "line": "nmap 10.0.0.5",
  "stdout": "PORT   STATE SERVICE\n80/tcp open  http",
  "stderr": "",
  "exit_code": 0,
  "cwd": "/home/player",
  "host": "jumpbox",
  "user": "player"
}
```

```json
{
  "type": "state.patch",
  "objectives": [{ "id": "recon-1", "status": "completed" }],
  "network_discoveries": [{ "ip": "10.0.0.5", "hostname": "orion-web" }]
}
```

```json
{
  "type": "flag.captured",
  "flag_id": "flag-initial-access",
  "value_masked": "FLAG{initial_access}",
  "xp_awarded": 100
}
```

### Community and classrooms

#### `GET /api/v1/leaderboards`

Returns season rankings by global, classroom, or team scope.

#### `POST /api/v1/classrooms`

Creates an instructor classroom.

#### `POST /api/v1/classrooms/{classroom_id}/assignments`

Assigns missions to a classroom with due dates and scoring rules.

#### `POST /api/v1/writeups`

Creates a writeup draft.

#### `POST /api/v1/missions/{mission_id}/fork`

Creates a creator-owned copy of a mission.

### API security controls

- JWT-based auth with refresh rotation
- Fine-grained roles for learner, creator, moderator, instructor, and admin
- Per-session authorization checks for WebSocket connection upgrades
- Request validation through Pydantic schemas
- Audit logging for content publishing, moderation, and admin actions
- Rate limiting on auth, hint, and publish endpoints

## 7. Command Parser Architecture

The command layer must emulate Linux-like terminal behavior without ever spawning a real shell.

### Parsing pipeline

1. Input capture
   - xterm.js submits a raw command line over WebSocket
2. Normalization
   - Trim unsafe control characters and normalize whitespace while preserving quoted segments
3. Lexing
   - Tokenize commands, flags, pipes, redirects, variable references, and quoted strings
4. Syntax analysis
   - Build a light command AST for simple shell constructs
5. Session context resolution
   - Resolve active host, user, cwd, and discovered network state
6. Dispatch
   - Route the command to a registered simulator implementation
7. Effect application
   - Apply filesystem, service, vulnerability, or objective state changes
8. Rendering
   - Convert structured results into terminal-friendly stdout and stderr

### Supported shell semantics

- Basic commands with arguments
- Relative and absolute path resolution
- File globbing for simulated paths
- Environment variables like `$HOME`
- Simple redirection such as `>` and `>>`
- Limited pipes for approved command combinations
- Exit codes and permission-denied responses

Unsupported or carefully limited semantics:

- Arbitrary shell scripting
- Background job control beyond simulated `ps` and `jobs`
- Real process execution
- Unbounded regex or command substitution if it threatens engine safety or predictability

### Command registry model

Each command implementation is a pure or near-pure function:

```text
CommandContext + ParsedCommand + SimulationState -> CommandResult + StateEvents
```

`CommandContext` contains:

- active session metadata
- current host and current user
- cwd and environment variables
- visible network graph
- mission rule flags

`CommandResult` contains:

- stdout
- stderr
- exit_code
- updated prompt context
- emitted domain events

### Command families

- Filesystem: `ls`, `cd`, `pwd`, `cat`, `grep`, `find`, `touch`
- Reconnaissance: `nmap`, `netstat`, `ss`, `arp`, `dig`
- Networking: `curl`, `wget`, `ssh`, `scp`, `nc`
- Privilege: `sudo`, `su`, `id`, `whoami`
- Process inspection: `ps`, `top`, `systemctl`
- Utility: `echo`, `clear`, `help`, `history`

### Safety guardrails

- No command is ever passed to the host operating system
- All file paths resolve inside virtual filesystems only
- All network actions target simulated hosts and services only
- Payload strings are treated as mission content, not executable code
- Command outputs are generated from structured state, not shell passthrough

## 8. Simulation Engine Architecture

### Engine goals

- Realistic enough to teach authentic workflows
- Deterministic enough for testing and replay
- Fast enough for large concurrent student cohorts
- Extensible enough for new mission archetypes and vulnerability classes

### State model

The engine represents each mission session as a world state graph.

#### World state

- `hosts`: virtual machines and appliances
- `network_edges`: connectivity rules and pivot relationships
- `services`: exposed ports, protocols, banners, HTTP routes, and auth gates
- `filesystems`: directory trees, file contents, permissions, ownership
- `users`: accounts, groups, password material, sudoers rules, SSH keys
- `processes`: simulated running processes and service metadata
- `vulnerabilities`: preconditions, exploit triggers, consequences
- `objectives`: completion logic tied to events or state queries
- `inventory`: collected artifacts, credentials, tokens, and notes

### Key engine abstractions

#### `HostNode`

- hostname
- ip address
- os fingerprint
- reachable_from
- services
- filesystem root
- users
- privilege boundaries

#### `ServiceNode`

- protocol and port
- banner and metadata
- auth model
- route handlers or request simulators
- known vulnerabilities and conditions

#### `VulnerabilityDefinition`

- id and severity
- category
- discovery hints
- exploit trigger
- required evidence or prerequisites
- post-exploit consequences

#### `ObjectiveDefinition`

- id
- title
- success condition query
- optionality
- XP reward

### Execution model

1. Load published mission definition
2. Resolve mission variables and randomizable seeds
3. Materialize initial world state
4. Accept player commands as discrete intents
5. Run command handlers against current state
6. Emit state transition events
7. Persist snapshots and append events
8. Push UI patches to the client

### Event types

- `COMMAND_EXECUTED`
- `HOST_DISCOVERED`
- `SERVICE_ENUMERATED`
- `FILE_READ`
- `CREDENTIAL_OBTAINED`
- `VULNERABILITY_TRIGGERED`
- `PRIVILEGE_ESCALATED`
- `FLAG_CAPTURED`
- `OBJECTIVE_COMPLETED`
- `HINT_CONSUMED`
- `SESSION_COMPLETED`

### Determinism strategy

- Each session is assigned a seed
- Any randomized clues, salts, or banners derive from the seed
- Mission version plus seed fully define reproducible state
- Replays consume the event log and rebuild state transitions

### Performance strategy

- Keep active session state in memory or Redis-backed cache
- Persist full checkpoints on interval and on important milestones
- Store event log incrementally for replay and analytics
- Use coarse-grained snapshotting to avoid re-simulating every command on resume

### Anti-cheat strategy

- Server-authoritative state only
- Flags validated against session state, not plain client submission
- Replayable event log for suspicious activity review
- Rate limiting and anomaly detection on hint and session creation patterns

## 9. Mission Format Specification

Mission definitions should be written in YAML for readability and converted to JSON during validation and publishing.

### Schema overview

```yaml
schema_version: "1.0"
id: "mission.orion-data-breach"
slug: "orion-data-breach"
title: "Orion Data Breach"
summary: "Compromise Orion Tech's exposed web stack and pivot to the internal admin host."
difficulty: "intermediate"
category: "web"
tags:
  - "recon"
  - "sqli"
  - "priv-esc"
mode: "solo"
estimated_time_minutes: 45
entrypoint:
  host: "jumpbox"
  user: "player"
  cwd: "/home/player"
story:
  briefing: |
    Orion Tech hired you to evaluate a suspected breach path.
objectives:
  - id: "obj-recon"
    title: "Enumerate the exposed web server"
    type: "event"
    completion:
      event: "SERVICE_ENUMERATED"
      match:
        host: "orion-web"
network:
  hosts: []
flags: []
hints: []
scoring:
  base_xp: 300
  time_bonus: true
  hint_penalty: 25
```

### Required sections

- `schema_version`
- `id`
- `slug`
- `title`
- `summary`
- `difficulty`
- `category`
- `entrypoint`
- `story`
- `objectives`
- `network`
- `flags`
- `hints`
- `scoring`

### Optional sections

- `prerequisites`
- `recommended_commands`
- `artifacts`
- `achievements`
- `ai_mentor`
- `localization`
- `author_notes`
- `randomization`
- `classroom_overrides`

### Host schema

```yaml
network:
  hosts:
    - id: "orion-web"
      ip: "10.0.0.5"
      hostname: "orion-web"
      role: "web_server"
      os: "ubuntu_22_04"
      reachable_from:
        - "jumpbox"
      services:
        - name: "http"
          port: 80
          protocol: "tcp"
          banner: "nginx/1.22.1"
```

### Filesystem schema

```yaml
filesystem:
  directories:
    - path: "/var/www/html"
      owner: "www-data"
      group: "www-data"
      mode: "0755"
  files:
    - path: "/var/www/html/.env"
      owner: "www-data"
      group: "www-data"
      mode: "0640"
      contents: |
        DB_USER=orionapp
        DB_PASS=summer2025
```

### Vulnerability schema

```yaml
vulnerabilities:
  - id: "vuln-login-sqli"
    category: "sql_injection"
    location:
      service: "http"
      route: "/login"
    discovery:
      evidence:
        - "error-based login response"
    trigger:
      type: "http_request"
      match:
        method: "POST"
        route: "/login"
        payload_contains: "' OR '1'='1"
    effects:
      - type: "credential_disclosure"
        value: "db_admin_hash"
      - type: "flag_capture"
        flag_id: "flag-initial-access"
```

### Objective completion models

- Event based: completes when a matching event occurs
- State query based: completes when a path, service, or privilege condition becomes true
- Manual validation: completes when a submitted answer matches a validator
- Composite: requires multiple child objectives

### Validation rules

- Every referenced host, service, file, objective, and flag must resolve
- All flags must have unique IDs per mission version
- Vulnerability triggers must declare at least one required condition
- Mission must have at least one path from entrypoint to final objective
- Hints must align with objective order and difficulty

## 10. Gamification and Progression Design

### Progression systems

- Mission completion XP
- Objective XP
- First-clear bonuses
- Difficulty multipliers
- Achievement-based XP
- Seasonal ranking points

### Leveling formula

Use a smooth quadratic progression to prevent early grind walls while preserving long-term growth.

```text
xp_required_for_level_n = 100 * n^2 + 400 * n
```

### Achievement examples

- `FIRST_EXPLOIT`: trigger first successful exploit event
- `RECON_SPECIALIST`: enumerate all exposed services in three missions
- `NETWORK_GHOST`: complete a mission without using hints
- `ROOT_OPERATOR`: gain root privileges in ten sessions
- `FORENSICS_TRAIL`: recover all evidence artifacts in a forensic mission

### Difficulty tiers

- Beginner: single-host enumeration, basic files, straightforward flags
- Intermediate: chained web vulns, credentials reuse, simple privilege escalation
- Advanced: network segmentation, pivoting, multiple exploit paths, decoy evidence
- Expert: time pressure, composite objectives, stealth scoring, reverse engineering requirements

## 11. Frontend UI Architecture

### Application structure

Recommended Next.js routes:

- `/`
- `/missions`
- `/missions/[slug]`
- `/session/[sessionId]`
- `/profile/[handle]`
- `/leaderboards`
- `/classrooms/[id]`
- `/editor`
- `/editor/missions/[missionId]`

### State management

- React Server Components for catalog and static content
- React Query for API-backed client cache
- Zustand or lightweight session store for real-time terminal state
- WebSocket event reducer for terminal output, discoveries, and objective changes

### Main session layout

- Top panel: compact ops header with branding, connection state, XP, score, and active mission telemetry
- Left panel: persistent mission operations rail with briefing, objectives, flags, and hint controls
- Center panel: dominant xterm.js terminal, prompt state, command history, and streamed system feedback
- Right panel: dynamic network graph, discovered hosts, accessible routes, and service intelligence
- Bottom drawer: notes, inventory, credentials, artifacts, and optional contextual help

### UI component modules

- `OpsHeader`
- `TerminalPane`
- `PromptStatusBar`
- `MissionOpsRail`
- `MissionBriefingPanel`
- `ObjectivesPanel`
- `NetworkMapPanel`
- `NetworkIntelPanel`
- `InventoryDrawer`
- `HintsPanel`
- `SessionEventFeed`
- `FlagCaptureModal`
- `AchievementToast`

### Visual baseline

RootLab's first frontend should be explicitly inspired by the local `frontendexample/` reference project while evolving it into a more production-ready visual system. The intended baseline is:

- three-panel control-room composition on desktop
- compact header chrome instead of large hero sections
- dark graphite surfaces with green, cyan, and amber status accents
- mono-heavy telemetry and terminal labeling
- subtle scanlines, dotted grids, and signal pulses for atmosphere
- thin separators and tight radii over soft consumer-app cards

### Visual direction

- Dark operations-room base theme with disciplined neon accents
- Preserve the reference layout's utilitarian feel, but sharpen it with stronger typography and cleaner spacing
- Use `JetBrains Mono` for terminal and telemetry, paired with a more characterful display face such as `Space Grotesk` for headings
- Animated scan lines, network pulses, and objective transitions should be meaningful, sparse, and never distract from the terminal
- Strong contrast, keyboard accessibility, and mobile adaptation are mandatory

### Responsive behavior

- Desktop: keep the left mission rail and right network panel persistently visible around the terminal
- Tablet: collapse one side rail into tabs while keeping the terminal full-height
- Mobile: keep the terminal primary and move mission and network detail into sheets or drawers

### Frontend security model

- No secrets in the client
- Session actions only over authenticated APIs and WebSockets
- Mission solutions never fully embedded in immediately accessible client state
- Server-signed event payloads optional for tournament mode

## 12. Optional AI Mentor

The AI mentor should be optional, scoped, and safety constrained.

### Responsibilities

- Suggest next investigative steps
- Point players toward underused evidence
- Explain concepts after partial discovery
- Offer adaptive hint tiers without revealing final answers immediately

### Guardrails

- Never generate instructions targeting real systems
- Never reveal hidden flag values directly
- Only reference the player's current session context
- Default to nudges, then procedural hints, then stronger hints after explicit escalation

### Suggested implementation

- Backend endpoint: `POST /api/v1/sessions/{session_id}/mentor/hint`
- Context window composed from current objectives, discovered hosts, recent commands, and hints already consumed
- Prompt template tuned to coaching rather than solution dumping

## 13. Security Requirements

- No real command execution
- No real network access from the simulation engine on behalf of player commands
- Mission assets scanned and schema-validated before publish
- Strict output escaping in terminal and markdown-rendered panels
- Role-based content moderation and audit trails
- Classroom privacy controls for student data
- Versioned mission content and reproducible builds

## 14. Observability and Operations

### Metrics

- active sessions
- command latency by command family
- session completion rate
- hint usage rate
- mission drop-off stage
- WebSocket disconnect rate
- publish validation failure rate

### Logging

- structured JSON logs for API requests and engine events
- redaction for auth tokens and personal data
- correlation IDs across HTTP and WebSocket requests

### Testing strategy

- unit tests for command handlers and parsers
- contract tests for API schemas
- golden tests for mission outputs
- deterministic replay tests for engine events
- end-to-end browser tests for session flows
- schema validation tests for official missions

## 15. Development Roadmap

### Phase 0: Foundation

- Establish repository, CI, linting, formatting, and local Docker environment
- Define mission schema and validator
- Build authentication, mission catalog, and profile basics

### Phase 1: Single-player core

- Implement terminal session transport
- Ship core command families: filesystem, recon, networking, privilege basics
- Deliver beginner and intermediate official missions
- Add progress tracking, XP, and achievements

### Phase 2: Mission authoring

- Build draft mission workflow and validation UI
- Add preview sandbox for creators
- Support versioning, publish, and fork operations

### Phase 3: Community and classrooms

- Leaderboards, writeups, moderation, and creator profiles
- Classroom assignments, cohort progress, instructor dashboards
- Team sessions and shared notes

### Phase 4: Advanced simulation

- Richer web app emulation
- Lateral movement and segmented network rules
- Reverse engineering and forensics mission packs
- Replay viewer and analytics dashboards

### Phase 5: AI mentor and tournaments

- Context-aware hinting
- Seasonal events and tournament ladders
- Anti-cheat replay review tools

## 16. Example Missions

### Mission 1: Orion Data Breach

- Tier: Intermediate
- Focus: recon, web enumeration, SQL injection, credential harvest, privilege escalation
- Narrative: assess a suspected breach path through Orion Tech's public web stack
- Outcome: compromise the web server, discover reused credentials, reach root on the internal admin host

### Mission 2: Northbridge Relay

- Tier: Advanced
- Focus: segmented networking, SSH pivoting, log analysis, secret recovery, sudo abuse
- Narrative: investigate a relay node suspected of forwarding traffic into a research enclave
- Outcome: enumerate the relay, pivot into the enclave, recover evidence, and gain privileged access

## 17. GitHub-Ready Repository Structure

```text
rootlab/
  .github/
    workflows/
      ci.yml
  .devcontainer/
    devcontainer.json
  frontend/
    app/
    components/
    features/
    lib/
    public/
    styles/
    tests/
    package.json
  backend/
    app/
      api/
      core/
      db/
      models/
      schemas/
      services/
      workers/
    tests/
    pyproject.toml
  engine/
    rootlab_engine/
      parser/
      runtime/
      commands/
      state/
      validators/
    tests/
    pyproject.toml
  missions/
    official/
      beginner/
      intermediate/
      advanced/
      expert/
    examples/
    schemas/
  packages/
    types/
    config/
  infra/
    docker/
    compose/
    k8s/
  docs/
    technical-spec.md
    mission-authoring-guide.md
    api/
    architecture/
  scripts/
  CONTRIBUTING.md
  LICENSE
  README.md
```

### Repository conventions

- Official missions live under `missions/official/` and are immutable once versioned
- Mission JSON schemas live under `missions/schemas/`
- Shared API and event contracts live under `packages/types/`
- The engine remains framework-agnostic and importable by backend workers
- Documentation is treated as a first-class surface for contributors and educators

## 18. Recommended Initial Build Order

1. Mission schema and validator
2. Session and event persistence model
3. Command parser and five foundational commands
4. Terminal transport and session UI
5. Two official missions with deterministic tests
6. XP and achievement pipeline
7. Mission editor draft workflow

This sequence delivers a usable open-source MVP quickly while protecting the core architectural constraints needed for a serious long-term platform.
