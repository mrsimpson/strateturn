import type {
  GameState,
  GameEvent,
  GameContext,
  StateMachineConfig,
  SetupState,
  PlayingState,
  FinishedState,
  WaitingForPlayerState,
  PieceSelectedState,
  CombatResolutionState,
  EndingTurnState,
  PlacePieceEvent,
  StartGameEvent,
  SelectPieceEvent,
  MovePieceEvent,
  ResolveCombatEvent,
  EndTurnEvent,
  EndGameEvent
} from '../types/stateMachine'
import type { Position } from '../types'
import { GameStateManager } from './GameState'
import { MovementValidator } from './MovementValidator'
import { CombatResolver } from './CombatResolver'
import { GameEndAnalyzer } from './GameEndAnalyzer'

/**
 * State Machine for Strateturn game logic
 * Provides type-safe state transitions and nested states for turn-based gameplay
 */
export class GameStateMachine {
  private currentState: GameState
  private context: GameContext
  private config: StateMachineConfig

  // Game logic components
  private gameStateManager: GameStateManager
  private movementValidator: MovementValidator
  private combatResolver: CombatResolver
  private gameEndAnalyzer: GameEndAnalyzer

  constructor(config: StateMachineConfig) {
    this.config = config
    this.currentState = config.initialState
    this.context = config.context

    // Initialize game logic components
    this.gameStateManager = new GameStateManager()
    this.movementValidator = new MovementValidator()
    this.combatResolver = new CombatResolver()
    this.gameEndAnalyzer = new GameEndAnalyzer()
  }

  /**
   * Get current state (immutable)
   */
  getState(): Readonly<GameState> {
    return Object.freeze({ ...this.currentState })
  }

  /**
   * Set state (for syncing from external sources like WebSocket)
   */
  setState(newState: GameState): void {
    this.currentState = { ...newState }
  }

  /**
   * Get current context
   */
  getContext(): Readonly<GameContext> {
    return Object.freeze({ ...this.context })
  }

  /**
   * Send event to state machine
   */
  send(event: GameEvent): boolean {
    try {
      const oldState = this.currentState
      const newState = this.transition(this.currentState, event)

      if (newState) {
        this.currentState = newState
        this.config.onStateChange?.(newState, oldState, event)
        return true
      }

      return false // Invalid transition
    } catch (error) {
      this.config.onError?.(error as Error, this.currentState, event)
      return false
    }
  }

  /**
   * Main transition function - routes to specific state handlers
   */
  private transition(state: GameState, event: GameEvent): GameState | null {
    switch (state.phase) {
      case 'setup':
        return this.handleSetupTransition(state, event)
      case 'playing':
        return this.handlePlayingTransition(state, event)
      case 'finished':
        return this.handleFinishedTransition(state, event)
      default:
        return null
    }
  }

  /**
   * Handle transitions in setup phase
   */
  private handleSetupTransition(state: SetupState, event: GameEvent): GameState | null {
    switch (event.type) {
      case 'PLACE_PIECE':
        return this.handlePlacePiece(state, event)
      case 'START_GAME':
        return this.handleStartGame(state, event)
      case 'RESET_GAME':
        return this.createInitialState()
      default:
        return null // Invalid event for this state
    }
  }

  /**
   * Handle transitions in playing phase (with nested states)
   */
  private handlePlayingTransition(state: PlayingState, event: GameEvent): GameState | null {
    switch (state.subState.type) {
      case 'waiting_for_player':
        return this.handleWaitingForPlayerTransition(state, event)
      case 'piece_selected':
        return this.handlePieceSelectedTransition(state, event)
      case 'moving_piece':
        return this.handleMovingPieceTransition(state, event)
      case 'ending_turn':
        return this.handleEndingTurnTransition(state, event)
      default:
        return null
    }
  }

  /**
   * Handle transitions in finished phase
   */
  private handleFinishedTransition(state: FinishedState, event: GameEvent): GameState | null {
    switch (event.type) {
      case 'RESET_GAME':
        return this.createInitialState()
      default:
        return null // Only reset allowed in finished state
    }
  }

  /**
   * Setup phase: Place piece
   */
  private handlePlacePiece(state: SetupState, event: PlacePieceEvent): GameState | null {
    // Validate piece placement
    if (!this.isValidSetupPosition(event.position, event.piece.player)) {
      return null
    }

    if (state.board[event.position.y][event.position.x] !== null) {
      return null // Position occupied
    }

    // Create new board with piece placed
    const newBoard = state.board.map(row => [...row])
    newBoard[event.position.y][event.position.x] = { ...event.piece, position: event.position }

    // Update piece count
    const newRedCount = event.piece.player === 'red' ? state.redPiecesPlaced + 1 : state.redPiecesPlaced
    const newBlueCount = event.piece.player === 'blue' ? state.bluePiecesPlaced + 1 : state.bluePiecesPlaced

    // Switch to other player if current player finished placing
    let nextPlayer = state.currentPlayer
    if (event.piece.player === 'red' && newRedCount === 40) {
      nextPlayer = 'blue'
    } else if (event.piece.player === 'blue' && newBlueCount === 40) {
      nextPlayer = 'red'
    }

    return {
      ...state,
      board: newBoard,
      redPiecesPlaced: newRedCount,
      bluePiecesPlaced: newBlueCount,
      currentPlayer: nextPlayer
    }
  }

  /**
   * Setup phase: Start game when both players ready
   */
  private handleStartGame(state: SetupState, event: StartGameEvent): GameState | null {
    if (state.redPiecesPlaced !== 40 || state.bluePiecesPlaced !== 40) {
      return null // Setup not complete
    }

    // TODO: In future, validate event.playerId matches expected player
    // TODO: In future, use event.gameConfig for custom rules
    console.log('Starting game with event:', event.type)

    return {
      phase: 'playing',
      subState: {
        type: 'waiting_for_player',
        currentPlayer: 'red'
      },
      board: state.board,
      capturedPieces: { red: [], blue: [] },
      turn: 1
    }
  }

  /**
   * Playing phase: Waiting for player to select piece
   */
  private handleWaitingForPlayerTransition(state: PlayingState, event: GameEvent): GameState | null {
    const subState = state.subState as WaitingForPlayerState

    switch (event.type) {
      case 'SELECT_PIECE':
        // Validate that the event comes from the current player
        const selectEvent = event as SelectPieceEvent
        if (selectEvent.piece.player !== subState.currentPlayer) {
          console.warn(`Wrong player ${selectEvent.piece.player} trying to select, expected ${subState.currentPlayer}`)
          return null // Wrong player trying to select
        }
        return this.handleSelectPiece(state, event)
      case 'END_GAME':
        return this.handleEndGame(state, event)
      case 'RESET_GAME':
        return this.createInitialState()
      default:
        return null
    }
  }

  /**
   * Playing phase: Piece selected, waiting for move
   */
  private handlePieceSelectedTransition(state: PlayingState, event: GameEvent): GameState | null {
    const subState = state.subState as PieceSelectedState

    switch (event.type) {
      case 'MOVE_PIECE':
        return this.handleMovePiece(state, event)
      case 'DESELECT_PIECE':
        return {
          ...state,
          subState: {
            type: 'waiting_for_player',
            currentPlayer: subState.currentPlayer
          }
        }
      case 'SELECT_PIECE':
        return this.handleSelectPiece(state, event)
      default:
        return null
    }
  }

  /**
   * Playing phase: Moving piece
   */
  private handleMovingPieceTransition(state: PlayingState, event: GameEvent): GameState | null {
    switch (event.type) {
      case 'END_TURN':
        return this.handleEndTurn(state, event)
      default:
        return null
    }
  }


  /**
   * Playing phase: Ending turn
   */
  private handleEndingTurnTransition(state: PlayingState, event: GameEvent): GameState | null {
    const subState = state.subState as EndingTurnState

    switch (event.type) {
      case 'END_TURN':
        return {
          ...state,
          subState: {
            type: 'waiting_for_player',
            currentPlayer: subState.nextPlayer
          },
          turn: state.turn + 1
        }
      default:
        return null
    }
  }

  /**
   * Select piece action
   */
  private handleSelectPiece(state: PlayingState, event: SelectPieceEvent): GameState | null {
    const subState = state.subState as WaitingForPlayerState | PieceSelectedState
    const currentPlayer = subState.currentPlayer

    if (event.piece.player !== currentPlayer) {
      return null // Can't select opponent's piece
    }

    if (event.piece.movement === 0) {
      return null // Can't select immovable piece
    }

    return {
      ...state,
      subState: {
        type: 'piece_selected',
        currentPlayer,
        selectedPiece: event.piece,
        selectedPosition: event.position,
        validMoves: event.validMoves
      }
    }
  }

  /**
   * Move piece action
   */
  private handleMovePiece(state: PlayingState, event: MovePieceEvent): GameState | null {
    const subState = state.subState as PieceSelectedState

    // Create new board with piece moved
    const newBoard = state.board.map(row => [...row])
    const movingPiece = newBoard[event.from.y][event.from.x]

    if (!movingPiece) return null

    newBoard[event.from.y][event.from.x] = null

    if (event.targetPiece) {
      // Combat will occur - resolve it immediately
      const combatResult = this.combatResolver.resolveCombat(movingPiece, event.targetPiece)
      
      if (combatResult.bothDestroyed) {
        // Both pieces destroyed - target position remains empty
        newBoard[event.to.y][event.to.x] = null
      } else if (combatResult.winner) {
        // Winner takes the position
        newBoard[event.to.y][event.to.x] = {
          ...combatResult.winner,
          position: event.to,
          isRevealed: true
        }
      }

      // Update captured pieces
      const newCapturedPieces = this.combatResolver.processCombatResult(combatResult, state.capturedPieces)

      return {
        ...state,
        board: newBoard,
        capturedPieces: newCapturedPieces,
        subState: {
          type: 'ending_turn',
          currentPlayer: subState.currentPlayer,
          nextPlayer: subState.currentPlayer === 'red' ? 'blue' : 'red'
        }
      }
    } else {
      // Simple move to empty cell
      newBoard[event.to.y][event.to.x] = { ...movingPiece, position: event.to }

      return {
        ...state,
        board: newBoard,
        subState: {
          type: 'ending_turn',
          currentPlayer: subState.currentPlayer,
          nextPlayer: subState.currentPlayer === 'red' ? 'blue' : 'red'
        }
      }
    }
  }

  /**
   * Resolve combat action
   */

  /**
   * End turn action - properly implement turn ending logic
   */
  private handleEndTurn(state: PlayingState, event: EndTurnEvent): GameState | null {
    // Check if we're in the correct substate for ending turn
    if (state.subState.type !== 'ending_turn') {
      console.warn(`Cannot end turn from state ${state.subState.type}`)
      return null // Can only end turn from ending_turn state
    }

    const subState = state.subState as EndingTurnState
    
    // TODO: In future, validate event.playerId matches current player
    // TODO: In future, use event.moveData for move history
    console.log('Ending turn for player:', subState.currentPlayer, 'event:', event.type)

    // Check for game end conditions after each turn
    const gameEndResult = this.gameEndAnalyzer.checkGameEnd({
      board: state.board,
      currentPlayer: subState.nextPlayer,
      turn: state.turn + 1,
      capturedPieces: state.capturedPieces,
      gamePhase: 'playing',
      redPiecesPlaced: 40, // Always 40 in playing phase
      bluePiecesPlaced: 40
    })

    if (gameEndResult.gameEnded) {
      return {
        phase: 'finished',
        winner: gameEndResult.winner || 'draw',
        reason: gameEndResult.reason || 'unknown',
        board: state.board,
        capturedPieces: state.capturedPieces,
        turn: state.turn + 1
      }
    }

    // Continue game with next player
    return {
      ...state,
      subState: {
        type: 'waiting_for_player',
        currentPlayer: subState.nextPlayer
      },
      turn: state.turn + 1
    }
  }

  /**
   * End game action
   */
  private handleEndGame(state: PlayingState, event: EndGameEvent): GameState | null {
    return {
      phase: 'finished',
      winner: event.result.winner || 'draw',
      reason: event.result.reason || 'unknown',
      board: state.board,
      capturedPieces: state.capturedPieces,
      turn: state.turn
    }
  }

  /**
   * Create initial game state
   */
  private createInitialState(): SetupState {
    return {
      phase: 'setup',
      currentPlayer: 'red',
      redPiecesPlaced: 0,
      bluePiecesPlaced: 0,
      board: Array(10).fill(null).map(() => Array(10).fill(null))
    }
  }

  /**
   * Validate setup position (REQ-S003)
   */
  private isValidSetupPosition(position: Position, player: 'red' | 'blue'): boolean {
    if (player === 'red') {
      return position.y >= 6 && position.y <= 9
    } else {
      return position.y >= 0 && position.y <= 3
    }
  }

  /**
   * Check if current state allows a specific event
   */
  canSend(event: GameEvent): boolean {
    return this.transition(this.currentState, event) !== null
  }

  /**
   * Get available actions for current state
   */
  getAvailableActions(): string[] {
    const actions: string[] = []

    switch (this.currentState.phase) {
      case 'setup':
        actions.push('PLACE_PIECE')
        if ((this.currentState as SetupState).redPiecesPlaced === 40 &&
            (this.currentState as SetupState).bluePiecesPlaced === 40) {
          actions.push('START_GAME')
        }
        break
      case 'playing':
        const subState = (this.currentState as PlayingState).subState
        switch (subState.type) {
          case 'waiting_for_player':
            actions.push('SELECT_PIECE')
            break
          case 'piece_selected':
            actions.push('MOVE_PIECE', 'DESELECT_PIECE')
            break
          case 'combat_resolution':
            actions.push('RESOLVE_COMBAT')
            break
          case 'ending_turn':
            actions.push('END_TURN')
            break
        }
        break
      case 'finished':
        actions.push('RESET_GAME')
        break
    }

    actions.push('RESET_GAME') // Always available
    return actions
  }
}
