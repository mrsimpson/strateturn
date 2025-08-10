import { RoomManager, type GameConfig, type RoomInfo, type ConnectionStatus } from './RoomManager'
import { P2PConnection, type P2PMessage } from '../p2p/P2PConnection'
import { GitSyncManager } from '../sync/GitSyncManager'
import type { GameStateMachine } from '../logic/GameStateMachine'

/**
 * Coordinates Room Management, P2P Connection, and Git Synchronization
 * Implements complete connection flow from room creation to game synchronization
 */
export class ConnectionCoordinator {
  private roomManager: RoomManager
  private p2pConnection: P2PConnection | null = null
  private gitSyncManager: GitSyncManager | null = null
  private gameId: string
  private playerId: string
  private isHost: boolean = false
  private connectionState: ConnectionState = 'disconnected'
  private onStateChangeCallback?: (state: ConnectionState, data?: ConnectionStateData) => void

  constructor(gameId: string, playerId: string, serverUrl?: string) {
    this.gameId = gameId
    this.playerId = playerId
    this.roomManager = new RoomManager(serverUrl)
    this.setupRoomManagerCallbacks()
  }

  /**
   * Initialize connection to signaling server
   */
  async initialize(): Promise<void> {
    try {
      this.updateConnectionState('connecting')
      await this.roomManager.connect()
      this.updateConnectionState('ready')
    } catch (error) {
      console.error('Failed to initialize connection coordinator:', error)
      this.updateConnectionState('error', { error: error as Error })
      throw error
    }
  }

  /**
   * Create a new game room (host)
   */
  async createRoom(gameConfig: GameConfig, stateMachine: GameStateMachine): Promise<string> {
    if (this.connectionState !== 'ready') {
      throw new Error('Connection coordinator not ready')
    }

    try {
      this.updateConnectionState('creating_room')
      
      // Create room on signaling server
      const roomCode = await this.roomManager.createRoom(gameConfig, this.playerId)
      
      // Set up as host
      this.isHost = true
      
      // Initialize P2P connection as initiator
      this.p2pConnection = new P2PConnection(this.gameId, this.playerId, true)
      await this.p2pConnection.initialize()
      this.setupP2PCallbacks()
      
      // Initialize Git sync manager
      this.gitSyncManager = new GitSyncManager(this.gameId, this.playerId, stateMachine)
      await this.gitSyncManager.initialize()
      
      this.updateConnectionState('room_created', { roomCode })
      return roomCode
      
    } catch (error) {
      console.error('Failed to create room:', error)
      this.updateConnectionState('error', { error: error as Error })
      throw error
    }
  }

  /**
   * Join an existing game room (guest)
   */
  async joinRoom(roomCode: string, stateMachine: GameStateMachine): Promise<RoomInfo> {
    if (this.connectionState !== 'ready') {
      throw new Error('Connection coordinator not ready')
    }

    try {
      this.updateConnectionState('joining_room')
      
      // Join room on signaling server
      const roomInfo = await this.roomManager.joinRoom(roomCode, this.playerId)
      
      // Set up as guest
      this.isHost = false
      
      // Initialize P2P connection as non-initiator
      this.p2pConnection = new P2PConnection(this.gameId, this.playerId, false)
      await this.p2pConnection.initialize()
      this.setupP2PCallbacks()
      
      // Initialize Git sync manager
      this.gitSyncManager = new GitSyncManager(this.gameId, this.playerId, stateMachine)
      await this.gitSyncManager.initialize()
      
      this.updateConnectionState('room_joined', { roomInfo })
      return roomInfo
      
    } catch (error) {
      console.error('Failed to join room:', error)
      this.updateConnectionState('error', { error: error as Error })
      throw error
    }
  }

  /**
   * Complete WebRTC handshake and establish P2P connection
   */
  async establishP2PConnection(): Promise<void> {
    if (!this.p2pConnection) {
      throw new Error('P2P connection not initialized')
    }

    try {
      this.updateConnectionState('establishing_p2p')
      
      // Get signaling data from P2P connection
      const signalData = await this.p2pConnection.getSignalData()
      
      // Send signaling data through room manager
      // Note: The peer ID will be determined by the room manager
      const peerIds = await this.getPeerIds()
      if (peerIds.length > 0) {
        this.roomManager.sendSignalData(signalData, peerIds[0])
      }
      
    } catch (error) {
      console.error('Failed to establish P2P connection:', error)
      this.updateConnectionState('error', { error: error as Error })
      throw error
    }
  }

  /**
   * Send game state change to peer
   */
  sendGameStateChange(gameState: any, event: any, commitHash: string): void {
    if (!this.p2pConnection || !this.p2pConnection.isConnectionActive()) {
      console.warn('P2P connection not active, cannot send state change')
      return
    }

    this.p2pConnection.sendStateChange(gameState, event, commitHash)
  }

  /**
   * Request synchronization with peer
   */
  requestSync(lastKnownCommitHash: string): void {
    if (!this.p2pConnection || !this.p2pConnection.isConnectionActive()) {
      console.warn('P2P connection not active, cannot request sync')
      return
    }

    this.p2pConnection.requestSync(lastKnownCommitHash)
  }

  /**
   * Get current connection state
   */
  getConnectionState(): ConnectionState {
    return this.connectionState
  }

  /**
   * Get P2P connection statistics
   */
  getP2PStats() {
    return this.p2pConnection?.getStats() || null
  }

  /**
   * Set callback for connection state changes
   */
  onStateChange(callback: (state: ConnectionState, data?: ConnectionStateData) => void): void {
    this.onStateChangeCallback = callback
  }

  /**
   * Disconnect and cleanup
   */
  disconnect(): void {
    this.roomManager.leaveRoom()
    this.roomManager.disconnect()
    
    if (this.p2pConnection) {
      this.p2pConnection.close()
      this.p2pConnection = null
    }
    
    this.gitSyncManager = null
    this.updateConnectionState('disconnected')
  }

  // Private helper methods

  private setupRoomManagerCallbacks(): void {
    this.roomManager.onConnectionStatus((status: ConnectionStatus) => {
      switch (status) {
        case 'connected':
          if (this.connectionState === 'connecting') {
            this.updateConnectionState('ready')
          }
          break
        case 'disconnected':
          this.updateConnectionState('disconnected')
          break
        case 'reconnecting':
          this.updateConnectionState('reconnecting')
          break
        case 'error':
        case 'failed':
          this.updateConnectionState('error')
          break
      }
    })

    this.roomManager.onPeerJoined((peerId: string) => {
      console.log('Peer joined:', peerId)
      this.updateConnectionState('peer_joined', { peerId })
      
      // If we're the host, initiate WebRTC handshake
      if (this.isHost) {
        this.establishP2PConnection().catch(console.error)
      }
    })

    this.roomManager.onSignalData((signalData: string, fromPeer: string) => {
      console.log('Received signal data from peer:', fromPeer)
      
      if (this.p2pConnection) {
        try {
          this.p2pConnection.processSignalData(signalData)
        } catch (error) {
          console.error('Failed to process signal data:', error)
        }
      }
    })
  }

  private setupP2PCallbacks(): void {
    if (!this.p2pConnection) return

    this.p2pConnection.onConnectionChange((connected: boolean) => {
      if (connected) {
        this.updateConnectionState('p2p_connected')
      } else {
        this.updateConnectionState('p2p_disconnected')
      }
    })

    this.p2pConnection.onMessage((message: P2PMessage) => {
      this.handleP2PMessage(message)
    })
  }

  private handleP2PMessage(message: P2PMessage): void {
    if (!this.gitSyncManager) {
      console.warn('Git sync manager not available, cannot handle P2P message')
      return
    }

    switch (message.type) {
      case 'state_change':
      case 'git_commit':
        if (message.payload.gameState && message.payload.event && message.payload.commitHash) {
          this.gitSyncManager.handlePeerCommit(
            message.payload.commitHash,
            message.payload.gameState,
            message.payload.event
          ).catch(console.error)
        }
        break

      case 'sync_request':
        if (message.payload.lastKnownCommitHash) {
          this.handleSyncRequest(message.payload.lastKnownCommitHash)
        }
        break

      case 'sync_response':
        if (message.payload.commits) {
          this.handleSyncResponse(message.payload.commits)
        }
        break
    }
  }

  private async handleSyncRequest(lastKnownCommitHash: string): Promise<void> {
    if (!this.gitSyncManager || !this.p2pConnection) return

    try {
      // Get commits since the last known hash
      const commits = await this.gitSyncManager.getCommitHistory(50)
      
      // Filter commits after the last known hash
      // This is a simplified implementation
      const missingCommits = commits.filter(commit => commit.oid !== lastKnownCommitHash)
      
      this.p2pConnection.sendSyncResponse(missingCommits)
    } catch (error) {
      console.error('Failed to handle sync request:', error)
    }
  }

  private handleSyncResponse(commits: any[]): void {
    console.log('Received sync response with', commits.length, 'commits')
    // TODO: Apply missing commits to local state
  }

  private async getPeerIds(): Promise<string[]> {
    // This would typically come from the room manager
    // For now, return empty array as placeholder
    return []
  }

  private updateConnectionState(state: ConnectionState, data?: ConnectionStateData): void {
    this.connectionState = state
    console.log('Connection state changed:', state, data)
    this.onStateChangeCallback?.(state, data)
  }
}

// Type definitions
export type ConnectionState = 
  | 'disconnected'
  | 'connecting'
  | 'ready'
  | 'creating_room'
  | 'room_created'
  | 'joining_room'
  | 'room_joined'
  | 'peer_joined'
  | 'establishing_p2p'
  | 'p2p_connected'
  | 'p2p_disconnected'
  | 'reconnecting'
  | 'error'

export interface ConnectionStateData {
  roomCode?: string
  roomInfo?: RoomInfo
  peerId?: string
  error?: Error
}
