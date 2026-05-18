"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { BingoCard } from "./bingo-card";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { CheckCircle2, Plus } from "lucide-react";
import type { TeamData, CategoryKey, LastFilledIndex } from "@/lib/supabase/types";

interface TeamPanelProps {
  teamNumber: 1 | 2;
  data: TeamData;
  lastFilled: LastFilledIndex;
  onIncrement: (category: CategoryKey) => void;
  getCategoryCounts: (team: TeamData, category: CategoryKey) => { filled: number; total: number };
  getTotalFilled: (team: TeamData) => number;
  isCategoryComplete: (team: TeamData, category: CategoryKey) => boolean;
}

const categories: { key: CategoryKey; label: string; color: string; bgColor: string; hoverColor: string }[] = [
  { key: "bvs", label: "BVS", color: "bg-[#003366]", bgColor: "bg-blue-50", hoverColor: "hover:bg-[#004080]" },
  { key: "ondernemen", label: "Ondernemen", color: "bg-[#0066cc]", bgColor: "bg-sky-50", hoverColor: "hover:bg-[#0077ee]" },
  { key: "leven", label: "Leven", color: "bg-[#4da6ff]", bgColor: "bg-cyan-50", hoverColor: "hover:bg-[#66b3ff]" },
];

export function TeamPanel({
  teamNumber,
  data,
  lastFilled,
  onIncrement,
  getCategoryCounts,
  getTotalFilled,
  isCategoryComplete,
}: TeamPanelProps) {
  const prevCompletionRef = useRef<Record<CategoryKey, boolean>>({
    bvs: false,
    ondernemen: false,
    leven: false,
  });

  useEffect(() => {
    categories.forEach(({ key }) => {
      const isComplete = isCategoryComplete(data, key);
      if (isComplete && !prevCompletionRef.current[key]) {
        const colors = key === 'bvs' 
          ? ["#003366", "#004080"] 
          : key === 'ondernemen'
          ? ["#0066cc", "#0077ee"]
          : ["#4da6ff", "#66b3ff"];
        
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors,
        });
      }
      prevCompletionRef.current[key] = isComplete;
    });
  }, [data, isCategoryComplete]);

  return (
    <div className="space-y-6">
      {/* Category Buttons */}
      <div className="bg-white rounded-2xl border border-blue-100 shadow-md p-6">
        <h3 className="text-lg font-semibold text-[#003366] mb-5">Score toevoegen</h3>
        <div className="grid grid-cols-3 gap-4">
          {categories.map(({ key, label, color, bgColor, hoverColor }) => {
            const { filled, total } = getCategoryCounts(data, key);
            const isComplete = filled >= total;
            const catPercentage = Math.round((filled / total) * 100);
            
            return (
              <div key={key} className="space-y-3">
                <Button
                  onClick={() => onIncrement(key)}
                  disabled={isComplete}
                  size="lg"
                  className={cn(
                    "w-full h-14 text-white font-semibold text-base transition-all relative",
                    color,
                    hoverColor,
                    isComplete && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <AnimatePresence mode="wait">
                    {isComplete ? (
                      <motion.div
                        key="complete"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="flex items-center gap-2"
                      >
                        <CheckCircle2 className="h-5 w-5" />
                        <span>Klaar</span>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="add"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center gap-2"
                      >
                        <Plus className="h-5 w-5" />
                        <span>{label}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Button>
                
                {/* Category progress */}
                <div className={cn("rounded-lg p-3", bgColor)}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">{label}</span>
                    <span className="text-sm font-mono font-semibold text-foreground">
                      {filled} / {total}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-white/80 overflow-hidden">
                    <motion.div
                      className={cn("h-full rounded-full", color)}
                      initial={{ width: 0 }}
                      animate={{ width: `${catPercentage}%` }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bingo Cards */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-[#003366] px-1">Bingokaarten</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <BingoCard cardNumber={1} boxes={data.card1} lastFilled={lastFilled} />
          <BingoCard cardNumber={2} boxes={data.card2} lastFilled={lastFilled} />
        </div>
      </div>
    </div>
  );
}
