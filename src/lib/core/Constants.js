/**
 * Game Constants
 * 
 * Define constants used throughout the battle system
 */

// Monte Carlo simulation settings
export const MONTE_CARLO_SETTINGS = {
  // Number of simulations to run
  DEFAULT_SIMULATION_COUNT: 1000,
  
  // Maximum simulated turns per battle
  MAX_SIMULATED_TURNS: 50,
  
  // Exploration parameter for UCB1 formula
  EXPLORATION_PARAM: 1.41
};

// Fighter constants
export const FIGHTER_CONSTANTS = {
  // Default fighter stats
  DEFAULT_HP: 100,
  DEFAULT_SPEED: 10,
  
  // Default fighter names
  PLAYER_NAME: "Player",
  AI_NAME: "Monte"
};

// UI constants
export const UI_CONSTANTS = {
  // Colors
  PLAYER_COLOR: "blue",
  AI_COLOR: "red",
  
  // HP bar thresholds for color changes
  HP_HIGH: 70,   // Above this percentage is green
  HP_MEDIUM: 30, // Above this percentage is yellow, below is red
  
  // Animation delays in milliseconds
  MOVE_ANIMATION_DELAY: 500,
  DAMAGE_ANIMATION_DELAY: 300,
  AI_THINKING_MIN_TIME: 1000, // Minimum time the AI appears to "think"
  
  // Max log entries to show
  MAX_LOG_ENTRIES: 50
};

// Game difficulty levels
export const DIFFICULTY_LEVELS = {
  EASY: {
    name: "Easy",
    simulationCount: 200,
    description: "AI performs limited simulations."
  },
  MEDIUM: {
    name: "Medium",
    simulationCount: 1000,
    description: "AI performs a moderate number of simulations."
  },
  HARD: {
    name: "Hard",
    simulationCount: 3000,
    description: "AI performs extensive simulations."
  }
};

// Game states
export const GAME_STATES = {
  WAITING_FOR_PLAYER: 'WAITING_FOR_PLAYER',
  AI_THINKING: 'AI_THINKING',
  EXECUTING_TURN: 'EXECUTING_TURN',
  BATTLE_OVER: 'BATTLE_OVER'
};

// Fighter IDs for easier reference
export const FIGHTER_IDS = {
  PLAYER: 'fighter1',
  AI: 'fighter2'
};