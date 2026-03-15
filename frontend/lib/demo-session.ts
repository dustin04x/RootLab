export type OutputTone = "normal" | "system" | "success" | "warning" | "error";
export type ObjectiveStatus = "active" | "locked" | "complete";
export type HostStatus = "entry" | "shadow" | "discovered" | "compromised";

export interface CommandLine {
  tone: OutputTone;
  text: string;
}

export interface ObjectiveModel {
  id: string;
  title: string;
  description: string;
  reward: number;
  status: ObjectiveStatus;
}

export interface FlagModel {
  id: string;
  label: string;
  value: string;
  reward: number;
  captured: boolean;
}

export interface CredentialModel {
  id: string;
  label: string;
  username: string;
  secret: string;
  source: string;
  acquired: boolean;
}

export interface ArtifactModel {
  id: string;
  label: string;
  kind: string;
  summary: string;
  acquired: boolean;
}

export interface HintModel {
  id: string;
  title: string;
  text: string;
  unlocked: boolean;
  used: boolean;
}

export interface TimelineEvent {
  id: string;
  label: string;
  time: string;
  tone: OutputTone;
}

export interface HostModel {
  id: string;
  hostname: string;
  label: string;
  role: string;
  ip: string;
  x: number;
  y: number;
  status: HostStatus;
  services: string[];
  summary: string;
  routeHint: string;
  intel: string[];
}

export interface PromptContext {
  hostId: string;
  user: string;
  cwd: string;
}

export interface DemoSessionState {
  missionTitle: string;
  missionCode: string;
  difficulty: string;
  briefing: string;
  tags: string[];
  xp: number;
  score: number;
  seasonRank: number;
  selectedHostId: string;
  currentContext: PromptContext;
  objectives: ObjectiveModel[];
  flags: FlagModel[];
  credentials: CredentialModel[];
  artifacts: ArtifactModel[];
  hints: HintModel[];
  notes: string[];
  hosts: HostModel[];
  timeline: TimelineEvent[];
  commandHistory: string[];
}

export interface CommandExecution {
  nextState: DemoSessionState;
  lines: CommandLine[];
  clearScreen?: boolean;
}

export const NETWORK_EDGES: Array<[string, string]> = [
  ["jumpbox", "gateway"],
  ["gateway", "orion-web"],
  ["orion-web", "orion-db"],
  ["orion-web", "orion-admin"],
  ["orion-db", "orion-admin"],
];

export const COMMAND_NAMES = [
  "help",
  "mission",
  "network",
  "notes",
  "hint",
  "history",
  "pwd",
  "whoami",
  "hostname",
  "ls",
  "cat",
  "grep",
  "find",
  "cd",
  "exit",
  "nmap",
  "curl",
  "ssh",
  "sudo",
  "clear",
] as const;

export const QUICK_COMMANDS = [
  "help",
  "mission",
  "network",
  "nmap 10.0.0.0/24",
  "curl http://10.0.0.5",
  "curl http://10.0.0.5/.env",
  "ssh opsadmin@10.0.0.9",
  "sudo -l",
  "sudo tar rootlab-backup",
  "hint",
] as const;

export const CURL_TARGETS = ["http://10.0.0.5", "http://10.0.0.5/.env"] as const;
export const SSH_TARGETS = ["opsadmin@10.0.0.9", "opsadmin@orion-admin"] as const;

function xpForLevel(level: number) {
  return 100 * level * level + 400 * level;
}

export function getLevelInfo(xp: number) {
  let level = 1;

  while (xp >= xpForLevel(level + 1)) {
    level += 1;
  }

  return {
    level,
    currentLevelFloor: xpForLevel(level),
    nextLevelXp: xpForLevel(level + 1),
  };
}

export function getPromptLabel(state: DemoSessionState) {
  const host = state.hosts.find((item) => item.id === state.currentContext.hostId);
  return `${state.currentContext.user}@${host?.hostname ?? "rootlab"}:${state.currentContext.cwd}`;
}

export function getCompletionStats(state: DemoSessionState) {
  const completedObjectives = state.objectives.filter(
    (objective) => objective.status === "complete",
  ).length;
  const capturedFlags = state.flags.filter((flag) => flag.captured).length;

  return {
    completedObjectives,
    objectiveCount: state.objectives.length,
    capturedFlags,
    totalFlags: state.flags.length,
  };
}

export function normalizeSimPath(path: string) {
  const segments = path.split("/");
  const normalized: string[] = [];

  for (const segment of segments) {
    if (!segment || segment === ".") {
      continue;
    }

    if (segment === "..") {
      normalized.pop();
      continue;
    }

    normalized.push(segment);
  }

  return normalized.length ? `/${normalized.join("/")}` : "/";
}

export function resolveSimPath(cwd: string, path: string) {
  if (path.startsWith("/")) {
    return normalizeSimPath(path);
  }

  return normalizeSimPath(`${cwd === "/" ? "" : cwd}/${path}`);
}

export function createInitialDemoState(): DemoSessionState {
  return {
    missionTitle: "Orion Data Breach",
    missionCode: "ORION-DB-01",
    difficulty: "Intermediate",
    briefing:
      "Reconstruct a suspected breach path from Orion Tech's exposed web edge to its internal admin estate without touching real infrastructure.",
    tags: ["web", "recon", "credential-reuse", "priv-esc"],
    xp: 2460,
    score: 820,
    seasonRank: 118,
    selectedHostId: "orion-web",
    currentContext: {
      hostId: "jumpbox",
      user: "player",
      cwd: "/home/player",
    },
    objectives: [
      {
        id: "obj-recon",
        title: "Map the exposed subnet",
        description: "Enumerate reachable hosts and exposed services from the jumpbox.",
        reward: 140,
        status: "active",
      },
      {
        id: "obj-creds",
        title: "Recover operator credentials",
        description: "Pull a sensitive artifact from the exposed web edge.",
        reward: 220,
        status: "locked",
      },
      {
        id: "obj-admin",
        title: "Reach the internal admin host",
        description: "Use recovered operator access to enter the segmented admin system.",
        reward: 260,
        status: "locked",
      },
      {
        id: "obj-root",
        title: "Escalate to root",
        description: "Abuse the delegated backup path and claim the final flag.",
        reward: 320,
        status: "locked",
      },
    ],
    flags: [
      {
        id: "flag-initial-access",
        label: "Initial Access",
        value: "FLAG{initial_access}",
        reward: 100,
        captured: false,
      },
      {
        id: "flag-operator-creds",
        label: "Credential Cache",
        value: "FLAG{credential_cache}",
        reward: 120,
        captured: false,
      },
      {
        id: "flag-admin-shell",
        label: "Admin Shell",
        value: "FLAG{admin_shell}",
        reward: 150,
        captured: false,
      },
      {
        id: "flag-root-access",
        label: "Root Access",
        value: "FLAG{root_access}",
        reward: 200,
        captured: false,
      },
    ],
    credentials: [
      {
        id: "opsadmin",
        label: "Operations SSH",
        username: "opsadmin",
        secret: "locked",
        source: "Pending discovery",
        acquired: false,
      },
    ],
    artifacts: [
      {
        id: "briefing",
        label: "Incident brief",
        kind: "brief",
        summary: "Engagement scope and initial subnet notes.",
        acquired: true,
      },
      {
        id: "env-dump",
        label: "Exposed environment file",
        kind: "config",
        summary: "Web edge application secrets and operator metadata.",
        acquired: false,
      },
      {
        id: "sudo-policy",
        label: "Backup sudo policy",
        kind: "privilege",
        summary: "Delegated tar execution on the admin host.",
        acquired: false,
      },
    ],
    hints: [
      {
        id: "hint-1",
        title: "Initial recon",
        text: "Use the jumpbox to probe the 10.0.0.0/24 segment before guessing at services.",
        unlocked: true,
        used: false,
      },
      {
        id: "hint-2",
        title: "Credential source",
        text: "The public web edge leaks more than banners. Inspect exposed application artifacts.",
        unlocked: false,
        used: false,
      },
      {
        id: "hint-3",
        title: "Privilege boundary",
        text: "Once on the admin host, inspect delegated commands before chasing noisy exploits.",
        unlocked: false,
        used: false,
      },
    ],
    notes: [
      "All activity is simulated. Commands never execute on real infrastructure.",
      "The terminal is the primary interface; supporting panels reflect authoritative server state.",
      "Try `help`, `mission`, `nmap 10.0.0.0/24`, `curl http://10.0.0.5/.env`, `ssh opsadmin@10.0.0.9`, and `sudo -l`.",
    ],
    hosts: [
      {
        id: "jumpbox",
        hostname: "jumpbox",
        label: "Jumpbox",
        role: "entry relay",
        ip: "10.0.0.2",
        x: 42,
        y: 150,
        status: "entry",
        services: ["operator shell"],
        summary: "Isolated operator entry host seeded by RootLab.",
        routeHint: "Starting foothold for all simulated actions.",
        intel: ["Outbound visibility to the Orion perimeter segment."],
      },
      {
        id: "gateway",
        hostname: "gateway",
        label: "Gateway",
        role: "edge gateway",
        ip: "10.0.0.1",
        x: 128,
        y: 74,
        status: "discovered",
        services: ["ssh"],
        summary: "Simulated network edge with sparse observability.",
        routeHint: "Transit only. No mission-critical data here.",
        intel: ["Responds to scans from the jumpbox.", "No exploitation path required."],
      },
      {
        id: "orion-web",
        hostname: "orion-web",
        label: "Orion Web",
        role: "web edge",
        ip: "10.0.0.5",
        x: 176,
        y: 156,
        status: "shadow",
        services: ["22/tcp", "80/tcp"],
        summary: "Public web node hosting Orion's employee access portal.",
        routeHint: "Primary foothold for the mission's breach chain.",
        intel: ["HTTP surface hides configuration metadata.", "Compromise reveals the admin route."],
      },
      {
        id: "orion-db",
        hostname: "orion-db",
        label: "Orion DB",
        role: "data tier",
        ip: "10.0.0.7",
        x: 286,
        y: 118,
        status: "shadow",
        services: ["5432/tcp"],
        summary: "Internal database service reachable from the web tier.",
        routeHint: "Enumeration target only during this demo build.",
        intel: ["Filtered from the jumpbox until the perimeter is scanned."],
      },
      {
        id: "orion-admin",
        hostname: "orion-admin",
        label: "Admin Node",
        role: "internal administration",
        ip: "10.0.0.9",
        x: 314,
        y: 228,
        status: "shadow",
        services: ["22/tcp", "backup policy"],
        summary: "Segmented administration system used by Orion operations staff.",
        routeHint: "Revealed only after recovering operator credentials.",
        intel: ["Delegated backup actions create the final privilege boundary."],
      },
    ],
    timeline: [
      {
        id: "evt-bootstrap",
        label: "Simulation session bootstrapped on jumpbox relay.",
        time: "00:00",
        tone: "system",
      },
      {
        id: "evt-brief",
        label: "Mission package loaded: Orion Data Breach.",
        time: "00:01",
        tone: "system",
      },
    ],
    commandHistory: [],
  };
}

function addTimeline(state: DemoSessionState, label: string, tone: OutputTone) {
  const time = `00:${String(state.timeline.length + 1).padStart(2, "0")}`;
  state.timeline.unshift({
    id: `evt-${state.timeline.length + 1}`,
    label,
    time,
    tone,
  });
}

function completeObjective(state: DemoSessionState, id: string) {
  const objective = state.objectives.find((item) => item.id === id);

  if (!objective || objective.status === "complete") {
    return;
  }

  objective.status = "complete";
  state.xp += objective.reward;
  state.score += objective.reward * 2;
}

function activateObjective(state: DemoSessionState, id: string) {
  const objective = state.objectives.find((item) => item.id === id);

  if (objective && objective.status === "locked") {
    objective.status = "active";
  }
}

function captureFlag(state: DemoSessionState, id: string) {
  const flag = state.flags.find((item) => item.id === id);

  if (flag && !flag.captured) {
    flag.captured = true;
    state.xp += flag.reward;
    state.score += flag.reward * 2;
  }
}

function acquireCredential(state: DemoSessionState, id: string, secret: string, source: string) {
  const credential = state.credentials.find((item) => item.id === id);

  if (credential && !credential.acquired) {
    credential.acquired = true;
    credential.secret = secret;
    credential.source = source;
  }
}

function acquireArtifact(state: DemoSessionState, id: string) {
  const artifact = state.artifacts.find((item) => item.id === id);

  if (artifact) {
    artifact.acquired = true;
  }
}

function updateHost(state: DemoSessionState, hostId: string, status: HostStatus) {
  const host = state.hosts.find((item) => item.id === hostId);

  if (!host) {
    return;
  }

  const rank: Record<HostStatus, number> = {
    shadow: 0,
    discovered: 1,
    compromised: 2,
    entry: 3,
  };

  if (rank[status] > rank[host.status]) {
    host.status = status;
  }
}

export function getDirectoryEntries(
  state: DemoSessionState,
  path = state.currentContext.cwd,
) {
  const normalizedPath = normalizeSimPath(path);
  const { hostId, user } = state.currentContext;

  if (hostId === "jumpbox" && normalizedPath === "/") {
    return ["home/"];
  }

  if (hostId === "jumpbox" && normalizedPath === "/home") {
    return ["player/"];
  }

  if (hostId === "jumpbox" && normalizedPath === "/home/player") {
    return ["briefing.txt", "toolkit/", "discovered_hosts.md"];
  }

  if (hostId === "jumpbox" && normalizedPath === "/home/player/toolkit") {
    return ["command-cheatsheet.txt", "network-notes.txt"];
  }

  if (hostId === "orion-admin" && normalizedPath === "/") {
    return user === "root" ? ["home/", "root/"] : ["home/"];
  }

  if (hostId === "orion-admin" && normalizedPath === "/home") {
    return ["opsadmin/"];
  }

  if (hostId === "orion-admin" && normalizedPath === "/home/opsadmin") {
    return ["deploy.sh", "audit.log"];
  }

  if (hostId === "orion-admin" && normalizedPath === "/root" && user === "root") {
    return ["flag.txt", "incident.txt"];
  }

  return [];
}

function getAccessibleFileContents(state: DemoSessionState) {
  const discoveredHosts = state.hosts
    .filter((host) => host.status !== "shadow")
    .map((host) => `- ${host.ip}  ${host.hostname}  ${host.services.join(", ")}`)
    .join("\n");

  const files: Record<string, string> = {
    "/home/player/briefing.txt":
      "Target segment: 10.0.0.0/24. Recreate the suspected attack path from the public edge inward.",
    "/home/player/discovered_hosts.md":
      discoveredHosts || "No enumerated hosts recorded yet.",
    "/home/player/toolkit/command-cheatsheet.txt": [
      "Recon: nmap 10.0.0.0/24",
      "Web probe: curl http://10.0.0.5/.env",
      "Pivot: ssh opsadmin@10.0.0.9",
      "Priv review: sudo -l",
    ].join("\n"),
    "/home/player/toolkit/network-notes.txt":
      "Orion path hypothesis: public web edge -> leaked credential -> internal admin host.",
  };

  if (state.currentContext.hostId === "orion-admin") {
    files["/home/opsadmin/deploy.sh"] = [
      "#!/bin/bash",
      "sudo /usr/bin/tar -czf /var/backups/web.tar.gz /var/www/html",
    ].join("\n");
    files["/home/opsadmin/audit.log"] = [
      "00:12 backup-runner :: archive rotation completed",
      "00:13 backup-runner :: sudo tar delegated by policy",
      "00:14 backup-runner :: no interactive shell expected",
    ].join("\n");
  }

  if (state.currentContext.user === "root") {
    files["/root/flag.txt"] = "FLAG{root_access}";
    files["/root/incident.txt"] =
      "RootLab note: privilege boundary reproduced through simulated backup misconfiguration.";
  }

  return files;
}

function listDirectory(state: DemoSessionState, path?: string): CommandLine[] {
  const targetPath = path ? resolveSimPath(state.currentContext.cwd, path) : state.currentContext.cwd;
  const entries = getDirectoryEntries(state, targetPath);

  if (entries.length) {
    return [{ tone: "normal", text: entries.join("   ") }];
  }

  if (targetPath.startsWith("/root") && state.currentContext.user !== "root") {
    return [{ tone: "error", text: `ls: cannot open directory '${path ?? targetPath}': Permission denied` }];
  }

  if (getAccessibleFileContents(state)[targetPath]) {
    return [{ tone: "error", text: `ls: cannot access '${path ?? targetPath}': Not a directory` }];
  }

  return [{ tone: "error", text: `ls: cannot access '${path ?? targetPath}': No such file or directory` }];
}

function catFile(state: DemoSessionState, path: string): CommandLine[] {
  const normalized = resolveSimPath(state.currentContext.cwd, path);

  if (normalized.startsWith("/root") && state.currentContext.user !== "root") {
    return [{ tone: "error", text: `cat: ${path}: Permission denied` }];
  }

  const files = getAccessibleFileContents(state);
  const content = files[normalized];

  if (content) {
    const tone = normalized === "/root/flag.txt" ? "success" : "normal";

    return content.split("\n").map((text) => ({ tone, text }));
  }

  return [{ tone: "error", text: `cat: ${path}: No such file or directory` }];
}

function grepFile(state: DemoSessionState, needle: string, path: string): CommandLine[] {
  const normalized = resolveSimPath(state.currentContext.cwd, path);
  const files = getAccessibleFileContents(state);
  const content = files[normalized];

  if (!content) {
    return [{ tone: "error", text: `grep: ${path}: No such file or directory` }];
  }

  const matches = content
    .split("\n")
    .filter((line) => line.toLowerCase().includes(needle.toLowerCase()));

  if (!matches.length) {
    return [{ tone: "warning", text: `grep: no matches for '${needle}' in ${path}` }];
  }

  return matches.map((text) => ({ tone: "normal" as const, text }));
}

function wildcardToRegExp(pattern: string) {
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
  return new RegExp(`^${escaped}$`, "i");
}

function findFiles(state: DemoSessionState, rootInput?: string, namePattern?: string): CommandLine[] {
  const files = Object.keys(getAccessibleFileContents(state));
  const searchRoot = rootInput ? resolveSimPath(state.currentContext.cwd, rootInput) : state.currentContext.cwd;
  const rootPrefix = searchRoot === "/" ? "/" : `${searchRoot}/`;
  const matcher = namePattern ? wildcardToRegExp(namePattern) : null;

  const matches = files.filter((file) => {
    if (!(file === searchRoot || file.startsWith(rootPrefix))) {
      return false;
    }

    if (!matcher) {
      return true;
    }

    const baseName = file.split("/").pop() ?? file;
    return matcher.test(baseName);
  });

  if (!matches.length) {
    return [{ tone: "warning", text: "find: no matching files in the simulated scope" }];
  }

  return matches.map((text) => ({ tone: "normal" as const, text }));
}

function revealHint(state: DemoSessionState): CommandLine[] {
  const nextHint = state.hints.find((hint) => hint.unlocked && !hint.used);

  if (!nextHint) {
    return [{ tone: "warning", text: "No additional hints are currently unlocked." }];
  }

  nextHint.used = true;
  addTimeline(state, `Hint consumed: ${nextHint.title}.`, "warning");

  return [
    { tone: "warning", text: `[${nextHint.title}] ${nextHint.text}` },
    { tone: "system", text: "Hint cost applied in progression telemetry only." },
  ];
}

function missionSummary(state: DemoSessionState): CommandLine[] {
  const stats = getCompletionStats(state);

  return [
    { tone: "system", text: `Mission ${state.missionCode} :: ${state.missionTitle}` },
    { tone: "normal", text: `Difficulty: ${state.difficulty}` },
    { tone: "normal", text: `Briefing: ${state.briefing}` },
    { tone: "normal", text: "" },
    ...state.objectives.map((objective) => ({
      tone:
        objective.status === "complete"
          ? ("success" as const)
          : objective.status === "active"
            ? ("normal" as const)
            : ("system" as const),
      text: `${objective.status === "complete" ? "[x]" : objective.status === "active" ? "[ ]" : "[-]"} ${objective.title}`,
    })),
    { tone: "normal", text: "" },
    {
      tone: "system",
      text: `Progress ${stats.completedObjectives}/${stats.objectiveCount} objectives, ${stats.capturedFlags}/${stats.totalFlags} flags.`,
    },
  ];
}

function networkSummary(state: DemoSessionState): CommandLine[] {
  const visibleHosts = state.hosts.filter((host) => host.status !== "shadow");

  if (!visibleHosts.length) {
    return [{ tone: "warning", text: "No hosts have been discovered yet." }];
  }

  return visibleHosts.map((host) => ({
    tone: host.status === "compromised" ? ("success" as const) : ("normal" as const),
    text: `${host.ip.padEnd(12, " ")} ${host.hostname.padEnd(12, " ")} ${host.services.join(", ")}`,
  }));
}

export function executeDemoCommand(
  state: DemoSessionState,
  rawInput: string,
): CommandExecution {
  const input = rawInput.trim();
  const nextState = structuredClone(state) as DemoSessionState;

  if (input) {
    nextState.commandHistory.push(input);
  }

  if (!input) {
    return {
      nextState,
      lines: [],
    };
  }

  if (input === "clear") {
    addTimeline(nextState, "Terminal viewport cleared by operator.", "system");
    return {
      nextState,
      lines: [],
      clearScreen: true,
    };
  }

  if (input === "help") {
    return {
      nextState,
      lines: [
        { tone: "system", text: "RootLab simulator commands" },
        { tone: "normal", text: "help, mission, network, notes, hint, history" },
        { tone: "normal", text: "pwd, whoami, hostname, ls [path], cat <file>, grep <text> <file>" },
        { tone: "normal", text: "cd <path>, find [path] -name <pattern>, exit" },
        { tone: "normal", text: "nmap 10.0.0.0/24, curl http://10.0.0.5/.env" },
        { tone: "normal", text: "ssh opsadmin@10.0.0.9, ssh opsadmin@orion-admin, sudo -l, sudo tar rootlab-backup" },
      ],
    };
  }

  if (input === "mission") {
    return { nextState, lines: missionSummary(nextState) };
  }

  if (input === "network") {
    return { nextState, lines: networkSummary(nextState) };
  }

  if (input === "notes") {
    return {
      nextState,
      lines: nextState.notes.map((note) => ({ tone: "normal" as const, text: `- ${note}` })),
    };
  }

  if (input === "hint") {
    return { nextState, lines: revealHint(nextState) };
  }

  if (input === "history") {
    return {
      nextState,
      lines: nextState.commandHistory.map((command, index) => ({
        tone: "normal" as const,
        text: `${String(index + 1).padStart(2, "0")}  ${command}`,
      })),
    };
  }

  if (input === "pwd") {
    return {
      nextState,
      lines: [{ tone: "normal", text: nextState.currentContext.cwd }],
    };
  }

  if (input === "whoami") {
    return {
      nextState,
      lines: [{ tone: "normal", text: nextState.currentContext.user }],
    };
  }

  if (input === "hostname") {
    return {
      nextState,
      lines: [
        {
          tone: "normal",
          text:
            nextState.hosts.find((host) => host.id === nextState.currentContext.hostId)?.hostname ??
            "rootlab",
        },
      ],
    };
  }

  if (input === "ls" || input.startsWith("ls ")) {
    const [, target] = input.split(/\s+/, 2);
    return {
      nextState,
      lines: listDirectory(nextState, target),
    };
  }

  if (input.startsWith("cat ")) {
    const [, path] = input.split(/\s+/, 2);
    const lines = catFile(nextState, path);
    if (resolveSimPath(nextState.currentContext.cwd, path) === "/root/flag.txt" && nextState.currentContext.user === "root") {
      addTimeline(nextState, "Final root flag reviewed in terminal.", "success");
    }
    return { nextState, lines };
  }

  if (input.startsWith("grep ")) {
    const [, needle, path] = input.split(/\s+/, 3);

    if (!needle || !path) {
      return {
        nextState,
        lines: [{ tone: "error", text: "usage: grep <search> <file>" }],
      };
    }

    return {
      nextState,
      lines: grepFile(nextState, needle, path),
    };
  }

  if (input === "find" || input.startsWith("find ")) {
    const tokens = input.split(/\s+/);
    const nameIndex = tokens.indexOf("-name");
    const rootInput =
      tokens.length > 1 && tokens[1] !== "-name"
        ? tokens[1]
        : undefined;
    const namePattern = nameIndex >= 0 ? tokens[nameIndex + 1] : undefined;

    return {
      nextState,
      lines: findFiles(nextState, rootInput, namePattern),
    };
  }

  if (input.startsWith("cd ")) {
    const target = input.slice(3).trim();
    const homeDirectory =
      nextState.currentContext.hostId === "jumpbox" ? "/home/player" : "/home/opsadmin";

    if (!target || target === "~") {
      nextState.currentContext.cwd = homeDirectory;
      return { nextState, lines: [] };
    }

    const resolvedTarget = resolveSimPath(nextState.currentContext.cwd, target);

    if (resolvedTarget.startsWith("/root") && nextState.currentContext.user !== "root") {
      if (nextState.currentContext.user !== "root") {
        return {
          nextState,
          lines: [{ tone: "error", text: "cd: permission denied: /root" }],
        };
      }
    }

    if (getDirectoryEntries(nextState, resolvedTarget).length) {
      nextState.currentContext.cwd = resolvedTarget;
      return { nextState, lines: [] };
    }

    return {
      nextState,
      lines: [{ tone: "error", text: `cd: no such file or directory: ${target}` }],
    };
  }

  if (input === "exit") {
    if (nextState.currentContext.hostId !== "jumpbox") {
      nextState.currentContext = {
        hostId: "jumpbox",
        user: "player",
        cwd: "/home/player",
      };
      nextState.selectedHostId = "jumpbox";
      addTimeline(nextState, "Operator returned to the jumpbox relay.", "system");
      return {
        nextState,
        lines: [{ tone: "system", text: "Connection closed. Session returned to jumpbox." }],
      };
    }

    return {
      nextState,
      lines: [{ tone: "warning", text: "Already at the jumpbox root session." }],
    };
  }

  if (input.startsWith("nmap")) {
    updateHost(nextState, "orion-web", "discovered");
    updateHost(nextState, "orion-db", "discovered");
    nextState.selectedHostId = "orion-web";
    completeObjective(nextState, "obj-recon");
    activateObjective(nextState, "obj-creds");
    nextState.hints[1].unlocked = true;
    addTimeline(nextState, "Perimeter scan enumerated the Orion web and database tiers.", "success");

    return {
      nextState,
      lines: [
        { tone: "system", text: "rootlab scan profile :: 10.0.0.0/24" },
        { tone: "normal", text: "10.0.0.1    gateway      22/tcp ssh" },
        { tone: "normal", text: "10.0.0.5    orion-web    22/tcp ssh, 80/tcp http" },
        { tone: "normal", text: "10.0.0.7    orion-db     5432/tcp postgresql" },
        { tone: "success", text: "Discovery recorded. Mission telemetry updated." },
      ],
    };
  }

  if (input.startsWith("curl ")) {
    if (input.includes("http://10.0.0.5/.env")) {
      updateHost(nextState, "orion-web", "compromised");
      updateHost(nextState, "orion-admin", "discovered");
      nextState.selectedHostId = "orion-admin";
      acquireCredential(nextState, "opsadmin", "Summer2025!", "orion-web /.env");
      acquireArtifact(nextState, "env-dump");
      completeObjective(nextState, "obj-creds");
      activateObjective(nextState, "obj-admin");
      captureFlag(nextState, "flag-initial-access");
      captureFlag(nextState, "flag-operator-creds");
      nextState.hints[2].unlocked = true;
      addTimeline(nextState, "Sensitive environment data leaked operator credentials.", "success");

      return {
        nextState,
        lines: [
          { tone: "system", text: "HTTP 200 :: / .env response captured" },
          { tone: "normal", text: "DB_HOST=10.0.0.7" },
          { tone: "normal", text: "OPS_ADMIN=opsadmin" },
          { tone: "normal", text: "OPS_PASS=Summer2025!" },
          { tone: "success", text: "Credential cache ingested. Internal admin route exposed." },
        ],
      };
    }

    if (input.includes("http://10.0.0.5")) {
      return {
        nextState,
        lines: [
          { tone: "system", text: "HTTP 200 :: Orion employee access portal" },
          { tone: "normal", text: "<html><title>Orion Access</title><body>Diagnostic headers enabled.</body></html>" },
          { tone: "warning", text: "Response metadata suggests a configuration artifact may be reachable." },
        ],
      };
    }

    return {
      nextState,
      lines: [{ tone: "error", text: "curl: target did not match a simulated route" }],
    };
  }

  if (input.startsWith("ssh ")) {
    const opsCredential = nextState.credentials.find((item) => item.id === "opsadmin");

    if (!opsCredential?.acquired) {
      return {
        nextState,
        lines: [
          { tone: "system", text: "Attempting remote session..." },
          { tone: "error", text: "Permission denied. No valid credential material present." },
        ],
      };
    }

    if (input.includes("opsadmin@10.0.0.9") || input.includes("opsadmin@orion-admin")) {
      nextState.currentContext = {
        hostId: "orion-admin",
        user: "opsadmin",
        cwd: "/home/opsadmin",
      };
      nextState.selectedHostId = "orion-admin";
      updateHost(nextState, "orion-admin", "compromised");
      completeObjective(nextState, "obj-admin");
      activateObjective(nextState, "obj-root");
      captureFlag(nextState, "flag-admin-shell");
      addTimeline(nextState, "Operator established an authenticated session to the admin node.", "success");

      return {
        nextState,
        lines: [
          { tone: "system", text: "Connection established :: opsadmin@orion-admin" },
          { tone: "normal", text: "Ubuntu 22.04 LTS :: delegated backup runner online." },
          { tone: "warning", text: "Privilege review recommended before exploit development." },
        ],
      };
    }

    return {
      nextState,
      lines: [{ tone: "error", text: "ssh: simulated route unavailable for the requested target" }],
    };
  }

  if (input === "sudo -l") {
    if (nextState.currentContext.hostId !== "orion-admin") {
      return {
        nextState,
        lines: [{ tone: "error", text: "sudo: unable to resolve delegated privileges from this host" }],
      };
    }

    acquireArtifact(nextState, "sudo-policy");
    addTimeline(nextState, "Backup policy inspection exposed delegated tar execution.", "warning");

    return {
      nextState,
      lines: [
        { tone: "system", text: "Matching Defaults entries for opsadmin on orion-admin:" },
        { tone: "normal", text: "    env_reset, mail_badpass, secure_path=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin" },
        { tone: "normal", text: "User opsadmin may run the following commands on orion-admin:" },
        { tone: "warning", text: "    (root) NOPASSWD: /usr/bin/tar" },
      ],
    };
  }

  if (input.startsWith("sudo tar") || input.startsWith("sudo /usr/bin/tar")) {
    if (nextState.currentContext.hostId !== "orion-admin") {
      return {
        nextState,
        lines: [{ tone: "error", text: "sudo: tar path unavailable outside the admin node" }],
      };
    }

    nextState.currentContext.user = "root";
    nextState.currentContext.cwd = "/root";
    captureFlag(nextState, "flag-root-access");
    completeObjective(nextState, "obj-root");
    addTimeline(nextState, "Simulated privilege boundary bypass completed. Root context granted.", "success");

    return {
      nextState,
      lines: [
        { tone: "system", text: "Delegated tar execution accepted by policy." },
        { tone: "success", text: "Privilege boundary reproduced inside the simulator. Root context active." },
        { tone: "success", text: "Final flag staged at /root/flag.txt" },
      ],
    };
  }

  return {
    nextState,
    lines: [{ tone: "error", text: `${input.split(/\s+/)[0]}: command not found in the simulated environment` }],
  };
}
