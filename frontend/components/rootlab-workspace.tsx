"use client";

import { useEffect, useState } from "react";
import Header from "@/components/header";
import MissionSidebar from "@/components/mission-sidebar";
import NetworkMap from "@/components/network-map";
import Terminal from "@/components/terminal";
import {
  createInitialDemoState,
  executeDemoCommand,
  type CommandExecution,
  type DemoSessionState,
} from "@/lib/demo-session";

const SESSION_STORAGE_KEY = "rootlab-demo-session-v1";

export function RootLabWorkspace() {
  const [session, setSession] = useState<DemoSessionState>(() => createInitialDemoState());
  const [isRestored, setIsRestored] = useState(false);
  const [resetVersion, setResetVersion] = useState(0);

  useEffect(() => {
    try {
      const storedSession = window.localStorage.getItem(SESSION_STORAGE_KEY);

      if (storedSession) {
        const parsed = JSON.parse(storedSession) as DemoSessionState;
        setSession(parsed);
      }
    } catch {
      window.localStorage.removeItem(SESSION_STORAGE_KEY);
    } finally {
      setIsRestored(true);
    }
  }, []);

  useEffect(() => {
    if (!isRestored) {
      return;
    }

    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  }, [isRestored, session]);

  function handleCommand(input: string): CommandExecution {
    let execution: CommandExecution | null = null;

    setSession((previous) => {
      const nextExecution = executeDemoCommand(previous, input);
      execution = nextExecution;
      return nextExecution.nextState;
    });

    return execution ?? executeDemoCommand(session, input);
  }

  function handleReset() {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
    setSession(createInitialDemoState());
    setResetVersion((previous) => previous + 1);
  }

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-background">
      <Header session={session} onReset={handleReset} />
      <div className="flex min-h-0 flex-1">
        <div className="w-72 shrink-0 border-r border-border">
          <MissionSidebar session={session} />
        </div>

        <div className="min-w-0 flex-1">
          <Terminal
            key={resetVersion}
            session={session}
            onExecute={handleCommand}
          />
        </div>

        <div className="w-72 shrink-0 border-l border-border">
          <NetworkMap
            hosts={session.hosts}
            selectedHostId={session.selectedHostId}
            timeline={session.timeline}
            onSelectHost={(hostId) =>
              setSession((previous) => ({
                ...previous,
                selectedHostId: hostId,
              }))
            }
          />
        </div>
      </div>
    </div>
  );
}
