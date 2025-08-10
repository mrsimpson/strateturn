import type { GameState, Position, Piece } from '../types'

/**
 * GameState management class
 * Implements requirements REQ-G001 through REQ-G006
 */
export class GameStateManager {
  private state: GameState

  constructor() {
    this.state = this.createInitialState()
  }

  /**
   * REQ-G001: Represent game board as 10x10 grid with coordinate system (0,0) to (9,9)
   */
  private createInitialState(): GameState {
    const board: (Piece | null)[][] = []
    
    // Initialize 10x10 board
    for (let y = 0; y < 10; y++) {
      board[y] = []
      for (let x = 0; x < 10; x++) {
        board[y][x] = null
      }
    }

    return {
      board,
      currentPlayer: 'red',
      turn: 0,
      capturedPieces: { red: [], blue: [] },
      gamePhase: 'setup',
      redPiecesPlaced: 0,
      bluePiecesPlaced: 0
    }
  }

  /**
   * REQ-G002: Validate position is within board boundaries and unoccupied
   */
  isValidPosition(position: Position): boolean {
    const { x, y } = position
    
    // Check boundaries
    if (x < 0 || x >= 10 || y < 0 || y >= 10) {
      return false
    }
    
    // Check if unoccupied
    return this.state.board[y][x] === null
  }

  /**
   * REQ-G002: Validate position is within board boundaries (occupied or not)
   */
  isWithinBounds(position: Position): boolean {
    const { x, y } = position
    return x >= 0 && x < 10 && y >= 0 && y < 10
  }

  /**
   * REQ-G003: Get current game state (immutable)
   */
  getState(): Readonly<GameState> {
    return Object.freeze({ ...this.state })
  }

  /**
   * REQ-G004: Create immutable state objects for predictable updates
   */
  private updateState(updates: Partial<GameState>): void {
    this.state = Object.freeze({
      ...this.state,
      ...updates
    })
  }

  /**
   * REQ-G005: Track game phases
   */
  setGamePhase(phase: GameState['gamePhase']): void {
    this.updateState({ gamePhase: phase })
  }

  /**
   * REQ-G006: Determine winner
   */
  setWinner(winner: 'red' | 'blue' | 'draw'): void {
    this.updateState({ 
      winner,
      gamePhase: 'finished'
    })
  }

  /**
   * Place a piece on the board during setup phase
   */
  placePiece(piece: Piece, position: Position): boolean {
    if (!this.isValidPosition(position)) {
      return false
    }

    // REQ-S003: Restrict piece placement to player's own territory
    if (!this.isValidSetupPosition(position, piece.player)) {
      return false
    }

    // Create new board state
    const newBoard = this.state.board.map(row => [...row])
    newBoard[position.y][position.x] = { ...piece, position }

    // Update piece count
    const countKey = piece.player === 'red' ? 'redPiecesPlaced' : 'bluePiecesPlaced'
    const newCount = this.state[countKey] + 1

    this.updateState({
      board: newBoard,
      [countKey]: newCount
    })

    return true
  }

  /**
   * REQ-S003: Validate setup territory (first 4 rows for each player)
   */
  private isValidSetupPosition(position: Position, player: 'red' | 'blue'): boolean {
    if (player === 'red') {
      // Red player: rows 0-3 (bottom of board from red's perspective)
      return position.y >= 6 && position.y <= 9
    } else {
      // Blue player: rows 6-9 (top of board from blue's perspective)  
      return position.y >= 0 && position.y <= 3
    }
  }

  /**
   * Move a piece from one position to another
   */
  movePiece(from: Position, to: Position): boolean {
    if (!this.isWithinBounds(from) || !this.isWithinBounds(to)) {
      return false
    }

    const piece = this.state.board[from.y][from.x]
    if (!piece) {
      return false
    }

    // Validate it's the current player's piece
    if (piece.player !== this.state.currentPlayer) {
      return false
    }

    // Create new board state
    const newBoard = this.state.board.map(row => [...row])
    newBoard[from.y][from.x] = null
    newBoard[to.y][to.x] = { ...piece, position: to }

    // Switch turns and increment turn counter
    const nextPlayer = this.state.currentPlayer === 'red' ? 'blue' : 'red'

    this.updateState({
      board: newBoard,
      currentPlayer: nextPlayer,
      turn: this.state.turn + 1
    })

    return true
  }

  /**
   * Get piece at position
   */
  getPieceAt(position: Position): Piece | null {
    if (!this.isWithinBounds(position)) {
      return null
    }
    return this.state.board[position.y][position.x]
  }

  /**
   * REQ-S005: Check if all required pieces are placed for a player
   */
  isSetupComplete(player: 'red' | 'blue'): boolean {
    const placedCount = player === 'red' ? this.state.redPiecesPlaced : this.state.bluePiecesPlaced
    return placedCount === 40 // REQ-S001: Each player places exactly 40 pieces
  }

  /**
   * Check if both players have completed setup
   */
  isBothPlayersSetupComplete(): boolean {
    return this.isSetupComplete('red') && this.isSetupComplete('blue')
  }

  /**
   * Start the game after setup is complete
   */
  startGame(): boolean {
    if (!this.isBothPlayersSetupComplete()) {
      return false
    }

    this.updateState({
      gamePhase: 'playing',
      currentPlayer: 'red', // Red starts first
      turn: 1
    })

    return true
  }

  /**
   * Reset game to initial state
   */
  reset(): void {
    this.state = this.createInitialState()
  }
}
