"use client";

import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import type { BingoBox, LastFilledIndex } from "@/lib/supabase/types";

interface BingoCardProps {
  cardNumber: 1 | 2;
  boxes: BingoBox[];
  lastFilled: LastFilledIndex;
}

const categoryColors: Record<string, { bg: string; filled: string; text: string; border: string }> = {
  bvs: { 
    bg: "bg-blue-50", 
    filled: "bg-[#003366]",
    text: "text-[#003366]",
    border: "border-blue-200"
  },
  ondernemen: { 
    bg: "bg-sky-50", 
    filled: "bg-[#0066cc]",
    text: "text-[#0066cc]",
    border: "border-sky-200"
  },
  leven: { 
    bg: "bg-cyan-50", 
    filled: "bg-[#4da6ff]",
    text: "text-[#0077cc]",
    border: "border-cyan-200"
  },
}

const categoryLabels: Record<string, string> = {
  bvs: "BVS",
  ondernemen: "Ondernemen",
  leven: "Leven",
}

export function BingoCard({ cardNumber, boxes, lastFilled }: BingoCardProps) {
  const filledCount = boxes.filter(b => b.isFilled).length;
  
  return (
    <div className="bg-white rounded-2xl border border-blue-100 shadow-md overflow-hidden">
      {/* Card Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-blue-100 bg-gradient-to-r from-[#003366] to-[#004d99]">
        <h3 className="text-lg font-bold text-white">Kaart {cardNumber}</h3>
        <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
          <span className="text-base font-bold text-white">{filledCount}</span>
          <span className="text-sm text-blue-200">/ {boxes.length}</span>
        </div>
      </div>
      
      {/* Bingo Grid */}
      <div className="p-5">
        <div className="grid grid-cols-7 gap-2.5">
          <AnimatePresence>
            {boxes.map((box, idx) => {
              const isJustFilled = lastFilled?.cardNumber === cardNumber && lastFilled?.boxIndex === idx;
              const colors = categoryColors[box.category];
              
              return (
                <motion.div
                  key={idx}
                  initial={false}
                  animate={
                    isJustFilled
                      ? {
                          scale: [1, 1.12, 1],
                          transition: { duration: 0.35, ease: "easeOut" },
                        }
                      : { scale: 1 }
                  }
                  className={cn(
                    "aspect-square rounded-xl flex items-center justify-center transition-all duration-300 border-2",
                    "min-h-[56px] min-w-[56px]",
                    box.isFilled
                      ? cn(colors.filled, "text-white border-transparent shadow-lg")
                      : cn(colors.bg, colors.text, colors.border, "hover:shadow-sm")
                  )}
                >
                  <span className={cn(
                    "font-bold text-center leading-tight select-none",
                    box.category === "ondernemen" ? "text-[8px] sm:text-[9px]" : "text-[10px] sm:text-xs"
                  )}>
                    {categoryLabels[box.category]}
                  </span>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
