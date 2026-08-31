<!-- src/routes/levels/[id]/+page.svelte -->
<script lang="ts">
    import Board from "$lib/components/game/board.svelte";
    import ts from "$lib/assets/sprites/spritesheet.png";
    import cs from "$lib/assets/sprites/charactersheet.png";
    import { Game, MOVE_DICT, type MoveName, type GameParams } from "$lib/state/game/game.svelte";
    import { onMount } from "svelte";
    import Modal from "$lib/components/util/modal.svelte";
    import wave from "$lib/assets/images/wave.gif";
    import Button from "$lib/components/util/button.svelte";
    import carrot_start from "$lib/assets/images/carrot-start.png";
    import carrot_end from "$lib/assets/images/carrot-end.png";
    import Navlink from "$lib/components/util/navlink.svelte";
    import Winmodal from "$lib/components/util/winmodal.svelte";
    import type { LevelData } from "$lib/data/leveldata";
    import type { PageData } from './$types';

    let { data }: { data: PageData } = $props();

    let gameParams = $derived<GameParams>([
        data.level.board, data.level.a, data.level.b, data.level.title, data.level.day, data.level.author
    ]);

    let tileSheet = $state<HTMLImageElement>();
    let characterSheet = $state<HTMLImageElement>();

    let game = $derived<Game>(new Game(...gameParams));
    let playbackGame = $derived<Game>(new Game(...gameParams));
    let moves = $derived<MoveName[]>(game.moves);
    let movesLength = $derived<number>(moves.length);
    let canShowModal = $state(true);
    let showWinModal = $derived(game.status === "won");

    const TILE_SIZE = 16;
    const WAVE_COUNT = 24;
    let waveTiles = $state<{ top: number; left: number }[]>([]);
    let gameEl = $state<HTMLDivElement>();
    let tileDisplaySize = $state(TILE_SIZE);

    let loaded = $state<boolean>(true);

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

        game.status = "playing";

        return () => {
            resizeObserver.disconnect();
            window.removeEventListener("resize", updateTileDisplaySize);
        };
    });

    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    async function playback(moves: MoveName[]) {
        if (game.status !== "won") return;
        game.status = "playback";
        playbackGame = new Game(...gameParams);
        playbackGame.status = "playback";
        for (let i = 0; i < moves.length; i++) {
            await sleep(250);
            playmove(moves[i]);
        }
    }

    function playmove(move: MoveName) {
        const { x, y } = MOVE_DICT[move];
        playbackGame.move(x, y);
    }

    function reset(playing: boolean = true) {
        if (game.status === "won") return;
        game = new Game(...gameParams);
        if (playing) game.status = "playing";
    }

    const pageTitle = "bunniesin.love";
</script>

<svelte:head>
    <title>level - {data.id}</title>
</svelte:head>

<Modal bind:showModal={showWinModal} bind:canShowModal>
    {#if game}
        <Winmodal {game} {playback} isUserMade id={data.id} />
    {/if}
</Modal>

<div class="page">
    <div class="wave-background" aria-hidden="true">
        {#each waveTiles as tile}
            <img class="wave-tile" src={wave} alt=""
                style={`top: ${tile.top}%; left: ${tile.left}%; width: ${tileDisplaySize}px; height: ${tileDisplaySize}px;`} />
        {/each}
    </div>

    <div class="nav">
        <Navlink href="/" title="back">
            <svg fill="white" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l160 160c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L106.5 288 480 288c17.7 0 32-14.3 32-32s-14.3-32-32-32l-373.5 0 108.2-108.2c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-160 160z"></path></svg>
        </Navlink>
    </div>

    <header>
        <div class="title">
            {#each pageTitle as char, i}
                <span class="tchar" style={`--index: ${i}; --col: #fff; --col2: var(--lpink);`}>{char}</span>
            {/each}
        </div>
        <div class="subtitle">
            <div class="day">
                <img alt="" src={carrot_start} />
                <div class="day-text">
                    {#each (data.level.title + ' — by ' + (data.level.author || 'anonymous')) as char, i}
                        <span class="char" style={`--index: ${i}`}>{char === ' ' ? '\u00A0' : char}</span>
                    {/each}
                </div>
                <img alt="" src={carrot_end} />
            </div>
        </div>
    </header>

    <div class="game" bind:this={gameEl}>
        {#if tileSheet && characterSheet}
            <Board {loaded} game={game.status === "playback" ? playbackGame : game} {tileSheet} {characterSheet} />
        {/if}
        <div class="game-info">
            <div class="moves">moves: {movesLength}</div>
            <div class="button-dock">
                <Button
                    onclick={() => game.undo()}
                    style="background-color: var(--carrot-orange);"
                    disabled={game.undone || !game.lastMove || game.status !== "playing"}
                >
                    ↩
                </Button>
                <Button 
                    onclick={() => reset()} 
                    style="background-color: #c20202;" 
                    className="reset-btn" 
                    disabled={game.status !== "playing"}
                >
                    Reset
                </Button>
                <Button 
                    onclick={() => { showWinModal = true; game.status = "won"; }} 
                    disabled={game.status !== "won" && game.status !== "playback"}
                    >
                        Stats
                </Button>
            </div>
        </div>
    </div>
</div>

<style lang="scss">
    :global(body) {
        overflow-x: hidden;
    }

    .nav {
        position: absolute;
        top: 0;
        left: 0;
        padding: 8px;
    }

    .modal-content {
        --p: 12px;
        padding: var(--p);
        max-width: 350px;
        gap: var(--p);   

        display: flex;
        flex-direction: column;
        align-items: center;
        

    }

    .page {
        position: relative;
        width: 100dvw; min-height: 100dvh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center; 
        background-color: var(--water-blue);
        overflow-x: hidden;
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
        width: clamp(280px, 35vw, 800px);
        aspect-ratio: 1 / 1;
    }

    .game-info {
        display: flex;
        flex-direction: row;
        width: 100%;

        font-family: "Halogen";
        color: #fff;
        font-size: 1.5rem;

        margin-top: -5%;
        justify-content: space-between;
    }

    header {
        position: relative;
        z-index: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        font-family: "Halogen";
    }

    .title {
        color: #fff;
        font-size: clamp(2rem, 4vw, 3rem);

        font-family: "Halogen";
    }

    .subtitle {
        display: flex;
        flex-direction: row;
        font-size: clamp(1rem, 2vw, 1.2rem);
        color: #fff;
        

        position: relative;
        image-rendering: pixelated;

        & .day {
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: center;
            padding: 12px;

            & img {
                height: 100%; width: auto;
            }

            & .day-text {
                width: fit-content;
                white-space: nowrap;
                background-color: var(--carrot-orange);
                padding: 8px;
            }
        }
    }

    .button-dock {
        display: flex;
        flex-direction: row;
        gap: 4px;
    }

    .tchar {
        display: inline-block;
        animation: letterfloat_title 3s ease-in-out infinite;
        animation-delay: calc(0.2s * var(--index));
    }

    .char {
        display: inline-block;
        animation: letterfloat 3s ease-in-out infinite;
        animation-delay: calc(0.2s * var(--index));
    }

    @keyframes letterfloat_title {
        0% {
            color: var(--col);
            transform: translateY(0px);
        } 50% {
            color: var(--col2);
            transform: translateY(2px);
        } 100% {
            color: var(--col);
            transform: translateY(0px);
        }
    }

    @keyframes letterfloat {
        0% {
            transform: translateY(0px);
        } 50% {
            transform: translateY(2px);
        } 100% {
            transform: translateY(0px);
        }
    }
</style>