/**
 * Core Battle Engine
 * 
 * A simplified battle engine for Monte Carlo simulation-based battles.
 */

import { battleEvents, BATTLE_EVENTS, createEventData } from './EventSystem.js';

/**
 * Creates an initial battle state with two fighters
 */
export function createBattleState(fighter1, fighter2) {
  const battleState = {
    fighter1: { ...fighter1 },
    fighter2: { ...fighter2 },
    turn: 1,
    battleOver: false,
    winner: null,
    history: []
  };
  
  // Emit battle started event
  battleEvents.emit(
    BATTLE_EVENTS.BATTLE_STARTED, 
    createEventData(BATTLE_EVENTS.BATTLE_STARTED, { 
      fighter1: battleState.fighter1,
      fighter2: battleState.fighter2
    })
  );
  
  return battleState;
}

/**
 * Execute a move from one fighter to another
 */
export function executeMove(state, attackerId, defenderId, moveKey) {
  // Create a deep copy of the state to avoid mutations
  const newState = JSON.parse(JSON.stringify(state));
  const attacker = newState[attackerId];
  const defender = newState[defenderId];

  // Get the move
  const move = attacker.moves[moveKey];
  
  // Emit move used event
  battleEvents.emit(
    BATTLE_EVENTS.MOVE_USED,
    createEventData(BATTLE_EVENTS.MOVE_USED, {
      fighter: attacker,
      target: defender,
      move,
      moveKey
    })
  );
  
  // Execute the move's custom code
  const result = move.execute({
    attacker,
    defender,
    move,
    battleState: newState
  });
  
  // Update the state with the result
  if (result) {
    // Update defender if the result includes defender
    if (result.defender) {
      newState[defenderId] = result.defender;
    }
    
    // Update attacker if the result includes attacker
    if (result.attacker) {
      newState[attackerId] = result.attacker;
    }
  }
  
  // Record move in history
  newState.history.push({
    turn: newState.turn,
    attacker: attackerId,
    defender: defenderId,
    move: moveKey,
    damage: result ? result.damage : 0
  });
  
  // Check if defender fainted
  let battleOver = newState.battleOver;
  let winner = newState.winner;
  
  if (newState[defenderId].hp <= 0) {
    // Emit fighter fainted event
    battleEvents.emit(
      BATTLE_EVENTS.FIGHTER_FAINTED,
      createEventData(BATTLE_EVENTS.FIGHTER_FAINTED, {
        fighter: newState[defenderId]
      })
    );
    
    battleOver = true;
    winner = attackerId;
    
    // Emit battle ended event
    battleEvents.emit(
      BATTLE_EVENTS.BATTLE_ENDED,
      createEventData(BATTLE_EVENTS.BATTLE_ENDED, {
        winner: newState[attackerId],
        loser: newState[defenderId]
      })
    );
  }
  
  return {
    ...newState,
    battleOver,
    winner
  };
}

/**
 * Execute a turn with moves from both fighters
 */
export function executeTurn(state, fighter1MoveKey, fighter2MoveKey) {
  let newState = JSON.parse(JSON.stringify(state));
  
  // Check if battle is already over
  if (newState.battleOver) {
    return newState;
  }
  
  // Emit turn started event
  battleEvents.emit(
    BATTLE_EVENTS.TURN_STARTED,
    createEventData(BATTLE_EVENTS.TURN_STARTED, {
      turn: newState.turn,
      fighter1: newState.fighter1,
      fighter2: newState.fighter2
    })
  );
  
  // Determine who goes first based on speed
  const fighter1Speed = newState.fighter1.speed;
  const fighter2Speed = newState.fighter2.speed;
  
  // If speeds are equal, randomize (50/50 chance)
  const fighter1First = fighter1Speed > fighter2Speed ||
    (fighter1Speed === fighter2Speed && Math.random() >= 0.5);
  
  // Order of execution
  const order = fighter1First
    ? [
        ['fighter1', 'fighter2', fighter1MoveKey], 
        ['fighter2', 'fighter1', fighter2MoveKey]
      ]
    : [
        ['fighter2', 'fighter1', fighter2MoveKey], 
        ['fighter1', 'fighter2', fighter1MoveKey]
      ];
  
  // Emit speed comparison event
  battleEvents.emit(
    BATTLE_EVENTS.SPEED_COMPARISON,
    createEventData(BATTLE_EVENTS.SPEED_COMPARISON, {
      fighter1: {
        name: newState.fighter1.name,
        speed: fighter1Speed
      },
      fighter2: {
        name: newState.fighter2.name,
        speed: fighter2Speed
      },
      firstAttacker: newState[order[0][0]].name
    })
  );
  
  // Execute first attack
  newState = executeMove(
    newState, 
    order[0][0], // attacker
    order[0][1], // defender
    order[0][2]  // move key
  );
  
  // Only execute second attack if battle isn't over
  if (!newState.battleOver) {
    newState = executeMove(
      newState,
      order[1][0], // attacker
      order[1][1], // defender
      order[1][2]  // move key
    );
  }
  
  // Increment turn counter if battle isn't over
  if (!newState.battleOver) {
    newState = {
      ...newState,
      turn: newState.turn + 1
    };
  }
  
  return newState;
}

/**
 * Get valid moves for a fighter (all moves are always valid in this simplified version)
 */
export function getValidMoves(fighter) {
  return Object.keys(fighter.moves);
}

/**
 * Simulates a battle state to completion with random moves
 * Used for Monte Carlo simulation
 */
export function simulateBattle(state, maxTurns = 100) {
  let simState = JSON.parse(JSON.stringify(state));
  let turnCount = 0;
  
  while (!simState.battleOver && turnCount < maxTurns) {
    // Get random moves for both fighters
    const fighter1Moves = getValidMoves(simState.fighter1);
    const fighter2Moves = getValidMoves(simState.fighter2);
    
    const fighter1Move = fighter1Moves[Math.floor(Math.random() * fighter1Moves.length)];
    const fighter2Move = fighter2Moves[Math.floor(Math.random() * fighter2Moves.length)];
    
    // Execute turn with random moves
    simState = executeTurn(simState, fighter1Move, fighter2Move);
    turnCount++;
  }
  
  // If we hit max turns but no winner, pick the one with more HP
  if (!simState.battleOver && turnCount >= maxTurns) {
    if (simState.fighter1.hp > simState.fighter2.hp) {
      simState.winner = 'fighter1';
    } else if (simState.fighter2.hp > simState.fighter1.hp) {
      simState.winner = 'fighter2';
    } else {
      // Tie, randomly choose winner
      simState.winner = Math.random() < 0.5 ? 'fighter1' : 'fighter2';
    }
    simState.battleOver = true;
  }
  
  return simState;
}

/**
 * Creates a fighter with given properties
 */
export function createFighter(name, stats, moves) {
  return {
    name,
    hp: stats.hp,
    maxHp: stats.hp,
    speed: stats.speed,
    moves
  };
}

/**
 * Clone a battle state for simulation
 */
export function cloneBattleState(state) {
  return JSON.parse(JSON.stringify(state));
}