<template>
  <div class="game-board">
    <!-- Board Grid -->
    <div 
      class="board-grid"
      :style="{ 
        gridTemplateColumns: `repeat(${boardConfig.width}, 1fr)`,
        gridTemplateRows: `repeat(${boardConfig.height}, 1fr)`
      }"
    >
      <BoardCell
        v-for="(cell, index) in boardCells"
        :key="`cell-${cell.x}-${cell.y}`"
        :position="cell"
        :piece="cell.piece"
        :is-selected="isSelected(cell)"
        :is-valid-move="isValidMove(cell)"
        :is-highlighted="isHighlighted(cell)"
        :board-config="boardConfig"
        @click="handleCellClick(cell)"
      />
    </div>

    <!-- Game Status -->
    <div class="game-status">
      <div class="current-player">
        Current Player: 
        <span :class="currentPlayerClass">{{ currentPlayer }}</span>
      </div>
      <div class="turn-counter">
        Turn: {{ turn }}
      </div>
      <div class="game-phase">
        Phase: {{ gamePhase }}
      </div>
    </div>

    <!-- Selected Piece Info -->
    <div v-if="selectedPiece" class="selected-piece-info">
      <h3>Selected Piece</h3>
      <div class="piece-details">
        <div>Name: {{ selectedPiece.name }}</div>
        <div>Rank: {{ selectedPiece.rank }}</div>
        <div>Player: {{ selectedPiece.player }}</div>
        <div>Movement: {{ selectedPiece.movement }}</div>
      </div>
      <button 
        class="deselect-btn"
        @click="deselectPiece"
      >
        Deselect
      </button>
    </div>

    <!-- Valid Moves Indicator -->
    <div v-if="validMoves.length > 0" class="valid-moves-info">
      <p>{{ validMoves.length }} valid moves available</p>
      <p class="hint">Click on a highlighted cell to move</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import BoardCell from './BoardCell.vue'
import type { GameState as StateMachineState } from '../../game/types/stateMachine'
import type { Piece, Position } from '../../game/types'

interface BoardConfig {
  width: number
  height: number
  obstacles: Array<{
    x: number
    y: number
    width?: number
    height?: number
    type: string
  }>
  playerZones: Array<{
    player: string
    startY: number
    endY: number
  }>
}

interface Props {
  gameState: StateMachineState
  boardConfig: BoardConfig
  onPieceSelect?: (piece: Piece, position: Position) => void
  onPieceMove?: (from: Position, to: Position, piece: Piece) => void
  onPieceDeselect?: () => void
}

const props = defineProps<Props>()
const emit = defineEmits<{
  pieceSelect: [piece: Piece, position: Position]
  pieceMove: [from: Position, to: Position, piece: Piece]
  pieceDeselect: []
}>()

// Reactive state
const selectedPiece = ref<Piece | null>(null)
const selectedPosition = ref<Position | null>(null)
const validMoves = ref<Position[]>([])

// Computed properties
const boardWidth = computed(() => props.boardConfig.width)
const boardHeight = computed(() => props.boardConfig.height)

const currentPlayer = computed(() => {
  if (props.gameState.phase === 'setup') {
    return props.gameState.currentPlayer
  } else if (props.gameState.phase === 'playing') {
    const subState = props.gameState.subState
    if (subState.type === 'waiting_for_player' || subState.type === 'piece_selected') {
      return subState.currentPlayer
    }
  }
  return 'unknown'
})

const currentPlayerClass = computed(() => ({
  'text-red-600': currentPlayer.value === 'red',
  'text-blue-600': currentPlayer.value === 'blue',
  'font-bold': true
}))

const turn = computed(() => {
  if (props.gameState.phase === 'playing') {
    return props.gameState.turn
  }
  return 0
})

const gamePhase = computed(() => {
  if (props.gameState.phase === 'playing') {
    return `${props.gameState.phase} (${props.gameState.subState.type})`
  }
  return props.gameState.phase
})

const boardCells = computed(() => {
  const cells: Array<Position & { piece: Piece | null }> = []
  
  for (let y = 0; y < boardHeight.value; y++) {
    for (let x = 0; x < boardWidth.value; x++) {
      const piece = props.gameState.board[y]?.[x] || null
      cells.push({ x, y, piece })
    }
  }
  
  return cells
})

// Methods
const handleCellClick = (cell: Position & { piece: Piece | null }) => {
  const { x, y, piece } = cell
  const position = { x, y }

  // Check if cell is obstacle
  if (isObstacle(position)) {
    return // Can't interact with obstacles
  }

  // If there's a selected piece and this is a valid move
  if (selectedPiece.value && selectedPosition.value && isValidMove(position)) {
    // Execute move
    emit('pieceMove', selectedPosition.value, position, selectedPiece.value)
    deselectPiece()
    return
  }

  // If clicking on a piece
  if (piece) {
    // If it's the same piece, deselect
    if (selectedPiece.value && 
        selectedPiece.value.id === piece.id && 
        selectedPosition.value?.x === x && 
        selectedPosition.value?.y === y) {
      deselectPiece()
      return
    }

    // Select new piece
    selectPiece(piece, position)
  } else {
    // Clicking on empty cell - deselect if no valid move
    if (!isValidMove(position)) {
      deselectPiece()
    }
  }
}

const selectPiece = (piece: Piece, position: Position) => {
  selectedPiece.value = piece
  selectedPosition.value = position
  
  // Calculate valid moves using board configuration
  validMoves.value = calculateValidMoves(piece, position)
  
  emit('pieceSelect', piece, position)
}

const deselectPiece = () => {
  selectedPiece.value = null
  selectedPosition.value = null
  validMoves.value = []
  
  emit('pieceDeselect')
}

const isSelected = (position: Position): boolean => {
  return !!(selectedPosition.value && 
           selectedPosition.value.x === position.x && 
           selectedPosition.value.y === position.y)
}

const isValidMove = (position: Position): boolean => {
  return validMoves.value.some(move => move.x === position.x && move.y === position.y)
}

const isHighlighted = (position: Position): boolean => {
  return isSelected(position) || isValidMove(position)
}

const isObstacle = (position: Position): boolean => {
  return props.boardConfig.obstacles.some(obstacle => {
    const width = obstacle.width || 1
    const height = obstacle.height || 1
    
    return position.x >= obstacle.x && 
           position.x < obstacle.x + width &&
           position.y >= obstacle.y && 
           position.y < obstacle.y + height
  })
}

const calculateValidMoves = (piece: Piece, from: Position): Position[] => {
  const moves: Position[] = []
  
  if (piece.movement === 0) {
    return moves // Immovable pieces
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
      
      if (newX >= 0 && newX < boardWidth.value && 
          newY >= 0 && newY < boardHeight.value &&
          !isObstacle(newPos)) {
        const targetPiece = props.gameState.board[newY]?.[newX]
        
        // Can move to empty cell or attack enemy piece
        if (!targetPiece || targetPiece.player !== piece.player) {
          moves.push(newPos)
        }
      }
    }
  }

  // Unlimited movement in straight lines
  if (piece.movement === 'unlimited') {
    const directions = [
      { dx: 0, dy: -1 }, // up
      { dx: 1, dy: 0 },  // right
      { dx: 0, dy: 1 },  // down
      { dx: -1, dy: 0 }  // left
    ]

    for (const dir of directions) {
      for (let distance = 1; distance < Math.max(boardWidth.value, boardHeight.value); distance++) {
        const newX = from.x + dir.dx * distance
        const newY = from.y + dir.dy * distance
        const newPos = { x: newX, y: newY }
        
        if (newX < 0 || newX >= boardWidth.value || 
            newY < 0 || newY >= boardHeight.value ||
            isObstacle(newPos)) {
          break // Out of bounds or blocked by obstacle
        }

        const targetPiece = props.gameState.board[newY]?.[newX]
        
        if (!targetPiece) {
          moves.push(newPos)
        } else if (targetPiece.player !== piece.player) {
          moves.push(newPos)
          break // Can attack but can't move further
        } else {
          break // Blocked by friendly piece
        }
      }
    }
  }

  return moves
}

// Watch for external state changes
watch(() => props.gameState, () => {
  // Clear selection if game state changes significantly
  if (props.gameState.phase !== 'playing') {
    deselectPiece()
  }
}, { deep: true })
</script>

<script lang="ts">
export default {
  name: 'GameBoard'
}
</script>

<style scoped>
.game-board {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 800px;
  margin: 0 auto;
  padding: 1rem;
}

.board-grid {
  display: grid;
  gap: 1px;
  background-color: #374151;
  border: 2px solid #374151;
  border-radius: 8px;
  padding: 4px;
  aspect-ratio: 1;
  max-width: 600px;
  margin: 0 auto;
}

.game-status {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background-color: #f3f4f6;
  border-radius: 8px;
  font-weight: 500;
}

.selected-piece-info {
  padding: 1rem;
  background-color: #dbeafe;
  border: 2px solid #3b82f6;
  border-radius: 8px;
}

.selected-piece-info h3 {
  margin: 0 0 0.5rem 0;
  color: #1e40af;
}

.piece-details {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.deselect-btn {
  background-color: #6b7280;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.deselect-btn:hover {
  background-color: #4b5563;
}

.valid-moves-info {
  padding: 0.75rem;
  background-color: #d1fae5;
  border: 1px solid #10b981;
  border-radius: 6px;
  text-align: center;
}

.valid-moves-info .hint {
  font-size: 0.875rem;
  color: #065f46;
  margin: 0.25rem 0 0 0;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .game-board {
    padding: 0.5rem;
  }
  
  .board-grid {
    max-width: 100%;
  }
  
  .game-status {
    flex-direction: column;
    gap: 0.5rem;
    text-align: center;
  }
  
  .piece-details {
    grid-template-columns: 1fr;
  }
}
</style>
