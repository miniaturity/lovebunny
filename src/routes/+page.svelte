<script lang="ts">
    import Board from "$lib/components/board.svelte";
    import ts from "$lib/assets/sprites/spritesheet.png";
    import cs from "$lib/assets/sprites/charactersheet.png";
    import { Game, type MoveName } from "$lib/state/game.svelte";
    import { DEMO_GAME } from "$lib/demo";
    import { onMount } from "svelte";
    import { hasVisited } from "$lib/state/store";
    import Modal from "$lib/components/modal.svelte";

    import love from "$lib/assets/images/love.png";
    import wave from "$lib/assets/images/wave.gif";
    import Button from "$lib/components/button.svelte";
    import carrot_start from "$lib/assets/images/carrot-start.png";
    import carrot_end from "$lib/assets/images/carrot-end.png";
    import Navlink from "$lib/components/navlink.svelte";


    let tileSheet = $state<HTMLImageElement>();
    let characterSheet = $state<HTMLImageElement>();

    let isNewUser = $state<boolean>(false);

    let canShowModal = $state<boolean>(true);
    let showIntroModal = $derived<boolean>(true);
    let showTutorialModal = $state<boolean>(false);

    const TILE_SIZE = 16;

    // Randomly scattered background wave gifs, sized to match the board tiles.
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

        if (!$hasVisited) {
            isNewUser = true;
            $hasVisited = true;
        }

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

    function play() {
        game.status = "playing";
        showIntroModal = false;
        canShowModal = true;
    }

    function reset() {
        if (game.status === "won") return;
        game = new Game(...DEMO_GAME);
        game.status = "playing";
    }

    function showTutorial(fromIntro?: boolean) {
        if (fromIntro) {
            showIntroModal = false;
            canShowModal = true;
        }

        if (!canShowModal) return;
        
        showTutorialModal = true;
        canShowModal = false;
    }

    const closeModal = () => { if (game.status === "menu") game.status = "playing"; }


    let game = $state<Game>(new Game(...DEMO_GAME));
    let moves = $derived<MoveName[]>(game.moves);

    let resetText = $state<string>("Reset");

    const title = "bunniesin.love";

</script>

<Modal bind:showModal={showIntroModal} bind:canShowModal onClose={closeModal}>
    <div class="modal-content">
        <img src={love} alt=""/>
        <header>
            welcome to bunniesin.love!
        </header>
        <p>
            {#each "reunite" as char, i} 
                <span class="tchar" style={`
                --index: ${i};
                --col: #000;
                --col2: var(--water-blue);`}>{char}</span>
            {/each} the lover bunnies! their 
            {#each "hearts" as char, i}
                <span class="tchar" style={`--index: ${i};
                --col: #000;
                --col2: red;
                `}>
                    {char}
                </span>
            {/each}
            are tethered, so they make the same moves.
        </p>
        <div class="buttons">
            <Button onclick={play}>
                Play
            </Button>

            <Button onclick={() => showTutorial(true)} style="background-color: var(--carrot-orange);">
                Tutorial
            </Button>
        </div>
    </div>
</Modal>

<Modal bind:showModal={showTutorialModal} bind:canShowModal onClose={closeModal}>
    <div class="modal-content">
        <header>
            how do i play?!
        </header>
    </div>
</Modal>

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
        <Navlink href={"/editor"} title={"editor"}>
            <svg fill="white" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path d="M474.1 398.2L289.1 212c18.3-47 8.1-102.3-30.5-141.1C217.9 30 156.9 21.8 108.1 44.3l87.4 88-61 61.4-89.5-88c-24.3 49-14.1 110.4 26.5 151.3 38.6 38.9 93.5 49.1 140.3 30.7l185 186.2c8.1 8.2 20.3 8.2 28.5 0l46.8-47c10.2-8.3 10.2-22.6 2-28.7z"></path></svg>
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
                        {#each (`day ${game.day} - ` + game.title) as char, i}
                            <span class="char" style={`--index: ${i}`}>{char === ' ' ? '\u00A0' : char}</span>
                        {/each}
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
                >
                    Reset
                </Button>

                <Button onclick={() => {}}>
                    Stats
                </Button>
            </div>
        </div>
    </div>
    
</div>

<style lang="scss">
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
        

        & header {
            font-size: 1.5rem;
        }

        & p {
            text-align: center;
        }

        & img {
            width: 100%;
            height: auto;
            padding: 24px;
            padding-bottom: 0;
            image-rendering: pixelated;
        }
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
        margin-bottom: 12px;
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

    @font-face {
        font-family: "Halogen";
        src: url("$lib/assets/fonts/Halogen.ttf")
    }
</style>