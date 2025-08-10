<template>
  <div 
    class="game-piece"
    :class="pieceClasses"
  >
    <!-- Piece Icon/Symbol -->
    <div class="piece-symbol">
      {{ pieceSymbol }}
    </div>
    
    <!-- Piece Rank (when revealed) -->
    <div v-if="isRevealed" class="piece-rank">
      {{ piece.rank }}
    </div>
    
    <!-- Piece Name (when revealed or for debugging) -->
    <div v-if="isRevealed || showName" class="piece-name">
      {{ piece.name }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Piece } from '../../game/types'

interface PieceConfig {
  symbols: Record<string, string>
  hiddenSymbols: Record<string, string>
}

interface Props {
  piece: Piece
  pieceConfig?: PieceConfig
  isRevealed?: boolean
  isSelected?: boolean
  showName?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isRevealed: false,
  isSelected: false,
  showName: false,
  pieceConfig: () => ({
    symbols: {},
    hiddenSymbols: { red: '🔴', blue: '🔵' }
  })
})

// Computed properties
const pieceClasses = computed(() => ({
  [`piece-${props.piece.player}`]: true,
  'piece-revealed': props.isRevealed,
  'piece-hidden': !props.isRevealed,
  'piece-selected': props.isSelected,
  'piece-immovable': props.piece.movement === 0,
  'piece-scout': props.piece.movement === 'unlimited'
}))

const pieceSymbol = computed(() => {
  if (!props.isRevealed && !props.showName) {
    // Show player-specific hidden symbol
    return props.pieceConfig.hiddenSymbols[props.piece.player] || '❓'
  }

  // Use configured symbol or fallback to default mapping
  const configuredSymbol = props.pieceConfig.symbols[props.piece.name]
  if (configuredSymbol) {
    return configuredSymbol
  }

  // Fallback to default symbol mapping
  const defaultSymbolMap: Record<string, string> = {
    // High ranks
    'Marshal': '👑',
    'General': '⭐',
    'Colonel': '🎖️',
    'Major': '🏅',
    'Captain': '👮',
    'Lieutenant': '🎯',
    'Sergeant': '🛡️',
    'Miner': '⛏️',
    'Scout': '🔍',
    'Spy': '🕵️',
    
    // Special pieces
    'Bomb': '💣',
    'Flag': '🏁',
    
    // German names (if using German pieces)
    'Marschall': '👑',
    'Feldmarschall': '👑',
    'Oberst': '🎖️',
    'Hauptmann': '👮',
    'Leutnant': '🎯',
    'Feldwebel': '🛡️',
    'Aufklärer': '🔍',
    'Mineur': '⛏️',
    'Spion': '🕵️',
    'Bombe': '💣',
    'Fahne': '🏁',
    
    // Generic fallbacks
    'King': '👑',
    'Queen': '👸',
    'Rook': '🏰',
    'Bishop': '⛪',
    'Knight': '🐎',
    'Pawn': '♟️'
  }

  return defaultSymbolMap[props.piece.name] || '❓'
})
</script>

<script lang="ts">
export default {
  name: 'GamePiece'
}
</script>

<style scoped>
.game-piece {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s ease;
  position: relative;
  font-weight: 600;
  text-align: center;
  cursor: pointer;
}

/* Player Colors */
.piece-red {
  background: linear-gradient(135deg, #dc2626, #b91c1c);
  color: white;
  border: 2px solid #991b1b;
}

.piece-blue {
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  color: white;
  border: 2px solid #1e40af;
}

.piece-green {
  background: linear-gradient(135deg, #16a34a, #15803d);
  color: white;
  border: 2px solid #166534;
}

.piece-yellow {
  background: linear-gradient(135deg, #eab308, #ca8a04);
  color: white;
  border: 2px solid #a16207;
}

/* Piece States */
.piece-hidden {
  background: linear-gradient(135deg, #6b7280, #4b5563) !important;
  color: white;
  border-color: #374151 !important;
}

.piece-revealed {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.piece-selected {
  transform: scale(1.05);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5);
  z-index: 10;
}

/* Special Piece Types */
.piece-immovable {
  border-style: dashed;
  opacity: 0.9;
}

.piece-scout {
  border-width: 3px;
  animation: scout-glow 3s ease-in-out infinite;
}

@keyframes scout-glow {
  0%, 100% { box-shadow: 0 0 5px rgba(16, 185, 129, 0.3); }
  50% { box-shadow: 0 0 15px rgba(16, 185, 129, 0.6); }
}

/* Piece Content */
.piece-symbol {
  font-size: 1.2rem;
  line-height: 1;
  margin-bottom: 2px;
}

.piece-rank {
  font-size: 0.7rem;
  font-weight: 700;
  opacity: 0.9;
  position: absolute;
  top: 2px;
  right: 2px;
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 2px;
  padding: 1px 3px;
  min-width: 12px;
}

.piece-name {
  font-size: 0.6rem;
  font-weight: 500;
  opacity: 0.8;
  position: absolute;
  bottom: 1px;
  left: 50%;
  transform: translateX(-50%);
  white-space: nowrap;
  max-width: 90%;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Hover Effects */
.game-piece:hover {
  transform: scale(1.02);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.piece-selected:hover {
  transform: scale(1.08);
}

/* Mobile Optimizations */
@media (max-width: 768px) {
  .piece-symbol {
    font-size: 1rem;
  }
  
  .piece-rank {
    font-size: 0.6rem;
    top: 1px;
    right: 1px;
    padding: 0px 2px;
  }
  
  .piece-name {
    font-size: 0.5rem;
    bottom: 0px;
  }
  
  .game-piece:hover {
    transform: scale(1.01);
  }
  
  .piece-selected:hover {
    transform: scale(1.06);
  }
}

/* Touch-friendly interactions */
@media (hover: none) {
  .game-piece:hover {
    transform: none;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  .piece-selected:hover {
    transform: scale(1.05);
  }
  
  .game-piece:active {
    transform: scale(0.98);
  }
  
  .piece-selected:active {
    transform: scale(1.02);
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .piece-red {
    background: #dc2626;
    border-color: #000;
    border-width: 3px;
  }
  
  .piece-blue {
    background: #2563eb;
    border-color: #000;
    border-width: 3px;
  }
  
  .piece-green {
    background: #16a34a;
    border-color: #000;
    border-width: 3px;
  }
  
  .piece-yellow {
    background: #eab308;
    border-color: #000;
    border-width: 3px;
  }
  
  .piece-hidden {
    background: #4b5563 !important;
    border-color: #000 !important;
    border-width: 3px !important;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .game-piece,
  .piece-selected {
    transition: none;
  }
  
  .scout-glow {
    animation: none;
  }
  
  .game-piece:hover,
  .piece-selected:hover {
    transform: none;
  }
}
</style>
