import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePlayerStore } from '../player'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
vi.stubGlobal('localStorage', localStorageMock)

describe('Player Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    // Clear localStorage mock data
    localStorageMock.getItem.mockReturnValue(null)
  })

  describe('Player Initialization', () => {
    it('should initialize red player as host', () => {
      const store = usePlayerStore()
      
      store.initializePlayer('room123', false)
      
      expect(store.playerRole).toBe('red')
      expect(store.isHost).toBe(true)
      expect(store.currentRoomId).toBe('room123')
      expect(store.localPlayerRole).toBe('red')
      expect(store.isRedPlayer).toBe(true)
      expect(store.isBluePlayer).toBe(false)
    })

    it('should initialize blue player as joiner', () => {
      const store = usePlayerStore()
      
      store.initializePlayer('room456', true)
      
      expect(store.playerRole).toBe('blue')
      expect(store.isHost).toBe(false)
      expect(store.currentRoomId).toBe('room456')
      expect(store.localPlayerRole).toBe('blue')
      expect(store.isRedPlayer).toBe(false)
      expect(store.isBluePlayer).toBe(true)
    })

    it('should save player data to localStorage', () => {
      const store = usePlayerStore()
      
      store.initializePlayer('room789', false)
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'strateturn-room-room789-player',
        expect.stringContaining('"role":"red"')
      )
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'strateturn-room-room789-player',
        expect.stringContaining('"isHost":true')
      )
    })

    it('should restore existing player data from localStorage', () => {
      const existingData = {
        role: 'blue',
        isHost: false,
        playerId: 'existing-player-123',
        roomId: 'room999',
        joinedAt: Date.now()
      }
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(existingData))
      
      const store = usePlayerStore()
      store.initializePlayer('room999', false)
      
      expect(store.playerRole).toBe('blue')
      expect(store.isHost).toBe(false)
      expect(store.playerId).toBe('existing-player-123')
    })
  })

  describe('Player Actions', () => {
    it('should switch player role', () => {
      const store = usePlayerStore()
      store.initializePlayer('room111', false) // Start as red
      
      store.switchRole()
      
      expect(store.playerRole).toBe('blue')
      expect(store.isHost).toBe(false)
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'strateturn-room-room111-player',
        expect.stringContaining('"role":"blue"')
      )
    })

    it('should leave room and clear data', () => {
      const store = usePlayerStore()
      store.initializePlayer('room222', false)
      
      store.leaveRoom()
      
      expect(store.currentRoomId).toBe(null)
      expect(store.playerRole).toBe('red')
      expect(store.isHost).toBe(true)
      expect(store.playerId).toBe('')
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('strateturn-room-room222-player')
    })

    it('should return correct player info', () => {
      const store = usePlayerStore()
      store.initializePlayer('room333', true) // Blue player
      
      const info = store.getPlayerInfo()
      
      expect(info.role).toBe('blue')
      expect(info.isHost).toBe(false)
      expect(info.displayName).toBe('BLUE Player')
      expect(info.color).toBe('#2563eb')
      expect(info.roomId).toBe('room333')
    })
  })

  describe('Computed Properties', () => {
    it('should have correct computed properties for red player', () => {
      const store = usePlayerStore()
      store.initializePlayer('room444', false)
      
      expect(store.localPlayerRole).toBe('red')
      expect(store.isRedPlayer).toBe(true)
      expect(store.isBluePlayer).toBe(false)
      expect(store.hasJoinedRoom).toBe(true)
    })

    it('should have correct computed properties for blue player', () => {
      const store = usePlayerStore()
      store.initializePlayer('room555', true)
      
      expect(store.localPlayerRole).toBe('blue')
      expect(store.isRedPlayer).toBe(false)
      expect(store.isBluePlayer).toBe(true)
      expect(store.hasJoinedRoom).toBe(true)
    })

    it('should indicate no room joined initially', () => {
      const store = usePlayerStore()
      
      expect(store.hasJoinedRoom).toBe(false)
    })
  })

  describe('Debug Helpers', () => {
    it('should return storage data', () => {
      const testData = { role: 'red', isHost: true }
      localStorageMock.getItem.mockReturnValue(JSON.stringify(testData))
      
      const store = usePlayerStore()
      store.initializePlayer('room666', false)
      
      const storageData = store.getStorageData()
      expect(storageData).toEqual(testData)
    })

    it('should clear storage data', () => {
      const store = usePlayerStore()
      store.initializePlayer('room777', false)
      
      store.clearStorageData()
      
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('strateturn-room-room777-player')
    })
  })
})
