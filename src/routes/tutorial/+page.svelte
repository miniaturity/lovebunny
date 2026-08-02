<script lang="ts">
    import Board from "$lib/components/board.svelte";
    import ts from "$lib/assets/sprites/spritesheet.png";
    import cs from "$lib/assets/sprites/charactersheet.png";
    import { Game, MOVE_DICT, type GameParams, type MoveName } from "$lib/state/game.svelte";
    import { T1_DIALOGUE, T1_GAME } from "$lib/levels/tutorial_1";
    import { onMount } from "svelte";

    import wave from "$lib/assets/images/wave.gif";
    import Button from "$lib/components/button.svelte";

    import Navlink from "$lib/components/navlink.svelte";

    import carrot_start from "$lib/assets/images/carrot-start.png";
    import carrot_end from "$lib/assets/images/carrot-end.png";
    import Dialogue, { type DialogueTree } from "$lib/components/dialogue.svelte";
    import { T2_DIALOGUE, T2_GAME } from "$lib/levels/tutorial_2";
    import { T3_DIALOGUE, T3_GAME } from "$lib/levels/tutorial_3";
    import { goto } from "$app/navigation";
    import MobileDeck from "$lib/components/mobileDeck.svelte";


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


    interface TutorialLevel {
        dialogue: DialogueTree;
        game: GameParams;
    }

    const TUTORIAL_LEVELS: TutorialLevel[] = [
        {
            dialogue: T1_DIALOGUE,
            game: T1_GAME
        },
        {
            dialogue: T2_DIALOGUE,
            game: T2_GAME
        },
        {
            dialogue: T3_DIALOGUE,
            game: T3_GAME
        }
    ]

    $effect(() => {
        if (interacted && game.status === "menu" && !renderDialogue) {
            game.status = "playing";
        }
    });

    $effect(() => {
        if (game.status === "won") {
            canGoNext = true;
            currentDialogueKey = "onWin";
            renderDialogue = true;
        }
    });

    function next() {
        if (!canGoNext) return;

        if (levelIndex === TUTORIAL_LEVELS.length - 1) goto("/");

        canGoNext = false;
        levelIndex++;
        currentDialogueKey = "start";
        renderDialogue = true;
        game.status = 'menu';
    }
    
    function reset() {
        if (game.status === "won") return;
        game = new Game(...currentLevel);
        game.status = "playing";
    }

    let levelIndex = $state<number>(0);
    let currentLevel = $derived<GameParams>(TUTORIAL_LEVELS[levelIndex].game);
    let game = $derived<Game>(new Game(...currentLevel));
    let moves = $derived<MoveName[]>(game.moves);
    let canGoNext = $state<boolean>(false);

    let interacted = $state<boolean>(false);
    let renderDialogue = $state<boolean>(false);
    let currentDialogue = $derived<DialogueTree>(TUTORIAL_LEVELS[levelIndex].dialogue);
    let currentDialogueKey = $state<string>("start");
    let finished = $state<boolean>(false);
    

    let canShowModal = $state<boolean>(true);
    let showIntroModal = $derived<boolean>(true);

    const title = "bunniesin.love";
    let innerWidth = $state(0);
    let isMobile = $derived(innerWidth < 768);

    function mobileMove(move: MoveName) {
        const { x, y } = MOVE_DICT[move];
        game.move(x, y);
    }
</script>

<svelte:window onmousedown={() => { if (!interacted) { interacted = true; 
    renderDialogue = true;
} }} bind:innerWidth/>

<div class="page">

    {#if !interacted}
        <div class="interact-overlay">
            <div class="interact">
                click to focus
            </div>
        </div>
    {/if}

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

    <header>
        <div class="title">
            {#each title as char, i}
                <span class="tchar" style={`
                --index: ${i};
                --col: #fff;
                --col2: var(--lpink);`}>{char}</span>
            {/each}
        </div>

        {#if game}
            <div class="subtitle">
                <div class="day">
                    <img alt="" src={carrot_start}/>
                    <div class="day-text">
                        tutorial - level {game.day}
                    </div>
                    <img alt="" src={carrot_end}/>
                </div>
            </div>
        {/if}    
    </header>


    <div class="game" bind:this={gameEl}>
        {#if tileSheet && characterSheet}
            <Board 
                {game}
                {tileSheet}
                {characterSheet}
            />
        {/if}
        <div class="game-info">
            <div class="moves">moves: {moves.length}</div>

            <div class="button-dock">
                <Button 
                    onclick={reset}
                    style="background-color: #c20202;"
                    className="reset-btn"
                    disabled={game.status !== "playing"}
                >
                    Reset
                </Button>

                <Button onclick={next} disabled={!canGoNext}>
                   {levelIndex !== TUTORIAL_LEVELS.length - 1 ? "Next >" : "Home"}
                </Button>
            </div>
        </div>
    </div>
    
    {#if renderDialogue}
        <Dialogue 
            bind:renderDialogue
            dialogue={currentDialogue}
            dialogueKey={currentDialogueKey}
            bind:finished
        />
    {/if}

    {#if isMobile && game.status === "playing"}
        <MobileDeck 
            move={mobileMove}
        />
    {/if}
</div>

<style lang="scss">
    .nav {
        position: absolute;
        top: 0;
        left: 0;
        padding: 8px;
    }

    .interact {
        position: absolute;

        padding: 8px;
        font-size: clamp(1.5rem, 3vw, 2rem);
        font-family: "Halogen";
        background-color: var(--carrot-orange);
        color: #fff;
        user-select: none;
    }

    .interact-overlay {
        position: absolute;
        display: flex;
        align-items: center;
        justify-content: center;
        top: 0; left: 0;
        z-index: 99;
        width: 100dvw; height: 100dvh;
        backdrop-filter: blur(2px);
        cursor: pointer;
    }

    :global(body) {
        overflow-x: hidden;
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

    @font-face {
        font-family: "Halogen";
        src: url("$lib/assets/fonts/Halogen.ttf")
    }
</style>