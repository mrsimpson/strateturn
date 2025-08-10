import type { GameState, Piece, GameEndResult } from '../types'
import { MovementValidator } from './MovementValidator'

/**
 * Analyzes game state to determine if the game has ended
 * Implements requirements REQ-C007, REQ-T005
 * Separate from combat resolution for clean architecture
 */
export class GameEndAnalyzer {
  private movementValidator: MovementValidator

  constructor() {
    this.movementValidator = new MovementValidator()
  }

  /**
   * Check if the game has ended based on current state
   */
  checkGameEnd(gameState: GameState): GameEndResult {
    // Check for flag capture (REQ-C007)
    const flagCaptureResult = this.checkFlagCapture(gameState)
    if (flagCaptureResult.gameEnded) {
      return flagCaptureResult
    }

    // Check if a player has no moveable pieces (REQ-T005)
    const noMoveableResult = this.checkNoMoveablePieces(gameState)
    if (noMoveableResult.gameEnded) {
      return noMoveableResult
    }

    // Check for stalemate (no valid moves possible)
    const stalemateResult = this.checkStalemate(gameState)
    if (stalemateResult.gameEnded) {
      return stalemateResult
    }

    // Game continues
    return { gameEnded: false }
  }

  /**
   * REQ-C007: Check if flag was captured
   */
  private checkFlagCapture(gameState: GameState): GameEndResult {
    let redFlagExists = false
    let blueFlagExists = false

    // Check if flags still exist on the board
    for (let y = 0; y < gameState.board.length; y++) {
      for (let x = 0; x < gameState.board[y].length; x++) {
        const piece = gameState.board[y][x]
        if (piece && piece.name === 'Flag') {
          if (piece.player === 'red') {
            redFlagExists = true
          } else if (piece.player === 'blue') {
            blueFlagExists = true
          }
        }
      }
    }

    // Determine winner based on missing flags
    if (!redFlagExists && !blueFlagExists) {
      return {
        gameEnded: true,
        winner: 'draw',
        reason: 'flag_captured'
      }
    } else if (!redFlagExists) {
      return {
        gameEnded: true,
        winner: 'blue',
        reason: 'flag_captured'
      }
    } else if (!blueFlagExists) {
      return {
        gameEnded: true,
        winner: 'red',
        reason: 'flag_captured'
      }
    }

    return { gameEnded: false }
  }

  /**
   * REQ-T005: Check if a player has no moveable pieces
   */
  private checkNoMoveablePieces(gameState: GameState): GameEndResult {
    const redMoveablePieces = this.getMoveablePieces(gameState, 'red')
    const blueMoveablePieces = this.getMoveablePieces(gameState, 'blue')

    if (redMoveablePieces.length === 0 && blueMoveablePieces.length === 0) {
      return {
        gameEnded: true,
        winner: 'draw',
        reason: 'no_moveable_pieces'
      }
    } else if (redMoveablePieces.length === 0) {
      return {
        gameEnded: true,
        winner: 'blue',
        reason: 'no_moveable_pieces'
      }
    } else if (blueMoveablePieces.length === 0) {
      return {
        gameEnded: true,
        winner: 'red',
        reason: 'no_moveable_pieces'
      }
    }

    return { gameEnded: false }
  }

  /**
   * Check for stalemate (no valid moves possible for current player)
   */
  private checkStalemate(gameState: GameState): GameEndResult {
    if (gameState.gamePhase !== 'playing') {
      return { gameEnded: false }
    }

    const currentPlayerPieces = this.getMoveablePieces(gameState, gameState.currentPlayer)
    
    // Check if any piece has valid moves
    for (const piece of currentPlayerPieces) {
      if (piece.position) {
        const validMoves = this.movementValidator.getValidMoves(piece, piece.position, gameState.board)
        if (validMoves.length > 0) {
          return { gameEnded: false } // Found at least one valid move
        }
      }
    }

    // No valid moves for current player
    const winner = gameState.currentPlayer === 'red' ? 'blue' : 'red'
    return {
      gameEnded: true,
      winner,
      reason: 'stalemate'
    }
  }

  /**
   * Get all pieces that can potentially move for a player
   */
  private getMoveablePieces(gameState: GameState, player: 'red' | 'blue'): Piece[] {
    const moveablePieces: Piece[] = []

    for (let y = 0; y < gameState.board.length; y++) {
      for (let x = 0; x < gameState.board[y].length; x++) {
        const piece = gameState.board[y][x]
        if (piece && piece.player === player && piece.movement > 0) {
          moveablePieces.push(piece)
        }
      }
    }

    return moveablePieces
  }

  /**
   * Check if game ended due to surrender
   */
  checkSurrender(player: 'red' | 'blue'): GameEndResult {
    const winner = player === 'red' ? 'blue' : 'red'
    return {
      gameEnded: true,
      winner,
      reason: 'surrender'
    }
  }

  /**
   * Check if game ended due to timeout (if implemented)
   */
  checkTimeout(): GameEndResult {
    return {
      gameEnded: true,
      winner: 'draw',
      reason: 'timeout'
    }
  }
}
