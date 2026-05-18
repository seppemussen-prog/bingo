-- Create game_sessions table to track different bingo games
CREATE TABLE IF NOT EXISTS game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  is_active BOOLEAN DEFAULT true
);

-- Create bingo_state table to track filled boxes for each team
CREATE TABLE IF NOT EXISTS bingo_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_session_id UUID REFERENCES game_sessions(id) ON DELETE CASCADE,
  team_number INTEGER NOT NULL CHECK (team_number IN (1, 2)),
  category TEXT NOT NULL CHECK (category IN ('bvs', 'betaalverkeer', 'leven')),
  filled_indices INTEGER[] DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(game_session_id, team_number, category)
);

-- Enable realtime for bingo_state
ALTER PUBLICATION supabase_realtime ADD TABLE bingo_state;

-- Disable RLS for simplicity (this is a public game)
ALTER TABLE game_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE bingo_state DISABLE ROW LEVEL SECURITY;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_bingo_state_game_session ON bingo_state(game_session_id);
CREATE INDEX IF NOT EXISTS idx_bingo_state_team ON bingo_state(team_number);
