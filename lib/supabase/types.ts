export interface GameSession {
  id: string
  created_at: string
  is_active: boolean
}

export interface BingoBox {
  index: number
  category: CategoryKey
  isFilled: boolean
}

export interface BingoState {
  id: string
  game_session_id: string
  team_number: 1 | 2
  card_number: 1 | 2
  boxes: BingoBox[]
  updated_at: string
}

export type CategoryKey = 'bvs' | 'ondernemen' | 'leven'

export interface TeamData {
  card1: BingoBox[]
  card2: BingoBox[]
}

export interface LastFilledIndex {
  cardNumber: 1 | 2
  boxIndex: number
} | null
