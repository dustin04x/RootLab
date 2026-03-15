"use client";

import { useState } from "react";
import type { DemoSessionState } from "@/lib/demo-session";

interface IntelDrawerProps {
  session: DemoSessionState;
}

type DrawerTab = "timeline" | "loot" | "notebook";

export function IntelDrawer({ session }: IntelDrawerProps) {
  const [activeTab, setActiveTab] = useState<DrawerTab>("timeline");

  return (
    <section className="flex h-full flex-col overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-border/80 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="panel-label">Operations drawer</div>
          <h2 className="mt-1 text-lg font-semibold text-foreground">
            Notes, loot, and replay telemetry
          </h2>
        </div>

        <div className="flex flex-wrap gap-2">
          {(["timeline", "loot", "notebook"] as DrawerTab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`data-chip transition-colors ${
                activeTab === tab
                  ? "border-primary/25 bg-primary/10 text-primary"
                  : "text-muted hover:bg-white/10"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {activeTab === "timeline" && (
          <div className="grid gap-3 lg:grid-cols-2">
            {session.timeline.map((event) => (
              <div key={event.id} className="border border-border bg-white/5 px-3 py-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-xs uppercase tracking-[0.16em] text-muted">
                    {event.time}
                  </span>
                  <span
                    className={`font-mono text-xs uppercase tracking-[0.16em] ${
                      event.tone === "success"
                        ? "text-primary"
                        : event.tone === "warning"
                          ? "text-warning"
                          : event.tone === "error"
                            ? "text-danger"
                            : event.tone === "system"
                              ? "text-accent"
                              : "text-foreground"
                    }`}
                  >
                    {event.tone}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-muted">{event.label}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === "loot" && (
          <div className="grid gap-3 xl:grid-cols-3">
            <div className="border border-border bg-white/5 px-3 py-3">
              <div className="panel-label">Flags</div>
              <div className="mt-3 space-y-2">
                {session.flags.map((flag) => (
                  <div key={flag.id} className="rounded-sm border border-border bg-black/10 px-3 py-2">
                    <div className="font-mono text-sm text-foreground">{flag.label}</div>
                    <div className={`mt-1 text-xs ${flag.captured ? "text-primary" : "text-muted"}`}>
                      {flag.captured ? flag.value : "awaiting capture"}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border border-border bg-white/5 px-3 py-3">
              <div className="panel-label">Credentials</div>
              <div className="mt-3 space-y-2">
                {session.credentials.map((credential) => (
                  <div key={credential.id} className="rounded-sm border border-border bg-black/10 px-3 py-2">
                    <div className="font-mono text-sm text-foreground">{credential.label}</div>
                    <div className="mt-1 text-xs text-muted">
                      {credential.username}:{credential.secret}
                    </div>
                    <div className="mt-1 text-xs text-muted">{credential.source}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border border-border bg-white/5 px-3 py-3">
              <div className="panel-label">Artifacts</div>
              <div className="mt-3 space-y-2">
                {session.artifacts.map((artifact) => (
                  <div key={artifact.id} className="rounded-sm border border-border bg-black/10 px-3 py-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-mono text-sm text-foreground">{artifact.label}</div>
                      <span className={`font-mono text-xs ${artifact.acquired ? "text-primary" : "text-muted"}`}>
                        {artifact.kind}
                      </span>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-muted">{artifact.summary}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "notebook" && (
          <div className="grid gap-3 xl:grid-cols-[1.4fr,1fr]">
            <div className="border border-border bg-white/5 px-3 py-3">
              <div className="panel-label">Operator notes</div>
              <div className="mt-3 space-y-3">
                {session.notes.map((note) => (
                  <div key={note} className="rounded-sm border border-border bg-black/10 px-3 py-3 text-sm leading-6 text-muted">
                    {note}
                  </div>
                ))}
              </div>
            </div>

            <div className="border border-border bg-white/5 px-3 py-3">
              <div className="panel-label">Current context</div>
              <div className="mt-3 space-y-2">
                <div className="data-chip justify-between">
                  <span className="text-muted">host</span>
                  <span>{session.currentContext.hostId}</span>
                </div>
                <div className="data-chip justify-between">
                  <span className="text-muted">user</span>
                  <span>{session.currentContext.user}</span>
                </div>
                <div className="data-chip justify-between">
                  <span className="text-muted">cwd</span>
                  <span>{session.currentContext.cwd}</span>
                </div>
                <div className="mt-4 rounded-sm border border-accent/15 bg-accent/10 px-3 py-3 text-sm leading-6 text-accent">
                  The UI is already wired to a deterministic demo simulator, so the eventual backend
                  engine can replace it without redesigning the session layout.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
