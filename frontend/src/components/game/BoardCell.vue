<template>
  <div 
    class="board-cell"
    :class="cellClasses"
    @click="handleClick"
  >
    <!-- Piece Display -->
    <GamePiece 
      v-if="piece" 
      :piece="piece"
      :piece-config="pieceConfig"
      :is-revealed="shouldRevealPiece"
      :is-selected="isSelected"
    />
    
    <!-- Valid Move Indicator -->
    <div 
      v-else-if="isValidMove" 
      class="move-indicator"
    >
      <div class="move-dot"></div>
    </div>

    <!-- Obstacle Display -->
    <div 
      v-else-if="obstacleInfo"
      class="obstacle"
      :class="`obstacle-${obstacleInfo.type}`"
    >
      {{ obstacleSymbol }}
    </div>

    <!-- Coordinate Display (for debugging) -->
    <div v-if="showCoordinates" class="coordinates">
      {{ position.x }},{{ position.y }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import GamePiece from './GamePiece.vue'
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

interface PieceConfig {
  symbols: Record<string, string>
  hiddenSymbols: Record<string, string>
}

interface Props {
  position: Position
  boardConfig: BoardConfig
  pieceConfig?: PieceConfig
  piece?: Piece | null
  isSelected?: boolean
  isValidMove?: boolean
  isHighlighted?: boolean
  showCoordinates?: boolean
  currentPlayer?: string  // Add current player to determine visibility
  gamePhase?: string      // Add game phase to determine visibility
}

const props = withDefaults(defineProps<Props>(), {
  piece: null,
  isSelected: false,
  isValidMove: false,
  isHighlighted: false,
  showCoordinates: false,
  currentPlayer: '',
  gamePhase: 'setup',
  pieceConfig: () => ({
    symbols: {},
    hiddenSymbols: { red: '🔴', blue: '🔵' }
  })
})

const emit = defineEmits<{
  click: [position: Position]
}>()

// Computed properties
const shouldRevealPiece = computed(() => {
  if (!props.piece) return false
  
  // Always reveal pieces that are already revealed
  if (props.piece.isRevealed) return true
  
  // During setup phase, reveal own pieces
  if (props.gamePhase === 'setup' && props.piece.player === props.currentPlayer) {
    return true
  }
  
  // During playing phase, only show revealed pieces
  return props.piece.isRevealed
})
const cellClasses = computed(() => ({
  'cell-selected': props.isSelected,
  'cell-valid-move': props.isValidMove,
  'cell-highlighted': props.isHighlighted,
  'cell-occupied': !!props.piece,
  'cell-empty': !props.piece && !obstacleInfo.value,
  'cell-clickable': props.isValidMove || !!props.piece,
  'cell-obstacle': !!obstacleInfo.value,
  // Player zones based on configuration
  ...playerZoneClasses.value
}))

const obstacleInfo = computed(() => {
  return props.boardConfig.obstacles.find(obstacle => {
    const width = obstacle.width || 1
    const height = obstacle.height || 1
    
    return props.position.x >= obstacle.x && 
           props.position.x < obstacle.x + width &&
           props.position.y >= obstacle.y && 
           props.position.y < obstacle.y + height
  })
})

const obstacleSymbol = computed(() => {
  if (!obstacleInfo.value) return ''
  
  const symbolMap: Record<string, string> = {
    lake: '🌊',
    mountain: '⛰️',
    forest: '🌲',
    wall: '🧱',
    pit: '🕳️',
    default: '⬛'
  }
  
  return symbolMap[obstacleInfo.value.type] || symbolMap.default
})

const playerZoneClasses = computed(() => {
  const classes: Record<string, boolean> = {}
  
  for (const zone of props.boardConfig.playerZones) {
    if (props.position.y >= zone.startY && props.position.y <= zone.endY) {
      classes[`cell-${zone.player}-zone`] = true
    }
  }
  
  return classes
})

// Methods
const handleClick = () => {
  console.log('BoardCell clicked:', props.position, 'obstacle:', !!obstacleInfo.value)
  
  // Don't allow clicks on obstacles
  if (obstacleInfo.value) {
    console.log('Click blocked: obstacle')
    return
  }
  
  // Allow all clicks on non-obstacle cells
  console.log('Emitting click event for position:', props.position)
  emit('click', props.position)
}
</script>

<script lang="ts">
export default {
  name: 'BoardCell'
}
</script>

<style scoped>
.board-cell {
  aspect-ratio: 1;
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: all 0.2s ease;
  cursor: default;
}

/* Cell States */
.cell-clickable {
  cursor: pointer;
}

.cell-clickable:hover {
  background-color: #f3f4f6;
  transform: scale(1.02);
}

.cell-selected {
  background-color: #dbeafe !important;
  border-color: #3b82f6 !important;
  border-width: 2px;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
}

.cell-valid-move {
  background-color: #d1fae5 !important;
  border-color: #10b981 !important;
  cursor: pointer;
}

.cell-valid-move:hover {
  background-color: #a7f3d0 !important;
  transform: scale(1.05);
}

.cell-highlighted {
  box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.5);
}

/* Obstacles */
.cell-obstacle {
  cursor: not-allowed;
}

.obstacle {
  font-size: 1.2rem;
  opacity: 0.8;
}

.obstacle-lake {
  background-color: #1e40af !important;
  background-image: 
    radial-gradient(circle at 25% 25%, rgba(255, 255, 255, 0.2) 2px, transparent 2px),
    radial-gradient(circle at 75% 75%, rgba(255, 255, 255, 0.1) 1px, transparent 1px);
}

.obstacle-mountain {
  background-color: #78716c !important;
  background-image: linear-gradient(45deg, rgba(255, 255, 255, 0.1) 25%, transparent 25%);
}

.obstacle-forest {
  background-color: #166534 !important;
  background-image: 
    radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.1) 1px, transparent 1px),
    radial-gradient(circle at 70% 70%, rgba(255, 255, 255, 0.1) 1px, transparent 1px);
}

.obstacle-wall {
  background-color: #525252 !important;
  background-image: 
    linear-gradient(90deg, rgba(255, 255, 255, 0.1) 50%, transparent 50%),
    linear-gradient(rgba(255, 255, 255, 0.1) 50%, transparent 50%);
  background-size: 4px 4px;
}

.cell-obstacle:hover {
  transform: none;
}

/* Player Zones - Dynamic based on configuration */
.cell-red-zone {
  background-color: #fef2f2;
  border-color: #fca5a5;
}

.cell-blue-zone {
  background-color: #eff6ff;
  border-color: #93c5fd;
}

.cell-green-zone {
  background-color: #f0fdf4;
  border-color: #86efac;
}

.cell-yellow-zone {
  background-color: #fefce8;
  border-color: #fde047;
}

/* Move Indicator */
.move-indicator {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.move-dot {
  width: 12px;
  height: 12px;
  background-color: #10b981;
  border-radius: 50%;
  opacity: 0.8;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 0.8;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.2);
  }
}

/* Coordinates Display */
.coordinates {
  position: absolute;
  top: 2px;
  left: 2px;
  font-size: 8px;
  color: #6b7280;
  line-height: 1;
  pointer-events: none;
}

/* Mobile Optimizations */
@media (max-width: 768px) {
  .board-cell {
    border-width: 0.5px;
  }
  
  .cell-selected {
    border-width: 1.5px;
  }
  
  .move-dot {
    width: 10px;
    height: 10px;
  }
  
  .obstacle {
    font-size: 1rem;
  }
  
  .coordinates {
    font-size: 6px;
  }
}

/* Touch-friendly hover states for mobile */
@media (hover: none) {
  .cell-clickable:hover {
    transform: none;
    background-color: #f9fafb;
  }
  
  .cell-valid-move:hover {
    background-color: #d1fae5 !important;
    transform: none;
  }
  
  /* Add active states for touch */
  .cell-clickable:active {
    transform: scale(0.98);
    background-color: #f3f4f6;
  }
  
  .cell-valid-move:active {
    background-color: #a7f3d0 !important;
    transform: scale(0.98);
  }
}
</style>
