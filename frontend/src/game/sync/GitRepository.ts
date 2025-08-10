import git from 'isomorphic-git'
import type { GameState as StateMachineState } from '../types/stateMachine'
import type { GameEvent } from '../types/stateMachine'

// Type for LightningFS instance
interface LightningFS {
  promises: {
    writeFile(path: string, data: string): Promise<void>
    readFile(path: string, encoding: string): Promise<string>
  }
}

/**
 * Git-based repository for game state synchronization
 * Implements REQ-GIT001 through REQ-GIT007
 */
export class GitRepository {
  private fs: LightningFS
  private dir: string
  private initialized: boolean = false

  constructor(gameId: string, fs: LightningFS) {
    this.fs = fs
    this.dir = `/game-${gameId}`
  }

  /**
   * REQ-GIT001: Initialize Git repository for game state tracking
   */
  async initialize(): Promise<void> {
    if (this.initialized) return

    try {
      // Initialize Git repository
      await git.init({
        fs: this.fs,
        dir: this.dir,
        defaultBranch: 'main'
      })

      // Create initial commit with empty game state
      await this.createInitialCommit()
      
      this.initialized = true
    } catch (error) {
      console.error('Failed to initialize Git repository:', error)
      throw new Error('Git repository initialization failed')
    }
  }

  /**
   * REQ-GIT002: Create commit for each game state change
   */
  async commitStateChange(
    gameState: StateMachineState, 
    event: GameEvent, 
    playerId: string
  ): Promise<string> {
    if (!this.initialized) {
      throw new Error('Repository not initialized')
    }

    try {
      // Write game state to files
      await this.writeGameFiles(gameState, event)

      // Stage all changes
      await git.add({
        fs: this.fs,
        dir: this.dir,
        filepath: '.'
      })

      // Create commit
      const commitHash = await git.commit({
        fs: this.fs,
        dir: this.dir,
        message: this.createCommitMessage(event, playerId),
        author: {
          name: playerId,
          email: `${playerId}@strateturn.local`
        }
      })

      return commitHash
    } catch (error) {
      console.error('Failed to commit state change:', error)
      throw new Error('State commit failed')
    }
  }

  /**
   * REQ-GIT003: Maintain linear history with fast-forward merges
   */
  async fastForwardMerge(remoteCommitHash: string): Promise<boolean> {
    try {
      // Get current HEAD
      const currentHead = await git.resolveRef({
        fs: this.fs,
        dir: this.dir,
        ref: 'HEAD'
      })

      // Check if remote commit is ahead of current HEAD
      const isAhead = await this.isCommitAhead(remoteCommitHash, currentHead)
      
      if (!isAhead) {
        return false // Cannot fast-forward
      }

      // Update HEAD to remote commit (fast-forward)
      await git.writeRef({
        fs: this.fs,
        dir: this.dir,
        ref: 'refs/heads/main',
        value: remoteCommitHash
      })

      return true
    } catch (error) {
      console.error('Fast-forward merge failed:', error)
      return false
    }
  }

  /**
   * REQ-GIT004: Detect conflicts through commit hash comparison
   */
  async detectConflict(remoteCommitHash: string): Promise<boolean> {
    try {
      const currentHead = await git.resolveRef({
        fs: this.fs,
        dir: this.dir,
        ref: 'HEAD'
      })

      // Conflict exists if neither commit is ahead of the other
      const remoteAhead = await this.isCommitAhead(remoteCommitHash, currentHead)
      const localAhead = await this.isCommitAhead(currentHead, remoteCommitHash)

      return !remoteAhead && !localAhead && currentHead !== remoteCommitHash
    } catch (error) {
      console.error('Conflict detection failed:', error)
      return true // Assume conflict on error
    }
  }

  /**
   * REQ-GIT005: Reset to common ancestor on conflict
   */
  async resetToCommonAncestor(remoteCommitHash: string): Promise<string | null> {
    try {
      const currentHead = await git.resolveRef({
        fs: this.fs,
        dir: this.dir,
        ref: 'HEAD'
      })

      // Find merge base (common ancestor)
      const mergeBase = await git.findMergeBase({
        fs: this.fs,
        dir: this.dir,
        oids: [currentHead, remoteCommitHash]
      })

      if (mergeBase.length === 0) {
        return null // No common ancestor
      }

      const commonAncestor = mergeBase[0]

      // Reset to common ancestor
      await git.writeRef({
        fs: this.fs,
        dir: this.dir,
        ref: 'refs/heads/main',
        value: commonAncestor
      })

      return commonAncestor
    } catch (error) {
      console.error('Reset to common ancestor failed:', error)
      return null
    }
  }

  /**
   * REQ-GIT006: Validate commit integrity using SHA-1 hashes
   */
  async validateCommit(commitHash: string): Promise<boolean> {
    try {
      // Try to read the commit object
      const commit = await git.readCommit({
        fs: this.fs,
        dir: this.dir,
        oid: commitHash
      })

      // Verify the commit exists and has valid structure
      return !!(commit && commit.commit && commit.commit.message)
    } catch (error) {
      console.error('Commit validation failed:', error)
      return false
    }
  }

  /**
   * REQ-GIT007: Read complete game state from commit
   */
  async readGameState(commitHash?: string): Promise<StateMachineState | null> {
    try {
      const ref = commitHash || 'HEAD'
      
      // Read gamestate.json from commit
      const gameStateContent = await git.readBlob({
        fs: this.fs,
        dir: this.dir,
        oid: ref,
        filepath: 'gamestate.json'
      })

      const gameStateText = new TextDecoder().decode(gameStateContent.blob)
      return JSON.parse(gameStateText) as StateMachineState
    } catch (error) {
      console.error('Failed to read game state:', error)
      return null
    }
  }

  /**
   * Get commit history for debugging/replay
   */
  async getCommitHistory(maxCount: number = 50): Promise<GitCommitInfo[]> {
    try {
      const commits = await git.log({
        fs: this.fs,
        dir: this.dir,
        depth: maxCount
      })

      return commits.map(commit => ({
        oid: commit.oid,
        message: commit.commit.message,
        author: commit.commit.author,
        timestamp: commit.commit.author.timestamp
      }))
    } catch (error) {
      console.error('Failed to get commit history:', error)
      return []
    }
  }

  /**
   * Get current HEAD commit hash
   */
  async getCurrentCommit(): Promise<string | null> {
    try {
      return await git.resolveRef({
        fs: this.fs,
        dir: this.dir,
        ref: 'HEAD'
      })
    } catch (error) {
      console.error('Failed to get current commit:', error)
      return null
    }
  }

  // Private helper methods

  private async createInitialCommit(): Promise<void> {
    // Create initial game files
    const initialState: StateMachineState = {
      phase: 'setup',
      currentPlayer: 'red',
      redPiecesPlaced: 0,
      bluePiecesPlaced: 0,
      board: Array(10).fill(null).map(() => Array(10).fill(null))
    }

    await this.writeGameFiles(initialState, { type: 'RESET_GAME' })

    // Stage and commit
    await git.add({ fs: this.fs, dir: this.dir, filepath: '.' })
    await git.commit({
      fs: this.fs,
      dir: this.dir,
      message: 'Initial commit: Game setup',
      author: {
        name: 'System',
        email: 'system@strateturn.local'
      }
    })
  }

  private async writeGameFiles(gameState: StateMachineState, event: GameEvent): Promise<void> {
    // Write main game state
    await this.fs.promises.writeFile(
      `${this.dir}/gamestate.json`,
      JSON.stringify(gameState, null, 2)
    )

    // Write state machine context
    const context = {
      lastEvent: event,
      timestamp: Date.now(),
      version: '1.0.0'
    }

    await this.fs.promises.writeFile(
      `${this.dir}/statemachine.json`,
      JSON.stringify(context, null, 2)
    )

    // Write human-readable move log
    const moveEntry = `${new Date().toISOString()}: ${event.type}\n`
    
    try {
      const existingLog = await this.fs.promises.readFile(`${this.dir}/moves.log`, 'utf8')
      await this.fs.promises.writeFile(`${this.dir}/moves.log`, existingLog + moveEntry)
    } catch {
      // File doesn't exist, create it
      await this.fs.promises.writeFile(`${this.dir}/moves.log`, moveEntry)
    }
  }

  private createCommitMessage(event: GameEvent, playerId: string): string {
    const timestamp = new Date().toISOString()
    return `${event.type} by ${playerId} at ${timestamp}`
  }

  private async isCommitAhead(commitA: string, commitB: string): Promise<boolean> {
    try {
      // Check if commitA is reachable from commitB (i.e., commitA is ahead)
      const commits = await git.log({
        fs: this.fs,
        dir: this.dir,
        ref: commitA
      })

      return commits.some(commit => commit.oid === commitB)
    } catch {
      return false
    }
  }
}

// Type definitions
export interface GitCommitInfo {
  oid: string
  message: string
  author: {
    name: string
    email: string
    timestamp: number
  }
  timestamp: number
}
