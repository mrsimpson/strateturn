import type { Piece, PieceDefinition } from '../types'
import { STRATEGO_PIECES } from '../types'

/**
 * Factory for creating game pieces based on definitions
 * Integrates STRATEGO_PIECES with actual game logic
 */
export class PieceFactory {
  private pieceDefinitions: PieceDefinition[]

  constructor(definitions: PieceDefinition[] = STRATEGO_PIECES) {
    this.pieceDefinitions = definitions
  }

  /**
   * Create a piece instance from definition
   */
  createPiece(
    pieceName: string, 
    player: 'red' | 'blue', 
    id?: string
  ): Piece | null {
    const definition = this.pieceDefinitions.find(def => def.name === pieceName)
    
    if (!definition) {
      return null
    }

    return {
      id: id || `${player}-${pieceName}-${Date.now()}`,
      rank: definition.rank,
      name: definition.name,
      player,
      movement: definition.movement,
      isRevealed: false
    }
  }

  /**
   * Get all piece definitions for a complete set
   */
  getCompleteSet(player: 'red' | 'blue'): Piece[] {
    const pieces: Piece[] = []
    
    for (const definition of this.pieceDefinitions) {
      for (let i = 0; i < definition.count; i++) {
        const piece = this.createPiece(definition.name, player, `${player}-${definition.name}-${i}`)
        if (piece) {
          pieces.push(piece)
        }
      }
    }
    
    return pieces
  }

  /**
   * Get piece definition by name
   */
  getPieceDefinition(pieceName: string): PieceDefinition | undefined {
    return this.pieceDefinitions.find(def => def.name === pieceName)
  }

  /**
   * Get all piece definitions
   */
  getAllDefinitions(): PieceDefinition[] {
    return [...this.pieceDefinitions]
  }

  /**
   * Validate if a piece set is complete (40 pieces total)
   */
  isCompleteSet(pieces: Piece[]): boolean {
    const expectedTotal = this.pieceDefinitions.reduce((sum, def) => sum + def.count, 0)
    return pieces.length === expectedTotal
  }

  /**
   * Get missing pieces from a set
   */
  getMissingPieces(pieces: Piece[], player: 'red' | 'blue'): string[] {
    const missing: string[] = []
    
    for (const definition of this.pieceDefinitions) {
      const actualCount = pieces.filter(p => p.name === definition.name && p.player === player).length
      const expectedCount = definition.count
      
      if (actualCount < expectedCount) {
        missing.push(`${definition.name}: ${actualCount}/${expectedCount}`)
      }
    }
    
    return missing
  }
}
