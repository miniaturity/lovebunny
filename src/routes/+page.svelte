<script lang="ts">
    import Board from "$lib/components/board.svelte";
    import ts from "$lib/assets/sprites/spritesheet.png";
    import cs from "$lib/assets/sprites/charactersheet.png";
    import { Game } from "$lib/state/game.svelte";
    import { DEMO_LEVEL } from "$lib/demo";
    import { onMount } from "svelte";



    let tileSheet = $state<HTMLImageElement>();
    let characterSheet = $state<HTMLImageElement>();

    onMount(() => {
        tileSheet = new Image();
        tileSheet.src = ts;

        characterSheet = new Image();
        characterSheet.src = cs;
    })


    let game = $state<Game>(new Game(DEMO_LEVEL, { x: 1, y: 1 }, { x: 14, y: 14 }));
</script>

<div class="page">
    <div class="game">
        {#if tileSheet && characterSheet}
            <Board 
                {game}
                {tileSheet}
                {characterSheet}
            />
        {/if}
    </div>
</div>

<style lang="scss">
    :global(*) {
        margin: 0; padding: 0;
        box-sizing: border-box;
    }

    :global(:root) {
        --water-blue: #5fade4;
    }

    .page {
        width: 100dvw; height: 100dvh;
        display: flex;
        align-items: center;
        justify-content: center; 
        background-color: var(--water-blue);
    }

    .game {
        width: clamp(300px, 50vw, 850px);
        aspect-ratio: 1 / 1;
    }
</style>