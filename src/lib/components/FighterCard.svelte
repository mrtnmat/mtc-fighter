<!-- 
  Fighter Card Component
  Displays a fighter's status and available moves
-->
<script>
  import MoveButton from './MoveButton.svelte';
  import { UI_CONSTANTS } from '../core/Constants.js';

  // Props for the component
  let {
    fighter,
    color = "blue",
    isPlayer = true,
    battleOver = false,
    onMoveSelect = (moveKey) => {},
    highlightedMove = null,
    showMoveStats = false, // Show win rates for AI moves
    moveStats = [] // Stats for Monte Carlo analysis
  } = $props();

  // Calculate HP percentage for the health bar
  let hpPercentage = $derived(
    Math.max(0, Math.min(100, (fighter.hp / fighter.maxHp) * 100))
  );

  // Determine HP bar color based on percentage
  let hpBarColor = $derived(() => {
    if (hpPercentage > UI_CONSTANTS.HP_HIGH) return 'bg-green-500';
    if (hpPercentage > UI_CONSTANTS.HP_MEDIUM) return 'bg-yellow-500';
    return 'bg-red-500';
  });

  // Calculate color classes based on the color prop
  let colorClasses = $derived(
    {
      blue: {
        bg: "bg-blue-50",
        border: "border-blue-300",
      },
      red: {
        bg: "bg-red-50",
        border: "border-red-300",
      },
      green: {
        bg: "bg-green-50",
        border: "border-green-300",
      }
    }[color]
  );
</script>

<div class="p-4 rounded-md mb-4 shadow-md {colorClasses.bg} border {colorClasses.border}">
  <div class="flex justify-between items-center mb-2">
    <h3 class="font-bold text-lg">{fighter.name}</h3>
    <span class="text-sm">HP: {fighter.hp}/{fighter.maxHp}</span>
  </div>

  <!-- HP Bar -->
  <div class="w-full bg-gray-200 h-4 mb-3 rounded-full">
    <div
      class="{hpBarColor} h-4 rounded-full transition-all duration-500"
      style="width: {hpPercentage}%"
    ></div>
  </div>

  <!-- Move Buttons (Only for player, or for AI if battle is over or showMoveStats is true) -->
  {#if isPlayer || battleOver || showMoveStats}
    <div class="grid gap-2">
      {#each Object.entries(fighter.moves) as [moveKey, move]}
        <MoveButton
          move={move}
          moveKey={moveKey}
          color={color}
          disabled={battleOver || !isPlayer}
          highlighted={highlightedMove === moveKey}
          onSelect={onMoveSelect}
        />
        
        <!-- Move Stats for AI (if available) -->
        {#if showMoveStats && moveStats.length > 0}
          {#if moveStats.find(stat => stat.move === moveKey)}
            {@const stat = moveStats.find(stat => stat.move === moveKey)}
            <div class="mb-3 text-xs bg-gray-800 text-white p-2 rounded">
              <div>Win rate: {(stat.winRate * 100).toFixed(1)}%</div>
              <div>Simulations: {stat.visits}</div>
            </div>
          {/if}
        {/if}
      {/each}
    </div>
  {:else}
    <!-- Placeholder for AI moves -->
    <div class="text-center py-4 text-gray-500 italic">
      AI's moves are hidden
    </div>
  {/if}
</div>