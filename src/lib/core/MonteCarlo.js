/**
 * Monte Carlo Tree Search for battle AI
 * 
 * Implements a simplified version of Monte Carlo Tree Search (MCTS)
 * to determine the best move for an AI opponent.
 */

import { executeTurn, getValidMoves, simulateBattle, cloneBattleState } from './BattleEngine.js';

/**
 * Represents a node in the Monte Carlo search tree
 */
class MCTSNode {
  constructor(state, parentNode = null, moveThatLedHere = null) {
    this.state = state;
    this.parentNode = parentNode;
    this.moveThatLedHere = moveThatLedHere;
    this.childNodes = [];
    this.wins = 0;
    this.visits = 0;
    this.untriedMoves = getValidMoves(state.fighter2); // Moves the AI can play
  }

  /**
   * Calculate UCB1 value for node selection
   * Uses exploration parameter to balance exploitation vs exploration
   */
  getUCB1(explorationParam = 1.41) {
    // If node never visited, give it highest priority
    if (this.visits === 0) {
      return Infinity;
    }

    // Exploitation term: win rate
    const exploitation = this.wins / this.visits;

    // Exploration term: decreases as visits increase
    const exploration = explorationParam * Math.sqrt(Math.log(this.parentNode.visits) / this.visits);

    return exploitation + exploration;
  }

  /**
   * Check if all possible moves have been tried from this node
   */
  isFullyExpanded() {
    return this.untriedMoves.length === 0;
  }

  /**
   * Check if this is a terminal node (battle is over)
   */
  isTerminal() {
    return this.state.battleOver;
  }

  /**
   * Create a child node by applying a move
   */
  expand(playerMove, aiMove) {
    // Create a copy of the state
    const nextState = executeTurn(
      cloneBattleState(this.state),
      playerMove,
      aiMove
    );

    // Create child node
    const childNode = new MCTSNode(nextState, this, aiMove);

    // Remove the move from untried moves (create a new array to avoid reactivity issues)
    this.untriedMoves = this.untriedMoves.filter(move => move !== aiMove);

    // Add to child nodes
    this.childNodes.push(childNode);

    return childNode;
  }

  /**
   * Select the best child based on UCB1 value
   */
  selectBestChild() {
    if (this.childNodes.length === 0) {
      return null;
    }

    return this.childNodes.reduce((best, child) => {
      return child.getUCB1() > best.getUCB1() ? child : best;
    }, this.childNodes[0]);
  }

  /**
   * Backpropagate results through the tree
   */
  backpropagate(result) {
    this.visits++;

    // Add win if fighter2 (AI) won
    if (result === 'fighter2') {
      this.wins++;
    }

    // Propagate to parent if exists
    if (this.parentNode) {
      this.parentNode.backpropagate(result);
    }
  }
}

/**
 * Main MCTS algorithm
 */
export class MonteCarloTreeSearch {
  constructor(initialState, simulationCount = 500) {
    this.rootNode = new MCTSNode(initialState);
    this.simulationCount = simulationCount;
  }

  /**
   * Run the Monte Carlo Tree Search algorithm
   */
  run(playerMove) {
    // Run simulations
    for (let i = 0; i < this.simulationCount; i++) {
      // Selection and expansion
      const selectedNode = this.select(playerMove);

      // Simulation
      const result = this.simulate(selectedNode);

      // Backpropagation
      selectedNode.backpropagate(result);
    }

    // Return the best move
    return this.getBestMove();
  }

  /**
   * Selection phase: select a promising node to expand
   */
  select(playerMove) {
    let currentNode = this.rootNode;

    // For the root, we need to consider the player's move
    if (currentNode.childNodes.length === 0) {
      // Try each possible AI move given the player move
      for (const aiMove of currentNode.untriedMoves) {
        currentNode.expand(playerMove, aiMove);
      }

      // Return a random child for the first simulation
      return currentNode.childNodes[Math.floor(Math.random() * currentNode.childNodes.length)];
    }

    // For non-root nodes, follow standard UCB1 selection
    while (!currentNode.isTerminal() && currentNode.isFullyExpanded()) {
      const bestChild = currentNode.selectBestChild();
      if (!bestChild) break;
      currentNode = bestChild;
    }

    // If node is terminal, return it
    if (currentNode.isTerminal()) {
      return currentNode;
    }

    // If node is not fully expanded, expand it
    if (!currentNode.isFullyExpanded()) {
      // Choose a random untried move
      const aiMove = currentNode.untriedMoves[
        Math.floor(Math.random() * currentNode.untriedMoves.length)
      ];

      // Player's move is randomized in simulation
      const randomPlayerMoves = getValidMoves(currentNode.state.fighter1);
      const randomPlayerMove = randomPlayerMoves[
        Math.floor(Math.random() * randomPlayerMoves.length)
      ];

      return currentNode.expand(randomPlayerMove, aiMove);
    }

    return currentNode;
  }

  /**
   * Simulation phase: simulate a random game from the current node
   */
  simulate(node) {
    // Clone the current state to avoid modifying the tree
    const state = cloneBattleState(node.state);

    // Simulate the battle to completion
    const result = simulateBattle(state);

    // Return the winner
    return result.winner;
  }

  /**
   * Get the best move based on visit count
   * Visit count is more reliable than win rate for action selection
   */
  getBestMove() {
    if (this.rootNode.childNodes.length === 0) {
      return null;
    }

    // Get the child with the most visits
    return this.rootNode.childNodes.reduce((best, child) => {
      return child.visits > best.visits ? child : best;
    }, this.rootNode.childNodes[0]).moveThatLedHere;
  }

  /**
   * Get stats for all possible moves (for UI display)
   */
  getMoveStats() {
    return this.rootNode.childNodes.map(child => ({
      move: child.moveThatLedHere,
      visits: child.visits,
      wins: child.wins,
      winRate: child.visits > 0 ? (child.wins / child.visits) : 0
    }));
  }
}

/**
 * Helper function to select best move for AI
 */
export function selectBestMoveForAI(battleState, playerMove, simulationCount = 500) {
  const mcts = new MonteCarloTreeSearch(battleState, simulationCount);
  const aiMove = mcts.run(playerMove);

  if (!aiMove) {
    // Fallback to a random move if MCTS fails
    const validMoves = getValidMoves(battleState.fighter2);
    return {
      move: validMoves[Math.floor(Math.random() * validMoves.length)],
      stats: []
    };
  }

  return {
    move: aiMove,
    stats: mcts.getMoveStats()
  };
}