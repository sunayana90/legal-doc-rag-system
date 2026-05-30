"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isError?: boolean;
}

interface ChatSession {
  id: string;
  title: string;
  createdAt: Date;
  messages: Message[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const API_BASE = "http://127.0.0.1:8000";

const SUGGESTIONS = [
  {
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14,2 14,8 20,8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10,9 9,9 8,9" />
      </svg>
    ),
    title: "Summarize this agreement",
    prompt: "Summarize this agreement in clear, plain English.",
  },
  {
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
    title: "What are the termination clauses?",
    prompt: "What are the termination clauses in this document?",
  },
  {
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    title: "Explain liabilities",
    prompt: "Explain the liability clauses and their implications.",
  },
  {
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    title: "Key obligations of parties",
    prompt: "What are the key obligations of each party in this agreement?",
  },
];

// ─── Markdown Renderer ────────────────────────────────────────────────────────

function renderMarkdown(text: string): string {
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Code blocks
  html = html.replace(
    /```(\w*)\n?([\s\S]*?)```/g,
    (_: string, lang: string, code: string) => {
      return `<pre class="bg-zinc-50 border border-zinc-200 rounded-lg p-3 my-3 overflow-x-auto font-mono text-sm text-slate-700"><code>${code.trim()}</code></pre>`;
    },
  );

  // Inline code
  html = html.replace(
    /`([^`]+)`/g,
    '<code class="bg-zinc-100 px-1.5 py-0.5 rounded text-sm font-mono text-slate-700">$1</code>',
  );

  // Tables
  html = html.replace(/((\|.+\|\n?)+)/g, (match: string) => {
    const rows = match.trim().split("\n");
    if (rows.length < 2) return match;
    const headerCells = rows[0].split("|").filter((c: string) => c.trim());
    const isDelimiter = (row: string) => /^[\s\-|:]+$/.test(row);
    const bodyRows = rows.slice(2).filter((r: string) => !isDelimiter(r));
    const header = `<tr>${headerCells.map((c: string) => `<th class="px-3 py-2 text-left text-xs font-semibold text-slate-600 border-b border-zinc-200">${c.trim()}</th>`).join("")}</tr>`;
    const body = bodyRows
      .map((row: string) => {
        const cells = row
          .split("|")
          .filter((c: string) => c.trim() !== undefined);
        return `<tr class="border-b border-zinc-100">${cells.map((c: string) => `<td class="px-3 py-2 text-sm text-slate-700">${c.trim()}</td>`).join("")}</tr>`;
      })
      .join("");
    return `<div class="my-3 overflow-x-auto"><table class="w-full border border-zinc-200 rounded-lg overflow-hidden"><thead class="bg-zinc-50">${header}</thead><tbody>${body}</tbody></table></div>`;
  });

  // Headings
  html = html.replace(
    /^### (.+)$/gm,
    '<h3 class="text-sm font-semibold text-slate-900 mt-4 mb-1.5">$1</h3>',
  );
  html = html.replace(
    /^## (.+)$/gm,
    '<h2 class="text-base font-semibold text-slate-900 mt-4 mb-2">$1</h2>',
  );
  html = html.replace(
    /^# (.+)$/gm,
    '<h1 class="text-lg font-semibold text-slate-900 mt-4 mb-2">$1</h1>',
  );

  // Bold / Italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>");
  html = html.replace(
    /\*\*(.+?)\*\*/g,
    '<strong class="font-semibold text-slate-900">$1</strong>',
  );
  html = html.replace(/\*(.+?)\*/g, '<em class="italic">$1</em>');

  // Unordered lists
  html = html.replace(/((?:^[-*+] .+\n?)+)/gm, (match: string) => {
    const items = match
      .trim()
      .split("\n")
      .map(
        (line: string) =>
          `<li class="flex gap-2 text-sm text-slate-700 leading-relaxed"><span class="mt-2 w-1 h-1 rounded-full bg-slate-400 shrink-0"></span><span>${line.replace(/^[-*+] /, "")}</span></li>`,
      )
      .join("");
    return `<ul class="my-2 space-y-1">${items}</ul>`;
  });

  // Ordered lists
  html = html.replace(/((?:^\d+\. .+\n?)+)/gm, (match: string) => {
    let i = 0;
    const items = match
      .trim()
      .split("\n")
      .map((line: string) => {
        i++;
        return `<li class="flex gap-2 text-sm text-slate-700 leading-relaxed"><span class="shrink-0 w-5 h-5 rounded-full bg-zinc-100 text-slate-500 text-xs flex items-center justify-center font-medium mt-0.5">${i}</span><span>${line.replace(/^\d+\. /, "")}</span></li>`;
      })
      .join("");
    return `<ol class="my-2 space-y-1">${items}</ol>`;
  });

  // Blockquote
  html = html.replace(
    /^> (.+)$/gm,
    '<blockquote class="border-l-2 border-zinc-300 pl-3 my-2 text-sm text-slate-500 italic">$1</blockquote>',
  );

  // Paragraphs
  html = html.replace(
    /\n\n/g,
    '</p><p class="text-sm text-slate-700 leading-relaxed mb-2">',
  );
  html = `<p class="text-sm text-slate-700 leading-relaxed mb-2">${html}</p>`;

  // Clean up empty paragraphs
  html = html.replace(/<p[^>]*>\s*<\/p>/g, "");

  return html;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-slate-500"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      </div>
      <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
        <div className="flex items-center gap-1.5">
          <div
            className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce"
            style={{ animationDelay: "0ms" }}
          />
          <div
            className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce"
            style={{ animationDelay: "150ms" }}
          />
          <div
            className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce"
            style={{ animationDelay: "300ms" }}
          />
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end px-4 py-1.5">
        <div className="max-w-[75%]">
          <div className="bg-slate-900 text-white px-4 py-2.5 rounded-2xl rounded-tr-sm text-sm leading-relaxed">
            {message.content}
          </div>
          <p className="text-xs text-slate-400 text-right mt-1 px-1">
            {message.timestamp.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 px-4 py-1.5">
      <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 mt-0.5">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-slate-500"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      </div>
      <div className="flex-1 min-w-0 max-w-[85%]">
        <div
          className={`bg-white border ${message.isError ? "border-red-200 bg-red-50" : "border-slate-200"} rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm`}
        >
          {message.isError ? (
            <p className="text-sm text-red-600">{message.content}</p>
          ) : (
            <div
              className="prose-custom"
              dangerouslySetInnerHTML={{
                __html: renderMarkdown(message.content),
              }}
            />
          )}
        </div>
        <p className="text-xs text-slate-400 mt-1 px-1">
          {message.timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Page() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [darkToggle, setDarkToggle] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeSession = sessions.find((s) => s.id === activeSessionId) ?? null;
  const messages = activeSession?.messages ?? [];

  // ── Backend health check ──────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const res = await fetch(`${API_BASE}/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: "__ping__" }),
          signal: AbortSignal.timeout(3000),
        });
        if (!cancelled) setBackendOnline(res.ok || res.status < 500);
      } catch {
        if (!cancelled) setBackendOnline(false);
      }
    };
    check();
    const interval = setInterval(check, 15000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  // ── Auto-scroll ───────────────────────────────────────────────────────────

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // ── Textarea auto-resize ──────────────────────────────────────────────────

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [input]);

  // ── Create new session ────────────────────────────────────────────────────

  const createNewSession = useCallback((): string => {
    const id = `session-${Date.now()}`;
    const newSession: ChatSession = {
      id,
      title: "New conversation",
      createdAt: new Date(),
      messages: [],
    };
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(id);
    return id;
  }, []);

  const handleNewChat = () => {
    createNewSession();
    setInput("");
  };

  // ── Send message ──────────────────────────────────────────────────────────

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      let sessionId = activeSessionId;
      if (!sessionId) {
        sessionId = createNewSession();
      }

      const userMsg: Message = {
        id: `msg-${Date.now()}-user`,
        role: "user",
        content: trimmed,
        timestamp: new Date(),
      };

      setSessions((prev) =>
        prev.map((s) => {
          if (s.id !== sessionId) return s;
          const newMsgs = [...s.messages, userMsg];
          return {
            ...s,
            messages: newMsgs,
            title:
              s.messages.length === 0
                ? trimmed.length > 40
                  ? trimmed.slice(0, 40) + "…"
                  : trimmed
                : s.title,
          };
        }),
      );
      setInput("");
      setIsLoading(true);

      try {
        const response = await fetch(`${API_BASE}/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: trimmed }),
        });

        if (!response.ok) {
          throw new Error(
            `Server error ${response.status}: ${response.statusText}`,
          );
        }

        const data = await response.json();
        const answer: string =
          data.answer ??
          data.message ??
          data.response ??
          "No response received.";

        const assistantMsg: Message = {
          id: `msg-${Date.now()}-assistant`,
          role: "assistant",
          content: answer,
          timestamp: new Date(),
        };

        setSessions((prev) =>
          prev.map((s) =>
            s.id === sessionId
              ? { ...s, messages: [...s.messages, assistantMsg] }
              : s,
          ),
        );
        setBackendOnline(true);
      } catch (err) {
        const errMsg: Message = {
          id: `msg-${Date.now()}-err`,
          role: "assistant",
          content:
            err instanceof TypeError && err.message.includes("fetch")
              ? "Unable to reach the backend. Please ensure the server is running at http://127.0.0.1:8000."
              : `Request failed: ${err instanceof Error ? err.message : "Unknown error"}`,
          timestamp: new Date(),
          isError: true,
        };
        setSessions((prev) =>
          prev.map((s) =>
            s.id === sessionId
              ? { ...s, messages: [...s.messages, errMsg] }
              : s,
          ),
        );
        setBackendOnline(false);
      } finally {
        setIsLoading(false);
        setTimeout(() => textareaRef.current?.focus(), 100);
      }
    },
    [activeSessionId, isLoading, createNewSession],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside
        className={`
          ${sidebarOpen ? "w-72" : "w-0"}
          transition-all duration-300 ease-in-out
          bg-white border-r border-slate-200
          flex flex-col shrink-0 overflow-hidden
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-slate-100">
          <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center shrink-0">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900 leading-tight truncate">
              Legal RAG AI
            </p>
            <p className="text-xs text-slate-400 leading-tight truncate">
              Legal Research Assistant
            </p>
          </div>
        </div>

        {/* New Chat */}
        <div className="px-3 pt-4 pb-2">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-slate-700 hover:bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all duration-150 font-medium group"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-slate-400 group-hover:text-slate-600 transition-colors"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New conversation
          </button>
        </div>

        {/* History */}
        <div className="flex-1 overflow-y-auto px-3 pb-2">
          {sessions.length > 0 && (
            <>
              <p className="text-xs font-medium text-slate-400 px-2 py-2 uppercase tracking-wide">
                Recent
              </p>
              <div className="space-y-0.5">
                {sessions.map((session) => (
                  <button
                    key={session.id}
                    onClick={() => setActiveSessionId(session.id)}
                    className={`
                      w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all duration-150 group
                      ${
                        activeSessionId === session.id
                          ? "bg-slate-100 text-slate-900 font-medium"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }
                    `}
                  >
                    <div className="flex items-center gap-2.5">
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="text-slate-400 shrink-0"
                      >
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                      <span className="truncate">{session.title}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 pl-5">
                      {session.messages.length} message
                      {session.messages.length !== 1 ? "s" : ""}
                    </p>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Settings */}
        <div className="px-3 pb-4 pt-2 border-t border-slate-100">
          <button className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-all duration-150">
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M19.07 4.93A10 10 0 1 0 4.93 19.07" />
              <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
            </svg>
            Settings
          </button>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-3">
            {/* Sidebar toggle */}
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-all duration-150"
              aria-label="Toggle sidebar"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <div className="h-4 w-px bg-slate-200" />
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-slate-900 flex items-center justify-center">
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2.5"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-slate-900">
                Legal RAG AI
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Backend status */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200">
              <div
                className={`w-1.5 h-1.5 rounded-full ${
                  backendOnline === null
                    ? "bg-slate-300 animate-pulse"
                    : backendOnline
                      ? "bg-emerald-500"
                      : "bg-red-400"
                }`}
              />
              <span className="text-xs text-slate-500 font-medium">
                {backendOnline === null
                  ? "Checking…"
                  : backendOnline
                    ? "Backend online"
                    : "Backend offline"}
              </span>
            </div>

            {/* Dark mode toggle (UI only) */}
            <button
              onClick={() => setDarkToggle((v) => !v)}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-all duration-150"
              aria-label="Toggle dark mode"
            >
              {darkToggle ? (
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              ) : (
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>
          </div>
        </header>

        {/* Messages / Hero */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            /* ── Hero / Empty State ── */
            <div className="flex flex-col items-center justify-center h-full px-6 pb-24">
              <div className="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center mb-5 shadow-sm">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="1.75"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <h1 className="text-2xl font-semibold text-slate-900 mb-2 text-center">
                Ask Questions About Legal Documents
              </h1>
              <p className="text-sm text-slate-500 text-center max-w-sm leading-relaxed mb-8">
                Retrieve accurate answers using AI-powered legal search.
                Grounded in your documents.
              </p>

              {/* Suggestion cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-xl">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s.title}
                    onClick={() => sendMessage(s.prompt)}
                    className="flex items-start gap-3 p-4 bg-white border border-slate-200 rounded-xl text-left hover:border-slate-300 hover:shadow-sm transition-all duration-150 group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 shrink-0 group-hover:bg-slate-100 transition-colors">
                      {s.icon}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800 group-hover:text-slate-900 transition-colors">
                        {s.title}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5 leading-relaxed line-clamp-1">
                        {s.prompt}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* ── Messages ── */
            <div className="py-4 space-y-1">
              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
              {isLoading && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* ── Input Area ─────────────────────────────────────────────────────── */}
        <div className="shrink-0 px-4 pb-5 pt-3 bg-white border-t border-slate-200">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-end gap-2 bg-white border border-slate-200 rounded-2xl shadow-sm px-4 py-3 focus-within:border-slate-400 focus-within:shadow-md transition-all duration-150">
              {/* Attach button (UI only) */}
              <button
                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all duration-150 shrink-0 mb-0.5"
                aria-label="Attach file"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21.44 11.05L12.25 20.24a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66L9.41 17.41a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                </svg>
              </button>

              {/* Textarea */}
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask a legal question…"
                rows={1}
                disabled={isLoading}
                className="flex-1 resize-none bg-transparent text-sm text-slate-900 placeholder:text-slate-400 outline-none leading-relaxed max-h-40 min-h-[24px] py-0.5 disabled:opacity-50 font-sans"
              />

              {/* Send button */}
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isLoading}
                className={`
                  w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-150 shrink-0 mb-0.5
                  ${
                    input.trim() && !isLoading
                      ? "bg-slate-900 text-white hover:bg-slate-800 shadow-sm"
                      : "bg-slate-100 text-slate-400 cursor-not-allowed"
                  }
                `}
                aria-label="Send message"
              >
                {isLoading ? (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    className="animate-spin"
                  >
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                  </svg>
                ) : (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                )}
              </button>
            </div>

            {/* Footer hint */}
            <p className="text-xs text-slate-400 text-center mt-2">
              Press{" "}
              <kbd className="px-1 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-500 font-mono text-xs">
                Enter
              </kbd>{" "}
              to send ·{" "}
              <kbd className="px-1 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-500 font-mono text-xs">
                Shift+Enter
              </kbd>{" "}
              for newline
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
