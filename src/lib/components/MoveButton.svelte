<!-- 
  Move Button Component
  Button for selecting a move during battle
-->
<script>
  // Props for the component
  let {
    move,
    moveKey,
    color = "blue", // blue for player, red for AI
    disabled = false,
    highlighted = false,
    onSelect = () => {}
  } = $props();

  // Calculate color classes based on the color prop
  let colorClasses = $derived(
    {
      blue: {
        bg: "bg-blue-500 hover:bg-blue-600",
        disabled: "bg-blue-300",
        highlight: "ring-2 ring-yellow-400"
      },
      red: {
        bg: "bg-red-500 hover:bg-red-600",
        disabled: "bg-red-300",
        highlight: "ring-2 ring-yellow-400"
      },
      green: {
        bg: "bg-green-500 hover:bg-green-600",
        disabled: "bg-green-300",
        highlight: "ring-2 ring-yellow-400"
      }
    }[color]
  );

  // Handle click event
  function handleClick() {
    if (!disabled) {
      onSelect(moveKey);
    }
  }
</script>

<button
  class="p-2 text-white rounded-md w-full mb-2 transition-all {disabled ? colorClasses.disabled : colorClasses.bg} {highlighted ? colorClasses.highlight : ''}"
  onclick={handleClick}
  disabled={disabled}
>
  <div class="font-bold">{move.name}</div>
  <div class="text-xs mt-1">{move.description}</div>
</button>

<style>
  button:disabled {
    cursor: not-allowed;
    opacity: 0.7;
  }
</style>