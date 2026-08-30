<script lang="ts">
    import type { MoveName } from "$lib/state/game.svelte";
    import Button from "./button.svelte";

    let {
        move
    }: {
        move: (move: MoveName) => void;
    } = $props();

</script>

<div class="mobile-deck">
    <div class="above">
        <button class="md-btn" onclick={() => move("up")}>
            {"↑"}
        </button>
    </div>

    <div class="below">
        <button class="md-btn" onclick={() => move("left")}>
            {"←"}
        </button>
        <button class="md-btn" onclick={() => move("down")}>
            {"↓"}
        </button>
        <button class="md-btn" onclick={() => move("right")}>
            {"→"}
        </button>
    </div>
</div>

<style lang="scss">
    .mobile-deck {
        position: absolute;
        bottom: 0;
        display: flex;
        flex-direction: column;
        gap: 8px;
        font-family: "Halogen";
        padding: 12px;
        
    }

    .above {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .below {
        display: flex;
        flex-direction: row;
        gap: 8px;
    }

    .md-btn {
        aspect-ratio: 1 / 1;
        display: flex;
        align-items: center; justify-content: center;
        width: 40px;
        border: none;
        font-size: clamp(1.4rem, 3vw, 2rem);
        box-shadow: 2px 2px #000;
    }
     
</style>