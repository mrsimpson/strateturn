import FS from '@isomorphic-git/lightning-fs'
import { GitRepository, type GitCommitInfo } from './GitRepository'
import type { GameStateMachine } from '../logic/GameStateMachine'
import type { GameEvent, GameState as StateMachineState } from '../types/stateMachine'

/**
 * Manages Git-based synchronization with State Machine
 * Integrates REQ-GIT001-007 with State Machine events
 */
export class GitSyncManager {
  private gitRepo: GitRepository
  private stateMachine: GameStateMachine
  private fs: FS
  private gameId: string
  private playerId: string
  private isInitialized: boolean = false

  constructor(gameId: string, playerId: string, stateMachine: GameStateMachine) {
    this.gameId = gameId
    this.playerId = playerId
    this.stateMachine = stateMachine
    this.fs = new FS(`strateturn-${gameId}`)
    this.gitRepo = new GitRepository(gameId, this.fs)
  }

  /**
   * Initialize Git repository and sync with State Machine
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      await this.gitRepo.initialize()
      
      // Set up State Machine event listener
      this.setupStateMachineSync()
      
      this.isInitialized = true
      console.log(`GitSyncManager initialized for game ${this.gameId}`)
    } catch (error) {
      console.error('GitSyncManager initialization failed:', error)
      throw error
    }
  }

  /**
   * Sync State Machine events to Git commits
   */
  private setupStateMachineSync(): void {
    // Listen to State Machine changes
    const originalSend = this.stateMachine.send.bind(this.stateMachine)
    
    this.stateMachine.send = async (event: GameEvent): Promise<boolean> => {
      const oldState = this.stateMachine.getState()
      const success = originalSend(event)
      
      if (success) {
        const newState = this.stateMachine.getState()
        
        // Only commit if state actually changed
        if (this.hasStateChanged(oldState, newState)) {
          try {
            const commitHash = await this.gitRepo.commitStateChange(
              newState, 
              event, 
              this.playerId
            )
            console.log(`State change committed: ${commitHash}`)
            
            // TODO: Send commit to peer via P2P
            this.notifyPeerOfCommit(commitHash, newState, event)
          } catch (error) {
            console.error('Failed to commit state change:', error)
            // TODO: Handle commit failure (maybe rollback state machine?)
          }
        }
      }
      
      return success
    }
  }

  /**
   * Handle incoming commit from peer
   */
  async handlePeerCommit(
    commitHash: string, 
    peerState: StateMachineState, 
    peerEvent: GameEvent
  ): Promise<boolean> {
    try {
      // Validate commit integrity
      const isValid = await this.gitRepo.validateCommit(commitHash)
      if (!isValid) {
        console.error('Invalid commit received from peer:', commitHash)
        return false
      }

      console.log('Processing peer commit:', commitHash, 'for event:', peerEvent.type)

      // Check for conflicts
      const hasConflict = await this.gitRepo.detectConflict(commitHash)
      
      if (hasConflict) {
        console.warn('Conflict detected, resetting to common ancestor')
        const commonAncestor = await this.gitRepo.resetToCommonAncestor(commitHash)
        
        if (commonAncestor) {
          // Reset State Machine to common ancestor state
          const ancestorState = await this.gitRepo.readGameState(commonAncestor)
          if (ancestorState) {
            this.resetStateMachineToState(ancestorState)
          }
        }
        
        return false
      }

      // Attempt fast-forward merge
      const mergeSuccess = await this.gitRepo.fastForwardMerge(commitHash)
      
      if (mergeSuccess) {
        // Update State Machine to peer state
        this.updateStateMachineToState(peerState)
        console.log('Successfully merged peer commit:', commitHash)
        return true
      } else {
        console.error('Fast-forward merge failed for commit:', commitHash)
        return false
      }
    } catch (error) {
      console.error('Error handling peer commit:', error)
      return false
    }
  }

  /**
   * Get current commit hash for P2P synchronization
   */
  async getCurrentCommitHash(): Promise<string | null> {
    return await this.gitRepo.getCurrentCommit()
  }

  /**
   * Get commit history for debugging
   */
  async getCommitHistory(maxCount: number = 20): Promise<GitCommitInfo[]> {
    return await this.gitRepo.getCommitHistory(maxCount)
  }

  /**
   * Export game state for recovery
   */
  async exportGameState(): Promise<{ state: StateMachineState; commitHash: string } | null> {
    try {
      const commitHash = await this.gitRepo.getCurrentCommit()
      const state = await this.gitRepo.readGameState()
      
      if (commitHash && state) {
        return { state, commitHash }
      }
      
      return null
    } catch (error) {
      console.error('Failed to export game state:', error)
      return null
    }
  }

  // Private helper methods

  private hasStateChanged(oldState: StateMachineState, newState: StateMachineState): boolean {
    // Simple deep comparison for state changes
    return JSON.stringify(oldState) !== JSON.stringify(newState)
  }

  private updateStateMachineToState(newState: StateMachineState): void {
    // TODO: Implement proper State Machine state restoration
    // This is tricky because we need to update internal state without triggering events
    console.log('TODO: Update State Machine to state:', newState.phase)
  }

  private resetStateMachineToState(ancestorState: StateMachineState): void {
    // TODO: Implement State Machine reset to specific state
    console.log('TODO: Reset State Machine to ancestor state:', ancestorState.phase)
  }

  private notifyPeerOfCommit(
    commitHash: string, 
    state: StateMachineState, 
    event: GameEvent
  ): void {
    // TODO: Send commit to peer via WebRTC P2P connection
    console.log('TODO: Notify peer of commit:', commitHash, event.type)
  }
}

/**
 * Factory function to create GitSyncManager
 */
export function createGitSyncManager(
  gameId: string, 
  playerId: string, 
  stateMachine: GameStateMachine
): GitSyncManager {
  return new GitSyncManager(gameId, playerId, stateMachine)
}
