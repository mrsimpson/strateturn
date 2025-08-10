import type { Position, Piece, ValidationResult } from '../types'

/**
 * Movement validation logic
 * Implements requirements REQ-M001 through REQ-M008
 */
export class MovementValidator {
  
  /**
   * REQ-M005: Check piece-specific movement rules before allowing move
   */
  canMove(piece: Piece, from: Position, to: Position, board: (Piece | null)[][]): ValidationResult {
    // REQ-M004: Pieces with movement 0 cannot move
    if (piece.movement === 0) {
      return { isValid: false, error: 'This piece cannot move' }
    }

    // Check basic movement rules
    const distance = this.calculateDistance(from, to)
    const direction = this.getDirection(from, to)

    // REQ-M006: Prevent diagonal movement
    if (direction === 'diagonal') {
      return { isValid: false, error: 'Diagonal movement is not allowed' }
    }

    // REQ-M001: Pieces with movement 1 can only move to adjacent cells
    if (piece.movement === 1 && distance !== 1) {
      return { isValid: false, error: 'This piece can only move one cell at a time' }
    }

    // REQ-M002: Unlimited movement pieces can move in straight lines until blocked
    if (piece.movement === 'unlimited') {
      const pathValidation = this.isPathClear(from, to, board)
      if (!pathValidation.isValid) {
        return pathValidation
      }
    }

    // REQ-M008: Prevent moving to cells occupied by friendly pieces
    const targetPiece = board[to.y]?.[to.x]
    if (targetPiece && targetPiece.player === piece.player) {
      return { isValid: false, error: 'Cannot move to a cell occupied by your own piece' }
    }

    return { isValid: true }
  }

  /**
   * REQ-M001: Get valid moves for pieces with movement value 1 (adjacent cells)
   * REQ-M002: Get valid moves for unlimited movement pieces (straight lines)
   */
  getValidMoves(piece: Piece, position: Position, board: (Piece | null)[][]): Position[] {
    const validMoves: Position[] = []

    // REQ-M004: Pieces with movement 0 cannot move
    if (piece.movement === 0) {
      return validMoves
    }

    if (piece.movement === 1) {
      // REQ-M001: Adjacent cells only (up, down, left, right)
      const adjacentPositions = [
        { x: position.x, y: position.y - 1 }, // up
        { x: position.x, y: position.y + 1 }, // down
        { x: position.x - 1, y: position.y }, // left
        { x: position.x + 1, y: position.y }  // right
      ]

      for (const pos of adjacentPositions) {
        if (this.isWithinBounds(pos, board) && this.canMove(piece, position, pos, board).isValid) {
          validMoves.push(pos)
        }
      }
    } else if (piece.movement === 'unlimited') {
      // REQ-M002: Straight lines until blocked
      const directions = [
        { dx: 0, dy: -1 }, // up
        { dx: 0, dy: 1 },  // down
        { dx: -1, dy: 0 }, // left
        { dx: 1, dy: 0 }   // right
      ]

      for (const dir of directions) {
        let currentPos = { x: position.x + dir.dx, y: position.y + dir.dy }
        
        while (this.isWithinBounds(currentPos, board)) {
          const targetPiece = board[currentPos.y][currentPos.x]
          
          // REQ-M008: Stop if friendly piece
          if (targetPiece && targetPiece.player === piece.player) {
            break
          }
          
          validMoves.push({ ...currentPos })
          
          // REQ-M007: Stop after enemy piece (can capture but can't continue)
          if (targetPiece && targetPiece.player !== piece.player) {
            break
          }
          
          currentPos = { x: currentPos.x + dir.dx, y: currentPos.y + dir.dy }
        }
      }
    }

    return validMoves
  }

  /**
   * REQ-M003: Check if path is clear (no pieces blocking the way)
   */
  isPathClear(from: Position, to: Position, board: (Piece | null)[][]): ValidationResult {
    const direction = this.getDirection(from, to)
    
    if (direction === 'diagonal') {
      return { isValid: false, error: 'Diagonal paths are not allowed' }
    }

    if (direction === 'same') {
      return { isValid: true } // Same position
    }

    const steps = this.getPathSteps(from, to)
    
    // Check each step in the path (excluding start and end positions)
    for (let i = 1; i < steps.length - 1; i++) {
      const step = steps[i]
      if (board[step.y]?.[step.x] !== null) {
        return { isValid: false, error: 'Path is blocked by another piece' }
      }
    }

    return { isValid: true }
  }

  /**
   * Calculate Manhattan distance between two positions
   */
  private calculateDistance(from: Position, to: Position): number {
    return Math.abs(to.x - from.x) + Math.abs(to.y - from.y)
  }

  /**
   * Determine movement direction
   */
  private getDirection(from: Position, to: Position): 'horizontal' | 'vertical' | 'diagonal' | 'same' {
    const dx = Math.abs(to.x - from.x)
    const dy = Math.abs(to.y - from.y)

    if (dx === 0 && dy === 0) return 'same'
    if (dx === 0) return 'vertical'
    if (dy === 0) return 'horizontal'
    return 'diagonal'
  }

  /**
   * Get all positions in the path from start to end
   */
  private getPathSteps(from: Position, to: Position): Position[] {
    const steps: Position[] = []
    const dx = to.x - from.x
    const dy = to.y - from.y
    const distance = Math.max(Math.abs(dx), Math.abs(dy))

    if (distance === 0) {
      return [from]
    }

    const stepX = dx === 0 ? 0 : dx / Math.abs(dx)
    const stepY = dy === 0 ? 0 : dy / Math.abs(dy)

    for (let i = 0; i <= distance; i++) {
      steps.push({
        x: from.x + (stepX * i),
        y: from.y + (stepY * i)
      })
    }

    return steps
  }

  /**
   * Check if position is within board bounds
   */
  private isWithinBounds(position: Position, board: (Piece | null)[][]): boolean {
    return position.x >= 0 && 
           position.x < board[0].length && 
           position.y >= 0 && 
           position.y < board.length
  }
}
