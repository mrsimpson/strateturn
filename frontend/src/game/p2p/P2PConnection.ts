import Peer from 'simple-peer'
import type { GameEvent, GameState as StateMachineState } from '../types/stateMachine'
import type { GitCommitInfo } from '../sync/GitRepository'

/**
 * P2P Connection Manager using WebRTC
 * Implements REQ-P2P001 through REQ-P2P005
 */
export class P2PConnection {
  private peer: Peer.Instance | null = null
  private isInitiator: boolean
  private gameId: string
  private playerId: string
  private isConnected: boolean = false
  private messageQueue: P2PMessage[] = []
  private onMessageCallback?: (message: P2PMessage) => void
  private onConnectionCallback?: (connected: boolean) => void

  constructor(gameId: string, playerId: string, isInitiator: boolean = false) {
    this.gameId = gameId
    this.playerId = playerId
    this.isInitiator = isInitiator
  }

  /**
   * REQ-CONN004: Initialize P2P connection
   */
  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.peer = new Peer({
          initiator: this.isInitiator,
          trickle: false, // Wait for all ICE candidates
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:stun1.l.google.com:19302' }
            ]
          }
        })

        this.setupPeerEventHandlers()
        
        this.peer.on('connect', () => {
          this.isConnected = true
          this.onConnectionCallback?.(true)
          this.flushMessageQueue()
          resolve()
        })

        this.peer.on('error', (error) => {
          console.error('P2P connection error:', error)
          this.isConnected = false
          this.onConnectionCallback?.(false)
          reject(error)
        })

      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * Get signaling data for WebRTC handshake
   */
  getSignalData(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.peer) {
        reject(new Error('Peer not initialized'))
        return
      }

      this.peer.on('signal', (data) => {
        resolve(JSON.stringify(data))
      })

      // Trigger signal generation if initiator
      if (this.isInitiator) {
        // Signal will be generated automatically
      }
    })
  }

  /**
   * Process signaling data from remote peer
   */
  processSignalData(signalData: string): void {
    if (!this.peer) {
      throw new Error('Peer not initialized')
    }

    try {
      const data = JSON.parse(signalData)
      this.peer.signal(data)
    } catch (error) {
      console.error('Failed to process signal data:', error)
      throw new Error('Invalid signal data')
    }
  }

  /**
   * REQ-P2P001: Send game state change to peer
   */
  sendStateChange(gameState: StateMachineState, event: GameEvent, commitHash: string): void {
    const message: P2PMessage = {
      type: 'state_change',
      payload: {
        gameState,
        event,
        commitHash,
        playerId: this.playerId,
        timestamp: Date.now()
      }
    }

    this.sendMessage(message)
  }

  /**
   * REQ-P2P001: Send Git commit to peer
   */
  sendCommit(commitHash: string, gameState: StateMachineState, event: GameEvent): void {
    const message: P2PMessage = {
      type: 'git_commit',
      payload: {
        commitHash,
        gameState,
        event,
        playerId: this.playerId,
        timestamp: Date.now()
      }
    }

    this.sendMessage(message)
  }

  /**
   * REQ-P2P003: Send sync request when connection is restored
   */
  requestSync(lastKnownCommitHash: string): void {
    const message: P2PMessage = {
      type: 'sync_request',
      payload: {
        lastKnownCommitHash,
        playerId: this.playerId,
        timestamp: Date.now()
      }
    }

    this.sendMessage(message)
  }

  /**
   * Send sync response with missing commits
   */
  sendSyncResponse(commits: GitCommitInfo[]): void {
    const message: P2PMessage = {
      type: 'sync_response',
      payload: {
        commits,
        playerId: this.playerId,
        timestamp: Date.now()
      }
    }

    this.sendMessage(message)
  }

  /**
   * REQ-P2P002: Send message with validation
   */
  private sendMessage(message: P2PMessage): void {
    // REQ-P2P002: Validate message format
    if (!this.validateMessage(message)) {
      console.error('Invalid message format:', message)
      return
    }

    if (this.isConnected && this.peer) {
      try {
        this.peer.send(JSON.stringify(message))
      } catch (error) {
        console.error('Failed to send message:', error)
        // REQ-P2P003: Cache message for later if send fails
        this.messageQueue.push(message)
      }
    } else {
      // REQ-P2P003: Cache pending messages when not connected
      this.messageQueue.push(message)
    }
  }

  /**
   * REQ-P2P002: Validate message format and content
   */
  private validateMessage(message: P2PMessage): boolean {
    if (!message.type || !message.payload) {
      return false
    }

    if (!message.payload.playerId || !message.payload.timestamp) {
      return false
    }

    // Validate specific message types
    switch (message.type) {
      case 'state_change':
      case 'git_commit':
        return !!(message.payload.gameState && message.payload.event)
      case 'sync_request':
        return !!message.payload.lastKnownCommitHash
      case 'sync_response':
        return Array.isArray(message.payload.commits)
      default:
        return false
    }
  }

  /**
   * Set up peer event handlers
   */
  private setupPeerEventHandlers(): void {
    if (!this.peer) return

    this.peer.on('data', (data) => {
      try {
        const message: P2PMessage = JSON.parse(data.toString())
        
        // REQ-P2P002: Validate received message
        if (!this.validateMessage(message)) {
          console.error('Received invalid message:', message)
          return
        }

        // REQ-P2P005: Check for duplicate messages
        if (this.isDuplicateMessage(message)) {
          console.log('Ignoring duplicate message:', message.type)
          return
        }

        // Process message
        this.onMessageCallback?.(message)
      } catch (error) {
        console.error('Failed to process received data:', error)
      }
    })

    this.peer.on('close', () => {
      this.isConnected = false
      this.onConnectionCallback?.(false)
      console.log('P2P connection closed')
    })
  }

  /**
   * REQ-P2P005: Detect duplicate messages
   */
  private isDuplicateMessage(message: P2PMessage): boolean {
    // Simple duplicate detection based on timestamp and type
    // In production, this should be more sophisticated
    const now = Date.now()
    const messageAge = now - message.payload.timestamp
    
    // Ignore messages older than 30 seconds (likely duplicates)
    return messageAge > 30000
  }

  /**
   * REQ-P2P003: Flush cached messages when connection is restored
   */
  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0 && this.isConnected) {
      const message = this.messageQueue.shift()
      if (message) {
        this.sendMessage(message)
      }
    }
  }

  /**
   * Set callback for incoming messages
   */
  onMessage(callback: (message: P2PMessage) => void): void {
    this.onMessageCallback = callback
  }

  /**
   * Set callback for connection status changes
   */
  onConnectionChange(callback: (connected: boolean) => void): void {
    this.onConnectionCallback = callback
  }

  /**
   * REQ-CONN005: Check connection status
   */
  isConnectionActive(): boolean {
    return this.isConnected && this.peer && !this.peer.destroyed
  }

  /**
   * REQ-CONN005: Attempt reconnection
   */
  async reconnect(): Promise<void> {
    if (this.peer) {
      this.peer.destroy()
    }
    
    this.isConnected = false
    await this.initialize()
  }

  /**
   * Close P2P connection
   */
  close(): void {
    if (this.peer) {
      this.peer.destroy()
      this.peer = null
    }
    this.isConnected = false
    this.messageQueue = []
  }

  /**
   * Get connection statistics
   */
  getStats(): P2PStats {
    return {
      isConnected: this.isConnected,
      isInitiator: this.isInitiator,
      queuedMessages: this.messageQueue.length,
      gameId: this.gameId,
      playerId: this.playerId
    }
  }
}

// Type definitions for P2P messages
export interface P2PMessage {
  type: 'state_change' | 'git_commit' | 'sync_request' | 'sync_response'
  payload: {
    playerId: string
    timestamp: number
    gameState?: StateMachineState
    event?: GameEvent
    commitHash?: string
    lastKnownCommitHash?: string
    commits?: GitCommitInfo[]
  }
}

export interface P2PStats {
  isConnected: boolean
  isInitiator: boolean
  queuedMessages: number
  gameId: string
  playerId: string
}
