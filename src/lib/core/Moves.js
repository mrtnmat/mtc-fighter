/**
 * Move system for Monte Carlo battles
 * 
 * This module contains custom moves with interesting probability distributions
 * that are designed to be difficult for humans to reason about.
 */

import { battleEvents, BATTLE_EVENTS, createEventData } from './EventSystem.js';

/**
 * Apply damage to a fighter
 */
function applyDamage(fighter, amount) {
  const newFighter = { ...fighter };
  const actualDamage = Math.round(amount); // Ensure damage is an integer
  newFighter.hp = Math.max(0, newFighter.hp - actualDamage);
  
  // Emit damage applied event
  battleEvents.emit(
    BATTLE_EVENTS.DAMAGE_APPLIED,
    createEventData(BATTLE_EVENTS.DAMAGE_APPLIED, {
      fighter: newFighter,
      damageAmount: actualDamage,
      remainingHp: newFighter.hp,
      maxHp: newFighter.maxHp
    })
  );
  
  return {
    fighter: newFighter,
    damage: actualDamage
  };
}

/**
 * Function to create a move
 */
function createMove({
  name,
  description,
  execute
}) {
  return {
    name,
    description,
    execute
  };
}

/**
 * Move Functions
 */

// Precise Strike - Consistent medium damage
function preciseStrike(params) {
  const { attacker, defender } = params;
  
  // Consistent damage - 15 points
  const baseDamage = 15;
  
  // Apply damage to defender
  const { fighter: newDefender, damage } = applyDamage(defender, baseDamage);
  
  // Return updated state
  return {
    hit: true,
    defender: newDefender,
    damage
  };
}

// Wild Swing - Highly variable damage (can be very low or very high)
function wildSwing(params) {
  const { attacker, defender } = params;
  
  // Random damage between 5 and 30
  // Uses a flatter distribution to make it less predictable
  const baseDamage = 5 + Math.floor(Math.random() * 26);
  
  // Apply damage to defender
  const { fighter: newDefender, damage } = applyDamage(defender, baseDamage);
  
  // Return updated state
  return {
    hit: true,
    defender: newDefender,
    damage
  };
}

// Calculated Risk - Damage increases when user's HP is lower
function calculatedRisk(params) {
  const { attacker, defender } = params;
  
  // Base damage of 10
  let baseDamage = 10;
  
  // Calculate HP percentage
  const hpPercentage = attacker.hp / attacker.maxHp;
  
  // Increase damage as HP decreases
  // At full HP: +0, at 1 HP: +15
  const hpBonus = Math.round((1 - hpPercentage) * 15);
  baseDamage += hpBonus;
  
  // Apply damage to defender
  const { fighter: newDefender, damage } = applyDamage(defender, baseDamage);
  
  // Return updated state
  return {
    hit: true,
    defender: newDefender,
    damage
  };
}

// Double Edge - High damage but hurts user too
function doubleEdge(params) {
  const { attacker, defender } = params;
  
  // High base damage - 25 points
  const baseDamage = 25;
  
  // Recoil damage - 8 points
  const recoilDamage = 8;
  
  // Apply damage to defender
  const { fighter: newDefender, damage } = applyDamage(defender, baseDamage);
  
  // Apply recoil damage to attacker
  const { fighter: newAttacker } = applyDamage(attacker, recoilDamage);
  
  // Emit recoil event
  battleEvents.emit(
    BATTLE_EVENTS.RECOIL_DAMAGE,
    createEventData(BATTLE_EVENTS.RECOIL_DAMAGE, {
      fighter: newAttacker,
      recoilDamage,
      move: params.move.name
    })
  );
  
  // Return updated state
  return {
    hit: true,
    attacker: newAttacker,
    defender: newDefender,
    damage
  };
}

// Momentum Swing - Damage based on last move used
function momentumSwing(params) {
  const { attacker, defender, battleState } = params;
  
  // Base damage - 12 points
  let baseDamage = 12;
  
  // Check battle history for last move
  const history = battleState.history;
  if (history.length > 0) {
    // Get the last entry in history
    const lastMove = history[history.length - 1];
    
    // If last move was from this attacker and did damage
    const lastAttackerId = `fighter${attacker.id}`;
    if (lastMove.attacker === lastAttackerId && lastMove.damage > 0) {
      // Bonus damage is 50% of last damage
      const bonusDamage = Math.round(lastMove.damage * 0.5);
      baseDamage += bonusDamage;
      
      // Emit event about momentum bonus
      battleEvents.emit(
        BATTLE_EVENTS.MOMENTUM_BONUS,
        createEventData(BATTLE_EVENTS.MOMENTUM_BONUS, {
          fighter: attacker,
          bonusDamage
        })
      );
    }
  }
  
  // Apply damage to defender
  const { fighter: newDefender, damage } = applyDamage(defender, baseDamage);
  
  // Return updated state
  return {
    hit: true,
    defender: newDefender,
    damage
  };
}

// All-or-Nothing - Either hits very hard or misses completely
function allOrNothing(params) {
  const { attacker, defender } = params;
  
  // 60% chance to hit
  const hitChance = 0.6;
  const hit = Math.random() < hitChance;
  
  if (hit) {
    // Very high damage - 30 points
    const baseDamage = 30;
    
    // Apply damage to defender
    const { fighter: newDefender, damage } = applyDamage(defender, baseDamage);
    
    // Return updated state
    return {
      hit: true,
      defender: newDefender,
      damage
    };
  } else {
    // Move missed
    battleEvents.emit(
      BATTLE_EVENTS.MOVE_MISSED,
      createEventData(BATTLE_EVENTS.MOVE_MISSED, {
        fighter: attacker,
        move: params.move
      })
    );
    
    return {
      hit: false,
      defender,
      damage: 0
    };
  }
}

// Reversal - Does more damage when user has less HP
function reversal(params) {
  const { attacker, defender } = params;
  
  // Base damage scales inversely with HP percentage
  // At full HP: 10 damage, at 1 HP: 30 damage
  const hpPercentage = attacker.hp / attacker.maxHp;
  const baseDamage = 10 + Math.round((1 - hpPercentage) * 20);
  
  // Apply damage to defender
  const { fighter: newDefender, damage } = applyDamage(defender, baseDamage);
  
  // Return updated state
  return {
    hit: true,
    defender: newDefender,
    damage
  };
}

// Adaptive Strike - Damage based on opponent's remaining HP
function adaptiveStrike(params) {
  const { attacker, defender } = params;
  
  // Base damage scales with opponent's HP percentage
  // At full HP: 20 damage, at 1 HP: 10 damage
  const hpPercentage = defender.hp / defender.maxHp;
  const baseDamage = 10 + Math.round(hpPercentage * 10);
  
  // Apply damage to defender
  const { fighter: newDefender, damage } = applyDamage(defender, baseDamage);
  
  // Return updated state
  return {
    hit: true,
    defender: newDefender,
    damage
  };
}

/**
 * Move list with all available moves
 */
export const moveList = {
  'PreciseStrike': createMove({
    name: 'Precise Strike',
    description: 'A consistent attack that always deals the same damage.',
    execute: preciseStrike
  }),
  
  'WildSwing': createMove({
    name: 'Wild Swing',
    description: 'A highly unpredictable attack that deals random damage.',
    execute: wildSwing
  }),
  
  'CalculatedRisk': createMove({
    name: 'Calculated Risk',
    description: 'Deals more damage when user has lower HP.',
    execute: calculatedRisk
  }),
  
  'DoubleEdge': createMove({
    name: 'Double Edge',
    description: 'A powerful attack that also damages the user.',
    execute: doubleEdge
  }),
  
  'MomentumSwing': createMove({
    name: 'Momentum Swing',
    description: 'Deals more damage if the user\'s previous attack was successful.',
    execute: momentumSwing
  }),
  
  'AllOrNothing': createMove({
    name: 'All or Nothing',
    description: 'Either deals massive damage or completely misses.',
    execute: allOrNothing
  }),
  
  'Reversal': createMove({
    name: 'Reversal',
    description: 'Deals significantly more damage when the user has low HP.',
    execute: reversal
  }),
  
  'AdaptiveStrike': createMove({
    name: 'Adaptive Strike',
    description: 'Deals more damage when the opponent has high HP, less when they have low HP.',
    execute: adaptiveStrike
  })
};

/**
 * Create a move instance from the move list
 */
export function createMoveInstance(moveKey) {
  const move = moveList[moveKey];
  if (!move) {
    throw new Error(`Unknown move: ${moveKey}`);
  }
  return { ...move };
}

/**
 * Get a subset of moves for a fighter
 */
export function getMovesSubset(moveKeys) {
  const moves = {};
  moveKeys.forEach((key, index) => {
    moves[`move${index + 1}`] = createMoveInstance(key);
  });
  return moves;
}