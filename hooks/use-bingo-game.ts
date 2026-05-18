"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import type { TeamData, BingoBox, CategoryKey, LastFilledIndex } from "@/lib/supabase/types"

const GAME_ID = "default"
const TOTAL_BOXES = 70
const BOXES_PER_CARD = 35

interface GameRow {
  id: string
  team1_card1: BingoBox[]
  team1_card2: BingoBox[]
  team2_card1: BingoBox[]
  team2_card2: BingoBox[]
  game_finished: boolean
}

// Create shuffled boxes for a team
function createInitialTeamData(): TeamData {
  const categories: CategoryKey[] = [
    ...Array(50).fill("bvs"),
    ...Array(7).fill("ondernemen"),
    ...Array(13).fill("leven"),
  ]
  
  // Shuffle
  for (let i = categories.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [categories[i], categories[j]] = [categories[j], categories[i]]
  }
  
  return {
    card1: categories.slice(0, 35).map((cat, i) => ({ index: i, category: cat, isFilled: false })),
    card2: categories.slice(35, 70).map((cat, i) => ({ index: i + 35, category: cat, isFilled: false })),
  }
}

export function useBingoGame() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [team1, setTeam1] = useState<TeamData>({ card1: [], card2: [] })
  const [team2, setTeam2] = useState<TeamData>({ card1: [], card2: [] })
  const [gameFinished, setGameFinished] = useState(false)
  const [team1LastFilled, setTeam1LastFilled] = useState<LastFilledIndex>(null)
  const [team2LastFilled, setTeam2LastFilled] = useState<LastFilledIndex>(null)
  
  // Use ref to keep stable supabase client
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current

  // Apply game data to state
  const applyGameData = useCallback((game: GameRow) => {
    setTeam1({ card1: game.team1_card1, card2: game.team1_card2 })
    setTeam2({ card1: game.team2_card1, card2: game.team2_card2 })
    setGameFinished(game.game_finished)
  }, [])

  // Initialize and subscribe
  useEffect(() => {
    let mounted = true

    async function init() {
      // Try to load existing game
      const { data, error } = await supabase
        .from("bingo_games")
        .select("*")
        .eq("id", GAME_ID)
        .single()

      if (!mounted) return

      if (data) {
        applyGameData(data as GameRow)
      } else if (error?.code === "PGRST116") {
        // No game exists, create one
        const t1 = createInitialTeamData()
        const t2 = createInitialTeamData()

        await supabase.from("bingo_games").insert({
          id: GAME_ID,
          team1_card1: t1.card1,
          team1_card2: t1.card2,
          team2_card1: t2.card1,
          team2_card2: t2.card2,
          game_finished: false,
        })

        if (mounted) {
          setTeam1(t1)
          setTeam2(t2)
        }
      }

      if (mounted) setIsLoaded(true)
    }

    init()

    // Realtime subscription
    const channel = supabase
      .channel("bingo-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bingo_games", filter: `id=eq.${GAME_ID}` },
        (payload) => {
          if (payload.new && mounted) {
            applyGameData(payload.new as GameRow)
          }
        }
      )
      .subscribe((status) => {
        if (mounted) setIsConnected(status === "SUBSCRIBED")
      })

    return () => {
      mounted = false
      supabase.removeChannel(channel)
    }
  }, [supabase, applyGameData])

  // Increment a category
  const handleIncrement = useCallback(
    async (teamNumber: 1 | 2, category: CategoryKey) => {
      const team = teamNumber === 1 ? team1 : team2
      if (!team.card1?.length || !team.card2?.length) return
      
      const allBoxes = [...team.card1, ...team.card2]

      // Find unfilled boxes of this category
      const unfilled = allBoxes.filter((b) => b.category === category && !b.isFilled)
      if (unfilled.length === 0) return

      // Pick random
      const box = unfilled[Math.floor(Math.random() * unfilled.length)]
      const isCard1 = box.index < 35
      const localIdx = isCard1 ? box.index : box.index - 35

      // Create updated card
      const card = isCard1 ? team.card1 : team.card2
      const updatedCard = card.map((b, i) => (i === localIdx ? { ...b, isFilled: true } : b))

      // Determine which field to update
      const fieldName = teamNumber === 1 
        ? (isCard1 ? "team1_card1" : "team1_card2")
        : (isCard1 ? "team2_card1" : "team2_card2")

      // Update database
      await supabase
        .from("bingo_games")
        .update({ [fieldName]: updatedCard })
        .eq("id", GAME_ID)

      // Optimistic local update
      const cardKey = isCard1 ? "card1" : "card2"
      if (teamNumber === 1) {
        setTeam1((prev) => ({ ...prev, [cardKey]: updatedCard }))
        setTeam1LastFilled({ cardNumber: isCard1 ? 1 : 2, boxIndex: localIdx })
      } else {
        setTeam2((prev) => ({ ...prev, [cardKey]: updatedCard }))
        setTeam2LastFilled({ cardNumber: isCard1 ? 1 : 2, boxIndex: localIdx })
      }
    },
    [team1, team2, supabase]
  )

  // Finish game
  const handleFinish = useCallback(async () => {
    await supabase.from("bingo_games").update({ game_finished: true }).eq("id", GAME_ID)
    setGameFinished(true)
  }, [supabase])

  // Reset game
  const handleReset = useCallback(async () => {
    const t1 = createInitialTeamData()
    const t2 = createInitialTeamData()

    await supabase
      .from("bingo_games")
      .update({
        team1_card1: t1.card1,
        team1_card2: t1.card2,
        team2_card1: t2.card1,
        team2_card2: t2.card2,
        game_finished: false,
      })
      .eq("id", GAME_ID)

    setTeam1(t1)
    setTeam2(t2)
    setGameFinished(false)
    setTeam1LastFilled(null)
    setTeam2LastFilled(null)
  }, [supabase])

  // Helpers - with safety checks for empty arrays
  const getCategoryCounts = useCallback((team: TeamData, category: CategoryKey) => {
    if (!team.card1?.length || !team.card2?.length) {
      return { filled: 0, total: 0 }
    }
    const all = [...team.card1, ...team.card2]
    const total = all.filter((b) => b.category === category).length
    const filled = all.filter((b) => b.category === category && b.isFilled).length
    return { filled, total }
  }, [])

  const getTotalFilled = useCallback((team: TeamData) => {
    if (!team.card1?.length || !team.card2?.length) {
      return 0
    }
    return [...team.card1, ...team.card2].filter((b) => b.isFilled).length
  }, [])

  const isCategoryComplete = useCallback(
    (team: TeamData, category: CategoryKey) => {
      const { filled, total } = getCategoryCounts(team, category)
      return filled >= total
    },
    [getCategoryCounts]
  )

  return {
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
  }
}
