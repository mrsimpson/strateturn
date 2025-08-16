import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useLocalStorage } from '@vueuse/core'

export type PlayerRole = 'red' | 'blue'

export interface PlayerState {
  role: PlayerRole
  roomId: string | null
  isHost: boolean
  playerId: string
}

export const usePlayerStore = defineStore('player', () => {
  // Reactive state with localStorage synchronization
  const currentRoomId = ref<string | null>(null)
  const playerRole = ref<PlayerRole>('red')
  const isHost = ref(true)
  const playerId = ref<string>('')

  // Computed properties
  const localPlayerRole = computed(() => playerRole.value)
  const isRedPlayer = computed(() => playerRole.value === 'red')
  const isBluePlayer = computed(() => playerRole.value === 'blue')
  const hasJoinedRoom = computed(() => !!currentRoomId.value)

  // Actions
  const initializePlayer = (roomId: string, isJoining: boolean = false) => {
    console.log('=== PLAYER STORE INITIALIZATION ===')
    console.log('Room ID:', roomId)
    console.log('Is joining:', isJoining)

    currentRoomId.value = roomId
    
    // Check if this player has already been in this specific room
    const roomStorageKey = `strateturn-room-${roomId}-player`
    const playerIdKey = `strateturn-player-id`
    
    // Check if this specific player has been in this room before
    const existingRoomData = localStorage.getItem(roomStorageKey)
    
    if (existingRoomData) {
      // Room has existing player data - restore it
      const data = JSON.parse(existingRoomData)
      playerRole.value = data.role
      isHost.value = data.isHost
      playerId.value = data.playerId
      console.log('Returning player to same room:', data)
    } else {
      // Get or create a persistent player ID (across all rooms)
      let persistentPlayerId = localStorage.getItem(playerIdKey)
      if (!persistentPlayerId) {
        persistentPlayerId = generatePlayerId()
        localStorage.setItem(playerIdKey, persistentPlayerId)
      }
      
      // First player in this room
      playerRole.value = isJoining ? 'blue' : 'red'
      isHost.value = !isJoining
      playerId.value = persistentPlayerId
      
      // Save to localStorage
      const playerData = {
        role: playerRole.value,
        isHost: isHost.value,
        playerId: playerId.value,
        roomId: roomId,
        joinedAt: Date.now()
      }
      
      localStorage.setItem(roomStorageKey, JSON.stringify(playerData))
      console.log('First player in room:', playerData)
    }

    console.log('Final player state:', {
      role: playerRole.value,
      isHost: isHost.value,
      playerId: playerId.value,
      roomId: currentRoomId.value
    })
    console.log('=== END PLAYER STORE INITIALIZATION ===')
  }

  const switchRole = () => {
    playerRole.value = playerRole.value === 'red' ? 'blue' : 'red'
    isHost.value = playerRole.value === 'red'
    
    // Update localStorage
    if (currentRoomId.value) {
      const storageKey = `strateturn-room-${currentRoomId.value}-player`
      const existingData = JSON.parse(localStorage.getItem(storageKey) || '{}')
      const updatedData = {
        ...existingData,
        role: playerRole.value,
        isHost: isHost.value,
        updatedAt: Date.now()
      }
      localStorage.setItem(storageKey, JSON.stringify(updatedData))
    }
  }

  const leaveRoom = () => {
    if (currentRoomId.value) {
      const storageKey = `strateturn-room-${currentRoomId.value}-player`
      localStorage.removeItem(storageKey)
    }
    
    currentRoomId.value = null
    playerRole.value = 'red'
    isHost.value = true
    playerId.value = ''
  }

  const getPlayerInfo = () => {
    return {
      role: playerRole.value,
      isHost: isHost.value,
      playerId: playerId.value,
      roomId: currentRoomId.value,
      displayName: `${playerRole.value.toUpperCase()} Player`,
      color: playerRole.value === 'red' ? '#dc2626' : '#2563eb'
    }
  }

  // Helper function to generate unique player ID
  const generatePlayerId = (): string => {
    return `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Debug helpers
  const getStorageData = () => {
    if (!currentRoomId.value) return null
    const storageKey = `strateturn-room-${currentRoomId.value}-player`
    const data = localStorage.getItem(storageKey)
    return data ? JSON.parse(data) : null
  }

  const clearStorageData = () => {
    if (!currentRoomId.value) return
    const storageKey = `strateturn-room-${currentRoomId.value}-player`
    localStorage.removeItem(storageKey)
  }

  return {
    // State
    currentRoomId,
    playerRole,
    isHost,
    playerId,
    
    // Computed
    localPlayerRole,
    isRedPlayer,
    isBluePlayer,
    hasJoinedRoom,
    
    // Actions
    initializePlayer,
    switchRole,
    leaveRoom,
    getPlayerInfo,
    
    // Debug
    getStorageData,
    clearStorageData
  }
})
