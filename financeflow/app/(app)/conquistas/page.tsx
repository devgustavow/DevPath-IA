"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";
import { Icon } from "@/components/icons";
import { PageHeader } from "@/components/shell";
import { Badge, Card, Progress } from "@/components/ui";
import { computeAchievements } from "@/lib/achievements";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export default function AchievementsPage() {
  const { state } = useStore();
  const achievements = useMemo(() => computeAchievements(state), [state]);
  const unlocked = achievements.filter((a) => a.unlocked).length;

  return (
    <div>
      <PageHeader
        title="Conquistas"
        subtitle={`${unlocked} de ${achievements.length} desbloqueadas — bons hábitos merecem recompensa`}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {achievements.map((a, i) => (
          <motion.div
            key={a.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
          >
            <Card className={cn("ff-card-hover h-full", !a.unlocked && "opacity-75")}>
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-transform",
                    a.unlocked
                      ? "bg-gradient-to-br from-amber-400 to-amber-500 text-white shadow-md shadow-amber-500/25"
                      : "bg-slate-100 text-slate-400 dark:bg-slate-800"
                  )}
                >
                  <Icon name={a.icon} className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <h3 className="text-sm font-semibold">{a.name}</h3>
                    {a.unlocked && (
                      <Badge tone="amber">
                        <Icon name="Trophy" className="h-3 w-3" /> Desbloqueada
                      </Badge>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{a.description}</p>
                </div>
              </div>
              <div className="mt-4">
                <Progress value={a.progress * 100} color={a.unlocked ? "#F59E0B" : "#94A3B8"} />
                <p className="mt-1.5 text-[11px] text-slate-400">{a.detail}</p>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
