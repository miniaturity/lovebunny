<script lang="ts">
    import EditorBoard from "$lib/components/editorboard.svelte";
    import ts from "$lib/assets/sprites/spritesheet.png";
    import cs from "$lib/assets/sprites/charactersheet.png";
    import { Game } from "$lib/state/game.svelte";
    import { DEMO_GAME } from "$lib/demo";
    import { onMount } from "svelte";
    import wave from "$lib/assets/images/wave.gif";
    import Navlink from "$lib/components/navlink.svelte";

    let tileSheet = $state<HTMLImageElement>();
    let characterSheet = $state<HTMLImageElement>();

    const TILE_SIZE = 16;

    const WAVE_COUNT = 24;
    let waveTiles = $state<{ top: number; left: number }[]>([]);
    let gameEl = $state<HTMLDivElement>();
    let tileDisplaySize = $state(TILE_SIZE);

    function updateTileDisplaySize() {
        if (!gameEl) return;
        const cols = game.board[0]?.length || 1;
        tileDisplaySize = gameEl.clientWidth / cols;
    }

    onMount(() => {
        tileSheet = new Image();
        tileSheet.src = ts;

        characterSheet = new Image();
        characterSheet.src = cs;

        waveTiles = Array.from({ length: WAVE_COUNT }, () => ({
            top: Math.random() * 100,
            left: Math.random() * 100
        }));

        updateTileDisplaySize();
        const resizeObserver = new ResizeObserver(updateTileDisplaySize);
        if (gameEl) resizeObserver.observe(gameEl);
        window.addEventListener("resize", updateTileDisplaySize);

        return () => {
            resizeObserver.disconnect();
            window.removeEventListener("resize", updateTileDisplaySize);
        };
    });

    let game = $state<Game>(new Game(...DEMO_GAME));
</script>

<div class="page">

    <div class="wave-background" aria-hidden="true">
        {#each waveTiles as tile}
            <img
                class="wave-tile"
                src={wave}
                alt=""
                style={`
                top: ${tile.top}%;
                left: ${tile.left}%;
                width: ${tileDisplaySize}px;
                height: ${tileDisplaySize}px;`}
            />
        {/each}
    </div>

    <div class="nav">
        <Navlink href={"/"} title={"back"}>
            <svg fill="white" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l160 160c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L106.5 288 480 288c17.7 0 32-14.3 32-32s-14.3-32-32-32l-373.5 0 108.2-108.2c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-160 160z"></path></svg>
        </Navlink>
    </div>

    <div class="game" bind:this={gameEl}>
        {#if tileSheet && characterSheet}
            <EditorBoard
                {game}
                {tileSheet}
                {characterSheet}
            />
        {/if}
    </div>

</div>

<style lang="scss">
    .nav {
        position: absolute;
        top: 0;
        left: 0;
        padding: 8px;
    }

    .page {
        position: relative;
        width: 100dvw; min-height: 100dvh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background-color: var(--water-blue);
        overflow: hidden;
    }

    .wave-background {
        position: absolute;
        inset: 0;
        z-index: 0;
        overflow: hidden;
        pointer-events: none;
    }

    .wave-tile {
        position: absolute;
        transform: translate(-50%, -50%);
        image-rendering: pixelated;
    }

    .game {
        position: relative;
        z-index: 1;
        width: clamp(320px, 40vw, 800px);
        aspect-ratio: 1 / 1;
    }
</style>
