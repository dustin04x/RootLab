import { RefreshCw, Wifi, Zap } from "lucide-react";
import Image from "next/image";
import {
  getCompletionStats,
  getLevelInfo,
  type DemoSessionState,
} from "@/lib/demo-session";

interface HeaderProps {
  session: DemoSessionState;
  onReset: () => void;
}

export default function Header({ session, onReset }: HeaderProps) {
  const levelInfo = getLevelInfo(session.xp);
  const completion = getCompletionStats(session);
  const xpSpan = Math.max(levelInfo.nextLevelXp - levelInfo.currentLevelFloor, 1);
  const xpProgress = Math.min(
    ((session.xp - levelInfo.currentLevelFloor) / xpSpan) * 100,
    100,
  );

  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-card px-4">
      <div className="flex min-w-0 items-center gap-3">
        <Image
          src="/logo.png"
          alt="RootLab"
          width={28}
          height={28}
          className="shrink-0 rounded-full ring-1 ring-primary/60"
        />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="glow-green font-mono text-sm font-bold tracking-wider text-primary">
              ROOTLAB
            </span>
            <span className="font-mono text-xs text-muted-foreground">{session.missionCode}</span>
          </div>
          <div className="truncate font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            {session.missionTitle}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="hidden items-center gap-2 font-mono text-xs lg:flex">
          <span className="text-muted-foreground">LVL</span>
          <span className="font-semibold text-foreground">{levelInfo.level}</span>
          <div className="h-1.5 w-20 overflow-hidden rounded-sm bg-muted">
            <div className="h-full rounded-sm bg-primary" style={{ width: `${xpProgress}%` }} />
          </div>
          <span className="text-muted-foreground">{session.xp} XP</span>
        </div>

        <div className="hidden items-center gap-1.5 font-mono text-xs md:flex">
          <Wifi className="animate-pulse-glow h-3.5 w-3.5 text-primary" />
          <span className="text-primary">CONNECTED</span>
        </div>

        <div className="hidden items-center gap-1.5 font-mono text-xs lg:flex">
          <Zap className="h-3.5 w-3.5 text-warning" />
          <span className="text-foreground">
            {completion.capturedFlags}/{completion.totalFlags} flags
          </span>
          <span className="text-muted-foreground">|</span>
          <span className="text-foreground">score {session.score}</span>
        </div>

        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-secondary px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
        >
          <RefreshCw className="h-3 w-3" />
          Reset Sim
        </button>
      </div>
    </header>
  );
}
