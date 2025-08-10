import express from 'express'
import { WebSocketServer } from 'ws'
import { createServer } from 'http'

const app = express()
const server = createServer(app)
const wss = new WebSocketServer({ server })

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
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString())
      console.log('Received message:', data)
      
      // Echo back for now - will implement signaling logic later
      ws.send(JSON.stringify({
        type: 'echo',
        data: data,
        timestamp: new Date().toISOString()
      }))
    } catch (error) {
      console.error('Error parsing WebSocket message:', error)
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Invalid JSON message'
      }))
    }
  })
  
  ws.on('close', () => {
    console.log('WebSocket connection closed')
  })
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error)
  })
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
