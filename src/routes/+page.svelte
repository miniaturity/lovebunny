<script lang="ts">
    import Board from "$lib/components/board.svelte";
    import ts from "$lib/assets/sprites/spritesheet.png";
    import cs from "$lib/assets/sprites/charactersheet.png";
    import { Game } from "$lib/state/game.svelte";
    import { DEMO_GAME } from "$lib/demo";
    import { onMount } from "svelte";
    import { hasVisited } from "$lib/state/store";
    import Modal from "$lib/components/modal.svelte";

    import love from "$lib/assets/images/love.png";
    import Button from "$lib/components/button.svelte";

    let tileSheet = $state<HTMLImageElement>();
    let characterSheet = $state<HTMLImageElement>();

    let isNewUser = $state<boolean>(false);
    let showIntroModal = $derived<boolean>(true);

    onMount(() => {
        tileSheet = new Image();
        tileSheet.src = ts;

        characterSheet = new Image();
        characterSheet.src = cs;

        if (!$hasVisited) {
            isNewUser = true;
            $hasVisited = true;
        }
    });

    function play() {
        game.status = "playing";
        showIntroModal = false;
    }

    let game = $state<Game>(new Game(...DEMO_GAME));

    const title = "bunniesin.love";
</script>

<Modal bind:showModal={showIntroModal}>
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
        </div>
    </div>
</Modal>

<div class="page">
    
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
                
                {#each (`day ${game.day} - ` + game.title) as char, i}
                    <span class="char" style={`--index: ${i}`}>{char}</span>
                {/each}
            </div>
        {/if}
    </header>
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
        --lpink: #fde0f4;
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
        width: 100dvw; height: 100dvh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center; 
        background-color: var(--water-blue);
    }

    .game {
        width: clamp(320px, 60vw, 800px);
        aspect-ratio: 1 / 1;
    }

    header {
        display: flex;
        flex-direction: column;
        align-items: center;
        font-family: "Halogen";
    }

    .title {
        color: #fff;
        font-size: clamp(2rem, 4vw, 3rem);
    }

    .subtitle {
        font-size: clamp(1rem, 2vw, 1.3rem);
        color: var(--lpink);
        white-space: pre-wrap;
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