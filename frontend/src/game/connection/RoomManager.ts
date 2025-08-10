/**
 * Room Management for P2P Game Matching
 * Implements REQ-CONN001 through REQ-CONN005
 */
export class RoomManager {
  private serverUrl: string
  private socket: WebSocket | null = null
  private isConnected: boolean = false
  private reconnectAttempts: number = 0
  private maxReconnectAttempts: number = 5
  private reconnectDelay: number = 1000
  private onRoomCreatedCallback?: (roomCode: string) => void
  private onRoomJoinedCallback?: (roomInfo: RoomInfo) => void
  private onPeerJoinedCallback?: (peerId: string) => void
  private onSignalDataCallback?: (signalData: string, fromPeer: string) => void
  private onConnectionStatusCallback?: (status: ConnectionStatus) => void

  constructor(serverUrl: string = 'ws://localhost:3001') {
    this.serverUrl = serverUrl
  }

  /**
   * REQ-CONN001: Connect to signaling server
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = new WebSocket(this.serverUrl)

        this.socket.onopen = () => {
          this.isConnected = true
          this.reconnectAttempts = 0
          this.onConnectionStatusCallback?.('connected')
          console.log('Connected to signaling server')
          resolve()
        }

        this.socket.onmessage = (event) => {
          this.handleServerMessage(JSON.parse(event.data))
        }

        this.socket.onclose = () => {
          this.isConnected = false
          this.onConnectionStatusCallback?.('disconnected')
          console.log('Disconnected from signaling server')
          this.attemptReconnect()
        }

        this.socket.onerror = (error) => {
          console.error('WebSocket error:', error)
          this.onConnectionStatusCallback?.('error')
          reject(error)
        }

      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * REQ-CONN002: Create game room
   */
  async createRoom(gameConfig: GameConfig, playerId: string): Promise<string> {
    if (!this.isConnected || !this.socket) {
      throw new Error('Not connected to signaling server')
    }

    return new Promise((resolve, reject) => {
      const message: ServerMessage = {
        type: 'create_room',
        payload: {
          gameConfig,
          playerId,
          timestamp: Date.now()
        }
      }

      // Set up one-time listener for room creation response
      const originalCallback = this.onRoomCreatedCallback
      this.onRoomCreatedCallback = (roomCode: string) => {
        this.onRoomCreatedCallback = originalCallback
        resolve(roomCode)
      }

      // Set timeout for room creation
      const timeout = setTimeout(() => {
        this.onRoomCreatedCallback = originalCallback
        reject(new Error('Room creation timeout'))
      }, 10000)

      this.socket.send(JSON.stringify(message))

      // Clear timeout when resolved
      this.onRoomCreatedCallback = (roomCode: string) => {
        clearTimeout(timeout)
        this.onRoomCreatedCallback = originalCallback
        resolve(roomCode)
      }
    })
  }

  /**
   * REQ-CONN002: Join existing game room
   */
  async joinRoom(roomCode: string, playerId: string): Promise<RoomInfo> {
    if (!this.isConnected || !this.socket) {
      throw new Error('Not connected to signaling server')
    }

    return new Promise((resolve, reject) => {
      const message: ServerMessage = {
        type: 'join_room',
        payload: {
          roomCode,
          playerId,
          timestamp: Date.now()
        }
      }

      // Set up one-time listener for room join response
      const originalCallback = this.onRoomJoinedCallback
      this.onRoomJoinedCallback = (roomInfo: RoomInfo) => {
        this.onRoomJoinedCallback = originalCallback
        resolve(roomInfo)
      }

      // Set timeout for room join
      const timeout = setTimeout(() => {
        this.onRoomJoinedCallback = originalCallback
        reject(new Error('Room join timeout'))
      }, 10000)

      this.socket.send(JSON.stringify(message))

      // Clear timeout when resolved
      this.onRoomJoinedCallback = (roomInfo: RoomInfo) => {
        clearTimeout(timeout)
        this.onRoomJoinedCallback = originalCallback
        resolve(roomInfo)
      }
    })
  }

  /**
   * Send WebRTC signaling data to peer
   */
  sendSignalData(signalData: string, toPeer: string): void {
    if (!this.isConnected || !this.socket) {
      throw new Error('Not connected to signaling server')
    }

    const message: ServerMessage = {
      type: 'signal_data',
      payload: {
        signalData,
        toPeer,
        timestamp: Date.now()
      }
    }

    this.socket.send(JSON.stringify(message))
  }

  /**
   * Leave current room
   */
  leaveRoom(): void {
    if (!this.isConnected || !this.socket) {
      return
    }

    const message: ServerMessage = {
      type: 'leave_room',
      payload: {
        timestamp: Date.now()
      }
    }

    this.socket.send(JSON.stringify(message))
  }

  /**
   * REQ-CONN005: Attempt automatic reconnection
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached')
      this.onConnectionStatusCallback?.('failed')
      return
    }

    this.reconnectAttempts++
    this.onConnectionStatusCallback?.('reconnecting')
    
    console.log(`Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts}`)

    setTimeout(() => {
      this.connect().catch((error) => {
        console.error('Reconnection failed:', error)
        this.attemptReconnect()
      })
    }, this.reconnectDelay * this.reconnectAttempts) // Exponential backoff
  }

  /**
   * Handle messages from signaling server
   */
  private handleServerMessage(message: ServerResponse): void {
    switch (message.type) {
      case 'room_created':
        this.onRoomCreatedCallback?.(message.payload.roomCode)
        break

      case 'room_joined':
        this.onRoomJoinedCallback?.(message.payload.roomInfo)
        break

      case 'peer_joined':
        this.onPeerJoinedCallback?.(message.payload.peerId)
        break

      case 'signal_data':
        this.onSignalDataCallback?.(message.payload.signalData, message.payload.fromPeer)
        break

      case 'room_full':
        console.error('Room is full')
        break

      case 'room_not_found':
        console.error('Room not found')
        break

      case 'error':
        console.error('Server error:', message.payload.error)
        break

      default:
        console.warn('Unknown message type:', message.type)
    }
  }

  /**
   * Set callback for room creation
   */
  onRoomCreated(callback: (roomCode: string) => void): void {
    this.onRoomCreatedCallback = callback
  }

  /**
   * Set callback for room joining
   */
  onRoomJoined(callback: (roomInfo: RoomInfo) => void): void {
    this.onRoomJoinedCallback = callback
  }

  /**
   * Set callback for peer joining
   */
  onPeerJoined(callback: (peerId: string) => void): void {
    this.onPeerJoinedCallback = callback
  }

  /**
   * Set callback for WebRTC signaling data
   */
  onSignalData(callback: (signalData: string, fromPeer: string) => void): void {
    this.onSignalDataCallback = callback
  }

  /**
   * Set callback for connection status changes
   */
  onConnectionStatus(callback: (status: ConnectionStatus) => void): void {
    this.onConnectionStatusCallback = callback
  }

  /**
   * Get current connection status
   */
  getConnectionStatus(): ConnectionStatus {
    if (!this.socket) return 'disconnected'
    
    switch (this.socket.readyState) {
      case WebSocket.CONNECTING:
        return 'connecting'
      case WebSocket.OPEN:
        return 'connected'
      case WebSocket.CLOSING:
      case WebSocket.CLOSED:
        return 'disconnected'
      default:
        return 'error'
    }
  }

  /**
   * Close connection to signaling server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.close()
      this.socket = null
    }
    this.isConnected = false
  }
}

// Type definitions
export interface GameConfig {
  name: string
  rules: string // YAML configuration
  maxPlayers: number
  timeLimit?: number
}

export interface RoomInfo {
  roomCode: string
  gameConfig: GameConfig
  players: string[]
  maxPlayers: number
  createdAt: number
}

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting' | 'failed' | 'error'

export interface ServerMessage {
  type: 'create_room' | 'join_room' | 'leave_room' | 'signal_data'
  payload: {
    gameConfig?: GameConfig
    roomCode?: string
    playerId?: string
    signalData?: string
    toPeer?: string
    timestamp: number
  }
}

export interface ServerResponse {
  type: 'room_created' | 'room_joined' | 'peer_joined' | 'signal_data' | 'room_full' | 'room_not_found' | 'error'
  payload: {
    roomCode?: string
    roomInfo?: RoomInfo
    peerId?: string
    signalData?: string
    fromPeer?: string
    error?: string
  }
}
