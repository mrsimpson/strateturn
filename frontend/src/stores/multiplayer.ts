import { defineStore } from 'pinia'
import { ref } from 'vue'
import { WebSocketService } from '../services/WebSocketService'
import { usePlayerStore } from './player'

export const useMultiplayerStore = defineStore('multiplayer', () => {
  const wsService = new WebSocketService()
  const connected = ref(false)
  const playerStore = usePlayerStore()

  async function connect() {
    try {
      await wsService.connect()
      connected.value = true
      
      // Set up message listeners
      wsService.on('room_joined', handleRoomJoined)
      wsService.on('game_state_sync', handleGameStateSync)
      wsService.on('error', handleError)
      
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error)
      connected.value = false
    }
  }

  function joinRoom(roomId: string) {
    if (!connected.value) return
    
    wsService.send({
      type: 'join_room',
      roomId,
      playerId: playerStore.playerId,
      data: {
        role: playerStore.playerRole
      }
    })
  }

  function syncGameState(gameState: any) {
    if (!connected.value) return
    
    wsService.send({
      type: 'game_state_update',
      roomId: playerStore.currentRoomId,
      data: gameState
    })
  }

  function handleRoomJoined(message: any) {
    console.log('Successfully joined room:', message.data)
  }

  function handleGameStateSync(message: any) {
    console.log('Received game state sync:', message.data)
    // This will be handled by the game view
    window.dispatchEvent(new CustomEvent('gameStateSync', { 
      detail: message.data 
    }))
  }

  function handleError(message: any) {
    console.error('WebSocket error:', message.data)
  }

  function disconnect() {
    wsService.disconnect()
    connected.value = false
  }

  return {
    connected,
    connect,
    joinRoom,
    syncGameState,
    disconnect
  }
})
