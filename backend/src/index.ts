import express from 'express'
import { WebSocketServer } from 'ws'
import { createServer } from 'http'
import { RoomManager } from './RoomManager.js'
import { WebSocketMessage, Player } from './types.js'

const app = express()
const server = createServer(app)
const wss = new WebSocketServer({ server })
const roomManager = new RoomManager()

const PORT = process.env.PORT || 3001

// Middleware
app.use(express.json())
app.use(express.static('public'))

// CORS for development
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization')
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200)
  } else {
    next()
  }
})

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'strateturn-backend'
  })
})

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('New WebSocket connection established')
  let currentPlayer: Player | null = null
  
  ws.on('message', (message) => {
    try {
      const msg: WebSocketMessage = JSON.parse(message.toString())
      console.log('Received message:', msg)
      
      switch (msg.type) {
        case 'join_room':
          handleJoinRoom(ws, msg)
          break
        case 'game_state_update':
          handleGameStateUpdate(msg)
          break
        default:
          ws.send(JSON.stringify({
            type: 'error',
            data: { message: 'Unknown message type' }
          }))
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error)
      ws.send(JSON.stringify({
        type: 'error',
        data: { message: 'Invalid JSON message' }
      }))
    }
  })
  
  ws.on('close', () => {
    console.log('WebSocket connection closed')
    if (currentPlayer) {
      roomManager.removePlayerFromRoom(currentPlayer.roomId, currentPlayer.id)
    }
  })
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error)
  })

  function handleJoinRoom(ws: any, msg: WebSocketMessage) {
    if (!msg.roomId || !msg.playerId) return

    const player: Player = {
      id: msg.playerId,
      role: msg.data?.role || 'red',
      ws,
      roomId: msg.roomId
    }

    const success = roomManager.addPlayerToRoom(msg.roomId, player)
    if (success) {
      currentPlayer = player
      ws.send(JSON.stringify({
        type: 'room_joined',
        data: { roomId: msg.roomId, playerId: msg.playerId }
      }))
    } else {
      ws.send(JSON.stringify({
        type: 'error',
        data: { message: 'Room is full' }
      }))
    }
  }

  function handleGameStateUpdate(msg: WebSocketMessage) {
    if (!msg.roomId) return
    
    const room = roomManager.getRoom(msg.roomId)
    if (!room) return

    // Update room's game state
    room.gameState = msg.data

    // Broadcast to all players in room
    room.players.forEach((player) => {
      if (player.ws.readyState === 1) { // WebSocket.OPEN
        player.ws.send(JSON.stringify({
          type: 'game_state_sync',
          data: msg.data
        }))
      }
    })
  }
})

// Start server
if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    console.log(`🚀 Strateturn backend server running on port ${PORT}`)
    console.log(`📡 WebSocket server ready for connections`)
    console.log(`🏥 Health check: http://localhost:${PORT}/health`)
  })
}

export { app, server, wss }
