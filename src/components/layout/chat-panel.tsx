"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import {
  Bot,
  Send,
  Loader2,
  User,
  CheckCircle,
  XCircle,
  ExternalLink,
  Search,
  FileText,
  Calculator,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useState, useRef, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { approveJournalEntry, rejectJournalEntry } from "@/actions/journal-entries";

const transport = new DefaultChatTransport({ api: "/api/chat" });

export function ChatPanel() {
  const { messages, sendMessage, status } = useChat({ transport });
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const isLoading = status === "streaming" || status === "submitted";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

  return (
    <div className="flex h-full flex-col border-l bg-background">
      {/* Header */}
      <div className="flex items-center gap-2.5 border-b px-4 py-3 shrink-0">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
          <Bot className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="font-semibold text-sm">Redovisningsassistent</span>
          <div className="text-[10px] text-muted-foreground">
            {isLoading ? "Tanker..." : "Online"}
          </div>
        </div>
        {isLoading && (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="flex flex-col gap-5 p-4">
          {/* Welcome */}
          {messages.length === 0 && <WelcomeMessage />}

          {messages.map((message) => (
            <div key={message.id} className="flex flex-col gap-1">
              {/* Role label */}
              <div
                className={`flex items-center gap-1.5 ${message.role === "user" ? "justify-end" : ""}`}
              >
                {message.role !== "user" ? (
                  <Bot className="h-3 w-3 text-primary" />
                ) : (
                  <User className="h-3 w-3 text-muted-foreground" />
                )}
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                  {message.role === "user" ? "Du" : "Assistent"}
                </span>
              </div>

              {/* Message content */}
              <div
                className={`rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground ml-8"
                    : "bg-muted/50 mr-4"
                }`}
              >
                {message.parts.map((part, index) => {
                  if (part.type === "text") {
                    if (message.role === "user") {
                      return (
                        <div key={index} className="whitespace-pre-wrap">
                          {part.text}
                        </div>
                      );
                    }
                    return (
                      <div key={index} className="prose-chat">
                        <ReactMarkdown
                          components={{
                            h1: ({ children }) => (
                              <h3 className="text-sm font-bold mt-3 mb-1.5 first:mt-0">
                                {children}
                              </h3>
                            ),
                            h2: ({ children }) => (
                              <h4 className="text-sm font-semibold mt-2.5 mb-1 first:mt-0">
                                {children}
                              </h4>
                            ),
                            h3: ({ children }) => (
                              <h5 className="text-xs font-semibold mt-2 mb-1 first:mt-0">
                                {children}
                              </h5>
                            ),
                            p: ({ children }) => (
                              <p className="mb-1.5 last:mb-0">{children}</p>
                            ),
                            ul: ({ children }) => (
                              <ul className="list-disc pl-4 mb-1.5 space-y-0.5 text-[13px]">
                                {children}
                              </ul>
                            ),
                            ol: ({ children }) => (
                              <ol className="list-decimal pl-4 mb-1.5 space-y-0.5 text-[13px]">
                                {children}
                              </ol>
                            ),
                            strong: ({ children }) => (
                              <strong className="font-semibold text-foreground">
                                {children}
                              </strong>
                            ),
                            code: ({ children }) => (
                              <code className="font-mono text-xs bg-background/80 px-1 py-0.5 rounded">
                                {children}
                              </code>
                            ),
                            blockquote: ({ children }) => (
                              <blockquote className="border-l-2 border-primary/30 pl-3 my-1.5 text-muted-foreground text-[13px] italic">
                                {children}
                              </blockquote>
                            ),
                            table: ({ children }) => (
                              <div className="my-2 rounded-lg border overflow-hidden">
                                <table className="w-full text-xs">
                                  {children}
                                </table>
                              </div>
                            ),
                            thead: ({ children }) => (
                              <thead className="bg-muted/80">{children}</thead>
                            ),
                            th: ({ children }) => (
                              <th className="px-2 py-1.5 text-left font-medium">
                                {children}
                              </th>
                            ),
                            td: ({ children }) => (
                              <td className="px-2 py-1 border-t border-border/50 font-mono">
                                {children}
                              </td>
                            ),
                            hr: () => (
                              <hr className="my-2 border-border/30" />
                            ),
                          }}
                        >
                          {part.text}
                        </ReactMarkdown>
                      </div>
                    );
                  }

                  // Tool parts
                  if (part.type.startsWith("tool-")) {
                    const toolPart = part as {
                      type: string;
                      toolCallId: string;
                      state: string;
                      input?: unknown;
                      output?: unknown;
                      errorText?: string;
                    };
                    const toolName = part.type.replace("tool-", "");

                    // askQuestions renders as a multi-question form
                    if (toolName === "askQuestions") {
                      if (toolPart.state === "output-available" && toolPart.output) {
                        const data = toolPart.output as {
                          title?: string;
                          questions?: Array<{
                            id: string;
                            question: string;
                            options: Array<{
                              label: string;
                              description?: string;
                              value: string;
                            }>;
                          }>;
                        };
                        if (data.questions?.length) {
                          return (
                            <QuestionForm
                              key={index}
                              title={data.title}
                              questions={data.questions}
                              onSubmit={(answers) => {
                                const summary = answers
                                  .map((a) => `${a.question}: ${a.answer}`)
                                  .join("\n");
                                sendMessage({ text: summary });
                              }}
                              disabled={isLoading}
                            />
                          );
                        }
                      }
                      // Show loading while tool is running
                      if (toolPart.state !== "output-available") {
                        return (
                          <div key={index} className="my-2 flex items-center gap-2 text-xs text-muted-foreground">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Forbereder fragor...
                          </div>
                        );
                      }
                      return null;
                    }

                    // Skip hidden tools
                    const meta = TOOL_META[toolName];
                    if (meta?.hidden) return null;

                    return (
                      <ToolCard
                        key={index}
                        toolName={toolName}
                        state={toolPart.state}
                        output={toolPart.output}
                        errorText={toolPart.errorText}
                      />
                    );
                  }

                  return null;
                })}
              </div>
            </div>
          ))}

          {/* Streaming indicator */}
          {isLoading && messages[messages.length - 1]?.role === "user" && (
            <div className="flex items-center gap-2 text-muted-foreground px-1">
              <Bot className="h-3 w-3 text-primary" />
              <div className="flex gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-bounce [animation-delay:0ms]" />
                <span className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-bounce [animation-delay:150ms]" />
                <span className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t p-3 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (input.trim() && !isLoading) {
              sendMessage({ text: input });
              setInput("");
            }
          }}
          className="flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Fraga din redovisningsassistent..."
            className="text-sm rounded-xl"
            disabled={isLoading}
          />
          <Button
            type="submit"
            size="icon"
            className="rounded-xl shrink-0"
            disabled={!input.trim() || isLoading}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}

function WelcomeMessage() {
  return (
    <div className="flex flex-col items-center text-center py-6 px-2">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-3">
        <Bot className="h-6 w-6 text-primary" />
      </div>
      <h3 className="font-semibold text-sm mb-1">Redovisningsassistent</h3>
      <p className="text-xs text-muted-foreground mb-4 max-w-[280px]">
        Jag hjalper dig med bokforing, kontoklassificering och rapporter enligt
        svensk redovisningslag.
      </p>
      <div className="grid grid-cols-2 gap-2 w-full">
        {[
          { icon: Search, label: "Sok i kontoplanen" },
          { icon: FileText, label: "Skapa verifikation" },
          { icon: BarChart3, label: "Generera rapport" },
          { icon: Calculator, label: "Berakna moms" },
        ].map(({ icon: Icon, label }) => (
          <div
            key={label}
            className="flex items-center gap-2 rounded-lg border border-border/50 px-3 py-2 text-xs text-muted-foreground hover:bg-muted/50 transition-colors cursor-default"
          >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}

const TOOL_META: Record<string, { icon: typeof Search; label: string; hidden?: boolean }> = {
  askQuestions: { icon: Search, label: "Fragor", hidden: true },
  searchAccounts: { icon: Search, label: "Soker i kontoplanen" },
  getAccountBalance: { icon: Calculator, label: "Hamtar kontosaldo" },
  getTrialBalance: { icon: BarChart3, label: "Hamtar saldobalans" },
  searchJournalEntries: { icon: Search, label: "Soker verifikationer" },
  createDraftJournalEntry: { icon: FileText, label: "Skapar verifikation" },
  classifyTransaction: { icon: Calculator, label: "Klassificerar transaktion" },
  generateIncomeStatement: { icon: BarChart3, label: "Genererar resultatrakning" },
  generateBalanceSheet: { icon: BarChart3, label: "Genererar balansrakning" },
  calculateVAT: { icon: Calculator, label: "Beraknar moms" },
};

function ToolCard({
  toolName,
  state,
  output,
  errorText,
}: {
  toolName: string;
  state: string;
  output?: unknown;
  errorText?: unknown;
}) {
  const meta = TOOL_META[toolName] ?? { icon: Search, label: toolName };
  const Icon = meta.icon;
  const isComplete = state === "output-available";
  const errorMessage = errorText ? String(errorText) : null;

  const hasOutput = isComplete && output != null;

  return (
    <div className="my-2 rounded-lg border border-border/50 bg-background overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 bg-muted/30">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs font-medium flex-1">{meta.label}</span>
        {isComplete ? (
          <CheckCircle className="h-3.5 w-3.5 text-green-500" />
        ) : errorMessage ? (
          <XCircle className="h-3.5 w-3.5 text-destructive" />
        ) : (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
        )}
      </div>
      {errorMessage ? (
        <div className="px-3 py-2 text-xs text-destructive">{errorMessage}</div>
      ) : hasOutput ? (
        <div className="px-3 py-2">
          <ToolResultContent toolName={toolName} result={output} />
        </div>
      ) : null}
    </div>
  );
}

function ToolResultContent({
  toolName,
  result,
}: {
  toolName: string;
  result: unknown;
}) {
  const data = result as Record<string, unknown>;

  if (data?.error) {
    return (
      <div className="text-xs text-destructive">{String(data.error)}</div>
    );
  }

  // Account search results
  if (toolName === "searchAccounts" && Array.isArray(data)) {
    const accounts = data as Array<{ number: string; name: string; vatCode?: string }>;
    return (
      <div className="space-y-1">
        {accounts.slice(0, 6).map((a, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <Badge variant="outline" className="font-mono text-[10px] px-1.5">
              {a.number}
            </Badge>
            <span className="truncate">{a.name}</span>
          </div>
        ))}
        {accounts.length > 6 && (
          <div className="text-[10px] text-muted-foreground">
            +{accounts.length - 6} till
          </div>
        )}
      </div>
    );
  }

  // Account balance
  if (toolName === "getAccountBalance" && data?.accountNumber) {
    return (
      <div className="flex items-center justify-between text-xs">
        <span>
          <span className="font-mono">{String(data.accountNumber)}</span>{" "}
          <span className="text-muted-foreground">
            {String(data.accountName)}
          </span>
        </span>
        <span className="font-mono font-semibold">
          {String(data.balanceFormatted)} kr
        </span>
      </div>
    );
  }

  // Validation blocked the entry
  if (toolName === "createDraftJournalEntry" && data?.blocked) {
    const errors = (data.errors as string[]) ?? [];
    return (
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5 text-xs text-destructive font-medium">
          <XCircle className="h-3.5 w-3.5" />
          Blockerad av valideringsregler
        </div>
        {errors.map((e, i) => (
          <div key={i} className="text-[11px] text-destructive/80 ml-5">
            {e}
          </div>
        ))}
      </div>
    );
  }

  // Draft journal entry created — show inline approval + warnings
  if (toolName === "createDraftJournalEntry" && data?.success) {
    const warnings = (data.warnings as string[]) ?? [];
    return (
      <div className="space-y-2">
        {warnings.length > 0 && (
          <div className="rounded-md bg-yellow-500/10 p-2 space-y-1">
            <div className="text-[11px] font-medium text-yellow-500">
              {warnings.length} varning(ar)
            </div>
            {warnings.map((w, i) => (
              <div key={i} className="text-[10px] text-yellow-400/80">
                {w}
              </div>
            ))}
          </div>
        )}
        <InlineApproval
          entryId={String(data.entryId)}
          link={String(data.link)}
        />
      </div>
    );
  }

  // Income statement
  if (toolName === "generateIncomeStatement" && data?.netResult !== undefined) {
    return (
      <div className="text-xs space-y-1">
        <div className="flex justify-between">
          <span>Intakter</span>
          <span className="font-mono text-green-400">
            {Number(data.totalRevenue).toLocaleString("sv-SE")} kr
          </span>
        </div>
        <div className="flex justify-between">
          <span>Kostnader</span>
          <span className="font-mono text-red-400">
            {Number(data.totalCosts).toLocaleString("sv-SE")} kr
          </span>
        </div>
        <hr className="border-border/30" />
        <div className="flex justify-between font-semibold">
          <span>Resultat</span>
          <span className="font-mono">
            {Number(data.netResult).toLocaleString("sv-SE")} kr
          </span>
        </div>
      </div>
    );
  }

  // VAT calculation
  if (toolName === "calculateVAT" && data?.netVat !== undefined) {
    return (
      <div className="text-xs space-y-1">
        <div className="flex justify-between">
          <span>Utgaende moms</span>
          <span className="font-mono">
            {Number(data.outputVat).toLocaleString("sv-SE")} kr
          </span>
        </div>
        <div className="flex justify-between">
          <span>Ingaende moms</span>
          <span className="font-mono">
            {Number(data.inputVat).toLocaleString("sv-SE")} kr
          </span>
        </div>
        <hr className="border-border/30" />
        <div className="flex justify-between font-semibold">
          <span>{data.toPay ? "Att betala" : "Att fa tillbaka"}</span>
          <span className="font-mono">
            {Math.abs(Number(data.netVat)).toLocaleString("sv-SE")} kr
          </span>
        </div>
      </div>
    );
  }

  // Generic fallback — compact summary
  if (Array.isArray(data)) {
    return (
      <div className="text-[10px] text-muted-foreground">
        {data.length} resultat
      </div>
    );
  }

  return (
    <div className="text-[10px] text-muted-foreground">
      Klart
    </div>
  );
}

function InlineApproval({
  entryId,
  link,
}: {
  entryId: string;
  link: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [decision, setDecision] = useState<"none" | "approved" | "rejected">(
    "none"
  );
  const router = useRouter();

  if (decision === "approved") {
    return (
      <div className="flex items-center gap-2 text-xs text-green-500">
        <CheckCircle className="h-3.5 w-3.5" />
        Godkand och bokford
      </div>
    );
  }

  if (decision === "rejected") {
    return (
      <div className="flex items-center gap-2 text-xs text-destructive">
        <XCircle className="h-3.5 w-3.5" />
        Avslagen
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs text-green-500">
        <FileText className="h-3.5 w-3.5" />
        Verifikation skapad som utkast
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          className="h-7 text-xs rounded-lg flex-1"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              const res = await approveJournalEntry(entryId, "system");
              if (res.success) {
                setDecision("approved");
                router.refresh();
              }
            })
          }
        >
          <CheckCircle className="h-3 w-3 mr-1" />
          Godkann
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs rounded-lg flex-1"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              const res = await rejectJournalEntry(entryId, "system");
              if (res.success) {
                setDecision("rejected");
                router.refresh();
              }
            })
          }
        >
          <XCircle className="h-3 w-3 mr-1" />
          Avslaa
        </Button>
      </div>
      <a
        href={link}
        className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
      >
        <ExternalLink className="h-2.5 w-2.5" />
        Visa detaljer
      </a>
    </div>
  );
}

function QuestionForm({
  title,
  questions,
  onSubmit,
  disabled,
}: {
  title?: string;
  questions: Array<{
    id: string;
    question: string;
    options: Array<{ label: string; description?: string; value: string }>;
  }>;
  onSubmit: (answers: Array<{ question: string; answer: string }>) => void;
  disabled: boolean;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const allAnswered = questions.every((q) => answers[q.id]);

  const handleSubmit = () => {
    if (!allAnswered) return;
    setSubmitted(true);
    onSubmit(
      questions.map((q) => ({
        question: q.question,
        answer: answers[q.id],
      }))
    );
  };

  if (submitted) {
    return (
      <div className="my-2 rounded-xl border border-primary/20 bg-primary/5 px-3.5 py-3 space-y-1.5">
        <div className="flex items-center gap-2 text-xs font-medium text-primary">
          <CheckCircle className="h-3.5 w-3.5" />
          Svar skickade
        </div>
        {questions.map((q) => (
          <div key={q.id} className="text-xs">
            <span className="text-muted-foreground">{q.question}</span>{" "}
            <span className="font-medium">{answers[q.id]}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="my-2 rounded-xl border border-border/50 bg-background overflow-hidden">
      {title && (
        <div className="px-3.5 pt-3 pb-1">
          <p className="text-xs font-semibold">{title}</p>
        </div>
      )}

      <div className="divide-y divide-border/30">
        {questions.map((q, qIndex) => (
          <div key={q.id} className="px-3.5 py-3 space-y-2">
            <p className="text-xs font-medium flex items-start gap-2">
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold mt-0.5">
                {qIndex + 1}
              </span>
              {q.question}
            </p>
            <div className="flex flex-col gap-1 ml-6">
              {q.options.map((opt) => {
                const isSelected = answers[q.id] === opt.value;
                return (
                  <button
                    key={opt.value}
                    disabled={disabled}
                    onClick={() =>
                      setAnswers((prev) => ({ ...prev, [q.id]: opt.value }))
                    }
                    className={`flex flex-col items-start rounded-lg border px-2.5 py-1.5 text-left transition-all ${
                      isSelected
                        ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                        : "border-border/40 hover:border-primary/40 hover:bg-muted/30"
                    }`}
                  >
                    <span className="text-[11px] font-medium">{opt.label}</span>
                    {opt.description && (
                      <span className="text-[10px] text-muted-foreground leading-tight">
                        {opt.description}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="px-3.5 py-2.5 bg-muted/20 border-t border-border/30 flex items-center gap-2">
        <Button
          size="sm"
          className="h-7 text-xs rounded-lg flex-1"
          disabled={!allAnswered || disabled}
          onClick={handleSubmit}
        >
          <Send className="h-3 w-3 mr-1" />
          Skicka svar
        </Button>
        <span className="text-[10px] text-muted-foreground">
          {Object.keys(answers).length}/{questions.length}
        </span>
      </div>
    </div>
  );
}
