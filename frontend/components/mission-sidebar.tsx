import {
  AlertTriangle,
  BookOpen,
  Flag,
  Package,
  ScrollText,
  Target,
} from "lucide-react";
import { getCompletionStats, type DemoSessionState } from "@/lib/demo-session";

interface MissionSidebarProps {
  session: DemoSessionState;
}

function objectiveIndicator(status: DemoSessionState["objectives"][number]["status"]) {
  if (status === "complete") {
    return {
      box: "border-primary bg-primary/20",
      mark: "x",
      text: "text-muted-foreground line-through",
      meta: "complete",
    };
  }

  if (status === "active") {
    return {
      box: "border-accent/40 bg-accent/15",
      mark: "!",
      text: "text-foreground",
      meta: "active",
    };
  }

  return {
    box: "border-muted-foreground/30",
    mark: "",
    text: "text-muted-foreground/70",
    meta: "locked",
  };
}

export default function MissionSidebar({ session }: MissionSidebarProps) {
  const completion = getCompletionStats(session);
  const inventoryItems = [
    ...session.credentials
      .filter((credential) => credential.acquired)
      .map((credential) => ({
        id: credential.id,
        name: credential.label,
        desc: `${credential.username}:${credential.secret}`,
      })),
    ...session.artifacts
      .filter((artifact) => artifact.acquired)
      .map((artifact) => ({
        id: artifact.id,
        name: artifact.label,
        desc: artifact.kind,
      })),
  ];
  const unlockedHints = session.hints.filter((hint) => hint.unlocked);

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-card">
      <div className="border-b border-border px-4 py-3">
        <div className="mb-1 flex items-center gap-2">
          <Target className="h-3.5 w-3.5 text-primary" />
          <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            Active Mission
          </span>
        </div>
        <h2 className="font-mono text-sm font-bold text-foreground">{session.missionTitle}</h2>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <span className="rounded-sm bg-warning/15 px-1.5 py-0.5 font-mono text-[10px] text-warning">
            {session.difficulty.toUpperCase()}
          </span>
          <span className="rounded-sm bg-secondary px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
            {session.missionCode}
          </span>
          {session.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-sm bg-secondary px-1.5 py-0.5 font-mono text-[10px] lowercase text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-sm bg-secondary px-2 py-1.5">
            <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Progress
            </div>
            <div className="mt-1 text-xs text-foreground">
              {completion.completedObjectives}/{completion.objectiveCount} objectives
            </div>
          </div>
          <div className="rounded-sm bg-secondary px-2 py-1.5">
            <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Ranking
            </div>
            <div className="mt-1 text-xs text-foreground">#{session.seasonRank}</div>
          </div>
        </div>
      </div>

      <div className="border-b border-border px-4 py-3">
        <div className="mb-2 flex items-center gap-2">
          <BookOpen className="h-3.5 w-3.5 text-accent" />
          <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            Briefing
          </span>
        </div>
        <p className="text-xs leading-relaxed text-foreground/80">{session.briefing}</p>
      </div>

      <div className="border-b border-border px-4 py-3">
        <div className="mb-2 flex items-center gap-2">
          <Flag className="h-3.5 w-3.5 text-primary" />
          <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            Objectives
          </span>
        </div>
        <div className="space-y-2">
          {session.objectives.map((objective) => {
            const indicator = objectiveIndicator(objective.status);

            return (
              <div key={objective.id} className="flex items-start gap-2">
                <div
                  className={`mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-sm border ${indicator.box}`}
                >
                  {indicator.mark ? (
                    <span className="text-[8px] text-primary">{indicator.mark}</span>
                  ) : null}
                </div>
                <div>
                  <span className={`text-xs ${indicator.text}`}>{objective.title}</span>
                  <div className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">
                    {objective.description}
                  </div>
                  <div className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                    {indicator.meta} | +{objective.reward} XP
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="border-b border-border px-4 py-3">
        <div className="mb-2 flex items-center gap-2">
          <Flag className="h-3.5 w-3.5 text-warning" />
          <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            Flags
          </span>
        </div>
        <div className="space-y-2">
          {session.flags.map((flag) => (
            <div key={flag.id} className="rounded-sm bg-secondary px-2 py-1.5">
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-xs text-foreground">{flag.label}</span>
                <span
                  className={`font-mono text-[10px] ${
                    flag.captured ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {flag.captured ? "captured" : "locked"}
                </span>
              </div>
              <div className="mt-1 text-[10px] text-muted-foreground">
                {flag.captured ? flag.value : "masked until captured"}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-b border-border px-4 py-3">
        <div className="mb-2 flex items-center gap-2">
          <Package className="h-3.5 w-3.5 text-accent" />
          <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            Inventory
          </span>
        </div>
        <div className="space-y-1.5">
          {inventoryItems.length ? (
            inventoryItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-sm bg-secondary px-2 py-1.5"
              >
                <span className="font-mono text-xs text-foreground">{item.name}</span>
                <span className="text-[10px] text-muted-foreground">{item.desc}</span>
              </div>
            ))
          ) : (
            <div className="rounded-sm bg-secondary px-2 py-2 text-[10px] text-muted-foreground">
              No artifacts captured yet. Start with `nmap 10.0.0.0/24`.
            </div>
          )}
        </div>
      </div>

      <div className="border-b border-border px-4 py-3">
        <div className="mb-2 flex items-center gap-2">
          <ScrollText className="h-3.5 w-3.5 text-accent" />
          <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            Notes
          </span>
        </div>
        <div className="space-y-2">
          {session.notes.map((note) => (
            <div key={note} className="rounded-sm bg-secondary px-2 py-2 text-[10px] leading-relaxed text-muted-foreground">
              {note}
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 py-3">
        <div className="mb-2 flex items-center gap-2">
          <AlertTriangle className="h-3.5 w-3.5 text-warning" />
          <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            Hints
          </span>
        </div>
        <div className="space-y-2">
          {unlockedHints.map((hint) => (
            <div
              key={hint.id}
              className="rounded-sm border border-warning/20 bg-warning/10 px-2 py-2"
            >
              <div className="font-mono text-[10px] uppercase tracking-wider text-warning">
                {hint.title}
              </div>
              <div className="mt-1 text-[10px] leading-relaxed text-warning/80">
                {hint.used ? hint.text : "Type `hint` in the terminal to reveal this guidance."}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
