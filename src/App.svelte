<!-- 
  App Component
  Main entry point for the Monte Carlo Battle Simulator
-->
<script>
  import BattleScene from "./lib/components/BattleScene.svelte";
  import { DIFFICULTY_LEVELS } from "./lib/core/Constants.js";

  // State management
  let selectedDifficulty = $state(DIFFICULTY_LEVELS.MEDIUM);
  let gameStarted = $state(false);

  // Handle difficulty change
  function changeDifficulty(difficulty) {
    selectedDifficulty = difficulty;
  }

  // Start the game
  function startGame() {
    gameStarted = true;
  }

  // Return to menu
  function returnToMenu() {
    gameStarted = false;
  }
</script>

<main class="min-h-screen bg-gray-900 text-white p-4">
  <div class="max-w-4xl mx-auto">
    {#if !gameStarted}
      <!-- Main Menu -->
      <div class="bg-gray-800 p-6 rounded-lg shadow-lg text-center">
        <h1 class="text-4xl font-bold mb-6">Monte Carlo Battle Simulator</h1>

        <p class="mb-8 text-gray-300">
          Battle against an AI that uses Monte Carlo Tree Search to make optimal
          decisions. Can you beat an opponent that simulates thousands of
          possible battle outcomes?
        </p>

        <div class="mb-8">
          <h2 class="text-xl mb-4">Select Difficulty</h2>

          <div class="grid md:grid-cols-3 gap-4">
            {#each Object.values(DIFFICULTY_LEVELS) as difficulty}
              <button
                class="p-4 rounded-lg transition-colors {selectedDifficulty ===
                difficulty
                  ? 'bg-blue-600'
                  : 'bg-gray-700 hover:bg-gray-600'}"
                onclick={() => changeDifficulty(difficulty)}
              >
                <div class="font-bold text-lg">{difficulty.name}</div>
                <div class="text-sm text-gray-300 mt-1">
                  {difficulty.description}
                </div>
              </button>
            {/each}
          </div>
        </div>

        <div class="mb-4">
          <h2 class="text-xl mb-4">Game Rules</h2>
          <div class="text-left text-gray-300 bg-gray-700 p-4 rounded-lg">
            <ul class="list-disc pl-5 space-y-2">
              <li>You and the AI each have 100 HP and unique moves</li>
              <li>Take turns attacking until one fighter runs out of HP</li>
              <li>
                Each move has different damage properties and probabilities
              </li>
              <li>
                The AI uses Monte Carlo simulations to find the optimal move
              </li>
              <li>The faster fighter attacks first each turn</li>
            </ul>
          </div>
        </div>

        <button
          class="px-8 py-3 bg-green-600 hover:bg-green-700 rounded-lg text-lg font-bold transition-colors"
          onclick={startGame}
        >
          Start Battle
        </button>
      </div>
    {:else}
      <!-- Battle Scene -->
      <div>
        <button
          class="mb-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md"
          onclick={returnToMenu}
        >
          ← Back to Menu
        </button>

        <BattleScene difficulty={selectedDifficulty} />
      </div>
    {/if}

    <footer class="mt-8 text-center text-gray-500 text-sm">
      <p>
        Monte Carlo Battle Simulator - A minimalist battle game with AI-powered
        decision making
      </p>
    </footer>
  </div>
</main>
