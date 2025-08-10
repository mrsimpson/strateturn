import { describe, it, expect, beforeEach } from 'vitest'
import { GameStateManager } from '../logic/GameState'
import type { Piece } from '../types'

describe('GameStateManager', () => {
  let gameState: GameStateManager
  let testPiece: Piece

  beforeEach(() => {
    gameState = new GameStateManager()
    testPiece = {
      id: 'test-1',
      rank: 5,
      name: 'Lieutenant',
      player: 'red',
      movement: 1,
      isRevealed: false
    }
  })

  describe('Initial State (REQ-G001)', () => {
    it('should create 10x10 board with coordinate system (0,0) to (9,9)', () => {
      const state = gameState.getState()
      
      expect(state.board).toHaveLength(10)
      expect(state.board[0]).toHaveLength(10)
      expect(state.board[9]).toHaveLength(10)
      
      // All positions should be null initially
      for (let y = 0; y < 10; y++) {
        for (let x = 0; x < 10; x++) {
          expect(state.board[y][x]).toBeNull()
        }
      }
    })

    it('should start in setup phase with red player', () => {
      const state = gameState.getState()
      
      expect(state.gamePhase).toBe('setup')
      expect(state.currentPlayer).toBe('red')
      expect(state.turn).toBe(0)
      expect(state.capturedPieces.red).toEqual([])
      expect(state.capturedPieces.blue).toEqual([])
    })
  })

  describe('Position Validation (REQ-G002)', () => {
    it('should validate positions within board boundaries', () => {
      expect(gameState.isWithinBounds({ x: 0, y: 0 })).toBe(true)
      expect(gameState.isWithinBounds({ x: 9, y: 9 })).toBe(true)
      expect(gameState.isWithinBounds({ x: 5, y: 5 })).toBe(true)
    })

    it('should reject positions outside board boundaries', () => {
      expect(gameState.isWithinBounds({ x: -1, y: 0 })).toBe(false)
      expect(gameState.isWithinBounds({ x: 0, y: -1 })).toBe(false)
      expect(gameState.isWithinBounds({ x: 10, y: 0 })).toBe(false)
      expect(gameState.isWithinBounds({ x: 0, y: 10 })).toBe(false)
    })

    it('should validate unoccupied positions', () => {
      const position = { x: 7, y: 7 }
      
      expect(gameState.isValidPosition(position)).toBe(true)
      
      // Place piece and check again
      gameState.placePiece(testPiece, position)
      expect(gameState.isValidPosition(position)).toBe(false)
    })
  })

  describe('Immutable State Updates (REQ-G004)', () => {
    it('should return frozen state objects', () => {
      const state = gameState.getState()
      
      expect(Object.isFrozen(state)).toBe(true)
      
      // Should not be able to modify returned state
      expect(() => {
        (state as any).turn = 999
      }).toThrow()
    })

    it('should create new state objects on updates', () => {
      const initialState = gameState.getState()
      
      gameState.setGamePhase('playing')
      
      const newState = gameState.getState()
      expect(newState).not.toBe(initialState)
      expect(newState.gamePhase).toBe('playing')
      expect(initialState.gamePhase).toBe('setup')
    })
  })

  describe('Game Phase Management (REQ-G005)', () => {
    it('should track game phases correctly', () => {
      expect(gameState.getState().gamePhase).toBe('setup')
      
      gameState.setGamePhase('playing')
      expect(gameState.getState().gamePhase).toBe('playing')
      
      gameState.setGamePhase('finished')
      expect(gameState.getState().gamePhase).toBe('finished')
    })
  })

  describe('Winner Determination (REQ-G006)', () => {
    it('should set winner and end game', () => {
      gameState.setWinner('red')
      
      const state = gameState.getState()
      expect(state.winner).toBe('red')
      expect(state.gamePhase).toBe('finished')
    })

    it('should handle draw games', () => {
      gameState.setWinner('draw')
      
      const state = gameState.getState()
      expect(state.winner).toBe('draw')
      expect(state.gamePhase).toBe('finished')
    })
  })

  describe('Setup Phase (REQ-S001, REQ-S003)', () => {
    it('should allow piece placement in valid setup territory for red player', () => {
      const redPiece: Piece = { ...testPiece, player: 'red' }
      
      // Red territory: rows 6-9
      expect(gameState.placePiece(redPiece, { x: 0, y: 6 })).toBe(true)
      expect(gameState.placePiece(redPiece, { x: 0, y: 9 })).toBe(true)
    })

    it('should allow piece placement in valid setup territory for blue player', () => {
      const bluePiece: Piece = { ...testPiece, player: 'blue' }
      
      // Blue territory: rows 0-3
      expect(gameState.placePiece(bluePiece, { x: 0, y: 0 })).toBe(true)
      expect(gameState.placePiece(bluePiece, { x: 0, y: 3 })).toBe(true)
    })

    it('should reject piece placement outside setup territory', () => {
      const redPiece: Piece = { ...testPiece, player: 'red' }
      const bluePiece: Piece = { ...testPiece, player: 'blue' }
      
      // Red trying to place in blue territory
      expect(gameState.placePiece(redPiece, { x: 0, y: 0 })).toBe(false)
      expect(gameState.placePiece(redPiece, { x: 0, y: 5 })).toBe(false)
      
      // Blue trying to place in red territory
      expect(gameState.placePiece(bluePiece, { x: 0, y: 9 })).toBe(false)
      expect(gameState.placePiece(bluePiece, { x: 0, y: 4 })).toBe(false)
    })

    it('should track piece placement count', () => {
      const redPiece: Piece = { ...testPiece, player: 'red' }
      
      expect(gameState.getState().redPiecesPlaced).toBe(0)
      
      gameState.placePiece(redPiece, { x: 0, y: 6 })
      expect(gameState.getState().redPiecesPlaced).toBe(1)
      
      gameState.placePiece(redPiece, { x: 1, y: 6 })
      expect(gameState.getState().redPiecesPlaced).toBe(2)
    })

    it('should detect setup completion', () => {
      expect(gameState.isSetupComplete('red')).toBe(false)
      expect(gameState.isBothPlayersSetupComplete()).toBe(false)
      
      // Mock placing 40 pieces for red
      const state = gameState.getState()
      ;(gameState as any).state = { ...state, redPiecesPlaced: 40 }
      
      expect(gameState.isSetupComplete('red')).toBe(true)
      expect(gameState.isBothPlayersSetupComplete()).toBe(false)
      
      // Mock placing 40 pieces for blue too
      ;(gameState as any).state = { ...gameState.getState(), bluePiecesPlaced: 40 }
      
      expect(gameState.isBothPlayersSetupComplete()).toBe(true)
    })
  })

  describe('Game Start', () => {
    it('should start game when both players setup complete', () => {
      // Mock both players having placed 40 pieces
      const state = gameState.getState()
      ;(gameState as any).state = { 
        ...state, 
        redPiecesPlaced: 40, 
        bluePiecesPlaced: 40 
      }
      
      expect(gameState.startGame()).toBe(true)
      
      const newState = gameState.getState()
      expect(newState.gamePhase).toBe('playing')
      expect(newState.currentPlayer).toBe('red')
      expect(newState.turn).toBe(1)
    })

    it('should not start game if setup incomplete', () => {
      expect(gameState.startGame()).toBe(false)
      expect(gameState.getState().gamePhase).toBe('setup')
    })
  })

  describe('Piece Movement', () => {
    beforeEach(() => {
      // Set up a piece on the board for movement tests
      gameState.placePiece(testPiece, { x: 5, y: 7 })
      gameState.setGamePhase('playing')
    })

    it('should move piece successfully', () => {
      const from = { x: 5, y: 7 }
      const to = { x: 5, y: 6 }
      
      expect(gameState.movePiece(from, to)).toBe(true)
      
      expect(gameState.getPieceAt(from)).toBeNull()
      expect(gameState.getPieceAt(to)).toEqual(expect.objectContaining({
        ...testPiece,
        position: to
      }))
    })

    it('should switch turns after move', () => {
      const initialTurn = gameState.getState().turn
      const initialPlayer = gameState.getState().currentPlayer
      
      gameState.movePiece({ x: 5, y: 7 }, { x: 5, y: 6 })
      
      const newState = gameState.getState()
      expect(newState.turn).toBe(initialTurn + 1)
      expect(newState.currentPlayer).toBe(initialPlayer === 'red' ? 'blue' : 'red')
    })

    it('should reject moves from empty positions', () => {
      expect(gameState.movePiece({ x: 0, y: 0 }, { x: 0, y: 1 })).toBe(false)
    })

    it('should reject moves outside board boundaries', () => {
      expect(gameState.movePiece({ x: 5, y: 7 }, { x: -1, y: 7 })).toBe(false)
      expect(gameState.movePiece({ x: 5, y: 7 }, { x: 10, y: 7 })).toBe(false)
    })
  })

  describe('Reset Functionality', () => {
    it('should reset to initial state', () => {
      // Make some changes
      gameState.placePiece(testPiece, { x: 5, y: 7 })
      gameState.setGamePhase('playing')
      gameState.setWinner('red')
      
      // Reset
      gameState.reset()
      
      const state = gameState.getState()
      expect(state.gamePhase).toBe('setup')
      expect(state.currentPlayer).toBe('red')
      expect(state.turn).toBe(0)
      expect(state.winner).toBeUndefined()
      expect(state.redPiecesPlaced).toBe(0)
      expect(state.bluePiecesPlaced).toBe(0)
      
      // Board should be empty
      for (let y = 0; y < 10; y++) {
        for (let x = 0; x < 10; x++) {
          expect(state.board[y][x]).toBeNull()
        }
      }
    })
  })
})
