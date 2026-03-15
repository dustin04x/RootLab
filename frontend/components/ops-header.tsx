import { Activity, Flag, Shield, Zap } from "lucide-react";
import {
  getCompletionStats,
  getLevelInfo,
  getPromptLabel,
  type DemoSessionState,
} from "@/lib/demo-session";

interface OpsHeaderProps {
  session: DemoSessionState;
}

export function OpsHeader({ session }: OpsHeaderProps) {
  const levelInfo = getLevelInfo(session.xp);
  const completionStats = getCompletionStats(session);
  const xpSpan = Math.max(levelInfo.nextLevelXp - levelInfo.currentLevelFloor, 1);
  const xpProgress = Math.min(
    ((session.xp - levelInfo.currentLevelFloor) / xpSpan) * 100,
    100,
  );

  return (
    <header className="relative z-10 border-b border-border/80 bg-[rgba(6,9,13,0.88)] backdrop-blur">
      <div className="mx-auto grid w-full max-w-[1720px] gap-3 px-3 py-3 lg:px-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center border border-primary/20 bg-primary/10 text-primary ring-glow">
            <Shield className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-mono text-sm uppercase tracking-[0.38em] text-primary text-glow-primary">
                RootLab
              </span>
              <span className="data-chip text-[0.66rem] text-muted">alpha console</span>
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
              <span className="panel-label">active session</span>
              <span className="font-mono text-foreground">{session.missionCode}</span>
              <span className="max-w-full truncate font-mono text-accent text-glow-accent">
                {getPromptLabel(session)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 xl:justify-self-end">
          <div className="data-chip">
            <Zap className="h-3.5 w-3.5 shrink-0 text-primary" />
            <div className="min-w-0">
              <div className="text-[0.68rem] uppercase tracking-[0.22em] text-muted">
                Progression
              </div>
              <div className="mt-1 flex items-center gap-2">
                <span className="font-semibold text-foreground">LVL {levelInfo.level}</span>
                <div className="h-1.5 w-24 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full bg-primary" style={{ width: `${xpProgress}%` }} />
                </div>
                <span className="text-muted">{session.xp} XP</span>
              </div>
            </div>
          </div>

          <div className="data-chip">
            <Activity className="h-3.5 w-3.5 shrink-0 text-accent" />
            <div>
              <div className="text-[0.68rem] uppercase tracking-[0.22em] text-muted">
                Objectives
              </div>
              <div className="mt-1 font-semibold text-foreground">
                {completionStats.completedObjectives}/{completionStats.objectiveCount} complete
              </div>
            </div>
          </div>

          <div className="data-chip">
            <Flag className="h-3.5 w-3.5 shrink-0 text-warning" />
            <div>
              <div className="text-[0.68rem] uppercase tracking-[0.22em] text-muted">
                Flags + Rank
              </div>
              <div className="mt-1 font-semibold text-foreground">
                {completionStats.capturedFlags}/{completionStats.totalFlags} flags | #
                {session.seasonRank}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
