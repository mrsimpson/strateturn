// Configurable combat system types
// Based on YAML schema from architecture planning

export interface CombatRule {
  // Piece that gets special combat abilities
  piece: string // piece name (e.g., "Spy", "Miner")
  
  // Additional pieces this piece can defeat (beyond normal rank comparison)
  defeatsAdditionally?: string[] // e.g., ["Marshal"] for Spy
  
  // Pieces this piece defeats regardless of rank (except specified exceptions)
  defeatsAllExcept?: string[] // e.g., ["Miner"] for Bomb
  
  // Whether this piece can attack at all
  canAttack?: boolean // default: true for moveable pieces, false for Bomb/Flag
}

export interface GameRules {
  // All combat rules for the game
  combatRules: CombatRule[]
  
  // Piece definitions with ranks
  pieces: PieceDefinition[]
  
  // Board configuration
  board: {
    width: number
    height: number
    obstacles?: BoardObstacle[]
  }
}

export interface PieceDefinition {
  rank: number
  name: string
  count: number
  movement: number | 'unlimited'
}

export interface BoardObstacle {
  x: number
  y: number
  width: number
  height: number
  type: string // e.g., "lake"
}

// Combat resolution result - ONLY handles combat, not game end
export interface CombatResult {
  winner: Piece | null
  loser: Piece | null
  bothDestroyed: boolean
  reason: CombatReason
}

export type CombatReason = 
  | 'rank_higher'           // Standard: higher rank wins
  | 'rank_equal'            // Standard: equal ranks destroy each other
  | 'special_defeats'       // Special rule: piece defeats another specifically
  | 'defeats_all_except'    // Special rule: piece defeats all except specified

// Separate game end analysis
export interface GameEndResult {
  gameEnded: boolean
  winner?: 'red' | 'blue' | 'draw'
  reason?: GameEndReason
}

export type GameEndReason = 
  | 'flag_captured'         // Flag was captured
  | 'no_moveable_pieces'    // Player has no pieces that can move
  | 'surrender'             // Player surrendered
  | 'timeout'               // Game timeout (if implemented)
  | 'stalemate'             // No progress possible

// Example Stratego combat rules (hardcoded for now, later from YAML)
export const STRATEGO_COMBAT_RULES: CombatRule[] = [
  {
    piece: "Spy",
    defeatsAdditionally: ["Marshal"]
  },
  {
    piece: "Miner", 
    defeatsAdditionally: ["Bomb"]
  },
  {
    piece: "Bomb",
    defeatsAllExcept: ["Miner"],
    canAttack: false
  },
  {
    piece: "Flag",
    canAttack: false
    // Flag capture is handled by GameEndAnalyzer, not CombatResolver
  }
]
