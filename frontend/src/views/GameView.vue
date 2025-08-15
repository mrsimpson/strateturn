<template>
  <div class="game-view">
    <!-- Game Header -->
    <div class="game-header">
      <div class="game-title-section">
        <h1 class="game-title">{{ gameConfig.rules.name }}</h1>
        <div class="player-info">
          <span class="player-role" :class="`player-${playerInfo.role}`">
            {{ playerInfo.displayName }}
          </span>
          <span v-if="roomId" class="room-info">
            Room: {{ roomId }}
          </span>
        </div>
      </div>
      <div class="game-controls">
        <button
          v-if="gameState.phase === 'setup'"
          @click="startGame"
          :disabled="!canStartGame"
          class="btn-primary"
        >
          Start Game
        </button>
        <button
          v-if="gameState.phase === 'setup'"
          @click="autoSetup"
          class="btn-secondary"
        >
          Auto Setup (Test)
        </button>
        <button
          @click="resetGame"
          class="btn-secondary"
        >
          Reset Game
        </button>
        <button
          @click="toggleDebugMode"
          class="btn-debug"
        >
          {{ debugMode ? 'Hide' : 'Show' }} Debug
        </button>
      </div>
    </div>

    <!-- Game Status -->
    <div class="game-status-bar">
      <div class="status-item">
        <strong>Phase:</strong> {{ gameState.phase }}
        <span v-if="gameState.phase === 'playing'">
          ({{ gameState.subState.type }})
        </span>
      </div>
      <div class="status-item">
        <strong>Current Player:</strong>
        <span :class="currentPlayerClass">{{ currentPlayer }}</span>
      </div>
      <div v-if="gameState.phase === 'playing'" class="status-item">
        <strong>Turn:</strong> {{ gameState.turn }}
      </div>
    </div>

    <!-- Setup Phase Instructions -->
    <div v-if="gameState.phase === 'setup'" class="setup-instructions">
      <h3>Setup Phase - <span :class="`player-${gameState.currentPlayer}`">{{ gameState.currentPlayer.toUpperCase() }}</span> Player's Turn</h3>
      <div class="setup-help">
        <p><strong>Setup Instructions:</strong></p>
        <ul v-if="gameState.currentPlayer === localPlayerRole">
          <li><strong>Your turn!</strong> Click on a piece below to select it</li>
          <li>Click on the board in your zone ({{ localPlayerRole === 'red' ? 'bottom rows' : 'top rows' }}) to place it</li>
          <li>Click on a placed piece to return it to your palette</li>
          <li>Place all 40 pieces to finish your setup</li>
        </ul>
        <ul v-else>
          <li>The <strong>{{ gameState.currentPlayer.toUpperCase() }}</strong> player is placing their pieces</li>
          <li>Please wait for your turn</li>
          <li>You can watch their progress below</li>
        </ul>
      </div>
      <div class="piece-counts">
        <div class="player-pieces" :class="{ 'active-player': gameState.currentPlayer === 'red' }">
          <h4>Red Player: {{ gameState.redPiecesPlaced }}/40</h4>
          <div class="progress-bar">
            <div
              class="progress-fill red"
              :style="{ width: (gameState.redPiecesPlaced / 40 * 100) + '%' }"
            ></div>
          </div>
          <div class="player-status">
            <span v-if="gameState.redPiecesPlaced === 40" class="status-complete">✅ Setup Complete</span>
            <span v-else-if="gameState.currentPlayer === 'red'" class="status-active">🎯 Placing pieces...</span>
            <span v-else class="status-waiting">⏳ Waiting...</span>
          </div>
        </div>
        <div class="player-pieces" :class="{ 'active-player': gameState.currentPlayer === 'blue' }">
          <h4>Blue Player: {{ gameState.bluePiecesPlaced }}/40</h4>
          <div class="progress-bar">
            <div
              class="progress-fill blue"
              :style="{ width: (gameState.bluePiecesPlaced / 40 * 100) + '%' }"
            ></div>
          </div>
          <div class="player-status">
            <span v-if="gameState.bluePiecesPlaced === 40" class="status-complete">✅ Setup Complete</span>
            <span v-else-if="gameState.currentPlayer === 'blue'" class="status-active">🎯 Placing pieces...</span>
            <span v-else class="status-waiting">⏳ Waiting...</span>
          </div>
        </div>
      </div>
      
      <!-- Start Game Button -->
      <div v-if="canStartGame" class="start-game-section">
        <h4>🎉 Both players have completed setup!</h4>
        <button @click="startGame" class="btn-primary btn-large">
          Start Game
        </button>
      </div>
    </div>

    <!-- Playing Phase Instructions -->
    <div v-if="gameState.phase === 'playing'" class="playing-instructions">
      <h3>Playing Phase - <span :class="`player-${gameState.subState.currentPlayer}`">{{ gameState.subState.currentPlayer.toUpperCase() }}</span> Player's Turn</h3>
      
      <!-- Turn Confirmation UI -->
      <div v-if="gameState.subState.type === 'ending_turn'" class="turn-confirmation">
        <div class="confirmation-message">
          <h4>Turn Complete</h4>
          <p v-if="gameState.subState.currentPlayer === localPlayerRole">
            Your move has been made. Confirming turn in {{ turnConfirmationCountdown }} seconds...
          </p>
          <p v-else>
            {{ gameState.subState.currentPlayer.toUpperCase() }} player's turn is ending...
          </p>
        </div>
        
        <div v-if="gameState.subState.currentPlayer === localPlayerRole" class="confirmation-actions">
          <button @click="confirmTurn" class="confirm-turn-btn">
            Confirm Turn
          </button>
          <button @click="cancelTurn" class="cancel-turn-btn" :disabled="turnConfirmationCountdown <= 0">
            Cancel Turn ({{ turnConfirmationCountdown }}s)
          </button>
        </div>
      </div>
      
      <!-- Regular Playing Instructions -->
      <div v-else class="playing-help">
        <p><strong>Game Instructions:</strong></p>
        <ul v-if="gameState.subState.currentPlayer === localPlayerRole">
          <li><strong>Your turn!</strong> Click on one of your pieces to select it</li>
          <li>Click on a highlighted square to move your piece</li>
          <li>Attack enemy pieces by moving into their square</li>
          <li>Capture the enemy flag to win!</li>
        </ul>
        <ul v-else>
          <li>The <strong>{{ gameState.subState.currentPlayer.toUpperCase() }}</strong> player is making their move</li>
          <li>Please wait for your turn</li>
          <li>Watch the board for their moves</li>
        </ul>
      </div>
      <div class="game-info">
        <div class="turn-info">
          <strong>Turn:</strong> {{ gameState.turn || 1 }}
        </div>
        <div v-if="gameState.subState" class="substate-info">
          <strong>State:</strong> {{ gameState.subState.type }}
        </div>
      </div>
    </div>

    <!-- Game Board -->
    <GameBoard
      :game-state="gameState"
      :board-config="gameConfig.board"
      :piece-config="gameConfig.pieces"
      :local-player-role="localPlayerRole"
      @piece-select="handlePieceSelect"
      @piece-move="handlePieceMove"
      @piece-deselect="handlePieceDeselect"
      @cell-click="handleCellClick"
      @piece-return="handlePieceReturn"
    />

    <!-- Piece Palette (Setup Phase) -->
    <div v-if="gameState.phase === 'setup' && gameState.currentPlayer === localPlayerRole" class="piece-palette">
      <h3>Your Pieces ({{ 40 - availablePieces.length }}/40 placed)</h3>
      <p class="palette-instruction">
        <span v-if="selectedPieceForPlacement">
          Selected: <strong>{{ selectedPieceForPlacement.name }}</strong> - Click on the board to place it
        </span>
        <span v-else>
          Click on a piece below to select it for placement
        </span>
      </p>

      <div class="piece-categories">
        <!-- High Rank Pieces -->
        <div class="piece-category">
          <h4>Command (Ranks 6-10)</h4>
          <div class="piece-type-grid">
            <div
              v-for="group in pieceTypeGroups.command"
              :key="group.type.name"
              class="piece-type-item"
              :class="{ 'selected': selectedPieceForPlacement?.name === group.type.name }"
              @click="selectPieceType(group)"
            >
              <div class="piece-type-visual">
                <div class="piece-symbol">{{ gameConfig.pieces.symbols[group.type.name] }}</div>
                <div class="piece-rank">{{ group.type.rank }}</div>
              </div>
              <div class="piece-type-info">
                <div class="piece-name">{{ group.type.name }}</div>
                <div class="piece-count">{{ group.count }} remaining</div>
                <div class="piece-rank-info">Rank: {{ group.type.rank }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Special Pieces -->
        <div class="piece-category">
          <h4>Special Units</h4>
          <div class="piece-type-grid">
            <div
              v-for="group in pieceTypeGroups.special"
              :key="group.type.name"
              class="piece-type-item"
              :class="{ 'selected': selectedPieceForPlacement?.name === group.type.name }"
              @click="selectPieceType(group)"
            >
              <div class="piece-type-visual">
                <div class="piece-symbol">{{ gameConfig.pieces.symbols[group.type.name] }}</div>
                <div class="piece-rank">{{ group.type.rank }}</div>
              </div>
              <div class="piece-type-info">
                <div class="piece-name">{{ group.type.name }}</div>
                <div class="piece-count">{{ group.count }} remaining</div>
                <div class="piece-rank-info">Rank: {{ group.type.rank }}</div>
                <div v-if="group.type.movement === 0" class="piece-special">Immovable</div>
                <div v-else-if="group.type.movement === 'unlimited'" class="piece-special">Unlimited Move</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Waiting for other player -->
    <div v-if="gameState.phase === 'setup' && gameState.currentPlayer !== localPlayerRole" class="waiting-message">
      <h3>Waiting for {{ gameState.currentPlayer.toUpperCase() }} player to place pieces...</h3>
      <p>The other player is currently setting up their pieces. Please wait.</p>
      <div class="loading-spinner">⏳</div>
    </div>

    <!-- Debug Panel -->
    <div v-if="debugMode" class="debug-panel">
      <h3>Debug Information</h3>
      <div class="debug-section">
        <h4>Game State</h4>
        <pre>{{ JSON.stringify(gameState, null, 2) }}</pre>
      </div>
      
      <div class="debug-section">
        <h4>Player Information</h4>
        <div class="debug-item">
          <strong>Player Role:</strong> {{ playerInfo.role }}
        </div>
        <div class="debug-item">
          <strong>Is Host:</strong> {{ playerStore.isHost }}
        </div>
        <div class="debug-item">
          <strong>Player ID:</strong> {{ playerInfo.playerId }}
        </div>
        <div class="debug-item">
          <strong>Room ID:</strong> {{ playerStore.currentRoomId }}
        </div>
        <div class="debug-item">
          <strong>Storage Data:</strong> 
          <pre>{{ JSON.stringify(playerStore.getStorageData(), null, 2) }}</pre>
        </div>
      </div>
      <div class="debug-section">
        <h4>Last Event</h4>
        <pre>{{ JSON.stringify(lastEvent, null, 2) }}</pre>
      </div>
    </div>

    <!-- Game End Modal -->
    <div v-if="gameState.phase === 'finished'" class="game-end-modal">
      <div class="modal-content">
        <h2>Game Over!</h2>
        <div class="winner-announcement">
          <span v-if="gameState.winner === 'draw'">
            It's a Draw!
          </span>
          <span v-else :class="`winner-${gameState.winner}`">
            {{ gameState.winner.toUpperCase() }} Wins!
          </span>
        </div>
        <div class="game-end-reason">
          Reason: {{ gameState.reason }}
        </div>
        <button @click="resetGame" class="btn-primary">
          Play Again
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watchEffect } from 'vue'
import { useRoute } from 'vue-router'
import GameBoard from '../components/game/GameBoard.vue'
import GamePiece from '../components/game/GamePiece.vue'
import { GameStateMachine } from '../game/logic/GameStateMachine'
import { strategoClassicConfig } from '../game/configs/stratego-classic'
import { usePlayerStore } from '../stores/player'
import { useMultiplayerStore } from '../stores/multiplayer'
import type { Piece, Position } from '../game/types'
import type { GameEvent, StateMachineConfig, PlacePieceEvent } from '../game/types/stateMachine'

// Game configuration
const gameConfig = ref(strategoClassicConfig)

// Route management
const route = useRoute()
const roomId = computed(() => route.params.roomId as string)
const isJoining = computed(() => route.query.join === '1')

// Player store
const playerStore = usePlayerStore()
const multiplayerStore = useMultiplayerStore()
const localPlayerRole = computed(() => playerStore.localPlayerRole)
const playerInfo = computed(() => playerStore.getPlayerInfo())

// Game state management
const stateMachine = ref<GameStateMachine | null>(null)
const gameState = ref<any>({
  phase: 'setup',
  currentPlayer: 'red',
  redPiecesPlaced: 0,
  bluePiecesPlaced: 0,
  board: Array(10).fill(null).map(() => Array(10).fill(null))
})

// UI state
const debugMode = ref(false)
const selectedPieceForPlacement = ref<Piece | null>(null)

// Turn confirmation state
const turnConfirmationCountdown = ref(0)
const turnConfirmationTimer = ref<NodeJS.Timeout | null>(null)

// Turn confirmation methods
const clearTurnConfirmationTimer = () => {
  if (turnConfirmationTimer.value) {
    clearInterval(turnConfirmationTimer.value)
    turnConfirmationTimer.value = null
  }
  turnConfirmationCountdown.value = 0
}

const startTurnConfirmation = () => {
  console.log('Starting turn confirmation countdown')
  turnConfirmationCountdown.value = 3
  
  turnConfirmationTimer.value = setInterval(() => {
    turnConfirmationCountdown.value--
    
    if (turnConfirmationCountdown.value <= 0) {
      confirmTurn()
    }
  }, 1000)
}

const confirmTurn = () => {
  console.log('Confirming turn')
  clearTurnConfirmationTimer()
  
  const event: GameEvent = {
    type: 'END_TURN'
  }
  
  sendEvent(event)
}

const cancelTurn = () => {
  console.log('Cancelling turn - not implemented yet')
  clearTurnConfirmationTimer()
  // TODO: Implement turn cancellation logic
  // This would need to revert the last move and return to piece_selected state
}
const lastEvent = ref<GameEvent | null>(null)

// Available pieces for setup
const availablePieces = ref<Piece[]>([])

// Computed properties
const currentPlayer = computed(() => {
  if (gameState.value.phase === 'setup') {
    return gameState.value.currentPlayer
  } else if (gameState.value.phase === 'playing') {
    const subState = gameState.value.subState
    if (subState && (subState.type === 'waiting_for_player' || subState.type === 'piece_selected')) {
      return subState.currentPlayer
    }
  }
  return 'unknown'
})

const currentPlayerClass = computed(() => ({
  'text-red-600 font-bold': currentPlayer.value === 'red',
  'text-blue-600 font-bold': currentPlayer.value === 'blue'
}))

const canStartGame = computed(() => {
  return gameState.value.redPiecesPlaced === 40 && gameState.value.bluePiecesPlaced === 40
})

// Computed properties for piece type organization with remaining counts
const pieceTypesSummary = computed(() => {
  if (!gameConfig.value.pieces?.types) return []
  
  // Count how many of each piece type are still available
  const availableCounts = {}
  availablePieces.value.forEach(piece => {
    availableCounts[piece.name] = (availableCounts[piece.name] || 0) + 1
  })
  
  // Create summary with remaining counts
  return gameConfig.value.pieces.types.map(pieceType => ({
    ...pieceType,
    remaining: availableCounts[pieceType.name] || 0,
    placed: pieceType.count - (availableCounts[pieceType.name] || 0)
  }))
})

const highRankPieceTypes = computed(() => 
  pieceTypesSummary.value.filter(piece => piece.rank >= 6 && piece.rank <= 10)
)

const specialPieceTypes = computed(() => 
  pieceTypesSummary.value.filter(piece => piece.rank < 6 || piece.rank > 10)
)

// Piece type groups with counts for better UX
const pieceTypeGroups = computed(() => {
  const groups = {
    command: [] as Array<{ type: any, count: number, pieces: Piece[] }>,
    special: [] as Array<{ type: any, count: number, pieces: Piece[] }>
  }

  // Group available pieces by type
  const piecesByType = new Map<string, Piece[]>()
  availablePieces.value.forEach(piece => {
    const key = piece.name
    if (!piecesByType.has(key)) {
      piecesByType.set(key, [])
    }
    piecesByType.get(key)!.push(piece)
  })

  // Create type groups with counts
  gameConfig.value.pieces.types.forEach(pieceType => {
    const availablePiecesOfType = piecesByType.get(pieceType.name) || []
    const count = availablePiecesOfType.length

    if (count > 0) {
      const group = {
        type: pieceType,
        count,
        pieces: availablePiecesOfType
      }

      if (pieceType.rank >= 6 && pieceType.rank <= 10) {
        groups.command.push(group)
      } else {
        groups.special.push(group)
      }
    }
  })

  return groups
})

// Legacy computed properties for backward compatibility (will be removed)
const highRankPieces = computed(() => {
  return availablePieces.value.filter(piece => piece.rank >= 6 && piece.rank <= 10)
})

const specialPieces = computed(() => {
  return availablePieces.value.filter(piece => piece.rank < 6 || piece.rank === 11 || piece.rank === 0)
})

// Initialize game
onMounted(async () => {
  initializePlayer()
  await initializeMultiplayer()
  initializeGame()
  setupGameStateListener()
})

onUnmounted(() => {
  multiplayerStore.disconnect()
  window.removeEventListener('gameStateSync', handleGameStateSync)
  clearTurnConfirmationTimer() // Clean up turn confirmation timer
})

const initializeMultiplayer = async () => {
  try {
    await multiplayerStore.connect()
    if (roomId.value) {
      multiplayerStore.joinRoom(roomId.value)
    }
  } catch (error) {
    console.error('Failed to initialize multiplayer:', error)
  }
}

const setupGameStateListener = () => {
  window.addEventListener('gameStateSync', handleGameStateSync)
}

const handleGameStateSync = (event: any) => {
  const syncedState = event.detail
  console.log('Syncing game state from other player:', syncedState)
  
  // Update local game state
  gameState.value = { ...syncedState }
  
  // Note: We don't need to update the state machine directly since
  // the gameState reactive ref will trigger UI updates automatically.
  // The state machine is primarily for local event processing.
}

const initializePlayer = () => {
  if (roomId.value) {
    playerStore.initializePlayer(roomId.value, isJoining.value)
  }
}

const initializeGame = () => {
  // Create initial state
  const initialState = {
    phase: 'setup' as const,
    currentPlayer: 'red' as const,
    redPiecesPlaced: 0,
    bluePiecesPlaced: 0,
    board: Array(10).fill(null).map(() => Array(10).fill(null))
  }

  // Create state machine configuration
  const config: StateMachineConfig = {
    initialState,
    context: {
      gameId: 'local-game',
      players: {
        red: { name: 'Red Player', isReady: false },
        blue: { name: 'Blue Player', isReady: false }
      },
      startTime: Date.now(),
      lastMoveTime: Date.now()
    }
  }

  // Create state machine
  stateMachine.value = new GameStateMachine(config)

  // Get initial state
  gameState.value = stateMachine.value.getState()

  // Initialize available pieces
  initializeAvailablePieces()
}

const initializeAvailablePieces = () => {
  console.log('=== INITIALIZE AVAILABLE PIECES ===')
  console.log('Current player:', gameState.value.currentPlayer)
  console.log('Local player role:', localPlayerRole.value)
  
  // Only initialize pieces for the local player when it's their turn
  if (gameState.value.currentPlayer !== localPlayerRole.value) {
    console.log('Not local player turn, clearing available pieces')
    availablePieces.value = []
    return
  }
  
  // Don't reinitialize if pieces already exist for this player
  if (availablePieces.value.length > 0) {
    console.log('Pieces already initialized for current player')
    return
  }

  const pieces: Piece[] = []
  const currentPlayer = gameState.value.currentPlayer

  // Create pieces based on game configuration
  gameConfig.value.pieces.types.forEach(pieceType => {
    for (let i = 0; i < pieceType.count; i++) {
      pieces.push({
        id: `${currentPlayer}-${pieceType.name.toLowerCase()}-${i + 1}`,
        name: pieceType.name,
        rank: pieceType.rank,
        movement: pieceType.movement,
        player: currentPlayer,
        isRevealed: false,
        position: null
      })
    }
  })

  // Sort pieces by rank (highest first) then by name
  pieces.sort((a, b) => {
    if (a.rank !== b.rank) {
      return b.rank - a.rank
    }
    return a.name.localeCompare(b.name)
  })

  availablePieces.value = pieces
  console.log(`Initialized ${pieces.length} pieces for ${currentPlayer} player`)
  console.log('=== END INITIALIZE AVAILABLE PIECES ===')
}

// Watch for current player changes to initialize pieces
watchEffect(() => {
  if (gameState.value.phase === 'setup') {
    // Only initialize pieces if the current player hasn't placed any pieces yet
    const currentPlayerPiecesPlaced = gameState.value.currentPlayer === 'red' 
      ? gameState.value.redPiecesPlaced 
      : gameState.value.bluePiecesPlaced
    
    if (currentPlayerPiecesPlaced === 0) {
      initializeAvailablePieces()
    }
  }
})

// Watch for ending_turn state to start confirmation countdown
watchEffect(() => {
  if (gameState.value.phase === 'playing' && 
      gameState.value.subState?.type === 'ending_turn' &&
      gameState.value.subState.currentPlayer === localPlayerRole.value) {
    // Only start confirmation if not already running
    if (!turnConfirmationTimer.value && turnConfirmationCountdown.value === 0) {
      startTurnConfirmation()
    }
  } else {
    // Clear any existing timer if we're not in ending_turn state
    clearTurnConfirmationTimer()
  }
})

// Event handlers
const handlePieceSelect = (piece: Piece, position: Position) => {
  console.log('Piece selected:', piece.name, 'at', position)

  if (gameState.value.phase === 'playing') {
    // Calculate valid moves for the selected piece
    const validMoves = calculateValidMoves(piece, position)

    const event: GameEvent = {
      type: 'SELECT_PIECE',
      piece,
      position,
      validMoves
    }

    sendEvent(event)
  }
}

const handlePieceMove = (from: Position, to: Position, piece: Piece) => {
  console.log('Piece move:', piece.name, 'from', from, 'to', to)

  if (gameState.value.phase === 'playing') {
    // Check if target position has a piece
    const targetPiece = gameState.value.board[to.y]?.[to.x] || undefined

    const event: GameEvent = {
      type: 'MOVE_PIECE',
      from,
      to,
      targetPiece
    }

    sendEvent(event)
  }
}

const handlePieceDeselect = () => {
  console.log('Piece deselected')

  if (gameState.value.phase === 'playing') {
    const event: GameEvent = {
      type: 'DESELECT_PIECE'
    }

    sendEvent(event)
  }
}

const handleCellClick = (position: Position) => {
  console.log('=== GAMEVIEW CELL CLICK ===')
  console.log('Position clicked:', position)
  console.log('Game phase:', gameState.value.phase)
  console.log('Selected piece for placement:', selectedPieceForPlacement.value?.name || 'none')

  // Handle piece placement in setup phase
  if (gameState.value.phase === 'setup' && selectedPieceForPlacement.value) {
    console.log('Setup phase + piece selected, calling placePieceOnBoard')
    placePieceOnBoard(selectedPieceForPlacement.value, position)
  } else {
    console.log('Not placing piece - phase:', gameState.value.phase, 'selected:', !!selectedPieceForPlacement.value)
  }

  console.log('=== END GAMEVIEW CELL CLICK ===')
}

const handlePieceReturn = (piece: Piece, position: Position) => {
  console.log('=== PIECE RETURN DEBUG ===')
  console.log('Returning piece to palette:', piece.name, 'from position:', position)
  console.log('Current player:', gameState.value.currentPlayer)
  console.log('Local player role:', localPlayerRole.value)

  // Only allow returning pieces during setup phase
  if (gameState.value.phase !== 'setup') {
    console.warn('Cannot return pieces outside of setup phase')
    return
  }

  // Only allow returning pieces during your turn
  if (gameState.value.currentPlayer !== localPlayerRole.value) {
    console.warn('Not your turn! Cannot return pieces.')
    return
  }

  // Only allow returning own pieces
  if (piece.player !== gameState.value.currentPlayer) {
    console.warn('Cannot return opponent pieces')
    return
  }

  // Remove piece from board directly (no state machine needed for setup)
  const newBoard = gameState.value.board.map(row => [...row])
  newBoard[position.y][position.x] = null

  // Update piece counts
  const newRedCount = piece.player === 'red' ? gameState.value.redPiecesPlaced - 1 : gameState.value.redPiecesPlaced
  const newBlueCount = piece.player === 'blue' ? gameState.value.bluePiecesPlaced - 1 : gameState.value.bluePiecesPlaced

  // Update game state directly
  gameState.value = {
    ...gameState.value,
    board: newBoard,
    redPiecesPlaced: newRedCount,
    bluePiecesPlaced: newBlueCount
  }

  // Add piece back to available pieces
  availablePieces.value.push(piece)
  availablePieces.value.sort((a, b) => {
    // Sort by rank descending, then by name
    if (a.rank !== b.rank) {
      return b.rank - a.rank
    }
    return a.name.localeCompare(b.name)
  })

  console.log('Piece returned successfully!')
  console.log('New piece counts - Red:', newRedCount, 'Blue:', newBlueCount)
  console.log('Available pieces:', availablePieces.value.length)

  console.log('=== END PIECE RETURN DEBUG ===')
}

// Turn confirmation methods are defined above

const placePieceOnBoard = (piece: Piece, position: Position) => {
  console.log('=== PLACE PIECE DEBUG ===')
  console.log('Piece:', piece)
  console.log('Position:', position)
  console.log('Current player:', gameState.value.currentPlayer)
  console.log('Local player role:', localPlayerRole.value)
  console.log('Game phase:', gameState.value.phase)

  // Only allow placing pieces during your turn
  if (gameState.value.currentPlayer !== localPlayerRole.value) {
    console.warn('Not your turn! Current player:', gameState.value.currentPlayer, 'Your role:', localPlayerRole.value)
    return
  }

  // Check if position is in valid setup zone for current player
  const isValidZone = isValidSetupPosition(position, gameState.value.currentPlayer)
  console.log('Is valid zone:', isValidZone)

  if (!isValidZone) {
    console.warn('Invalid setup position for player:', gameState.value.currentPlayer)
    return
  }

  // Check if position is already occupied
  const occupiedPiece = gameState.value.board[position.y][position.x]
  console.log('Position occupied by:', occupiedPiece)

  if (occupiedPiece) {
    console.warn('Position already occupied:', occupiedPiece)
    return
  }

  // Place piece on board directly (no state machine for setup)
  const newBoard = gameState.value.board.map(row => [...row])
  newBoard[position.y][position.x] = { ...piece, player: gameState.value.currentPlayer, position }

  // Update piece counts
  const newRedCount = gameState.value.currentPlayer === 'red' ? gameState.value.redPiecesPlaced + 1 : gameState.value.redPiecesPlaced
  const newBlueCount = gameState.value.currentPlayer === 'blue' ? gameState.value.bluePiecesPlaced + 1 : gameState.value.bluePiecesPlaced

  // Check if current player has finished setup
  const currentPlayerFinished = (gameState.value.currentPlayer === 'red' && newRedCount === 40) || 
                                (gameState.value.currentPlayer === 'blue' && newBlueCount === 40)

  // Determine next player
  let nextPlayer = gameState.value.currentPlayer
  if (currentPlayerFinished) {
    if (gameState.value.currentPlayer === 'red' && newBlueCount < 40) {
      nextPlayer = 'blue' // Red finished, blue's turn
    } else if (gameState.value.currentPlayer === 'blue' && newRedCount < 40) {
      nextPlayer = 'red' // Blue finished, red's turn (shouldn't happen in normal flow)
    }
    // If both players finished, keep current player (will transition to playing phase)
  }

  // Update game state directly
  gameState.value = {
    ...gameState.value,
    board: newBoard,
    redPiecesPlaced: newRedCount,
    bluePiecesPlaced: newBlueCount,
    currentPlayer: nextPlayer
  }

  // Remove piece from available pieces
  const oldLength = availablePieces.value.length
  availablePieces.value = availablePieces.value.filter(p => p.id !== piece.id)
  console.log('Removed piece from palette. Old length:', oldLength, 'New length:', availablePieces.value.length)
  selectedPieceForPlacement.value = null

  console.log('Piece placed successfully!')
  console.log('New piece counts - Red:', newRedCount, 'Blue:', newBlueCount)
  console.log('Next player:', nextPlayer)
  console.log('Current player finished setup:', currentPlayerFinished)
  console.log('=== END PLACE PIECE DEBUG ===')
}

const isValidSetupPosition = (position: Position, player: string): boolean => {
  const playerZone = gameConfig.value.board.playerZones.find(zone => zone.player === player)
  if (!playerZone) return false

  return position.y >= playerZone.startY && position.y <= playerZone.endY
}

const calculateValidMoves = (piece: Piece, from: Position): Position[] => {
  console.log('=== CALCULATE VALID MOVES DEBUG ===')
  console.log('Piece:', piece.name, 'Movement:', piece.movement, 'From:', from)
  
  const moves: Position[] = []

  if (piece.movement === 0) {
    console.log('Piece cannot move (movement = 0)')
    return moves // Immovable pieces
  }

  // Helper function to check if position is an obstacle
  const isObstacle = (position: Position): boolean => {
    return gameConfig.value.board.obstacles.some(obstacle => {
      const width = obstacle.width || 1
      const height = obstacle.height || 1
      
      return position.x >= obstacle.x && 
             position.x < obstacle.x + width &&
             position.y >= obstacle.y && 
             position.y < obstacle.y + height
    })
  }

  // Adjacent moves for movement: 1
  if (piece.movement === 1) {
    const directions = [
      { dx: 0, dy: -1 }, // up
      { dx: 1, dy: 0 },  // right
      { dx: 0, dy: 1 },  // down
      { dx: -1, dy: 0 }  // left
    ]

    for (const dir of directions) {
      const newX = from.x + dir.dx
      const newY = from.y + dir.dy
      const newPos = { x: newX, y: newY }

      if (newX >= 0 && newX < gameConfig.value.board.width &&
          newY >= 0 && newY < gameConfig.value.board.height) {
        
        // Check if position is an obstacle
        if (isObstacle(newPos)) {
          continue // Skip obstacle positions
        }
        
        const targetPiece = gameState.value.board[newY]?.[newX]

        // Can move to empty cell or attack enemy piece
        if (!targetPiece || targetPiece.player !== piece.player) {
          moves.push(newPos)
        }
      }
    }
  }

  // Unlimited movement in straight lines
  if (piece.movement === 'unlimited') {
    console.log('Processing unlimited movement for Scout')
    const directions = [
      { dx: 0, dy: -1 }, // up
      { dx: 1, dy: 0 },  // right
      { dx: 0, dy: 1 },  // down
      { dx: -1, dy: 0 }  // left
    ]

    for (const dir of directions) {
      console.log('Checking direction:', dir)
      for (let distance = 1; distance < Math.max(gameConfig.value.board.width, gameConfig.value.board.height); distance++) {
        const newX = from.x + dir.dx * distance
        const newY = from.y + dir.dy * distance
        const newPos = { x: newX, y: newY }

        if (newX < 0 || newX >= gameConfig.value.board.width ||
            newY < 0 || newY >= gameConfig.value.board.height) {
          console.log('Out of bounds at distance', distance, 'position:', newPos)
          break // Out of bounds
        }
        
        // Check if position is an obstacle
        if (isObstacle(newPos)) {
          console.log('Blocked by obstacle at distance', distance, 'position:', newPos)
          break // Blocked by obstacle
        }

        const targetPiece = gameState.value.board[newY]?.[newX]

        if (!targetPiece) {
          console.log('Valid move found at distance', distance, 'position:', newPos)
          moves.push(newPos)
        } else if (targetPiece.player !== piece.player) {
          console.log('Attack move found at distance', distance, 'position:', newPos)
          moves.push(newPos)
          break // Can attack but can't move further
        } else {
          console.log('Blocked by friendly piece at distance', distance, 'position:', newPos)
          break // Blocked by friendly piece
        }
      }
    }
  }

  console.log('Total valid moves found:', moves.length, moves)
  console.log('=== END CALCULATE VALID MOVES DEBUG ===')
  return moves
}

const selectPieceTypeForPlacement = (pieceType: any) => {
  console.log('Selected piece type for placement:', pieceType.name)
  
  if (pieceType.remaining <= 0) {
    console.warn('No pieces of this type remaining')
    return
  }
  
  // Find the first available piece of this type
  const availablePiece = availablePieces.value.find(piece => piece.name === pieceType.name)
  
  if (availablePiece) {
    selectedPieceForPlacement.value = availablePiece
    console.log('Selected piece:', availablePiece)
  } else {
    console.warn('No available piece found for type:', pieceType.name)
  }
}

const selectPieceForPlacement = (piece: Piece) => {
  selectedPieceForPlacement.value = piece
  console.log('Selected piece for placement:', piece.name, piece)
}

const selectPieceType = (pieceTypeGroup: { type: any, count: number, pieces: Piece[] }) => {
  // Select the first available piece of this type
  if (pieceTypeGroup.pieces.length > 0) {
    selectedPieceForPlacement.value = pieceTypeGroup.pieces[0]
    console.log('Selected piece type for placement:', pieceTypeGroup.type.name, 'remaining:', pieceTypeGroup.count)
  }
}

const startGame = () => {
  const event: GameEvent = {
    type: 'START_GAME'
  }

  sendEvent(event)
}

const resetGame = () => {
  const event: GameEvent = {
    type: 'RESET_GAME'
  }

  sendEvent(event)
  initializeAvailablePieces()
  selectedPieceForPlacement.value = null
}

const toggleDebugMode = () => {
  debugMode.value = !debugMode.value
}

const autoSetup = () => {
  console.log('=== AUTO SETUP DEBUG ===')
  console.log('Available pieces:', availablePieces.value.length)
  console.log('Game config:', gameConfig.value.board)

  // Auto-place all pieces for quick testing using proper state machine events
  const redZone = gameConfig.value.board.playerZones.find(zone => zone.player === 'red')
  const blueZone = gameConfig.value.board.playerZones.find(zone => zone.player === 'blue')

  console.log('Red zone:', redZone)
  console.log('Blue zone:', blueZone)

  if (!redZone || !blueZone) {
    console.error('Player zones not found!')
    return
  }

  // Create red pieces from current available pieces
  const redPieces = availablePieces.value.map(piece => ({
    ...piece,
    player: 'red' as const
  }))

  // Place red pieces using state machine events
  let pieceIndex = 0
  let redPlacedCount = 0

  for (let y = redZone.startY; y <= redZone.endY && pieceIndex < redPieces.length; y++) {
    for (let x = 0; x < gameConfig.value.board.width && pieceIndex < redPieces.length; x++) {
      const piece = redPieces[pieceIndex]
      const position = { x, y }

      console.log(`Placing red piece ${pieceIndex + 1}:`, piece.name, 'at', position)

      // Send PLACE_PIECE event to state machine
      const event: PlacePieceEvent = {
        type: 'PLACE_PIECE',
        piece,
        position
      }

      const success = sendEvent(event)
      if (success) {
        redPlacedCount++
      } else {
        console.error('Failed to place red piece:', piece.name, 'at', position)
      }
      
      pieceIndex++
    }
  }

  console.log('Placed red pieces:', redPlacedCount)

  // Create blue pieces (mirror of red pieces)
  const bluePieces = redPieces.map(piece => ({
    ...piece,
    id: piece.id.replace('red-', 'blue-'),
    player: 'blue' as const
  }))

  console.log('Blue pieces created:', bluePieces.length)

  // Place blue pieces using state machine events
  pieceIndex = 0
  let bluePlacedCount = 0

  for (let y = blueZone.startY; y <= blueZone.endY && pieceIndex < bluePieces.length; y++) {
    for (let x = 0; x < gameConfig.value.board.width && pieceIndex < bluePieces.length; x++) {
      const piece = bluePieces[pieceIndex]
      const position = { x, y }

      console.log(`Placing blue piece ${pieceIndex + 1}:`, piece.name, 'at', position)

      // Send PLACE_PIECE event to state machine
      const event: PlacePieceEvent = {
        type: 'PLACE_PIECE',
        piece,
        position
      }

      const success = sendEvent(event)
      if (success) {
        bluePlacedCount++
      } else {
        console.error('Failed to place blue piece:', piece.name, 'at', position)
      }
      
      pieceIndex++
    }
  }

  console.log('Placed blue pieces:', bluePlacedCount)

  // IMPORTANT: Clear available pieces since they're all placed on the board
  availablePieces.value = []
  selectedPieceForPlacement.value = null

  console.log('Final game state:', gameState.value)
  console.log('Available pieces after auto-setup:', availablePieces.value.length)
  console.log('=== END AUTO SETUP DEBUG ===')
}

const sendEvent = (event: GameEvent): boolean => {
  console.log('=== SEND EVENT DEBUG ===')
  console.log('Event:', event)
  console.log('State machine exists:', !!stateMachine.value)

  if (!stateMachine.value) {
    console.error('No state machine available!')
    return false
  }

  console.log('Current state before event:', stateMachine.value.getState())

  lastEvent.value = event
  const success = stateMachine.value.send(event)

  console.log('Event success:', success)

  if (success) {
    const newState = stateMachine.value.getState()
    gameState.value = newState
    console.log('Event processed successfully:', event.type)
    console.log('New state:', newState)
    
    // Sync state with other players via WebSocket
    if (multiplayerStore.connected) {
      multiplayerStore.syncGameState(newState)
      console.log('State synced to other players')
    }
  } else {
    console.warn('Event rejected:', event.type)
    console.log('Current state after rejection:', stateMachine.value.getState())
  }

  console.log('=== END SEND EVENT DEBUG ===')
  return success
}
</script>

<script lang="ts">
export default {
  name: 'GameView'
}
</script>

<style scoped>
.game-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
}

.game-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding: 1rem;
  background-color: #f8fafc;
  border-radius: 8px;
}

.game-title-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.game-title {
  font-size: 1.5rem;
  font-weight: bold;
  color: #1f2937;
  margin: 0;
}

.player-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.player-role {
  font-size: 0.9rem;
  font-weight: 600;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  display: inline-block;
}

.player-role.player-red {
  background-color: #fef2f2;
  color: #dc2626;
  border: 1px solid #fca5a5;
}

.player-role.player-blue {
  background-color: #eff6ff;
  color: #2563eb;
  border: 1px solid #93c5fd;
}

.room-info {
  font-size: 0.8rem;
  color: #6b7280;
  font-family: monospace;
}

.game-controls {
  display: flex;
  gap: 0.5rem;
}

.btn-primary {
  background-color: #3b82f6;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.btn-primary:hover:not(:disabled) {
  background-color: #2563eb;
}

.btn-primary:disabled {
  background-color: #9ca3af;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: #6b7280;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.btn-secondary:hover {
  background-color: #4b5563;
}

.btn-debug {
  background-color: #f59e0b;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.btn-debug:hover {
  background-color: #d97706;
}

.game-status-bar {
  display: flex;
  gap: 2rem;
  margin-bottom: 1rem;
  padding: 0.75rem 1rem;
  background-color: #f1f5f9;
  border-radius: 6px;
}

.status-item {
  font-size: 0.9rem;
}

.setup-instructions,
.playing-instructions {
  margin-bottom: 1rem;
  padding: 1rem;
  background-color: #dbeafe;
  border-radius: 8px;
  border-left: 4px solid #3b82f6;
}

.setup-instructions h3,
.playing-instructions h3 {
  margin: 0 0 0.5rem 0;
  color: #1e40af;
}

.setup-help,
.playing-help {
  margin-bottom: 1rem;
  padding: 0.75rem;
  background-color: #f0f9ff;
  border-radius: 6px;
  border-left: 3px solid #0ea5e9;
}

.setup-help p,
.playing-help p {
  margin: 0 0 0.5rem 0;
  font-weight: 600;
  color: #0c4a6e;
}

.setup-help ul,
.playing-help ul {
  margin: 0;
  padding-left: 1.25rem;
  color: #0c4a6e;
}

.setup-help li,
.playing-help li {
  margin-bottom: 0.25rem;
}

.game-info {
  display: flex;
  gap: 1rem;
  margin-top: 0.5rem;
  padding: 0.5rem;
  background-color: #e0f2fe;
  border-radius: 4px;
}

.turn-info,
.substate-info {
  font-size: 0.875rem;
  color: #0c4a6e;
}

.piece-counts {
  display: flex;
  gap: 2rem;
  margin-top: 0.5rem;
}

.player-pieces {
  flex: 1;
  padding: 1rem;
  border-radius: 8px;
  background-color: #f9fafb;
  border: 2px solid transparent;
  transition: all 0.3s ease;
}

.player-pieces.active-player {
  background-color: #fef3c7;
  border-color: #f59e0b;
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1);
}

.player-pieces h4 {
  margin: 0 0 0.5rem 0;
  font-size: 0.9rem;
}

.player-status {
  margin-top: 0.5rem;
  font-size: 0.8rem;
  font-weight: 500;
}

.status-complete {
  color: #059669;
}

.status-active {
  color: #d97706;
}

.status-waiting {
  color: #6b7280;
}

.start-game-section {
  margin-top: 1.5rem;
  padding: 1.5rem;
  background-color: #ecfdf5;
  border-radius: 8px;
  text-align: center;
  border: 2px solid #10b981;
}

.start-game-section h4 {
  margin: 0 0 1rem 0;
  color: #065f46;
}

.btn-large {
  padding: 0.75rem 2rem;
  font-size: 1.1rem;
  font-weight: 600;
}

.progress-bar {
  width: 200px;
  height: 8px;
  background-color: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  transition: width 0.3s ease;
  border-radius: 4px;
}

.progress-fill.red {
  background-color: #dc2626;
}

.progress-fill.blue {
  background-color: #2563eb;
}

.piece-palette {
  margin-top: 2rem;
  padding: 1rem;
  background-color: #f8fafc;
  border-radius: 8px;
}

.piece-palette h3 {
  margin: 0 0 1rem 0;
  color: #1f2937;
}

.palette-instruction {
  margin-bottom: 1rem;
  padding: 0.5rem;
  background-color: #e0f2fe;
  border-radius: 4px;
  font-size: 0.9rem;
  color: #0c4a6e;
}

.piece-categories {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.piece-category h4 {
  margin: 0 0 0.5rem 0;
  color: #374151;
  font-size: 1rem;
  border-bottom: 2px solid #e5e7eb;
  padding-bottom: 0.25rem;
}

.piece-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 0.5rem;
}

.piece-type-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.piece-type-item {
  background-color: #ffffff;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  padding: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
  position: relative;
}

.piece-type-item:hover {
  border-color: #3b82f6;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
}

.piece-type-item.selected {
  border-color: #3b82f6;
  background-color: #eff6ff;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.piece-type-item.unavailable {
  opacity: 0.5;
  cursor: not-allowed;
  background-color: #f9fafb;
}

.piece-type-item.unavailable:hover {
  border-color: #e5e7eb;
  box-shadow: none;
}

.piece-type-display {
  margin-bottom: 0.5rem;
}

.piece-type-visual {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 0.5rem;
}

.piece-symbol {
  font-size: 2rem;
  margin-bottom: 0.25rem;
}

.piece-rank {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  background-color: #f3f4f6;
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
}

.piece-type-info {
  text-align: center;
}

.piece-name {
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.25rem;
}

.piece-count {
  font-size: 0.875rem;
  color: #059669;
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.piece-rank-info {
  font-size: 0.75rem;
  color: #6b7280;
  margin-bottom: 0.125rem;
}

.piece-special {
  font-size: 0.75rem;
  color: #7c3aed;
  font-style: italic;
  margin-bottom: 0.25rem;
}

.piece-rank {
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 0.125rem;
}

.piece-name {
  font-size: 0.8rem;
  font-weight: 500;
  color: #374151;
}

.piece-count {
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.piece-count .remaining {
  color: #059669;
}

.piece-count .total {
  color: #6b7280;
}

.piece-type-item.unavailable .piece-count .remaining {
  color: #dc2626;
}

.piece-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.5rem;
  border: 2px solid #e5e7eb;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  background-color: white;
}

.piece-item:hover {
  border-color: #3b82f6;
  transform: translateY(-1px);
}

.piece-item.selected {
  border-color: #3b82f6;
  background-color: #dbeafe;
}

.piece-info {
  text-align: center;
  font-size: 0.75rem;
  margin-top: 0.25rem;
}

.movement-info {
  font-size: 0.65rem;
  color: #059669;
  font-weight: 500;
  margin-top: 0.125rem;
}

.waiting-message {
  margin-top: 2rem;
  padding: 2rem;
  background-color: #f9fafb;
  border-radius: 8px;
  text-align: center;
  border: 2px dashed #d1d5db;
}

.waiting-message h3 {
  margin: 0 0 0.5rem 0;
  color: #374151;
}

.waiting-message p {
  margin: 0 0 1rem 0;
  color: #6b7280;
}

.loading-spinner {
  font-size: 2rem;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.debug-panel {
  margin-top: 2rem;
  padding: 1rem;
  background-color: #1f2937;
  color: #f9fafb;
  border-radius: 8px;
}

.debug-panel h3 {
  margin: 0 0 1rem 0;
  color: #f59e0b;
}

.debug-section {
  margin-bottom: 1rem;
}

.debug-section h4 {
  margin: 0 0 0.5rem 0;
  color: #10b981;
}

.debug-section pre {
  background-color: #374151;
  padding: 0.5rem;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 0.75rem;
  max-height: 200px;
  overflow-y: auto;
}

.game-end-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  padding: 2rem;
  border-radius: 12px;
  text-align: center;
  max-width: 400px;
  margin: 1rem;
}

.modal-content h2 {
  margin: 0 0 1rem 0;
  color: #1f2937;
}

.winner-announcement {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 1rem;
}

.winner-red {
  color: #dc2626;
}

.winner-blue {
  color: #2563eb;
}

.game-end-reason {
  margin-bottom: 1.5rem;
  color: #6b7280;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .game-header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }

  .game-status-bar {
    flex-direction: column;
    gap: 0.5rem;
  }

  .piece-counts {
    flex-direction: column;
    gap: 0.5rem;
  }

  .piece-grid {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  }
}

/* Turn Confirmation Styles */
.turn-confirmation {
  background-color: #fef3c7;
  border: 2px solid #f59e0b;
  border-radius: 8px;
  padding: 1.5rem;
  margin: 1rem 0;
  text-align: center;
}

.confirmation-message h4 {
  margin: 0 0 0.5rem 0;
  color: #92400e;
  font-size: 1.2rem;
}

.confirmation-message p {
  margin: 0 0 1rem 0;
  color: #78350f;
  font-weight: 500;
}

.confirmation-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  align-items: center;
}

.confirm-turn-btn {
  background-color: #10b981;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.confirm-turn-btn:hover {
  background-color: #059669;
}

.cancel-turn-btn {
  background-color: #ef4444;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.cancel-turn-btn:hover:not(:disabled) {
  background-color: #dc2626;
}

.cancel-turn-btn:disabled {
  background-color: #9ca3af;
  cursor: not-allowed;
}
</style>
