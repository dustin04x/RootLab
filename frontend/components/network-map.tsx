"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Activity, Route, Server } from "lucide-react";
import {
  NETWORK_EDGES,
  type HostModel,
  type TimelineEvent,
} from "@/lib/demo-session";

type NetworkNode = {
  id: string;
  ip: string;
  label: string;
  x: number;
  y: number;
  status: "discovered" | "compromised" | "unknown";
  services: string[];
};

interface NetworkMapProps {
  hosts?: HostModel[];
  selectedHostId?: string;
  timeline?: TimelineEvent[];
  onSelectHost?: (hostId: string) => void;
}

const DEFAULT_NODES: NetworkNode[] = [
  {
    id: "gw",
    ip: "10.0.0.1",
    label: "Gateway",
    x: 150,
    y: 40,
    status: "discovered",
    services: ["ssh"],
  },
  {
    id: "web",
    ip: "10.0.0.5",
    label: "Web Server",
    x: 80,
    y: 130,
    status: "compromised",
    services: ["ssh", "http", "mysql"],
  },
  {
    id: "db",
    ip: "10.0.0.7",
    label: "DB Server",
    x: 220,
    y: 130,
    status: "discovered",
    services: ["mysql"],
  },
  {
    id: "admin",
    ip: "10.0.0.9",
    label: "Admin Server",
    x: 150,
    y: 220,
    status: "unknown",
    services: ["?"],
  },
];

const DEFAULT_EDGES: Array<[string, string]> = [
  ["gw", "web"],
  ["gw", "db"],
  ["web", "db"],
  ["db", "admin"],
];

function getNodeColor(status: NetworkNode["status"] | HostModel["status"]) {
  switch (status) {
    case "compromised":
      return "hsl(156 100% 50%)";
    case "discovered":
      return "hsl(199 95% 60%)";
    case "entry":
      return "hsl(0 0% 93%)";
    case "shadow":
    case "unknown":
      return "hsl(240 4% 35%)";
  }
}

function statusPill(status: HostModel["status"] | NetworkNode["status"]) {
  if (status === "compromised") {
    return "bg-primary/20 text-primary";
  }

  if (status === "discovered" || status === "entry") {
    return "bg-accent/20 text-accent";
  }

  return "bg-muted text-muted-foreground";
}

function mapHostToNode(host: HostModel): NetworkNode {
  return {
    id: host.id,
    ip: host.ip,
    label: host.label,
    x: host.x,
    y: host.y,
    status:
      host.status === "shadow"
        ? "unknown"
        : host.status === "compromised"
          ? "compromised"
          : "discovered",
    services: host.services,
  };
}

export function NetworkMap({
  hosts,
  selectedHostId,
  timeline = [],
  onSelectHost,
}: NetworkMapProps) {
  const activeNodes = hosts?.length ? hosts.map(mapHostToNode) : DEFAULT_NODES;
  const activeEdges = hosts?.length ? NETWORK_EDGES : DEFAULT_EDGES;
  const [localSelected, setLocalSelected] = useState<string | null>(selectedHostId ?? "web");
  const selected = selectedHostId ?? localSelected;
  const selectedNode = activeNodes.find((node) => node.id === selected) ?? activeNodes[0] ?? null;
  const selectedHost = hosts?.find((host) => host.id === selected) ?? null;
  const visibleHostCount = hosts?.filter((host) => host.status !== "shadow").length ?? activeNodes.length;

  function getNodeById(id: string) {
    return activeNodes.find((node) => node.id === id);
  }

  function handleSelect(nodeId: string) {
    setLocalSelected(nodeId);
    onSelectHost?.(nodeId);
  }

  return (
    <div className="flex h-full flex-col bg-card">
      <div className="shrink-0 border-b border-border px-3 py-2">
        <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
          Network Map
        </div>
        <div className="mt-1 font-mono text-[10px] text-muted-foreground">
          {visibleHostCount} visible nodes
        </div>
      </div>

      <div className="relative h-64 shrink-0 border-b border-border">
        <svg viewBox="0 0 360 280" className="h-full w-full">
          {Array.from({ length: 18 }).map((_, i) =>
            Array.from({ length: 14 }).map((__, j) => (
              <circle
                key={`${i}-${j}`}
                cx={i * 20 + 10}
                cy={j * 20 + 10}
                r="0.5"
                fill="hsl(240 4% 20%)"
              />
            )),
          )}

          {activeEdges.map(([from, to]) => {
            const a = getNodeById(from);
            const b = getNodeById(to);

            if (!a || !b) {
              return null;
            }

            return (
              <line
                key={`${from}-${to}`}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke="hsl(240 4% 22%)"
                strokeWidth="1"
                strokeDasharray="4 3"
              />
            );
          })}

          {activeNodes.map((node) => (
            <g key={node.id} onClick={() => handleSelect(node.id)} className="cursor-pointer">
              <motion.circle
                cx={node.x}
                cy={node.y}
                r="16"
                fill="none"
                stroke={getNodeColor(node.status)}
                strokeWidth={selected === node.id ? 2 : 1}
                opacity={node.status === "unknown" ? 0.3 : 0.65}
                whileHover={{ scale: 1.15 }}
              />
              <circle
                cx={node.x}
                cy={node.y}
                r="4"
                fill={getNodeColor(node.status)}
                opacity={node.status === "unknown" ? 0.3 : 1}
              />
              <text
                x={node.x}
                y={node.y + 28}
                textAnchor="middle"
                fill="hsl(0 0% 93%)"
                fontSize="8"
                fontFamily="JetBrains Mono"
              >
                {node.ip}
              </text>
            </g>
          ))}
        </svg>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3">
        {selectedHost ? (
          <div className="space-y-4">
            <section className="space-y-2">
              <div className="flex items-center gap-2">
                <Server className="h-3.5 w-3.5 text-accent" />
                <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  Selected Host
                </span>
              </div>
              <div className="rounded-sm bg-secondary px-2 py-2">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-mono text-xs text-foreground">{selectedHost.label}</div>
                    <div className="mt-1 text-[10px] text-muted-foreground">
                      {selectedHost.role} | {selectedHost.ip}
                    </div>
                  </div>
                  <span className={`rounded-sm px-1.5 py-0.5 font-mono text-[10px] ${statusPill(selectedHost.status)}`}>
                    {selectedHost.status}
                  </span>
                </div>
                <div className="mt-2 text-[10px] leading-relaxed text-muted-foreground">
                  {selectedHost.summary}
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {selectedHost.services.map((service) => (
                    <span
                      key={service}
                      className="rounded-sm border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
                    >
                      {service}
                    </span>
                  ))}
                </div>
              </div>
            </section>

            <section className="space-y-2">
              <div className="flex items-center gap-2">
                <Route className="h-3.5 w-3.5 text-primary" />
                <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  Route Intel
                </span>
              </div>
              <div className="rounded-sm bg-secondary px-2 py-2 text-[10px] leading-relaxed text-muted-foreground">
                {selectedHost.routeHint}
              </div>
              <div className="space-y-1.5">
                {selectedHost.intel.map((line) => (
                  <div
                    key={line}
                    className="rounded-sm border border-border px-2 py-1.5 text-[10px] leading-relaxed text-muted-foreground"
                  >
                    {line}
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-2">
              <div className="flex items-center gap-2">
                <Activity className="h-3.5 w-3.5 text-warning" />
                <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  Telemetry
                </span>
              </div>
              <div className="space-y-1.5">
                {timeline.slice(0, 4).map((event) => (
                  <div key={event.id} className="rounded-sm bg-secondary px-2 py-1.5">
                    <div className="flex items-center justify-between gap-2 font-mono text-[10px] text-muted-foreground">
                      <span>{event.time}</span>
                      <span>{event.tone}</span>
                    </div>
                    <div className="mt-1 text-[10px] leading-relaxed text-foreground/80">
                      {event.label}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        ) : selectedNode ? (
          <div className="space-y-1 rounded-sm bg-secondary px-2 py-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-semibold text-foreground">
                {selectedNode.label}
              </span>
              <span className={`rounded-sm px-1.5 py-0.5 font-mono text-[10px] ${statusPill(selectedNode.status)}`}>
                {selectedNode.status.toUpperCase()}
              </span>
            </div>
            <div className="font-mono text-[10px] text-muted-foreground">
              Services: {selectedNode.services.join(", ")}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default NetworkMap;
