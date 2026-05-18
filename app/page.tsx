"use client";

import { useState, useCallback } from "react";
import { TeamPanel } from "@/components/team-panel";
import { Button } from "@/components/ui/button";
import { RotateCcw, Trophy, Flag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { useBingoGame } from "@/hooks/use-bingo-game";
import { cn } from "@/lib/utils";

export default function BingoPage() {
  const [activeTab, setActiveTab] = useState<1 | 2>(1);
  
  const {
    team1,
    team2,
    team1LastFilled,
    team2LastFilled,
    isLoaded,
    isConnected,
    gameFinished,
    handleIncrement,
    handleFinish,
    handleReset,
    getCategoryCounts,
    getTotalFilled,
    isCategoryComplete,
  } = useBingoGame();

  const team1Total = getTotalFilled(team1);
  const team2Total = getTotalFilled(team2);
  const hasFullWinner = team1Total === 70 || team2Total === 70;
  const hasWinner = hasFullWinner || gameFinished;
  
  const getWinnerTeam = () => {
    if (team1Total > team2Total) return 1;
    if (team2Total > team1Total) return 2;
    return null; // Gelijkspel
  };

  const triggerWinnerConfetti = useCallback(() => {
    const duration = 4000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ["#003366", "#0066cc", "#4da6ff"],
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ["#003366", "#0066cc", "#4da6ff"],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, []);

  // Show loading state while data loads from localStorage
  if (!isLoaded) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Laden...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-gradient-to-r from-[#003366] to-[#004d99] shadow-lg">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                Bingo Drive
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-sm text-blue-200">
                  50 BVS &bull; 7 Ondernemen &bull; 13 Leven
                </p>
                <div className={cn(
                  "flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium",
                  isConnected 
                    ? "bg-green-500/20 text-green-300" 
                    : "bg-yellow-500/20 text-yellow-300"
                )}>
                  <span className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    isConnected ? "bg-green-400 animate-pulse" : "bg-yellow-400"
                  )} />
                  {isConnected ? "Live" : "Verbinden..."}
                </div>
              </div>
            </div>
            
            {/* Score comparison */}
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-3 sm:gap-4 bg-white/15 backdrop-blur-sm rounded-xl px-4 py-3">
                <div className="text-center">
                  <p className="text-xs font-medium text-blue-200 uppercase tracking-wide">Team 1</p>
                  <motion.p
                    key={`t1-${team1Total}`}
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                    className={cn(
                      "text-2xl sm:text-3xl font-bold text-white"
                    )}
                  >
                    {team1Total}
                  </motion.p>
                </div>
                <div className="text-blue-200 font-medium text-lg">:</div>
                <div className="text-center">
                  <p className="text-xs font-medium text-blue-200 uppercase tracking-wide">Team 2</p>
                  <motion.p
                    key={`t2-${team2Total}`}
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                    className={cn(
                      "text-2xl sm:text-3xl font-bold text-white"
                    )}
                  >
                    {team2Total}
                  </motion.p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleFinish}
                className="hidden sm:flex bg-green-500/90 border-green-400 text-white hover:bg-green-600 hover:text-white"
              >
                <Flag className="mr-2 h-4 w-4" />
                Finish
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="hidden sm:flex bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleFinish}
                className="sm:hidden bg-green-500/90 border-green-400 text-white hover:bg-green-600"
              >
                <Flag className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleReset}
                className="sm:hidden bg-white/10 border-white/30 text-white hover:bg-white/20"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="sticky top-[85px] sm:top-[89px] z-30 bg-gradient-to-r from-[#004080] to-[#0059b3] shadow-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex">
            {([1, 2] as const).map((tabNum) => {
              const total = tabNum === 1 ? team1Total : team2Total;
              const isActive = activeTab === tabNum;
              
              return (
                <button
                  key={tabNum}
                  onClick={() => setActiveTab(tabNum)}
                  className={cn(
                    "flex-1 py-4 px-4 text-base font-semibold transition-all relative",
                    isActive
                      ? "text-white bg-white/15"
                      : "text-blue-200 hover:text-white hover:bg-white/10"
                  )}
                >
                  <span>Team {tabNum}</span>
                  <span className={cn(
                    "ml-2 text-sm font-mono",
                    isActive ? "text-white/80" : "text-blue-300"
                  )}>
                    {total}/70
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-1 bg-white"
                      transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <AnimatePresence mode="wait">
          {activeTab === 1 ? (
            <motion.div
              key="team1"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <TeamPanel
                teamNumber={1}
                data={team1}
                lastFilled={team1LastFilled}
                onIncrement={(category) => handleIncrement(1, category)}
                getCategoryCounts={getCategoryCounts}
                getTotalFilled={getTotalFilled}
                isCategoryComplete={isCategoryComplete}
              />
            </motion.div>
          ) : (
            <motion.div
              key="team2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <TeamPanel
                teamNumber={2}
                data={team2}
                lastFilled={team2LastFilled}
                onIncrement={(category) => handleIncrement(2, category)}
                getCategoryCounts={getCategoryCounts}
                getTotalFilled={getTotalFilled}
                isCategoryComplete={isCategoryComplete}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Winner announcement */}
      <AnimatePresence>
        {hasWinner && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onAnimationComplete={() => triggerWinnerConfetti()}
            className="fixed inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="bg-white border-2 border-[#003366]/20 rounded-2xl p-10 text-center shadow-2xl mx-4 max-w-md"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#003366] to-[#0066cc] flex items-center justify-center">
                <Trophy className="h-8 w-8 text-white" />
              </div>
              <motion.h2
                initial={{ y: -10 }}
                animate={{ y: 0 }}
                className="text-4xl font-bold mb-3 text-[#003366]"
              >
                {getWinnerTeam() === null 
                  ? "Gelijkspel!" 
                  : `Team ${getWinnerTeam()} wint!`}
              </motion.h2>
              <div className="text-muted-foreground mb-4 text-lg">
                <p className="font-semibold text-foreground mb-2">
                  Eindstand: {team1Total} - {team2Total}
                </p>
                {hasFullWinner 
                  ? "Alle 70 vakjes zijn gevuld."
                  : "De drive is beeindigd."}
              </div>
              <Button onClick={handleReset} size="lg" className="px-8 bg-[#003366] hover:bg-[#004080]">
                <RotateCcw className="mr-2 h-5 w-5" />
                Nieuw spel starten
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
