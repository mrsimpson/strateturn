import { describe, it, expect, beforeEach } from 'vitest'
import { MovementValidator } from '../logic/MovementValidator'
import type { Piece } from '../types'

describe('MovementValidator', () => {
  let validator: MovementValidator
  let board: (Piece | null)[][]
  let normalPiece: Piece
  let scoutPiece: Piece
  let bombPiece: Piece

  beforeEach(() => {
    validator = new MovementValidator()
    
    // Create empty 10x10 board
    board = Array(10).fill(null).map(() => Array(10).fill(null))
    
    normalPiece = {
      id: 'normal-1',
      rank: 5,
      name: 'Lieutenant',
      player: 'red',
      movement: 1,
      isRevealed: false
    }

    scoutPiece = {
      id: 'scout-1',
      rank: 2,
      name: 'Scout',
      player: 'red',
      movement: 'unlimited',
      isRevealed: false
    }

    bombPiece = {
      id: 'bomb-1',
      rank: 0,
      name: 'Bomb',
      player: 'red',
      movement: 0,
      isRevealed: false
    }
  })

  describe('REQ-M001: Movement value 1 - adjacent cells only', () => {
    it('should allow movement to adjacent cells', () => {
      const from = { x: 5, y: 5 }
      
      // Test all four directions
      expect(validator.canMove(normalPiece, from, { x: 5, y: 4 }, board).isValid).toBe(true) // up
      expect(validator.canMove(normalPiece, from, { x: 5, y: 6 }, board).isValid).toBe(true) // down
      expect(validator.canMove(normalPiece, from, { x: 4, y: 5 }, board).isValid).toBe(true) // left
      expect(validator.canMove(normalPiece, from, { x: 6, y: 5 }, board).isValid).toBe(true) // right
    })

    it('should reject movement beyond adjacent cells', () => {
      const from = { x: 5, y: 5 }
      
      const result = validator.canMove(normalPiece, from, { x: 5, y: 3 }, board)
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('This piece can only move one cell at a time')
    })

    it('should return correct valid moves for movement 1 pieces', () => {
      const position = { x: 5, y: 5 }
      const validMoves = validator.getValidMoves(normalPiece, position, board)
      
      expect(validMoves).toHaveLength(4)
      expect(validMoves).toEqual(expect.arrayContaining([
        expect.objectContaining({ x: 5, y: 4 }), // up
        expect.objectContaining({ x: 5, y: 6 }), // down
        expect.objectContaining({ x: 4, y: 5 }), // left
        expect.objectContaining({ x: 6, y: 5 })  // right
      ]))
    })
  })

  describe('REQ-M002: Unlimited movement - straight lines until blocked', () => {
    it('should allow unlimited movement in straight lines', () => {
      const from = { x: 5, y: 5 }
      
      // Long distance moves in straight lines
      expect(validator.canMove(scoutPiece, from, { x: 5, y: 0 }, board).isValid).toBe(true) // up
      expect(validator.canMove(scoutPiece, from, { x: 5, y: 9 }, board).isValid).toBe(true) // down
      expect(validator.canMove(scoutPiece, from, { x: 0, y: 5 }, board).isValid).toBe(true) // left
      expect(validator.canMove(scoutPiece, from, { x: 9, y: 5 }, board).isValid).toBe(true) // right
    })

    it('should be blocked by pieces in the path', () => {
      const from = { x: 5, y: 5 }
      const to = { x: 5, y: 1 }
      
      // Place blocking piece
      board[3][5] = { ...normalPiece, player: 'blue' }
      
      const result = validator.canMove(scoutPiece, from, to, board)
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Path is blocked by another piece')
    })

    it('should return valid moves until blocked', () => {
      const position = { x: 5, y: 5 }
      
      // Place blocking piece at (5, 2)
      board[2][5] = { ...normalPiece, player: 'blue' }
      
      const validMoves = validator.getValidMoves(scoutPiece, position, board)
      
      // Should be able to move up to (5, 3) and (5, 2) but not beyond
      expect(validMoves).toEqual(expect.arrayContaining([
        expect.objectContaining({ x: 5, y: 4 }),
        expect.objectContaining({ x: 5, y: 3 }),
        expect.objectContaining({ x: 5, y: 2 }) // Can capture enemy piece
      ]))
      expect(validMoves).not.toEqual(expect.arrayContaining([
        expect.objectContaining({ x: 5, y: 1 }) // Cannot move beyond enemy piece
      ]))
    })
  })

  describe('REQ-M003: Path blocking prevention', () => {
    it('should detect blocked paths', () => {
      const from = { x: 2, y: 2 }
      const to = { x: 6, y: 2 }
      
      // Place blocking piece in the middle
      board[2][4] = normalPiece
      
      const result = validator.isPathClear(from, to, board)
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Path is blocked by another piece')
    })

    it('should allow clear paths', () => {
      const from = { x: 2, y: 2 }
      const to = { x: 6, y: 2 }
      
      const result = validator.isPathClear(from, to, board)
      expect(result.isValid).toBe(true)
    })
  })

  describe('REQ-M004: Movement value 0 - no movement allowed', () => {
    it('should prevent any movement for pieces with movement 0', () => {
      const from = { x: 5, y: 5 }
      const to = { x: 5, y: 6 }
      
      const result = validator.canMove(bombPiece, from, to, board)
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('This piece cannot move')
    })

    it('should return no valid moves for movement 0 pieces', () => {
      const position = { x: 5, y: 5 }
      const validMoves = validator.getValidMoves(bombPiece, position, board)
      
      expect(validMoves).toHaveLength(0)
    })
  })

  describe('REQ-M006: Diagonal movement prevention', () => {
    it('should reject diagonal movement', () => {
      const from = { x: 5, y: 5 }
      const to = { x: 6, y: 6 }
      
      const result = validator.canMove(normalPiece, from, to, board)
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Diagonal movement is not allowed')
    })

    it('should reject diagonal paths for unlimited movement', () => {
      const from = { x: 5, y: 5 }
      const to = { x: 7, y: 7 }
      
      const result = validator.canMove(scoutPiece, from, to, board)
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Diagonal movement is not allowed')
    })
  })

  describe('REQ-M008: Friendly piece collision prevention', () => {
    it('should prevent moving to cells occupied by friendly pieces', () => {
      const from = { x: 5, y: 5 }
      const to = { x: 5, y: 6 }
      
      // Place friendly piece at destination
      board[6][5] = { ...normalPiece, player: 'red' }
      
      const result = validator.canMove(normalPiece, from, to, board)
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Cannot move to a cell occupied by your own piece')
    })

    it('should allow moving to cells occupied by enemy pieces', () => {
      const from = { x: 5, y: 5 }
      const to = { x: 5, y: 6 }
      
      // Place enemy piece at destination
      board[6][5] = { ...normalPiece, player: 'blue' }
      
      const result = validator.canMove(normalPiece, from, to, board)
      expect(result.isValid).toBe(true)
    })

    it('should exclude friendly pieces from valid moves', () => {
      const position = { x: 5, y: 5 }
      
      // Place friendly pieces around
      board[4][5] = { ...normalPiece, player: 'red' } // up
      board[6][5] = { ...normalPiece, player: 'red' } // down
      
      const validMoves = validator.getValidMoves(normalPiece, position, board)
      
      expect(validMoves).not.toEqual(expect.arrayContaining([
        expect.objectContaining({ x: 5, y: 4 }),
        expect.objectContaining({ x: 5, y: 6 })
      ]))
      expect(validMoves).toEqual(expect.arrayContaining([
        expect.objectContaining({ x: 4, y: 5 }), // left still valid
        expect.objectContaining({ x: 6, y: 5 })  // right still valid
      ]))
    })
  })

  describe('Board boundary handling', () => {
    it('should not return moves outside board boundaries', () => {
      // Test corner position
      const position = { x: 0, y: 0 }
      const validMoves = validator.getValidMoves(normalPiece, position, board)
      
      expect(validMoves).toHaveLength(2) // only right and down
      expect(validMoves).toEqual(expect.arrayContaining([
        expect.objectContaining({ x: 1, y: 0 }),
        expect.objectContaining({ x: 0, y: 1 })
      ]))
    })

    it('should handle edge positions correctly', () => {
      // Test edge position
      const position = { x: 9, y: 5 }
      const validMoves = validator.getValidMoves(normalPiece, position, board)
      
      expect(validMoves).toHaveLength(3) // up, down, left (no right)
      expect(validMoves).toEqual(expect.arrayContaining([
        expect.objectContaining({ x: 9, y: 4 }),
        expect.objectContaining({ x: 9, y: 6 }),
        expect.objectContaining({ x: 8, y: 5 })
      ]))
      expect(validMoves).not.toEqual(expect.arrayContaining([
        expect.objectContaining({ x: 10, y: 5 })
      ]))
    })
  })
})
