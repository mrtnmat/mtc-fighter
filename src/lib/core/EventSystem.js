/**
 * Event System for Battle Engine
 * 
 * This module provides a centralized event emitter for the battle system
 */

// Simple event emitter implementation
class EventEmitter {
  constructor() {
    this.events = {};
  }
  
  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
    
    // Return unsubscribe function
    return () => {
      this.events[event] = this.events[event].filter(cb => cb !== callback);
    };
  }
  
  emit(event, data) {
    if (this.events[event]) {
      this.events[event].forEach(callback => callback(data));
    }
  }
}

// Create a single event emitter instance
const eventEmitter = new EventEmitter();

// Event types enumeration
export const BATTLE_EVENTS = {
  BATTLE_STARTED: 'battle:started',
  TURN_STARTED: 'turn:started',
  MOVE_USED: 'move:used',
  MOVE_MISSED: 'move:missed',
  DAMAGE_APPLIED: 'damage:applied',
  FIGHTER_FAINTED: 'fighter:fainted',
  BATTLE_ENDED: 'battle:ended',
  SPEED_COMPARISON: 'speed:comparison',
  RECOIL_DAMAGE: 'recoil:damage',
  MOMENTUM_BONUS: 'momentum:bonus',
  AI_THINKING: 'ai:thinking',
  AI_MOVE_SELECTED: 'ai:move:selected'
};

// Event emitter for components to subscribe to
export const battleEvents = {
  // Subscribe to an event, returns an unsubscribe function
  on: (event, callback) => {
    return eventEmitter.on(event, callback);
  },
  
  // Emit an event
  emit: (event, data) => {
    eventEmitter.emit(event, data);
  }
};

// Helper function to create standardized event objects
export function createEventData(type, data = {}) {
  return {
    type,
    timestamp: Date.now(),
    ...data
  };
}