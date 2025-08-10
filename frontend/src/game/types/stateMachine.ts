// State Machine types for Strateturn
// Provides type-safe state transitions and nested states

import type { Piece, Position, CombatResult, GameEndResult } from './index'

// Main game states
export type GameState = 
  | SetupState
  | PlayingState  
  | FinishedState

export interface SetupState {
  phase: 'setup'
  currentPlayer: 'red' | 'blue'
  redPiecesPlaced: number
  bluePiecesPlaced: number
  board: (Piece | null)[][]
}

export interface PlayingState {
  phase: 'playing'
  subState: PlayingSubState
  board: (Piece | null)[][]
  capturedPieces: { red: Piece[]; blue: Piece[] }
  turn: number
}

export interface FinishedState {
  phase: 'finished'
  winner: 'red' | 'blue' | 'draw'
  reason: string
  board: (Piece | null)[][]
  capturedPieces: { red: Piece[]; blue: Piece[] }
  turn: number
}

// Nested states for playing phase
export type PlayingSubState =
  | WaitingForPlayerState
  | PieceSelectedState
  | MovingPieceState
  | CombatResolutionState
  | EndingTurnState

export interface WaitingForPlayerState {
  type: 'waiting_for_player'
  currentPlayer: 'red' | 'blue'
}

export interface PieceSelectedState {
  type: 'piece_selected'
  currentPlayer: 'red' | 'blue'
  selectedPiece: Piece
  selectedPosition: Position
  validMoves: Position[]
}

export interface MovingPieceState {
  type: 'moving_piece'
  currentPlayer: 'red' | 'blue'
  piece: Piece
  from: Position
  to: Position
}

export interface CombatResolutionState {
  type: 'combat_resolution'
  currentPlayer: 'red' | 'blue'
  attacker: Piece
  defender: Piece
  attackerPosition: Position
  defenderPosition: Position
  combatResult?: CombatResult
}

export interface EndingTurnState {
  type: 'ending_turn'
  currentPlayer: 'red' | 'blue'
  nextPlayer: 'red' | 'blue'
}

// Events that can trigger state transitions
export type GameEvent =
  | PlacePieceEvent
  | StartGameEvent
  | SelectPieceEvent
  | DeselectPieceEvent
  | MovePieceEvent
  | ResolveCombatEvent
  | EndTurnEvent
  | EndGameEvent
  | ResetGameEvent

export interface PlacePieceEvent {
  type: 'PLACE_PIECE'
  piece: Piece
  position: Position
}

export interface StartGameEvent {
  type: 'START_GAME'
}

export interface SelectPieceEvent {
  type: 'SELECT_PIECE'
  piece: Piece
  position: Position
  validMoves: Position[]
}

export interface DeselectPieceEvent {
  type: 'DESELECT_PIECE'
}

export interface MovePieceEvent {
  type: 'MOVE_PIECE'
  from: Position
  to: Position
  targetPiece?: Piece // If moving to occupied cell
}

export interface ResolveCombatEvent {
  type: 'RESOLVE_COMBAT'
  result: CombatResult
}

export interface EndTurnEvent {
  type: 'END_TURN'
}

export interface EndGameEvent {
  type: 'END_GAME'
  result: GameEndResult
}

export interface ResetGameEvent {
  type: 'RESET_GAME'
}

// Transition function type
export type StateTransition<TState extends GameState, TEvent extends GameEvent> = 
  (state: TState, event: TEvent) => GameState | null

// State machine context for additional data
export interface GameContext {
  gameId: string
  players: {
    red: { name: string; isReady: boolean }
    blue: { name: string; isReady: boolean }
  }
  startTime: number
  lastMoveTime: number
}

// State machine configuration
export interface StateMachineConfig {
  initialState: GameState
  context: GameContext
  onStateChange?: (newState: GameState, oldState: GameState, event: GameEvent) => void
  onError?: (error: Error, state: GameState, event: GameEvent) => void
}
