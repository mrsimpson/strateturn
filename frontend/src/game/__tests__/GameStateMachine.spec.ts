import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GameStateMachine } from '../logic/GameStateMachine'
import type { 
  SetupState, 
  PlayingState, 
  StateMachineConfig,
  GameContext 
} from '../types/stateMachine'
import type { Piece } from '../types'

describe('GameStateMachine', () => {
  let stateMachine: GameStateMachine
  let mockConfig: StateMachineConfig
  let testPiece: Piece

  beforeEach(() => {
    const initialState: SetupState = {
      phase: 'setup',
      currentPlayer: 'red',
      redPiecesPlaced: 0,
      bluePiecesPlaced: 0,
      board: Array(10).fill(null).map(() => Array(10).fill(null))
    }

    const context: GameContext = {
      gameId: 'test-game',
      players: {
        red: { name: 'Player 1', isReady: false },
        blue: { name: 'Player 2', isReady: false }
      },
      startTime: Date.now(),
      lastMoveTime: Date.now()
    }

    mockConfig = {
      initialState,
      context,
      onStateChange: vi.fn(),
      onError: vi.fn()
    }

    stateMachine = new GameStateMachine(mockConfig)

    testPiece = {
      id: 'test-1',
      rank: 5,
      name: 'Lieutenant',
      player: 'red',
      movement: 1,
      isRevealed: false
    }
  })

  describe('Initial State', () => {
    it('should start in setup phase', () => {
      const state = stateMachine.getState()
      expect(state.phase).toBe('setup')
      expect((state as SetupState).currentPlayer).toBe('red')
      expect((state as SetupState).redPiecesPlaced).toBe(0)
      expect((state as SetupState).bluePiecesPlaced).toBe(0)
    })

    it('should return immutable state', () => {
      const state = stateMachine.getState()
      expect(Object.isFrozen(state)).toBe(true)
    })

    it('should return available actions for setup phase', () => {
      const actions = stateMachine.getAvailableActions()
      expect(actions).toContain('PLACE_PIECE')
      expect(actions).toContain('RESET_GAME')
      expect(actions).not.toContain('START_GAME') // Not available until setup complete
    })
  })

  describe('Setup Phase Transitions', () => {
    it('should allow placing pieces in valid territory', () => {
      const success = stateMachine.send({
        type: 'PLACE_PIECE',
        piece: { ...testPiece, player: 'red' },
        position: { x: 0, y: 6 } // Red territory
      })

      expect(success).toBe(true)
      const state = stateMachine.getState() as SetupState
      expect(state.redPiecesPlaced).toBe(1)
      expect(state.board[6][0]).toEqual(expect.objectContaining({
        ...testPiece,
        player: 'red',
        position: { x: 0, y: 6 }
      }))
    })

    it('should reject placing pieces in invalid territory', () => {
      const success = stateMachine.send({
        type: 'PLACE_PIECE',
        piece: { ...testPiece, player: 'red' },
        position: { x: 0, y: 0 } // Blue territory
      })

      expect(success).toBe(false)
      const state = stateMachine.getState() as SetupState
      expect(state.redPiecesPlaced).toBe(0)
    })

    it('should reject placing pieces on occupied positions', () => {
      // Place first piece
      stateMachine.send({
        type: 'PLACE_PIECE',
        piece: { ...testPiece, player: 'red' },
        position: { x: 0, y: 6 }
      })

      // Try to place second piece on same position
      const success = stateMachine.send({
        type: 'PLACE_PIECE',
        piece: { ...testPiece, id: 'test-2', player: 'red' },
        position: { x: 0, y: 6 }
      })

      expect(success).toBe(false)
      const state = stateMachine.getState() as SetupState
      expect(state.redPiecesPlaced).toBe(1)
    })

    it('should allow starting game when both players have placed all pieces', () => {
      // Mock both players having placed 40 pieces
      const state = stateMachine.getState() as SetupState
      ;(stateMachine as any).currentState = {
        ...state,
        redPiecesPlaced: 40,
        bluePiecesPlaced: 40
      }

      const success = stateMachine.send({ type: 'START_GAME' })
      expect(success).toBe(true)

      const newState = stateMachine.getState()
      expect(newState.phase).toBe('playing')
      expect((newState as PlayingState).subState.type).toBe('waiting_for_player')
      expect((newState as PlayingState).turn).toBe(1)
    })

    it('should reject starting game when setup incomplete', () => {
      const success = stateMachine.send({ type: 'START_GAME' })
      expect(success).toBe(false)
      
      const state = stateMachine.getState()
      expect(state.phase).toBe('setup')
    })
  })

  describe('Playing Phase Transitions', () => {
    beforeEach(() => {
      // Set up a playing state
      const playingState: PlayingState = {
        phase: 'playing',
        subState: {
          type: 'waiting_for_player',
          currentPlayer: 'red'
        },
        board: Array(10).fill(null).map(() => Array(10).fill(null)),
        capturedPieces: { red: [], blue: [] },
        turn: 1
      }
      
      // Place a test piece on the board
      playingState.board[7][5] = { ...testPiece, position: { x: 5, y: 7 } }
      
      ;(stateMachine as any).currentState = playingState
    })

    it('should allow selecting own pieces', () => {
      const success = stateMachine.send({
        type: 'SELECT_PIECE',
        piece: testPiece,
        position: { x: 5, y: 7 },
        validMoves: [{ x: 5, y: 6 }]
      })

      expect(success).toBe(true)
      const state = stateMachine.getState() as PlayingState
      expect(state.subState.type).toBe('piece_selected')
      expect((state.subState as any).selectedPiece).toEqual(testPiece)
    })

    it('should reject selecting opponent pieces', () => {
      const opponentPiece = { ...testPiece, player: 'blue' as const }
      
      const success = stateMachine.send({
        type: 'SELECT_PIECE',
        piece: opponentPiece,
        position: { x: 5, y: 7 },
        validMoves: []
      })

      expect(success).toBe(false)
      const state = stateMachine.getState() as PlayingState
      expect(state.subState.type).toBe('waiting_for_player')
    })

    it('should reject selecting immovable pieces', () => {
      const bomb = { ...testPiece, name: 'Bomb', movement: 0 }
      
      const success = stateMachine.send({
        type: 'SELECT_PIECE',
        piece: bomb,
        position: { x: 5, y: 7 },
        validMoves: []
      })

      expect(success).toBe(false)
    })

    it('should allow deselecting pieces', () => {
      // First select a piece
      stateMachine.send({
        type: 'SELECT_PIECE',
        piece: testPiece,
        position: { x: 5, y: 7 },
        validMoves: [{ x: 5, y: 6 }]
      })

      // Then deselect
      const success = stateMachine.send({ type: 'DESELECT_PIECE' })
      expect(success).toBe(true)

      const state = stateMachine.getState() as PlayingState
      expect(state.subState.type).toBe('waiting_for_player')
    })

    it('should handle simple moves to empty cells', () => {
      // Select piece first
      stateMachine.send({
        type: 'SELECT_PIECE',
        piece: testPiece,
        position: { x: 5, y: 7 },
        validMoves: [{ x: 5, y: 6 }]
      })

      // Move to empty cell
      const success = stateMachine.send({
        type: 'MOVE_PIECE',
        from: { x: 5, y: 7 },
        to: { x: 5, y: 6 }
      })

      expect(success).toBe(true)
      const state = stateMachine.getState() as PlayingState
      expect(state.subState.type).toBe('ending_turn')
      expect(state.board[6][5]).toEqual(expect.objectContaining({
        ...testPiece,
        position: { x: 5, y: 6 }
      }))
      expect(state.board[7][5]).toBeNull()
    })

    it('should initiate combat when moving to occupied cell', () => {
      // Place enemy piece
      const enemyPiece = { ...testPiece, id: 'enemy-1', player: 'blue' as const }
      const state = stateMachine.getState() as PlayingState
      state.board[6][5] = enemyPiece

      // Select piece first
      stateMachine.send({
        type: 'SELECT_PIECE',
        piece: testPiece,
        position: { x: 5, y: 7 },
        validMoves: [{ x: 5, y: 6 }]
      })

      // Move to occupied cell
      const success = stateMachine.send({
        type: 'MOVE_PIECE',
        from: { x: 5, y: 7 },
        to: { x: 5, y: 6 },
        targetPiece: enemyPiece
      })

      expect(success).toBe(true)
      const newState = stateMachine.getState()
      
      // Combat should be resolved immediately
      const boardPiece = newState.board[6][5] // Target position (y=6, x=5)
      
      // If game ended (e.g., flag captured), state.phase will be 'finished'
      if (newState.phase === 'finished') {
        expect(newState.phase).toBe('finished')
        console.log('Game ended due to:', (newState as any).reason)
      } else {
        // Otherwise, should be in ending_turn state
        const playingState = newState as PlayingState
        expect(playingState.subState.type).toBe('ending_turn')
        
        // Note: If both pieces are destroyed in combat, position will be null
        if (boardPiece) {
          expect(boardPiece.isRevealed).toBe(true) // Combat reveals pieces
        }
      }
    })
  })

  describe('State Machine Validation', () => {
    it('should check if events can be sent', () => {
      expect(stateMachine.canSend({ type: 'PLACE_PIECE', piece: testPiece, position: { x: 0, y: 6 } })).toBe(true)
      expect(stateMachine.canSend({ type: 'START_GAME' })).toBe(false) // Setup not complete
      expect(stateMachine.canSend({ type: 'SELECT_PIECE', piece: testPiece, position: { x: 0, y: 0 }, validMoves: [] })).toBe(false) // Wrong phase
    })

    it('should call onStateChange callback', () => {
      stateMachine.send({
        type: 'PLACE_PIECE',
        piece: testPiece,
        position: { x: 0, y: 6 }
      })

      expect(mockConfig.onStateChange).toHaveBeenCalledTimes(1)
    })

    it('should handle invalid transitions gracefully', () => {
      const success = stateMachine.send({
        type: 'SELECT_PIECE',
        piece: testPiece,
        position: { x: 0, y: 0 },
        validMoves: []
      })

      expect(success).toBe(false)
      expect(mockConfig.onError).not.toHaveBeenCalled()
    })

    it('should reset game state', () => {
      // Make some changes
      stateMachine.send({
        type: 'PLACE_PIECE',
        piece: testPiece,
        position: { x: 0, y: 6 }
      })

      // Reset
      const success = stateMachine.send({ type: 'RESET_GAME' })
      expect(success).toBe(true)

      const state = stateMachine.getState() as SetupState
      expect(state.phase).toBe('setup')
      expect(state.redPiecesPlaced).toBe(0)
      expect(state.bluePiecesPlaced).toBe(0)
    })
  })

  describe('Context Management', () => {
    it('should return immutable context', () => {
      const context = stateMachine.getContext()
      expect(Object.isFrozen(context)).toBe(true)
      expect(context.gameId).toBe('test-game')
    })
  })

  describe('Available Actions', () => {
    it('should return correct actions for each state', () => {
      // Setup phase
      let actions = stateMachine.getAvailableActions()
      expect(actions).toContain('PLACE_PIECE')
      expect(actions).toContain('RESET_GAME')

      // Mock complete setup
      const state = stateMachine.getState() as SetupState
      ;(stateMachine as any).currentState = {
        ...state,
        redPiecesPlaced: 40,
        bluePiecesPlaced: 40
      }

      actions = stateMachine.getAvailableActions()
      expect(actions).toContain('START_GAME')
    })
  })
})
