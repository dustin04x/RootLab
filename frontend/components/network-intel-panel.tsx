import { Activity, Route, Server } from "lucide-react";
import type { HostModel, TimelineEvent } from "@/lib/demo-session";
import { NetworkMap } from "@/components/network-map";

interface NetworkIntelPanelProps {
  hosts: HostModel[];
  selectedHostId: string;
  timeline: TimelineEvent[];
  onSelectHost: (hostId: string) => void;
}

function hostStatusLabel(status: HostModel["status"]) {
  if (status === "entry") {
    return "entry";
  }

  if (status === "compromised") {
    return "compromised";
  }

  if (status === "discovered") {
    return "discovered";
  }

  return "shadow";
}

export function NetworkIntelPanel({
  hosts,
  selectedHostId,
  timeline,
  onSelectHost,
}: NetworkIntelPanelProps) {
  const selectedHost = hosts.find((host) => host.id === selectedHostId) ?? hosts[0];

  return (
    <aside className="flex h-full flex-col overflow-hidden">
      <div className="border-b border-border/80 px-4 py-4">
        <div className="panel-label">Network intelligence</div>
        <div className="mt-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Live topology view</h2>
            <p className="mt-1 text-sm text-muted">
              Host visibility and compromise state mirror the simulated session.
            </p>
          </div>
          <span className="data-chip border-accent/20 bg-accent/10 text-accent">
            {hosts.filter((host) => host.status !== "shadow").length} visible
          </span>
        </div>
      </div>

      <div className="border-b border-border/80 px-3 py-3">
        <NetworkMap
          hosts={hosts}
          selectedHostId={selectedHostId}
          onSelectHost={onSelectHost}
        />
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4">
        <section>
          <div className="mb-3 flex items-center gap-2">
            <Server className="h-4 w-4 text-accent" />
            <span className="panel-label">Selected host</span>
          </div>
          <div className="space-y-3 border border-border bg-white/5 px-3 py-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-mono text-base text-foreground">{selectedHost.label}</h3>
                <p className="mt-1 text-sm text-muted">{selectedHost.summary}</p>
              </div>
              <span
                className={`data-chip text-[0.66rem] ${
                  selectedHost.status === "compromised"
                      ? "border-primary/20 bg-primary/10 text-primary"
                    : selectedHost.status === "discovered"
                      ? "border-accent/20 bg-accent/10 text-accent"
                    : selectedHost.status === "entry"
                        ? "border-white/10 bg-white/10 text-foreground"
                        : "border-border bg-white/5 text-muted"
                }`}
              >
                {hostStatusLabel(selectedHost.status)}
              </span>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <div className="data-chip justify-between">
                <span className="text-muted">role</span>
                <span>{selectedHost.role}</span>
              </div>
              <div className="data-chip justify-between">
                <span className="text-muted">ip</span>
                <span>{selectedHost.ip}</span>
              </div>
            </div>

            <div>
              <div className="panel-label">Service surface</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedHost.services.map((service) => (
                  <span key={service} className="data-chip text-[0.66rem] text-muted">
                    {service}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <div className="panel-label">Route hint</div>
              <p className="mt-2 text-sm leading-6 text-muted">{selectedHost.routeHint}</p>
            </div>

            <div>
              <div className="panel-label">Intel</div>
              <div className="mt-2 space-y-2">
                {selectedHost.intel.map((line) => (
                  <div key={line} className="rounded-sm border border-border bg-black/10 px-3 py-2 text-sm text-muted">
                    {line}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center gap-2">
            <Route className="h-4 w-4 text-primary" />
            <span className="panel-label">Session telemetry</span>
          </div>
          <div className="space-y-2">
            {timeline.slice(0, 5).map((event) => (
              <div
                key={event.id}
                className="flex gap-3 border border-border bg-white/5 px-3 py-2"
              >
                <span className="font-mono text-xs text-muted">{event.time}</span>
                <div className="min-w-0">
                  <div
                    className={`font-mono text-xs uppercase tracking-[0.18em] ${
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
                  </div>
                  <p className="mt-1 text-sm leading-5 text-muted">{event.label}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center gap-2">
            <Activity className="h-4 w-4 text-warning" />
            <span className="panel-label">Host manifest</span>
          </div>
          <div className="space-y-2">
            {hosts.map((host) => (
              <button
                key={host.id}
                type="button"
                onClick={() => onSelectHost(host.id)}
                className={`flex w-full items-center justify-between border px-3 py-2 text-left transition-colors ${
                  selectedHostId === host.id
                    ? "border-primary/25 bg-primary/10"
                    : "border-border bg-white/5 hover:bg-white/10"
                }`}
              >
                <div>
                  <div className="font-mono text-sm text-foreground">{host.hostname}</div>
                  <div className="mt-1 text-xs text-muted">{host.ip}</div>
                </div>
                <span className="font-mono text-xs text-muted">{hostStatusLabel(host.status)}</span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </aside>
  );
}
