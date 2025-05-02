<!-- 
  Battle Scene Component
  Main component that orchestrates the battle
-->
<script>
  import { onDestroy, onMount } from "svelte";
  import FighterCard from "./FighterCard.svelte";
  import BattleLog from "./BattleLog.svelte";
  import { createFighter } from "../core/BattleEngine.js";
  import { getMovesSubset } from "../core/Moves.js";
  import { selectBestMoveForAI } from "../core/MonteCarlo.js";
  import { createBattleState, executeTurn } from "../core/BattleEngine.js";
  import {
    initializeBattleLog,
    cleanupEventListeners,
    addCustomLogMessage,
  } from "../services/BattleLogManager.js";
  import {
    battleEvents,
    BATTLE_EVENTS,
    createEventData,
  } from "../core/EventSystem.js";
  import {
    FIGHTER_CONSTANTS,
    UI_CONSTANTS,
    DIFFICULTY_LEVELS,
    GAME_STATES,
    FIGHTER_IDS,
  } from "../core/Constants.js";

  // Props for the component
  let { difficulty = DIFFICULTY_LEVELS.MEDIUM } = $props();

  // Game state - use primitive values separately instead of nested objects
  let gameState = $state(GAME_STATES.WAITING_FOR_PLAYER);
  let battleState = $state(null);
  let selectedMove = $state(null);
  let aiMoveStats = $state([]);
  let showAIMoveStats = $state(false);

  // Initialize on component mount
  onMount(() => {
    startNewBattle();
  });

  // Clean up event listeners on destroy
  onDestroy(() => {
    cleanupEventListeners();
  });

  // Start a new battle
  function startNewBattle() {
    // Initialize the battle log
    initializeBattleLog();

    // Create player fighter with 4 random moves
    const player = createFighter(
      FIGHTER_CONSTANTS.PLAYER_NAME,
      {
        hp: FIGHTER_CONSTANTS.DEFAULT_HP,
        maxHp: FIGHTER_CONSTANTS.DEFAULT_HP,
        speed: FIGHTER_CONSTANTS.DEFAULT_SPEED,
      },
      getMovesSubset([
        "PreciseStrike",
        "WildSwing",
        "CalculatedRisk",
        "Reversal",
      ]),
    );
    player.id = 1; // Add ID for move execution

    // Create AI fighter with 4 different moves
    const ai = createFighter(
      FIGHTER_CONSTANTS.AI_NAME,
      {
        hp: FIGHTER_CONSTANTS.DEFAULT_HP,
        maxHp: FIGHTER_CONSTANTS.DEFAULT_HP,
        speed: FIGHTER_CONSTANTS.DEFAULT_SPEED - 1, // Slightly slower than player
      },
      getMovesSubset([
        "DoubleEdge",
        "AllOrNothing",
        "MomentumSwing",
        "AdaptiveStrike",
      ]),
    );
    ai.id = 2; // Add ID for move execution

    // Create battle state - create a fresh object
    battleState = createBattleState(player, ai);

    // Reset game state
    gameState = GAME_STATES.WAITING_FOR_PLAYER;
    selectedMove = null;
    aiMoveStats = [];
    showAIMoveStats = false;
  }

  // Handle player move selection
  async function handleMoveSelect(moveKey) {
    if (
      gameState !== GAME_STATES.WAITING_FOR_PLAYER ||
      battleState.battleOver
    ) {
      return;
    }

    // Update UI state
    selectedMove = moveKey;
    gameState = GAME_STATES.AI_THINKING;

    // Emit AI thinking event
    battleEvents.emit(
      BATTLE_EVENTS.AI_THINKING,
      createEventData(BATTLE_EVENTS.AI_THINKING, {
        fighter: battleState.fighter2,
        simulationCount: difficulty.simulationCount,
      }),
    );

    // Wait minimum time for AI to appear to "think"
    const thinkingStartTime = Date.now();

    // Run Monte Carlo simulation to find best move
    const { move: aiMove, stats } = selectBestMoveForAI(
      battleState,
      moveKey,
      difficulty.simulationCount,
    );

    // Store move stats for display - create a fresh array
    aiMoveStats = [...stats];

    // Ensure AI "thinks" for a minimum amount of time
    const elapsedTime = Date.now() - thinkingStartTime;
    if (elapsedTime < UI_CONSTANTS.AI_THINKING_MIN_TIME) {
      await new Promise((resolve) =>
        setTimeout(resolve, UI_CONSTANTS.AI_THINKING_MIN_TIME - elapsedTime),
      );
    }

    // Get the best move's win rate
    const bestMoveStats = stats.find((stat) => stat.move === aiMove);
    const winRate = bestMoveStats ? bestMoveStats.winRate : 0;

    // Emit AI move selected event
    battleEvents.emit(
      BATTLE_EVENTS.AI_MOVE_SELECTED,
      createEventData(BATTLE_EVENTS.AI_MOVE_SELECTED, {
        fighter: battleState.fighter2,
        move: battleState.fighter2.moves[aiMove],
        winRate: winRate,
      }),
    );

    // Update game state
    gameState = GAME_STATES.EXECUTING_TURN;

    // Execute the turn with slight delay for UI
    setTimeout(() => {
      executeBattleTurn(moveKey, aiMove);
    }, UI_CONSTANTS.MOVE_ANIMATION_DELAY);
  }

  // Execute a battle turn
  function executeBattleTurn(playerMoveKey, aiMoveKey) {
    // Execute the turn
    const newBattleState = executeTurn(battleState, playerMoveKey, aiMoveKey);

    // Update battle state with new object to avoid reactive identity issues
    battleState = newBattleState;

    // Check if battle is over
    if (newBattleState.battleOver) {
      gameState = GAME_STATES.BATTLE_OVER;
    } else {
      // Reset for next turn
      gameState = GAME_STATES.WAITING_FOR_PLAYER;
      selectedMove = null;
    }
  }

  // Reset battle
  function handleReset() {
    startNewBattle();
  }

  // Toggle showing AI move stats
  function toggleAIMoveStats() {
    showAIMoveStats = !showAIMoveStats;
  }
</script>

<div class="max-w-3xl mx-auto">
  <div class="bg-gray-100 p-4 rounded-lg shadow-lg">
    <header class="flex justify-between items-center mb-4">
      <h2 class="text-2xl font-bold">Monte Carlo Battle Simulator</h2>
      <div class="text-sm bg-gray-800 text-white px-3 py-1 rounded-md">
        {difficulty.name} Difficulty
      </div>
    </header>

    {#if battleState}
      <!-- Battle Status -->
      <div class="mb-4 bg-white p-3 rounded-md shadow">
        <div class="font-bold">
          {#if gameState === GAME_STATES.WAITING_FOR_PLAYER}
            Your turn! Select a move.
          {:else if gameState === GAME_STATES.AI_THINKING}
            AI is analyzing possible outcomes...
          {:else if gameState === GAME_STATES.EXECUTING_TURN}
            Executing turn...
          {:else if gameState === GAME_STATES.BATTLE_OVER}
            Battle over! {battleState.winner === FIGHTER_IDS.PLAYER
              ? "You won!"
              : "AI won!"}
          {/if}
        </div>

        <div class="mt-2 text-sm">
          Turn: {battleState.turn}
        </div>
      </div>

      <!-- Fighter Cards -->
      <div class="grid md:grid-cols-2 gap-4 mb-4">
        <!-- AI Fighter -->
        <FighterCard
          fighter={battleState.fighter2}
          color="red"
          isPlayer={false}
          battleOver={battleState.battleOver}
          showMoveStats={showAIMoveStats}
          moveStats={aiMoveStats}
        />

        <!-- Player Fighter -->
        <FighterCard
          fighter={battleState.fighter1}
          color="blue"
          isPlayer={true}
          battleOver={battleState.battleOver}
          highlightedMove={selectedMove}
          onMoveSelect={handleMoveSelect}
        />
      </div>

      <!-- Battle Log -->
      <BattleLog />

      <!-- Action Buttons -->
      <div class="flex justify-between">
        <button
          class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md"
          onclick={handleReset}
        >
          {battleState.battleOver ? "New Battle" : "Reset Battle"}
        </button>

        {#if battleState.battleOver}
          <button
            class="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-md"
            onclick={toggleAIMoveStats}
          >
            {showAIMoveStats ? "Hide AI Analysis" : "Show AI Analysis"}
          </button>
        {/if}
      </div>
    {:else}
      <div class="text-center py-8">Loading battle...</div>
    {/if}
  </div>
</div>
