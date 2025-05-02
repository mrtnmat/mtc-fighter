<!--
  App Component
  Main entry point for the Monte Carlo Battle Simulator
-->
<script>
  import { onDestroy, onMount } from "svelte";
  import { createFighter, createBattleState, executeTurn } from "./lib/core/BattleEngine.js";
  import { getMovesSubset } from "./lib/core/Moves.js";
  import { selectBestMoveForAI } from "./lib/core/MonteCarlo.js";
  import { battleEvents, BATTLE_EVENTS, createEventData } from "./lib/core/EventSystem.js";

  // Constants
  const FIGHTER_CONSTANTS = {
    PLAYER_NAME: "Player",
    AI_NAME: "Monte",
    DEFAULT_HP: 100,
    DEFAULT_SPEED: 10
  };

  const GAME_STATES = {
    WAITING_FOR_PLAYER: 'WAITING_FOR_PLAYER',
    AI_THINKING: 'AI_THINKING',
    EXECUTING_TURN: 'EXECUTING_TURN',
    BATTLE_OVER: 'BATTLE_OVER'
  };

  const DIFFICULTY = {
    simulationCount: 1000
  };

  // Game state variables
  let gameState = $state(GAME_STATES.WAITING_FOR_PLAYER);
  let battleState = $state(null);
  let selectedMove = $state(null);
  let aiMoveStats = $state([]);
  let battleLog = $state([]);
  
  // Initialize on mount
  onMount(() => {
    startNewBattle();
  });
  
  // Start a new battle
  function startNewBattle() {
    // Reset battle log
    battleLog = [];
    
    // Create player fighter with 4 moves
    const player = createFighter(
      FIGHTER_CONSTANTS.PLAYER_NAME,
      {
        hp: FIGHTER_CONSTANTS.DEFAULT_HP,
        speed: FIGHTER_CONSTANTS.DEFAULT_SPEED,
      },
      getMovesSubset([
        "PreciseStrike",
        "WildSwing",
        "CalculatedRisk",
        "Reversal",
      ])
    );
    
    // Create AI fighter with 4 different moves
    const ai = createFighter(
      FIGHTER_CONSTANTS.AI_NAME,
      {
        hp: FIGHTER_CONSTANTS.DEFAULT_HP,
        speed: FIGHTER_CONSTANTS.DEFAULT_SPEED - 1, // Slightly slower than player
      },
      getMovesSubset([
        "DoubleEdge",
        "AllOrNothing",
        "MomentumSwing",
        "AdaptiveStrike",
      ])
    );
    
    // Create battle state
    battleState = createBattleState(player, ai);
    
    // Log battle start
    addLogMessage(`Battle started between ${player.name} and ${ai.name}!`);
    addLogMessage(`Select a move to attack.`);
    
    // Reset game state
    gameState = GAME_STATES.WAITING_FOR_PLAYER;
    selectedMove = null;
    aiMoveStats = [];
  }
  
  // Handle player move selection
  async function handleMoveSelect(moveKey) {
    if (gameState !== GAME_STATES.WAITING_FOR_PLAYER || battleState.battleOver) {
      return;
    }
    
    // Update UI state
    selectedMove = moveKey;
    gameState = GAME_STATES.AI_THINKING;
    
    // Log AI thinking
    addLogMessage(`${battleState.fighter2.name} is analyzing ${DIFFICULTY.simulationCount} possible battle outcomes...`);
    
    // Run Monte Carlo simulation to find best move
    const { move: aiMove, stats } = selectBestMoveForAI(
      battleState,
      moveKey,
      DIFFICULTY.simulationCount
    );
    
    // Store move stats for display
    aiMoveStats = [...stats];
    
    // Get the best move's win rate
    const bestMoveStats = stats.find((stat) => stat.move === aiMove);
    const winRate = bestMoveStats ? bestMoveStats.winRate : 0;
    
    // Log AI move selection
    addLogMessage(`${battleState.fighter2.name} selected ${battleState.fighter2.moves[aiMove].name} (${Math.round(winRate * 100)}% win rate).`);
    
    // Update game state
    gameState = GAME_STATES.EXECUTING_TURN;
    
    // Execute the turn with slight delay
    setTimeout(() => {
      executeBattleTurn(moveKey, aiMove);
    }, 500);
  }
  
  // Execute a battle turn
  function executeBattleTurn(playerMoveKey, aiMoveKey) {
    // Execute the turn
    const newBattleState = executeTurn(battleState, playerMoveKey, aiMoveKey);
    
    // Update battle state
    battleState = newBattleState;
    
    // Check if battle is over
    if (newBattleState.battleOver) {
      gameState = GAME_STATES.BATTLE_OVER;
      // Log battle end
      addLogMessage(`${newBattleState.winner === 'fighter1' ? battleState.fighter1.name : battleState.fighter2.name} won the battle!`);
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
  
  // Add a message to the battle log
  function addLogMessage(message) {
    battleLog = [...battleLog, {
      message,
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false })
    }];
    
    // Limit log size
    if (battleLog.length > 50) {
      battleLog = battleLog.slice(battleLog.length - 50);
    }
  }
  
  // Listen for battle events
  battleEvents.on(BATTLE_EVENTS.MOVE_USED, (event) => {
    addLogMessage(`${event.fighter.name} used ${event.move.name}!`);
  });
  
  battleEvents.on(BATTLE_EVENTS.MOVE_MISSED, (event) => {
    addLogMessage(`${event.fighter.name}'s attack missed!`);
  });
  
  battleEvents.on(BATTLE_EVENTS.DAMAGE_APPLIED, (event) => {
    addLogMessage(`${event.fighter.name} took ${event.damageAmount} damage!`);
  });
  
  battleEvents.on(BATTLE_EVENTS.FIGHTER_FAINTED, (event) => {
    addLogMessage(`${event.fighter.name} fainted!`);
  });
  
  battleEvents.on(BATTLE_EVENTS.RECOIL_DAMAGE, (event) => {
    addLogMessage(`${event.fighter.name} took ${event.recoilDamage} recoil damage!`);
  });
  
  battleEvents.on(BATTLE_EVENTS.MOMENTUM_BONUS, (event) => {
    addLogMessage(`${event.fighter.name} gained ${event.bonusDamage} bonus damage from momentum!`);
  });
</script>

<main class="min-h-screen bg-gray-900 text-white p-4">
  <div class="max-w-4xl mx-auto">
    <div class="bg-gray-800 p-6 rounded-lg shadow-lg">
      <h1 class="text-4xl font-bold mb-6 text-center">Monte Carlo Battle Simulator</h1>
      
      {#if battleState}
        <!-- Battle Status -->
        <div class="mb-4 bg-white text-black p-3 rounded-md shadow">
          <div class="font-bold">
            {#if gameState === GAME_STATES.WAITING_FOR_PLAYER}
              Your turn! Select a move.
            {:else if gameState === GAME_STATES.AI_THINKING}
              AI is analyzing possible outcomes...
            {:else if gameState === GAME_STATES.EXECUTING_TURN}
              Executing turn...
            {:else if gameState === GAME_STATES.BATTLE_OVER}
              Battle over! {battleState.winner === 'fighter1' ? "You won!" : "AI won!"}
            {/if}
          </div>
          <div class="mt-2 text-sm">Turn: {battleState.turn}</div>
        </div>
        
        <!-- Fighter Cards -->
        <div class="grid md:grid-cols-2 gap-4 mb-4">
          <!-- AI Fighter -->
          <div class="p-4 rounded-md mb-4 shadow-md bg-red-50 border border-red-300 text-black">
            <div class="flex justify-between items-center mb-2">
              <h3 class="font-bold text-lg">{battleState.fighter2.name}</h3>
              <span class="text-sm">HP: {battleState.fighter2.hp}/{battleState.fighter2.maxHp}</span>
            </div>
            
            <!-- HP Bar -->
            <div class="w-full bg-gray-200 h-4 mb-3 rounded-full">
              <div 
                class="bg-red-500 h-4 rounded-full transition-all duration-500" 
                style="width: {Math.max(0, Math.min(100, (battleState.fighter2.hp / battleState.fighter2.maxHp) * 100))}%"
              ></div>
            </div>
            
            <!-- AI Moves (only shown when battle is over) -->
            {#if battleState.battleOver}
              <div class="grid gap-2">
                {#each Object.entries(battleState.fighter2.moves) as [moveKey, move]}
                  <div class="p-2 text-white rounded-md w-full mb-2 transition-all bg-red-500">
                    <div class="font-bold">{move.name}</div>
                    <div class="text-xs mt-1">{move.description}</div>
                  </div>
                  
                  <!-- Move Stats -->
                  {#if aiMoveStats.length > 0}
                    {#if aiMoveStats.find((stat) => stat.move === moveKey)}
                      {@const stat = aiMoveStats.find((stat) => stat.move === moveKey)}
                      <div class="mb-3 text-xs bg-gray-800 text-white p-2 rounded">
                        <div>Win rate: {(stat.winRate * 100).toFixed(1)}%</div>
                        <div>Simulations: {stat.visits}</div>
                      </div>
                    {/if}
                  {/if}
                {/each}
              </div>
            {:else}
              <div class="text-center py-4 text-gray-500 italic">AI's moves are hidden</div>
            {/if}
          </div>
          
          <!-- Player Fighter -->
          <div class="p-4 rounded-md mb-4 shadow-md bg-blue-50 border border-blue-300 text-black">
            <div class="flex justify-between items-center mb-2">
              <h3 class="font-bold text-lg">{battleState.fighter1.name}</h3>
              <span class="text-sm">HP: {battleState.fighter1.hp}/{battleState.fighter1.maxHp}</span>
            </div>
            
            <!-- HP Bar -->
            <div class="w-full bg-gray-200 h-4 mb-3 rounded-full">
              <div 
                class="bg-blue-500 h-4 rounded-full transition-all duration-500" 
                style="width: {Math.max(0, Math.min(100, (battleState.fighter1.hp / battleState.fighter1.maxHp) * 100))}%"
              ></div>
            </div>
            
            <!-- Player Moves -->
            <div class="grid gap-2">
              {#each Object.entries(battleState.fighter1.moves) as [moveKey, move]}
                <button 
                  class="p-2 text-white rounded-md w-full mb-2 transition-all {
                    battleState.battleOver ? 'bg-blue-300' : 'bg-blue-500 hover:bg-blue-600'
                  } {selectedMove === moveKey ? 'ring-2 ring-yellow-400' : ''}"
                  disabled={battleState.battleOver || gameState !== GAME_STATES.WAITING_FOR_PLAYER}
                  on:click={() => handleMoveSelect(moveKey)}
                >
                  <div class="font-bold">{move.name}</div>
                  <div class="text-xs mt-1">{move.description}</div>
                </button>
              {/each}
            </div>
          </div>
        </div>
        
        <!-- Battle Log -->
        <div class="bg-gray-800 text-gray-200 rounded-md p-3 h-48 overflow-y-auto mb-4 text-sm">
          <h3 class="text-white font-bold mb-2">Battle Log</h3>
          
          <div class="overflow-y-auto h-36 pr-1">
            {#each battleLog as entry}
              <div class="mb-1 flex">
                <span class="text-gray-500 text-xs mr-2">{entry.timestamp}</span>
                <span>{entry.message}</span>
              </div>
            {/each}
            
            {#if battleLog.length === 0}
              <div class="text-gray-500 italic">No battle events yet.</div>
            {/if}
          </div>
        </div>
        
        <!-- Action Button -->
        <div class="flex justify-center">
          <button 
            class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md"
            on:click={handleReset}
          >
            {battleState.battleOver ? "New Battle" : "Reset Battle"}
          </button>
        </div>
      {:else}
        <div class="text-center py-8">Loading battle...</div>
      {/if}
    </div>
  </div>
</main>