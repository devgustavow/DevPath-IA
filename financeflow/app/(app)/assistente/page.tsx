"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/icons";
import { PageHeader } from "@/components/shell";
import { Button, RichText } from "@/components/ui";
import { answerQuestion, SUGGESTED_QUESTIONS } from "@/lib/ai";
import { generateInsights } from "@/lib/finance";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  text: string;
}

export default function AssistantPage() {
  const { state } = useStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  useEffect(() => {
    // Mensagem de boas-vindas com insights
    const insights = generateInsights(state);
    const top = insights.slice(0, 3).map((i) => `• ${i.text}`).join("\n");
    setMessages([
      {
        role: "assistant",
        text: `Olá! Sou o assistente financeiro do FinanceFlow. Analiso os seus dados em tempo real.\n\n**Insights de hoje:**\n${top}\n\nPergunte qualquer coisa sobre suas finanças! 👇`,
      },
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function ask(question: string) {
    const q = question.trim();
    if (!q || thinking) return;
    setMessages((m) => [...m, { role: "user", text: q }]);
    setInput("");
    setThinking(true);
    // Latência artificial para UX de "pensando" (motor local é instantâneo)
    setTimeout(() => {
      const answer = answerQuestion(state, q);
      setMessages((m) => [...m, { role: "assistant", text: answer }]);
      setThinking(false);
    }, 450);
  }

  return (
    <div className="flex h-[calc(100dvh-11rem)] flex-col lg:h-[calc(100dvh-9rem)]">
      <PageHeader
        title="Assistente IA"
        subtitle="Pergunte sobre seus gastos, metas, cartões e receba insights"
      />

      <div className="ff-card flex flex-1 flex-col overflow-hidden">
        {/* Mensagens */}
        <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className={cn("flex gap-3", m.role === "user" && "flex-row-reverse")}
            >
              {m.role === "assistant" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 text-white">
                  <Icon name="Bot" className="h-4 w-4" />
                </div>
              )}
              <div
                className={cn(
                  "max-w-[85%] space-y-0.5 rounded-2xl px-4 py-3 text-sm leading-relaxed sm:max-w-[75%]",
                  m.role === "user"
                    ? "rounded-br-md bg-brand-600 text-white"
                    : "rounded-bl-md bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                )}
              >
                <RichText text={m.text} />
              </div>
            </motion.div>
          ))}
          {thinking && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 text-white">
                <Icon name="Bot" className="h-4 w-4" />
              </div>
              <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md bg-slate-100 px-4 py-3 dark:bg-slate-800">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="h-1.5 w-1.5 rounded-full bg-slate-400"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                  />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Sugestões */}
        <div className="flex gap-1.5 overflow-x-auto border-t border-slate-100 px-4 py-2.5 dark:border-slate-800">
          {SUGGESTED_QUESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => ask(q)}
              className="ff-focus shrink-0 rounded-full border border-slate-200 px-3 py-1.5 text-[11px] text-slate-500 transition-colors hover:border-brand-400 hover:bg-brand-50 hover:text-brand-700 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-brand-500/10 dark:hover:text-brand-400"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            ask(input);
          }}
          className="flex gap-2 border-t border-slate-100 p-3 dark:border-slate-800"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='Ex.: "Quanto gastei com mercado este mês?"'
            className="ff-focus h-11 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-800/60"
          />
          <Button type="submit" disabled={!input.trim() || thinking} className="h-11 w-11 p-0">
            <Icon name="Send" className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
