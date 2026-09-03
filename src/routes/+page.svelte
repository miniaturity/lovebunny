<script lang="ts">
    import Board from "$lib/components/game/board.svelte";
    import ts from "$lib/assets/sprites/spritesheet.png";
    import cs from "$lib/assets/sprites/charactersheet.png";
    import { Game, MOVE_DICT, type GameParams, type MoveName } from "$lib/state/game/game.svelte.js";
    import { getContext, onMount } from "svelte";
    import { hasVisited, hasCompletedTip } from "$lib/state/store";
    import Modal from "$lib/components/util/modal.svelte";

    import love from "$lib/assets/images/love.png";
    import wave from "$lib/assets/images/wave.gif";
    import Button from "$lib/components/util/button.svelte";
    import carrot_start from "$lib/assets/images/carrot-start.png";
    import carrot_end from "$lib/assets/images/carrot-end.png";
    import Navlink from "$lib/components/util/navlink.svelte";
    import Winmodal from "$lib/components/util/winmodal.svelte";
    import MobileDeck from "$lib/components/game/mobileDeck.svelte";
    import { fetchScoreDistribution, fetchMyScore, submitScore } from "$lib/api/scores";
    import Dialogue, { type DialogueTree } from "$lib/components/game/dialogue.svelte";
    import { goto } from "$app/navigation";

    import { page } from "$app/state";

    let { data } = $props();
    let gameParams: GameParams = $derived([data.daily.board, data.daily.a, data.daily.b, data.daily.title, data.daily.day, data.daily.author]);

    let tileSheet = $state<HTMLImageElement>();
    let characterSheet = $state<HTMLImageElement>();

    let game = $derived<Game>(new Game(...gameParams));
    let playbackGame = $derived<Game>(new Game(...gameParams));
    let moves = $derived<MoveName[]>(game.moves);
    let bestGame = $derived<Game>(new Game(...gameParams));

    let isNewUser = $state<boolean>(false);
    let scoreSubmitted = $state(false);
    let canShowModal = $state<boolean>(true);
    let showIntroModal = $derived<boolean>(isNewUser);
    let showWinModal = $derived<boolean>(game.status === "won" && scoreSubmitted);
    let showConfirmModal = $derived<boolean>(game.status === "won" && !scoreSubmitted);
    let confirmedSubmission = $state<boolean>(false);

    const TILE_SIZE = 16;

    const WAVE_COUNT = 24;
    let waveTiles = $state<{ top: number; left: number }[]>([]);
    let gameEl = $state<HTMLDivElement>();
    let tileDisplaySize = $state(TILE_SIZE);

    let loaded = $state<boolean>(false);
    let hasSeenTips = $state<boolean>(true);

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
        } else {
            game.status = "playing";
        }

        if (!$hasCompletedTip) {
            hasSeenTips = false;
            $hasCompletedTip = true;
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

    let today = $derived<string>(data.today);
    let alreadyPlayedToday = $state(false); 
    let distribution = $state<Record<string, number>>({});
    let totalPlayers = $state(0);

    $effect(() => {
        today = data.today;
    });

    async function loadDistribution() {
        try {
            console.log(today);
            const result = await fetchScoreDistribution(today);
            distribution = result.distribution;
            totalPlayers = result.totalPlayers;
        } catch (err) {
            console.error("Failed to load dist.: " + err);
        }
    }

    async function replayLockedSolution(existingMoves: MoveName[]) {
        playbackGame = new Game(...gameParams);
        playbackGame.status = "playback"; 
        game.status = "playback";

        for (const move of existingMoves) {
            await sleep(150);
            playmove(move);
        }

        playbackGame.status = "won"; 
        game.status = "won"; 
    }

    onMount(() => {

        fetchMyScore(today).then(async (existing) => {
            if (existing) {
                alreadyPlayedToday = true;
                scoreSubmitted = true; 
                loaded = true;
                await replayLockedSolution(existing.moves);
                loadDistribution();
            } else {
                loaded = true;
            }

            game.moves = existing?.moves ?? [];
        });

    });

    let submittingScore = $state(false);

    $effect(() => {
        if (game.status === "won" && !scoreSubmitted && !submittingScore && confirmedSubmission) {
            submittingScore = true;
            submitScore(today, game.moves).then((result) => {
                submittingScore = false;

                if (result.ok || result.alreadyPlayed) {
                    scoreSubmitted = true;
                    loadDistribution();
                } else {
                    confirmedSubmission = false;
                    alert("Couldn't submit your score. Don't try to cheat!");
                }
            });
        }
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
    
    function mobileMove(move: MoveName) {
        const { x, y } = MOVE_DICT[move];
        game.move(x, y);
    }

    function playmove(move: MoveName) {
        const { x, y } = MOVE_DICT[move];
        playbackGame.move(x, y);
    }

    function play() {
        game.status = "playing";
        showIntroModal = false;
        canShowModal = true;
    }

    function reset(playing: boolean = true) {
        if (alreadyPlayedToday || (game.status === "won" && scoreSubmitted)) return;
        
        if (game.status === "won" && (bestGame.moves.length === 0 || bestGame.getScore() > game.getScore())) {
            bestGame.moves = [...game.moves];
            bestGame.a = { ...game.a };
            bestGame.b = { ...game.b };
            
        }

        game = new Game(...gameParams);
        if (playing) game.status = "playing";
    }

    function setToBest() {
        if (bestGame.moves.length === 0) return;

        game.moves = [...bestGame.moves.slice(0, -1)];
        game.a = { ...bestGame.a };
        game.b = { ...bestGame.b };
        
        let n = bestGame.moves.length;
        game.move(MOVE_DICT[bestGame.moves[n-1]].x, MOVE_DICT[bestGame.moves[n-1]].y)
        
        game.status = "won";
        
        
    }

    function confirmSubmission() {
        confirmedSubmission = true;
    }

    const closeModal = () => { if (game.status === "menu") game.status = "playing"; }

    function shiftDate(dateStr: string, deltaDays: number): string {
        const t = new Date(`${dateStr}T00:00:00.000Z`).getTime();
        return new Date(t + deltaDays * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    }

    let canGoNext = $derived(today < data.serverToday);

    async function lastDay() {
        if (game.day === 1) return;

        const target = shiftDate(today, -1);
        try {
            await goto(`/?date=${target}`);
            game = new Game(...gameParams);
            game.status = 'playing';
        } catch (err) {
            console.error(err);
            goto("/");
        }
    }

    async function nextDay() {
        if (!canGoNext) return;

        const target = shiftDate(today, 1);
        try {
            await goto(`/?date=${target}`);
            game = new Game(...gameParams);
            game.status = 'playing';
        } catch (err) {
            console.error(err);
            goto("/");
        }
    }

    const title = "bunniesin.love";

    let innerWidth = $state(0);
    let isMobile = $derived(innerWidth < 768);
    
    let menuMode = $state<boolean>(false);
    let focusedMenu = $state<boolean>(false);
    let finished = $state<boolean>(false);
    let renderDialogue = $state<boolean>(false);

    const TIP_DIALOGUE: DialogueTree = {
        tip: {
            id: "tip",
            expression: "happy.png",
            name: "mini",
            text: "view the editor and tutorial from this menu!"
        }
    }

    $effect(() => {
        if (!showIntroModal && !hasSeenTips) {
            menuMode = true;

            setTimeout(() => {
                focusedMenu = true;
                renderDialogue = true;
            }, 500);
            
        }
    });

    $effect(() => {
        if (!renderDialogue && focusedMenu) {
            focusedMenu = false;
            setTimeout(() => menuMode = false, 1000);
        }
    });

    let scoreMode = $state<boolean>(true);

</script>

<svelte:head>
    <title>bunniesin.love</title>
</svelte:head>

<svelte:window bind:innerWidth />

<Modal bind:showModal={showConfirmModal} bind:canShowModal onClose={closeModal} canClose={false}>
    <div class="modal-content">
        <img src={love} alt=""/>
        <header style="display: flex; flex-direction: row;">
            confirm submission
        </header>

        <p>
            are you sure you want to submit this solution? 
        </p>

        <div class="buttons">
            <Button onclick={reset} style="background-color: #c20202;">
                Reset
            </Button>

            <Button onclick={confirmSubmission}>
                Confirm
            </Button>
        </div>
    </div>
</Modal>

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

            <Button href={"/tutorial"} style="background-color: var(--carrot-orange);">
                Tutorial
            </Button>
        </div>
    </div>
</Modal>

<Modal bind:showModal={showWinModal} bind:canShowModal>
    {#if game}
        <Winmodal {game} {playback} {distribution} {totalPlayers} />
    {/if}
</Modal>

<div class={`page${menuMode ? " menu-mode" : ""}`}>

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
                    height: ${tileDisplaySize}px;`
                }
            />
        {/each}
    </div>

    <div class="nav">
        <Navlink href="/editor" title="editor">
            <svg fill="white" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path d="M474.1 398.2L289.1 212c18.3-47 8.1-102.3-30.5-141.1C217.9 30 156.9 21.8 108.1 44.3l87.4 88-61 61.4-89.5-88c-24.3 49-14.1 110.4 26.5 151.3 38.6 38.9 93.5 49.1 140.3 30.7l185 186.2c8.1 8.2 20.3 8.2 28.5 0l46.8-47c10.2-8.3 10.2-22.6 2-28.7z"></path></svg>
        </Navlink>

        <Navlink href="/tutorial" title="tutorial">
            <svg fill="white" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path d="M256 76c48.1 0 93.3 18.7 127.3 52.7S436 207.9 436 256s-18.7 93.3-52.7 127.3S304.1 436 256 436c-48.1 0-93.3-18.7-127.3-52.7S76 304.1 76 256s18.7-93.3 52.7-127.3S207.9 76 256 76m0-28C141.1 48 48 141.1 48 256s93.1 208 208 208 208-93.1 208-208S370.9 48 256 48z"></path><path d="M256.7 160c37.5 0 63.3 20.8 63.3 50.7 0 19.8-9.6 33.5-28.1 44.4-17.4 10.1-23.3 17.5-23.3 30.3v7.9h-34.7l-.3-8.6c-1.7-20.6 5.5-33.4 23.6-44 16.9-10.1 24-16.5 24-28.9s-12-21.5-26.9-21.5c-15.1 0-26 9.8-26.8 24.6H192c.7-32.2 24.5-54.9 64.7-54.9zm-26.3 171.4c0-11.5 9.6-20.6 21.4-20.6 11.9 0 21.5 9 21.5 20.6s-9.6 20.6-21.5 20.6-21.4-9-21.4-20.6z"></path></svg>
        </Navlink>

        <Navlink href="https://discord.gg/dSDRre7nC" title="discord">
            <svg fill="white" viewBox="0 0 640 512" xmlns="http://www.w3.org/2000/svg"><path d="M524.531,69.836a1.5,1.5,0,0,0-.764-.7A485.065,485.065,0,0,0,404.081,32.03a1.816,1.816,0,0,0-1.923.91,337.461,337.461,0,0,0-14.9,30.6,447.848,447.848,0,0,0-134.426,0,309.541,309.541,0,0,0-15.135-30.6,1.89,1.89,0,0,0-1.924-.91A483.689,483.689,0,0,0,116.085,69.137a1.712,1.712,0,0,0-.788.676C39.068,183.651,18.186,294.69,28.43,404.354a2.016,2.016,0,0,0,.765,1.375A487.666,487.666,0,0,0,176.02,479.918a1.9,1.9,0,0,0,2.063-.676A348.2,348.2,0,0,0,208.12,430.4a1.86,1.86,0,0,0-1.019-2.588,321.173,321.173,0,0,1-45.868-21.853,1.885,1.885,0,0,1-.185-3.126c3.082-2.309,6.166-4.711,9.109-7.137a1.819,1.819,0,0,1,1.9-.256c96.229,43.917,200.41,43.917,295.5,0a1.812,1.812,0,0,1,1.924.233c2.944,2.426,6.027,4.851,9.132,7.16a1.884,1.884,0,0,1-.162,3.126,301.407,301.407,0,0,1-45.89,21.83,1.875,1.875,0,0,0-1,2.611,391.055,391.055,0,0,0,30.014,48.815,1.864,1.864,0,0,0,2.063.7A486.048,486.048,0,0,0,610.7,405.729a1.882,1.882,0,0,0,.765-1.352C623.729,277.594,590.933,167.465,524.531,69.836ZM222.491,337.58c-28.972,0-52.844-26.587-52.844-59.239S193.056,219.1,222.491,219.1c29.665,0,53.306,26.82,52.843,59.239C275.334,310.993,251.924,337.58,222.491,337.58Zm195.38,0c-28.971,0-52.843-26.587-52.843-59.239S388.437,219.1,417.871,219.1c29.667,0,53.307,26.82,52.844,59.239C470.715,310.993,447.538,337.58,417.871,337.58Z"></path></svg>
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
                    <button onclick={lastDay} disabled={game.day === 1} class="carrot-left">
                        <img alt="" src={carrot_start}/>
                    </button>
                    <div class="day-text">
                        {#each (`day ${game.day} - ` + game.title) as char, i}
                            <span class="char" style={`--index: ${i}`}>{char === ' ' ? '\u00A0' : char}</span>
                        {/each}
                    </div>
                    <button onclick={nextDay} disabled={!canGoNext} class="carrot-right">
                        <img alt="" src={carrot_end}/>
                    </button>

                    <div class="hover-overlay-left">
                        last day
                    </div>

                    <div class="hover-overlay-right">
                        next day
                    </div>
                </div>

                
            </div>

            <div class="author">
                level by {game.author}
            </div>
        {/if}
    </header>

    <div class="game" bind:this={gameEl}>
        {#if tileSheet && characterSheet}
           <Board 
                game={(game.status === "playback" || alreadyPlayedToday) ? playbackGame : game} 
                {tileSheet} 
                {characterSheet} 
                {loaded}
                isTuye={getContext('isTuye')}
            />
        {/if}
        <div class="game-info">
            <div class="moves">
                <button class="score" onclick={() => scoreMode = !scoreMode}>
                    {#if scoreMode}
                        score: {game.getScore()}
                    {:else}
                        moves: {game.moves.length}
                    {/if}
                </button>
                {#if bestGame.moves.length !== 0} 
                    <button class="best" onclick={setToBest}>best: {bestGame.getScore()} {"<"}</button>
                {/if}
            </div>

            <div class="button-dock">
                <Button
                    onclick={() => game.undo()}
                    style="background-color: var(--carrot-orange);"
                    disabled={game.undone || game.history.length === 0}
                >
                    ↩
                </Button>

                <Button 
                    onclick={() => reset()} 
                    style="background-color: var(--reset-red);" className="reset-btn"
                    disabled={alreadyPlayedToday || game.status !== "playing"}
                >Reset</Button>

                <Button onclick={() => { showWinModal = true; game.status = "won" }} disabled={!scoreSubmitted || game.status === "playback"}>
                    Stats
                </Button>
            </div>
        </div>
    </div>


    {#if isMobile && game.status === "playing"}
        <MobileDeck 
            move={mobileMove}
        />
    {/if}

    <div class="meta">
        <a href="https://github.com/miniaturity/lovebunny" target="_blank" rel="noopener noreferrer">github repo</a>
        <span>&middot;</span>
        game by miniaturity
    </div>
</div>

{#if menuMode}
    <div class={`focus-container${focusedMenu ? " focused" : ""}`}>

    </div>
{/if}

{#if renderDialogue}
    <Dialogue
        bind:renderDialogue
        dialogue={TIP_DIALOGUE}
        dialogueKey={"tip"}
        bind:finished
        audioEnabled={false}
    />
{/if}

<style lang="scss">
    :global(body) {
        overflow-x: hidden;
    }

    .score {
        border: none;
        background: transparent;
    }

    .nav {
        position: absolute;
        top: 0;
        left: 0;
        padding: 8px;
    }

    .meta {
        position: absolute;
        bottom: 0; left: 0;
        padding: 8px;
        font-family: "Halogen";
        opacity: 0.5;
        color: #fff;

        & a {
            color: #fff;

            &:hover {
                color: #d8d8d8;
            }
        }

        @media screen and (max-width: 768px) {
            font-size: 0.4rem;
        }
    }



    .hover-overlay-left, .hover-overlay-right {
        position: absolute;
        top: 0; left: 0;
        width: 100%; height: 100%;

        display: flex;
        align-items: center;
        justify-content: center;

        pointer-events: none;
        opacity: 0;
        
        transition: opacity 0.5s cubic-bezier(0.165, 0.84, 0.44, 1);
    }

    .hover-overlay-left {
        z-index: 4;
    }

    .hover-overlay-right {
        z-index: 5;
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
        overflow-x: hidden;
    }

    .carrot-left, .carrot-right {
        border: none;
        margin: 0;
        background: transparent;

        width: 100%; height: 100%;

        cursor: pointer;
    }

    .day:has(.carrot-left:hover) {
        margin-right: 2rem;

        .day-text > span {
            opacity: 0;
        }

        .hover-overlay-left {
            opacity: 1;
        }
    }

    .day:has(.carrot-right:hover) {
        margin-left: 2rem;

        .day-text > span {
            opacity: 0;
        }

        .hover-overlay-right {
            opacity: 1;
        }
    } 

    .menu-mode {
        filter: brightness(0.5);
    }

    .focus-container {
        position: absolute;
        top: 0; left: 0;
        z-index: 55;
        backdrop-filter: brightness(2);
        width: 100vw; height: 100vh;
    
        transition: all 0.5s ease-in-out;
    }

    .focused {
        width: 65px !important; 
        height: 115px !important;
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

        @media screen and (max-width: 768px) {
            margin-bottom: 10vh;
        }
    }

    .score {
        font-family: "Halogen";
        color: #fff;
        font-size: 1.5rem;
        cursor: pointer;
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

        @media screen and (max-width: 768px) {
            font-size: 1rem;
        }
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
            position: relative;
            flex-direction: row;
            align-items: center;
            justify-content: center;
            padding: 12px;

            transition: margin 0.5s cubic-bezier(0.22, 1, 0.36, 1);

            & img {
                height: 100%; width: auto;
            }

            & .day-text {
                width: fit-content;
                white-space: nowrap;
                background-color: var(--carrot-orange);
                padding: 8px;

                & span {
                    transition: opacity 0.5s cubic-bezier(0.165, 0.84, 0.44, 1);
                }
            }
        }
    }

    .author {
        color: #ffffff6d;
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

    .best {
        border: none;
        background: transparent;
        font-family: "Halogen";
        color: #fff;
        opacity: 0.8;
        cursor: pointer;

        &:hover {
            opacity: 1;
        }
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