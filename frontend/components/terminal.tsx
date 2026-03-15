"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import {
  COMMAND_NAMES,
  CURL_TARGETS,
  QUICK_COMMANDS,
  SSH_TARGETS,
  getCompletionStats,
  getDirectoryEntries,
  getPromptLabel,
  resolveSimPath,
  type CommandExecution,
  type CommandLine,
  type DemoSessionState,
} from "@/lib/demo-session";

type TerminalLine = {
  type: "input" | "output" | "error" | "success" | "system";
  content: string;
};

type CompletionResult = {
  nextInput: string;
  nextCursor: number;
  hints: TerminalLine[];
};

interface TerminalProps {
  session: DemoSessionState;
  onExecute: (input: string) => CommandExecution;
}

function createInitialLines(session: DemoSessionState): TerminalLine[] {
  return [
    { type: "system", content: "RootLab Terminal v0.1.0 - Simulated Environment" },
    {
      type: "system",
      content: `Mission loaded: ${session.missionTitle} | Environment: fully simulated | No live systems touched`,
    },
    {
      type: "output",
      content: "Type help, mission, nmap 10.0.0.0/24, curl http://10.0.0.5/.env, ssh opsadmin@10.0.0.9, sudo -l",
    },
    { type: "output", content: "" },
  ];
}

function longestCommonPrefix(values: string[]): string {
  if (!values.length) {
    return "";
  }

  let prefix = values[0] ?? "";

  for (const value of values.slice(1)) {
    while (prefix && !value.startsWith(prefix)) {
      prefix = prefix.slice(0, -1);
    }

    if (!prefix) {
      break;
    }
  }

  return prefix;
}

function toneToType(tone: CommandLine["tone"]): TerminalLine["type"] {
  if (tone === "error") {
    return "error";
  }

  if (tone === "success") {
    return "success";
  }

  if (tone === "system") {
    return "system";
  }

  return "output";
}

function getTokenBounds(currentInput: string, cursorPosition: number) {
  let tokenStart = cursorPosition;

  while (tokenStart > 0 && !/\s/.test(currentInput[tokenStart - 1] ?? "")) {
    tokenStart -= 1;
  }

  const beforeToken = currentInput.slice(0, tokenStart);
  const token = currentInput.slice(tokenStart, cursorPosition);
  const afterCursor = currentInput.slice(cursorPosition);
  const argsBeforeToken = beforeToken.trim().split(/\s+/).filter(Boolean);

  return {
    beforeToken,
    token,
    afterCursor,
    argsBeforeToken,
  };
}

function completeChoiceToken(
  currentInput: string,
  cursorPosition: number,
  candidates: readonly string[],
  appendSpace = true,
): CompletionResult | null {
  const { beforeToken, token, afterCursor } = getTokenBounds(currentInput, cursorPosition);
  const matches = candidates.filter((candidate) => candidate.startsWith(token));

  if (!matches.length) {
    return null;
  }

  if (matches.length === 1) {
    const match = matches[0] ?? "";
    const completedToken = `${match}${appendSpace ? " " : ""}`;

    return {
      nextInput: `${beforeToken}${completedToken}${afterCursor}`,
      nextCursor: beforeToken.length + completedToken.length,
      hints: [],
    };
  }

  const sharedPrefix = longestCommonPrefix(matches);

  if (sharedPrefix.length > token.length) {
    return {
      nextInput: `${beforeToken}${sharedPrefix}${afterCursor}`,
      nextCursor: beforeToken.length + sharedPrefix.length,
      hints: [],
    };
  }

  return {
    nextInput: currentInput,
    nextCursor: cursorPosition,
    hints: [{ type: "system", content: matches.join("  ") }],
  };
}

function completePathToken(
  currentInput: string,
  session: DemoSessionState,
  cursorPosition: number,
  command: string,
): CompletionResult | null {
  const { beforeToken, token, afterCursor } = getTokenBounds(currentInput, cursorPosition);
  const separatorIndex = token.lastIndexOf("/");
  const hasSeparator = separatorIndex >= 0;
  const directoryInput = hasSeparator ? token.slice(0, separatorIndex + 1) : "";
  const partialName = hasSeparator ? token.slice(separatorIndex + 1) : token;
  const directoryBase =
    directoryInput === "/"
      ? "/"
      : directoryInput
        ? resolveSimPath(session.currentContext.cwd, directoryInput.slice(0, -1))
        : session.currentContext.cwd;

  let candidates = getDirectoryEntries(session, directoryBase);

  if (!candidates.length) {
    return null;
  }

  if (command === "cd") {
    candidates = candidates.filter((entry) => entry.endsWith("/"));
  } else if (command === "cat" || command === "grep") {
    candidates = candidates.filter((entry) => !entry.endsWith("/"));
  }

  if (!partialName.startsWith(".")) {
    candidates = candidates.filter((entry) => !entry.startsWith("."));
  }

  const matches = candidates.filter((entry) => entry.startsWith(partialName));

  if (!matches.length) {
    return null;
  }

  if (matches.length === 1) {
    const match = matches[0] ?? "";
    const completedToken = `${directoryInput}${match}${match.endsWith("/") ? "" : " "}`;

    return {
      nextInput: `${beforeToken}${completedToken}${afterCursor}`,
      nextCursor: beforeToken.length + completedToken.length,
      hints: [],
    };
  }

  const sharedPrefix = longestCommonPrefix(matches);

  if (sharedPrefix.length > partialName.length) {
    const completedToken = `${directoryInput}${sharedPrefix}`;

    return {
      nextInput: `${beforeToken}${completedToken}${afterCursor}`,
      nextCursor: beforeToken.length + completedToken.length,
      hints: [],
    };
  }

  return {
    nextInput: currentInput,
    nextCursor: cursorPosition,
    hints: [{ type: "system", content: matches.join("  ") }],
  };
}

function completeInput(
  currentInput: string,
  session: DemoSessionState,
  cursorPosition: number,
): CompletionResult | null {
  const { argsBeforeToken } = getTokenBounds(currentInput, cursorPosition);

  if (argsBeforeToken.length === 0) {
    return completeChoiceToken(currentInput, cursorPosition, COMMAND_NAMES);
  }

  const activeCommand = argsBeforeToken[0] ?? "";

  if (["cd", "cat", "ls"].includes(activeCommand)) {
    return completePathToken(currentInput, session, cursorPosition, activeCommand);
  }

  if (activeCommand === "grep" && argsBeforeToken.length >= 2) {
    return completePathToken(currentInput, session, cursorPosition, "grep");
  }

  if (activeCommand === "find" && !argsBeforeToken.includes("-name")) {
    return completePathToken(currentInput, session, cursorPosition, "find");
  }

  if (activeCommand === "ssh") {
    return completeChoiceToken(currentInput, cursorPosition, SSH_TARGETS);
  }

  if (activeCommand === "curl") {
    return completeChoiceToken(currentInput, cursorPosition, CURL_TARGETS);
  }

  if (activeCommand === "nmap") {
    return completeChoiceToken(currentInput, cursorPosition, ["10.0.0.0/24", "10.0.0.5", "10.0.0.7", "10.0.0.9"]);
  }

  if (activeCommand === "sudo") {
    return completeChoiceToken(currentInput, cursorPosition, ["-l", "tar rootlab-backup", "/usr/bin/tar rootlab-backup"]);
  }

  return null;
}

function getLineColor(type: TerminalLine["type"]) {
  switch (type) {
    case "input":
      return "glow-green text-primary";
    case "error":
      return "text-destructive";
    case "success":
      return "text-primary";
    case "system":
      return "glow-blue text-accent";
    default:
      return "text-foreground";
  }
}

export default function Terminal({ session, onExecute }: TerminalProps) {
  const [lines, setLines] = useState<TerminalLine[]>(() => createInitialLines(session));
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const prompt = getPromptLabel(session);
  const completion = getCompletionStats(session);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  function executeCommand(command: string) {
    const trimmed = command.trim();

    if (!trimmed) {
      setInput("");
      return;
    }

    const inputLine: TerminalLine = { type: "input", content: `${prompt} $ ${trimmed}` };
    const execution = onExecute(trimmed);
    const outputLines = execution.lines.map((line) => ({
      type: toneToType(line.tone),
      content: line.text,
    }));

    if (execution.clearScreen) {
      setLines(outputLines);
    } else {
      setLines((previous) => [...previous, inputLine, ...outputLines]);
    }

    setHistory((previous) => [trimmed, ...previous]);
    setHistoryIdx(-1);
    setInput("");
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Tab") {
      event.preventDefault();

      const cursorPosition = event.currentTarget.selectionStart ?? input.length;
      const completionResult = completeInput(input, session, cursorPosition);

      if (!completionResult) {
        return;
      }

      if (completionResult.nextInput !== input) {
        setInput(completionResult.nextInput);

        requestAnimationFrame(() => {
          inputRef.current?.setSelectionRange(
            completionResult.nextCursor,
            completionResult.nextCursor,
          );
        });
      }

      if (completionResult.hints.length) {
        setLines((previous) => [...previous, ...completionResult.hints]);
      }

      return;
    }

    if (event.key === "Enter") {
      executeCommand(input);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (historyIdx < history.length - 1) {
        const nextIdx = historyIdx + 1;
        setHistoryIdx(nextIdx);
        setInput(history[nextIdx] ?? "");
      }
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (historyIdx > 0) {
        const nextIdx = historyIdx - 1;
        setHistoryIdx(nextIdx);
        setInput(history[nextIdx] ?? "");
      } else {
        setHistoryIdx(-1);
        setInput("");
      }
    }
  }

  return (
    <div
      className="relative flex h-full flex-col overflow-hidden bg-terminal-bg"
      onClick={() => inputRef.current?.focus()}
    >
      <div className="scanline absolute inset-0 z-10" />
      <div className="z-20 flex shrink-0 items-center justify-between gap-3 border-b border-border bg-card px-3 py-1.5">
        <div className="flex items-center gap-2">
          <div className="animate-pulse-glow h-2 w-2 rounded-full bg-primary" />
          <span className="font-mono text-xs text-muted-foreground">
            terminal - {getPromptLabel(session)}
          </span>
        </div>
        <div className="hidden items-center gap-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground md:flex">
          <span>{completion.completedObjectives}/{completion.objectiveCount} objectives</span>
          <span>{completion.capturedFlags}/{completion.totalFlags} flags</span>
        </div>
      </div>
      <div className="relative z-20 flex-1 overflow-y-auto p-3 font-mono text-sm">
        {lines.map((line, index) => (
          <div
            key={`${line.type}-${index}-${line.content}`}
            className={`${getLineColor(line.type)} whitespace-pre-wrap leading-relaxed`}
          >
            {line.content}
          </div>
        ))}
        <div className="mt-1 flex items-center gap-0">
          <span className="glow-green text-primary">{prompt} $&nbsp;</span>
          <input
            ref={inputRef}
            autoFocus
            spellCheck={false}
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent font-mono text-sm text-foreground caret-primary outline-none"
          />
        </div>
        <div ref={bottomRef} />
      </div>
      <div className="relative z-20 shrink-0 border-t border-border bg-card/90 px-3 py-2">
        <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Quick Actions
        </div>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_COMMANDS.map((command) => (
            <button
              key={command}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => executeCommand(command)}
              className="rounded-sm border border-border bg-secondary px-2 py-1 font-mono text-[10px] text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
            >
              {command}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
