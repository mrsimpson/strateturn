/**
 * Classic Stratego Game Configuration
 * This demonstrates how board layout, pieces, and rules can be configured
 */

export const strategoClassicConfig = {
  // Board Configuration
  board: {
    width: 10,
    height: 10,
    obstacles: [
      // Classic Stratego lakes
      { x: 2, y: 4, width: 2, height: 2, type: 'lake' },
      { x: 6, y: 4, width: 2, height: 2, type: 'lake' }
    ],
    playerZones: [
      { player: 'blue', startY: 0, endY: 3 },   // Blue setup zone (top 4 rows)
      { player: 'red', startY: 6, endY: 9 }     // Red setup zone (bottom 4 rows)
    ]
  },

  // Piece Configuration
  pieces: {
    // Piece types with counts and properties
    types: [
      { name: 'Marshal', rank: 10, movement: 1, count: 1 },
      { name: 'General', rank: 9, movement: 1, count: 1 },
      { name: 'Colonel', rank: 8, movement: 1, count: 2 },
      { name: 'Major', rank: 7, movement: 1, count: 3 },
      { name: 'Captain', rank: 6, movement: 1, count: 4 },
      { name: 'Lieutenant', rank: 5, movement: 1, count: 4 },
      { name: 'Sergeant', rank: 4, movement: 1, count: 4 },
      { name: 'Miner', rank: 3, movement: 1, count: 5 },
      { name: 'Scout', rank: 2, movement: 'unlimited', count: 8 },
      { name: 'Spy', rank: 1, movement: 1, count: 1 },
      { name: 'Bomb', rank: 11, movement: 0, count: 6 },
      { name: 'Flag', rank: 0, movement: 0, count: 1 }
    ],
    symbols: {
      // High-ranking pieces
      'Marshal': '👑',
      'General': '⭐',
      'Colonel': '🎖️',
      'Major': '🏅',
      'Captain': '👮',
      'Lieutenant': '🎯',
      'Sergeant': '🛡️',
      
      // Special pieces
      'Miner': '⛏️',
      'Scout': '🔍',
      'Spy': '🕵️',
      'Bomb': '💣',
      'Flag': '🏁'
    },
    hiddenSymbols: {
      red: '🔴',
      blue: '🔵'
    }
  },

  // Game Rules
  rules: {
    name: 'Classic Stratego',
    description: 'Traditional Stratego with standard pieces and rules',
    maxPlayers: 2,
    turnTimeLimit: 300, // 5 minutes per turn
    
    // Victory conditions
    victoryConditions: [
      { type: 'capture_flag', description: 'Capture the enemy flag' },
      { type: 'eliminate_movable', description: 'Eliminate all enemy movable pieces' }
    ],

    // Combat rules
    combat: {
      // Higher rank wins, equal ranks both die
      rankComparison: 'higher_wins',
      
      // Special combat rules
      specialRules: [
        {
          attacker: 'Spy',
          defender: 'Marshal',
          result: 'attacker_wins',
          description: 'Spy defeats Marshal'
        },
        {
          attacker: 'Miner',
          defender: 'Bomb',
          result: 'attacker_wins',
          description: 'Miner defuses Bomb'
        }
      ]
    },

    // Movement rules
    movement: {
      // Most pieces move 1 space
      default: 1,
      
      // Special movement rules
      special: [
        {
          piece: 'Scout',
          movement: 'unlimited',
          description: 'Scout can move any distance in straight lines'
        },
        {
          piece: 'Bomb',
          movement: 0,
          description: 'Bombs cannot move'
        },
        {
          piece: 'Flag',
          movement: 0,
          description: 'Flag cannot move'
        }
      ]
    }
  }
}

// Alternative configuration for a smaller board
export const strategoMiniConfig = {
  board: {
    width: 6,
    height: 6,
    obstacles: [
      { x: 2, y: 2, width: 2, height: 2, type: 'mountain' }
    ],
    playerZones: [
      { player: 'blue', startY: 0, endY: 1 },
      { player: 'red', startY: 4, endY: 5 }
    ]
  },

  pieces: {
    symbols: {
      'King': '👑',
      'Guard': '🛡️',
      'Scout': '🔍',
      'Flag': '🏁'
    },
    hiddenSymbols: {
      red: '🔴',
      blue: '🔵'
    }
  },

  rules: {
    name: 'Mini Stratego',
    description: 'Simplified Stratego for quick games',
    maxPlayers: 2,
    turnTimeLimit: 120,
    
    victoryConditions: [
      { type: 'capture_flag', description: 'Capture the enemy flag' }
    ],

    combat: {
      rankComparison: 'higher_wins',
      specialRules: []
    },

    movement: {
      default: 1,
      special: [
        {
          piece: 'Flag',
          movement: 0,
          description: 'Flag cannot move'
        }
      ]
    }
  }
}

// Chess-like configuration to show flexibility
export const chessLikeConfig = {
  board: {
    width: 8,
    height: 8,
    obstacles: [],
    playerZones: [
      { player: 'white', startY: 0, endY: 1 },
      { player: 'black', startY: 6, endY: 7 }
    ]
  },

  pieces: {
    symbols: {
      'King': '♔',
      'Queen': '♕',
      'Rook': '♖',
      'Bishop': '♗',
      'Knight': '♘',
      'Pawn': '♙'
    },
    hiddenSymbols: {
      white: '⚪',
      black: '⚫'
    }
  },

  rules: {
    name: 'Chess-like Strategy',
    description: 'Chess pieces with Stratego-like hidden information',
    maxPlayers: 2,
    turnTimeLimit: 600,
    
    victoryConditions: [
      { type: 'capture_king', description: 'Capture the enemy king' }
    ],

    combat: {
      rankComparison: 'higher_wins',
      specialRules: []
    },

    movement: {
      default: 1,
      special: [
        {
          piece: 'Queen',
          movement: 'unlimited',
          description: 'Queen moves any distance'
        },
        {
          piece: 'Rook',
          movement: 'unlimited',
          description: 'Rook moves any distance in straight lines'
        },
        {
          piece: 'Bishop',
          movement: 'unlimited',
          description: 'Bishop moves any distance diagonally'
        }
      ]
    }
  }
}
