import type { Piece, CombatResult, CombatRule } from '../types'
import { STRATEGO_COMBAT_RULES } from '../types'

/**
 * Configurable combat resolution logic
 * Implements requirements REQ-C001 through REQ-C009
 * Uses rule-based system instead of hardcoded ranks
 */
export class CombatResolver {
  private combatRules: CombatRule[]

  constructor(combatRules: CombatRule[] = STRATEGO_COMBAT_RULES) {
    this.combatRules = combatRules
  }

  /**
   * REQ-C001: Resolve combat based on rules and rank comparison
   * Only handles combat - game end detection is separate
   */
  resolveCombat(attacker: Piece, defender: Piece): CombatResult {
    // Apply special rules first
    const specialResult = this.applySpecialRules(attacker, defender)
    if (specialResult) {
      return specialResult
    }

    // REQ-C001, REQ-C002, REQ-C003: Standard rank-based combat
    return this.resolveStandardCombat(attacker, defender)
  }

  /**
   * Apply special combat rules based on piece names
   */
  private applySpecialRules(attacker: Piece, defender: Piece): CombatResult | null {
    const attackerRule = this.getCombatRule(attacker.name)
    
    if (!attackerRule) {
      return null // No special rules for this piece
    }

    // Check "defeatsAdditionally" rules (e.g., Spy defeats Marshal)
    if (attackerRule.defeatsAdditionally?.includes(defender.name)) {
      return {
        winner: attacker,
        loser: defender,
        bothDestroyed: false,
        reason: 'special_defeats'
      }
    }

    // Check "defeatsAllExcept" rules (e.g., Bomb defeats all except Miner)
    if (attackerRule.defeatsAllExcept) {
      if (!attackerRule.defeatsAllExcept.includes(defender.name)) {
        return {
          winner: attacker,
          loser: defender,
          bothDestroyed: false,
          reason: 'defeats_all_except'
        }
      }
    }

    // Check if defender has special rules against attacker
    const defenderRule = this.getCombatRule(defender.name)
    if (defenderRule?.defeatsAllExcept && !defenderRule.defeatsAllExcept.includes(attacker.name)) {
      return {
        winner: defender,
        loser: attacker,
        bothDestroyed: false,
        reason: 'defeats_all_except'
      }
    }

    return null // No special rules apply
  }

  /**
   * REQ-C001, REQ-C002, REQ-C003: Standard rank-based combat resolution
   */
  private resolveStandardCombat(attacker: Piece, defender: Piece): CombatResult {
    if (attacker.rank > defender.rank) {
      // REQ-C002: Higher rank wins
      return {
        winner: attacker,
        loser: defender,
        bothDestroyed: false,
        reason: 'rank_higher'
      }
    } else if (attacker.rank < defender.rank) {
      // REQ-C002: Higher rank wins (defender wins)
      return {
        winner: defender,
        loser: attacker,
        bothDestroyed: false,
        reason: 'rank_higher'
      }
    } else {
      // REQ-C003: Equal rank destroys both pieces
      return {
        winner: null,
        loser: null,
        bothDestroyed: true,
        reason: 'rank_equal'
      }
    }
  }

  /**
   * REQ-C009: Process combat result for captured pieces
   */
  processCombatResult(
    result: CombatResult, 
    capturedPieces: { red: Piece[]; blue: Piece[] }
  ): { red: Piece[]; blue: Piece[] } {
    const newCapturedPieces = {
      red: [...capturedPieces.red],
      blue: [...capturedPieces.blue]
    }

    if (result.bothDestroyed) {
      // Both pieces destroyed - no one captures anything
      return newCapturedPieces
    }

    if (result.loser) {
      // REQ-C009: Add captured piece to winner's collection
      if (result.winner?.player === 'red') {
        newCapturedPieces.red.push(result.loser)
      } else if (result.winner?.player === 'blue') {
        newCapturedPieces.blue.push(result.loser)
      }
    }

    return newCapturedPieces
  }

  /**
   * REQ-C008: Reveal pieces involved in combat
   */
  revealCombatPieces(attacker: Piece, defender: Piece): { attacker: Piece; defender: Piece } {
    return {
      attacker: { ...attacker, isRevealed: true },
      defender: { ...defender, isRevealed: true }
    }
  }

  /**
   * Check if a piece can attack based on combat rules
   */
  canAttack(piece: Piece): boolean {
    const rule = this.getCombatRule(piece.name)
    
    // If rule explicitly sets canAttack, use that
    if (rule && rule.canAttack !== undefined) {
      return rule.canAttack
    }
    
    // Default: pieces with movement > 0 can attack
    return piece.movement > 0
  }

  /**
   * Determine if combat should occur when a piece moves to an occupied cell
   */
  shouldInitiateCombat(movingPiece: Piece, targetPiece: Piece): boolean {
    // Combat occurs when:
    // 1. Moving piece can attack
    // 2. Target piece belongs to opponent
    return (
      this.canAttack(movingPiece) &&
      movingPiece.player !== targetPiece.player
    )
  }

  /**
   * Get combat rule for a specific piece name
   */
  private getCombatRule(pieceName: string): CombatRule | undefined {
    return this.combatRules.find(rule => rule.piece === pieceName)
  }

  /**
   * Get all combat rules (for testing/debugging)
   */
  getCombatRules(): CombatRule[] {
    return [...this.combatRules]
  }

  /**
   * Update combat rules (for configuration changes)
   */
  updateCombatRules(newRules: CombatRule[]): void {
    this.combatRules = newRules
  }
}
