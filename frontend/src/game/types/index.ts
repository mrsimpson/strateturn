// Core game types for Strateturn
// Based on requirements in docs/REQUIREMENTS.md

export interface Position {
  x: number
  y: number
}

export interface Piece {
  id: string
  rank: number
  name: string
  player: 'red' | 'blue'
  movement: number | 'unlimited'
  isRevealed: boolean
  position?: Position
}

export interface GameState {
  board: (Piece | null)[][]
  currentPlayer: 'red' | 'blue'
  turn: number
  capturedPieces: { red: Piece[]; blue: Piece[] }
  gamePhase: 'setup' | 'playing' | 'finished'
  winner?: 'red' | 'blue' | 'draw'
  redPiecesPlaced: number
  bluePiecesPlaced: number
}

export interface Move {
  from: Position
  to: Position
  piece: Piece
  timestamp: number
  player: 'red' | 'blue'
}

export interface PieceDefinition {
  rank: number
  name: string
  count: number
  movement: number | 'unlimited'
}

// Hardcoded Stratego piece definitions (REQ-S002)
export const STRATEGO_PIECES: PieceDefinition[] = [
  { rank: 10, name: 'Marshal', count: 1, movement: 1 },
  { rank: 9, name: 'General', count: 1, movement: 1 },
  { rank: 8, name: 'Colonel', count: 2, movement: 1 },
  { rank: 7, name: 'Major', count: 3, movement: 1 },
  { rank: 6, name: 'Captain', count: 4, movement: 1 },
  { rank: 5, name: 'Lieutenant', count: 4, movement: 1 },
  { rank: 4, name: 'Sergeant', count: 4, movement: 1 },
  { rank: 3, name: 'Miner', count: 5, movement: 1 },
  { rank: 2, name: 'Scout', count: 8, movement: 'unlimited' },
  { rank: 1, name: 'Spy', count: 1, movement: 1 },
  { rank: 0, name: 'Bomb', count: 6, movement: 0 },
  { rank: -1, name: 'Flag', count: 1, movement: 0 }
]

export interface ValidationResult {
  isValid: boolean
  error?: string
}

// Re-export combat types
export type { 
  CombatResult, 
  CombatReason, 
  GameEndResult, 
  GameEndReason,
  CombatRule,
  GameRules,
  BoardObstacle
} from './combat'

export { STRATEGO_COMBAT_RULES } from './combat'
