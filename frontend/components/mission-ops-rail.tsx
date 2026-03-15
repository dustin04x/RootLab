import { Flag, KeyRound, Lightbulb, Package, Target } from "lucide-react";
import { getCompletionStats, type DemoSessionState } from "@/lib/demo-session";

interface MissionOpsRailProps {
  session: DemoSessionState;
}

function statusStyles(status: "active" | "locked" | "complete") {
  if (status === "complete") {
    return "border-primary/30 bg-primary/10 text-primary";
  }

  if (status === "active") {
    return "border-accent/30 bg-accent/10 text-foreground";
  }

  return "border-border bg-white/5 text-muted";
}

export function MissionOpsRail({ session }: MissionOpsRailProps) {
  const completionStats = getCompletionStats(session);

  return (
    <aside className="flex h-full flex-col overflow-hidden">
      <div className="border-b border-border/80 px-4 py-4">
        <div className="panel-label">Mission operations</div>
        <div className="mt-3 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              {session.missionTitle}
            </h1>
            <p className="mt-2 text-sm leading-6 text-muted">{session.briefing}</p>
          </div>
          <span className="data-chip shrink-0 border-warning/20 bg-warning/10 text-warning">
            {session.difficulty}
          </span>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {session.tags.map((tag) => (
            <span key={tag} className="data-chip text-[0.68rem] lowercase text-muted">
              {tag}
            </span>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="data-chip justify-between">
            <span className="text-muted">score</span>
            <span>{session.score}</span>
          </div>
          <div className="data-chip justify-between">
            <span className="text-muted">capture</span>
            <span>
              {completionStats.capturedFlags}/{completionStats.totalFlags}
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4">
        <section>
          <div className="mb-3 flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            <span className="panel-label">Objectives</span>
          </div>
          <div className="space-y-3">
            {session.objectives.map((objective) => (
              <div
                key={objective.id}
                className={`rounded-sm border px-3 py-3 ${statusStyles(objective.status)}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-mono text-sm">{objective.title}</div>
                    <p className="mt-1 text-sm leading-5 opacity-80">{objective.description}</p>
                  </div>
                  <span className="font-mono text-xs text-muted">+{objective.reward}xp</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center gap-2">
            <Flag className="h-4 w-4 text-warning" />
            <span className="panel-label">Flags</span>
          </div>
          <div className="space-y-2">
            {session.flags.map((flag) => (
              <div
                key={flag.id}
                className="flex items-center justify-between border border-border bg-white/5 px-3 py-2"
              >
                <div>
                  <div className="font-mono text-sm text-foreground">{flag.label}</div>
                  <div className="mt-1 text-xs text-muted">
                    {flag.captured ? flag.value : "masked until captured"}
                  </div>
                </div>
                <span
                  className={`font-mono text-xs ${
                    flag.captured ? "text-primary" : "text-muted"
                  }`}
                >
                  {flag.captured ? "captured" : "locked"}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-accent" />
            <span className="panel-label">Credential vault</span>
          </div>
          <div className="space-y-2">
            {session.credentials.map((credential) => (
              <div
                key={credential.id}
                className="border border-border bg-white/5 px-3 py-2"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-sm text-foreground">{credential.label}</span>
                  <span
                    className={`font-mono text-xs ${
                      credential.acquired ? "text-primary" : "text-muted"
                    }`}
                  >
                    {credential.acquired ? "ready" : "locked"}
                  </span>
                </div>
                <div className="mt-1 text-xs text-muted">
                  {credential.username}:{credential.secret}
                </div>
                <div className="mt-1 text-xs text-muted">source: {credential.source}</div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" />
            <span className="panel-label">Artifacts</span>
          </div>
          <div className="space-y-2">
            {session.artifacts.map((artifact) => (
              <div
                key={artifact.id}
                className="border border-border bg-white/5 px-3 py-2"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-sm text-foreground">{artifact.label}</span>
                  <span className={`font-mono text-xs ${artifact.acquired ? "text-primary" : "text-muted"}`}>
                    {artifact.acquired ? artifact.kind : "pending"}
                  </span>
                </div>
                <p className="mt-1 text-xs leading-5 text-muted">{artifact.summary}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-warning" />
            <span className="panel-label">Hints</span>
          </div>
          <div className="space-y-2">
            {session.hints
              .filter((hint) => hint.unlocked)
              .map((hint) => (
                <div key={hint.id} className="border border-warning/15 bg-warning/10 px-3 py-2">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-mono text-sm text-warning">{hint.title}</span>
                    <span className="font-mono text-xs text-muted">
                      {hint.used ? "revealed" : "ready"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-warning/80">
                    {hint.used ? hint.text : "Type `hint` in the terminal to reveal this guidance."}
                  </p>
                </div>
              ))}
          </div>
        </section>
      </div>

      <div className="border-t border-border/80 px-4 py-3 text-xs text-muted">
        All mission data here is simulation state only. No commands execute outside RootLab.
      </div>
    </aside>
  );
}
