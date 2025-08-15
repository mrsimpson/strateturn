import { WebSocket } from 'ws'

export interface Player {
  id: string
  role: 'red' | 'blue'
  ws: WebSocket
  roomId: string
}

export interface GameRoom {
  id: string
  players: Map<string, Player>
  gameState: any
}

export interface WebSocketMessage {
  type: string
  roomId?: string
  playerId?: string
  data?: any
}
