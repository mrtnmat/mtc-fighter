<!-- 
  Battle Log Component
  Displays messages about battle events
-->
<script>
  import { battleLog } from "../services/BattleLogManager.js";

  // Reference to the log element for auto-scrolling
  let logElement;

  // Auto-scroll to bottom when messages change
  $effect(() => {
    if (logElement && $battleLog.length > 0) {
      logElement.scrollTop = logElement.scrollHeight;
    }
  });
</script>

<div class="bg-gray-800 text-gray-200 rounded-md p-3 h-48 overflow-y-auto mb-4 text-sm">
  <h3 class="text-white font-bold mb-2">Battle Log</h3>
  
  <div
    bind:this={logElement}
    class="overflow-y-auto h-36 pr-1"
  >
    {#each $battleLog as entry}
      <div class="mb-1 flex">
        <span class="text-gray-500 text-xs mr-2">{entry.timestamp}</span>
        <span>{entry.message}</span>
      </div>
    {/each}

    {#if $battleLog.length === 0}
      <div class="text-gray-500 italic">No battle events yet.</div>
    {/if}
  </div>
</div>

<style>
  /* Smooth scrolling for battle log */
  div {
    scroll-behavior: smooth;
  }
</style>