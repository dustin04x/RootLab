"use client";

import { useEffect, useEffectEvent, useRef } from "react";
import { FitAddon } from "@xterm/addon-fit";
import { Terminal } from "@xterm/xterm";
import { TerminalSquare } from "lucide-react";
import type { CommandExecution, CommandLine, DemoSessionState } from "@/lib/demo-session";
import { getPromptLabel } from "@/lib/demo-session";
import "@xterm/xterm/css/xterm.css";

interface TerminalPaneProps {
  session: DemoSessionState;
  onExecute: (input: string) => CommandExecution;
}

function colorize(line: CommandLine) {
  const reset = "\u001b[0m";

  if (line.tone === "success") {
    return `\u001b[38;2;76;255;154m${line.text}${reset}`;
  }

  if (line.tone === "warning") {
    return `\u001b[38;2;255;191;71m${line.text}${reset}`;
  }

  if (line.tone === "error") {
    return `\u001b[38;2;255;107;125m${line.text}${reset}`;
  }

  if (line.tone === "system") {
    return `\u001b[38;2;95;213;255m${line.text}${reset}`;
  }

  return line.text;
}

export function TerminalPane({ session, onExecute }: TerminalPaneProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const bufferRef = useRef("");
  const promptRef = useRef(getPromptLabel(session));
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef(-1);
  const executeInSession = useEffectEvent((value: string) => onExecute(value));

  useEffect(() => {
    if (!hostRef.current) {
      return;
    }

    const computedStyle = window.getComputedStyle(document.body);
    const xtermFont = computedStyle.getPropertyValue("--font-jetbrains-mono").trim() || "monospace";
    const terminal = new Terminal({
      cursorBlink: true,
      convertEol: true,
      fontFamily: xtermFont,
      fontSize: 14,
      lineHeight: 1.45,
      theme: {
        background: "#030509",
        foreground: "#ecf7f2",
        cursor: "#4cff9a",
        cursorAccent: "#030509",
        selectionBackground: "rgba(95, 213, 255, 0.28)",
        black: "#04070b",
        red: "#ff6b7d",
        green: "#4cff9a",
        yellow: "#ffbf47",
        blue: "#5fd5ff",
        magenta: "#5fd5ff",
        cyan: "#5fd5ff",
        white: "#ecf7f2",
        brightBlack: "#7c8aa0",
        brightRed: "#ff8a99",
        brightGreen: "#79ffb3",
        brightYellow: "#ffd27a",
        brightBlue: "#8de1ff",
        brightMagenta: "#8de1ff",
        brightCyan: "#8de1ff",
        brightWhite: "#ffffff",
      },
    });

    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);
    terminal.open(hostRef.current);

    const writePrompt = (newline = true) => {
      terminal.write(
        `${newline ? "\r\n" : ""}\u001b[38;2;76;255;154m${promptRef.current}\u001b[0m $ `,
      );
    };

    const replaceBuffer = (nextBuffer: string) => {
      while (bufferRef.current.length > 0) {
        terminal.write("\b \b");
        bufferRef.current = bufferRef.current.slice(0, -1);
      }

      bufferRef.current = nextBuffer;
      terminal.write(nextBuffer);
    };

    const runCommand = (value: string) => {
      terminal.write("\r\n");

      const execution = executeInSession(value);
      promptRef.current = getPromptLabel(execution.nextState);

      if (execution.clearScreen) {
        terminal.clear();
      }

      execution.lines.forEach((line) => {
        terminal.writeln(colorize(line));
      });

      writePrompt();
    };

    terminal.writeln("\u001b[38;2;95;213;255mRootLab Terminal :: simulated command channel online\u001b[0m");
    terminal.writeln("\u001b[38;2;124;138;160mMission loaded: Orion Data Breach | Environment: fully simulated | No live systems touched\u001b[0m");
    terminal.writeln("\u001b[38;2;124;138;160mType help, mission, nmap 10.0.0.0/24, curl http://10.0.0.5/.env, ssh opsadmin@10.0.0.9, sudo -l\u001b[0m");
    writePrompt(false);

    terminal.onData((data) => {
      if (data === "\r") {
        const command = bufferRef.current.trim();

        if (command) {
          historyRef.current = [command, ...historyRef.current];
          historyIndexRef.current = -1;
        }

        bufferRef.current = "";
        runCommand(command);
        return;
      }

      if (data === "\u0003") {
        terminal.write("^C");
        bufferRef.current = "";
        writePrompt();
        return;
      }

      if (data === "\u007F") {
        if (bufferRef.current.length > 0) {
          terminal.write("\b \b");
          bufferRef.current = bufferRef.current.slice(0, -1);
        }
        return;
      }

      if (data === "\u001b[A") {
        if (historyRef.current.length === 0) {
          return;
        }

        const nextIndex = Math.min(historyIndexRef.current + 1, historyRef.current.length - 1);
        historyIndexRef.current = nextIndex;
        replaceBuffer(historyRef.current[nextIndex]);
        return;
      }

      if (data === "\u001b[B") {
        if (historyRef.current.length === 0) {
          return;
        }

        if (historyIndexRef.current <= 0) {
          historyIndexRef.current = -1;
          replaceBuffer("");
          return;
        }

        const nextIndex = historyIndexRef.current - 1;
        historyIndexRef.current = nextIndex;
        replaceBuffer(historyRef.current[nextIndex]);
        return;
      }

      if (data === "\f") {
        terminal.clear();
        writePrompt(false);
        return;
      }

      if (data >= " ") {
        bufferRef.current += data;
        terminal.write(data);
      }
    });

    const resizeObserver = new ResizeObserver(() => {
      fitAddon.fit();
    });

    resizeObserver.observe(hostRef.current);
    requestAnimationFrame(() => fitAddon.fit());

    return () => {
      resizeObserver.disconnect();
      terminal.dispose();
    };
  }, []);

  useEffect(() => {
    promptRef.current = getPromptLabel(session);
  }, [session]);

  return (
    <section className="relative flex h-full flex-col overflow-hidden">
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-b border-border/80 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center border border-primary/20 bg-primary/10 text-primary">
            <TerminalSquare className="h-4 w-4" />
          </div>
          <div>
            <div className="panel-label">Interactive terminal</div>
            <h2 className="mt-1 text-lg font-semibold text-foreground">
              Live session shell
            </h2>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="data-chip text-[0.68rem] text-muted">deterministic demo state</span>
          <span className="data-chip border-primary/20 bg-primary/10 text-primary">connected</span>
        </div>
      </div>

      <div className="relative flex-1 overflow-hidden">
        <div ref={hostRef} className="h-full w-full px-3 py-3" />
        <div className="scanline-overlay opacity-35" />
      </div>

      <div className="relative z-10 border-t border-border/80 px-4 py-3">
        <div className="panel-label">Operator prompts</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {[
            "help",
            "mission",
            "nmap 10.0.0.0/24",
            "curl http://10.0.0.5/.env",
            "ssh opsadmin@10.0.0.9",
            "sudo -l",
          ].map((command) => (
            <span key={command} className="data-chip text-[0.68rem] text-muted">
              {command}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
