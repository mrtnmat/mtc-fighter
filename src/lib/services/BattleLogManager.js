/**
 * Battle Log Manager
 * 
 * This service listens to battle events and generates appropriate log messages.
 */

import { writable } from 'svelte/store';
import { battleEvents, BATTLE_EVENTS } from '../core/EventSystem.js';
import { UI_CONSTANTS } from '../core/Constants.js';

// Create a store for the log messages
export const battleLog = writable([]);

// Store all unsubscribe functions
let unsubscribeFunctions = [];

/**
 * Initialize the battle log
 */
export function initializeBattleLog() {
  // Clean up existing subscriptions first to prevent duplicates
  cleanupEventListeners();

  // Reset log messages
  battleLog.set([]);

  // Set up fresh event listeners
  setupEventListeners();
}

/**
 * Remove all event listeners
 */
export function cleanupEventListeners() {
  // Call each unsubscribe function
  unsubscribeFunctions.forEach(unsubscribe => unsubscribe());

  // Reset the array
  unsubscribeFunctions = [];
}

/**
 * Setup all event listeners
 */
function setupEventListeners() {
  // Battle started
  const unsubBattleStart = battleEvents.on(BATTLE_EVENTS.BATTLE_STARTED, (event) => {
    addLogMessage(`Battle started between ${event.fighter1.name} and ${event.fighter2.name}!`);
    addLogMessage(`Select a move to attack.`);
  });
  unsubscribeFunctions.push(unsubBattleStart);

  // Turn started
  const unsubTurnStart = battleEvents.on(BATTLE_EVENTS.TURN_STARTED, (event) => {
    if (event.turn > 1) { // Don't show for the first turn
      addLogMessage(`Turn ${event.turn} begins!`);
    }
  });
  unsubscribeFunctions.push(unsubTurnStart);

  // Speed comparison
  const unsubSpeedComp = battleEvents.on(BATTLE_EVENTS.SPEED_COMPARISON, (event) => {
    addLogMessage(`${event.firstAttacker} moves first due to higher speed!`);
  });
  unsubscribeFunctions.push(unsubSpeedComp);

  // Move used
  const unsubMoveUsed = battleEvents.on(BATTLE_EVENTS.MOVE_USED, (event) => {
    addLogMessage(`${event.fighter.name} used ${event.move.name}!`);
  });
  unsubscribeFunctions.push(unsubMoveUsed);

  // Move missed
  const unsubMoveMissed = battleEvents.on(BATTLE_EVENTS.MOVE_MISSED, (event) => {
    addLogMessage(`${event.fighter.name}'s attack missed!`);
  });
  unsubscribeFunctions.push(unsubMoveMissed);

  // Damage applied
  const unsubDamageApplied = battleEvents.on(BATTLE_EVENTS.DAMAGE_APPLIED, (event) => {
    addLogMessage(`${event.fighter.name} took ${event.damageAmount} damage!`);
  });
  unsubscribeFunctions.push(unsubDamageApplied);

  // Recoil damage
  const unsubRecoilDamage = battleEvents.on(BATTLE_EVENTS.RECOIL_DAMAGE, (event) => {
    addLogMessage(`${event.fighter.name} took ${event.recoilDamage} recoil damage!`);
  });
  unsubscribeFunctions.push(unsubRecoilDamage);

  // Momentum bonus
  const unsubMomentumBonus = battleEvents.on(BATTLE_EVENTS.MOMENTUM_BONUS, (event) => {
    addLogMessage(`${event.fighter.name} gained ${event.bonusDamage} bonus damage from momentum!`);
  });
  unsubscribeFunctions.push(unsubMomentumBonus);

  // Fighter fainted
  const unsubFighterFainted = battleEvents.on(BATTLE_EVENTS.FIGHTER_FAINTED, (event) => {
    addLogMessage(`${event.fighter.name} fainted!`);
  });
  unsubscribeFunctions.push(unsubFighterFainted);

  // Battle ended
  const unsubBattleEnded = battleEvents.on(BATTLE_EVENTS.BATTLE_ENDED, (event) => {
    addLogMessage(`${event.winner.name} won the battle!`);
  });
  unsubscribeFunctions.push(unsubBattleEnded);

  // AI thinking
  const unsubAIThinking = battleEvents.on(BATTLE_EVENTS.AI_THINKING, (event) => {
    addLogMessage(`${event.fighter.name} is analyzing ${event.simulationCount} possible battle outcomes...`);
  });
  unsubscribeFunctions.push(unsubAIThinking);

  // AI move selected
  const unsubAIMoveSelected = battleEvents.on(BATTLE_EVENTS.AI_MOVE_SELECTED, (event) => {
    addLogMessage(`${event.fighter.name} selected ${event.move.name} (${Math.round(event.winRate * 100)}% win rate).`);
  });
  unsubscribeFunctions.push(unsubAIMoveSelected);
}

/**
 * Helper function to add a message to the log
 */
function addLogMessage(message) {
  battleLog.update(log => {
    // Add new message with timestamp
    const updatedLog = [...log, {
      message,
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false })
    }];
    
    // Limit log size to prevent performance issues
    if (updatedLog.length > UI_CONSTANTS.MAX_LOG_ENTRIES) {
      return updatedLog.slice(updatedLog.length - UI_CONSTANTS.MAX_LOG_ENTRIES);
    }
    
    return updatedLog;
  });
}

/**
 * Export function to manually add messages
 */
export function addCustomLogMessage(message) {
  addLogMessage(message);
}

/**
 * Reset the battle log
 */
export function resetBattleLog() {
  battleLog.set([]);
}