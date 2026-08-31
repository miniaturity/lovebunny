<script lang="ts">
    import EditorBoard from "$lib/components/editor/editorBoard.svelte";
    import EditorDeck, { type SolveStatus, type Tool, type UploadStatus } from "$lib/components/editor/editorDeck.svelte";
    import ts from "$lib/assets/sprites/spritesheet.png";
    import cs from "$lib/assets/sprites/charactersheet.png";
    import { onMount } from "svelte";
    import wave from "$lib/assets/images/wave.gif";
    import Navlink from "$lib/components/util/navlink.svelte";
    import { DEFAULT_GAME } from "$lib/levels/default";
    import { solveLevel } from "$lib/state/game/solver";
    import {
        type LevelData,
        cloneBoard,
        clampPosition,
        resizeBoard,
        downloadLevel,
        parseLevel,
        MIN_BOARD_SIZE,
        MAX_BOARD_SIZE
    } from "$lib/data/leveldata";
    import Board from "$lib/components/game/board.svelte";
    import { Game, type EditorMode } from "$lib/state/game/game.svelte";
    import { publishLevel } from "$lib/api/levels";
    import Modal from "$lib/components/util/modal.svelte";
    import { editorLevel } from "$lib/state/store";
    import Button from "$lib/components/util/button.svelte";

    import carrot_start from "$lib/assets/images/carrot-start.png";
    import carrot_end from "$lib/assets/images/carrot-end.png";

    let tileSheet = $state<HTMLImageElement>();
    let characterSheet = $state<HTMLImageElement>();

    

    const TILE_SIZE = 16;

    const WAVE_COUNT = 24;
    let waveTiles = $state<{ top: number; left: number }[]>([]);
    let gameEl = $state<HTMLDivElement>();
    let tileDisplaySize = $state(TILE_SIZE);

    function updateTileDisplaySize() {
        if (!gameEl) return;
        const cols = level.board[0]?.length || 1;
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

    const [initBoard, initA, initB, initTitle, initDay] = DEFAULT_GAME;
    
    let level = $state<LevelData>({
        board: cloneBoard(initBoard),
        a: { ...initA },
        b: { ...initB },
        title: initTitle,
        day: initDay,
        author: "anonymous"
    });


    let editorMode = $state<EditorMode>("edit");
    let game = $derived<Game>(new Game(level.board, level.a, level.b, level.title, level.day, level.author));
    let tool = $state<Tool>(0);
    let importError = $state<string | null>(null);

    let rows = $derived(level.board.length);
    let cols = $derived(level.board[0]?.length ?? 0);

    let solveStatus = $state<SolveStatus>({ state: "checking" });

    onMount(() => {
        // NOTE: assumes a and b are set if board is set
        if ("board" in $editorLevel) {
            level.board = cloneBoard($editorLevel.board);
            level.a = { ...$editorLevel.a };
            level.b = { ...$editorLevel.b };   
        }
    })

    $effect(() => {
        const board = level.board;
        const a = level.a;
        const b = level.b;

        solveStatus = { state: "checking" };

        const solution = solveLevel(board, a, b);
        solveStatus = solution
            ? { state: "solvable", moves: solution }
            : { state: "unsolvable" };

        $editorLevel = { board, a, b };

        return;
    });

    let canShowModal = $state<boolean>(true);
    let showLevelUploadModal = $state<boolean>(false);
    let showClearWarningModal = $state<boolean>(false);
    let showUploadModal = $state<boolean>(false);

    let publishing = $state(false);
    let uploadStatus = $state<UploadStatus>("upload");
    let publishResult = $state<string | null>(null);
    let publishLink = $state<string | null>(null);

    function onUpload() {
        showUploadModal = true;
    }

    async function handleUpload() {
        uploadStatus = "uploading...";

        const status = await handlePublish();
        showUploadModal = false;
        uploadStatus = status;
    }

    async function handlePublish(): Promise<UploadStatus> {
        if (solveStatus.state !== "solvable" || publishing) return "error";

        if (level.author === "") {
            level.author = "anonymous";
        }

        if (level.title === "") {
            level.title = "unamed";
        }

        publishing = true;
        publishResult = null;

        try {
            const { id } = await publishLevel(level);
            publishResult = `published! id: ${id}`;
            publishLink = `https://bunniesin.love/levels/${id}`;
        } catch (e) {
            publishResult = e instanceof Error ? e.message : "failed to publish";
            return "error";
        } finally {
            publishing = false;
            return "upload";
        }
    }

    function handleCell(x: number, y: number) {
        if (typeof tool === "number") {
            if (level.board[y]?.[x] === tool || (positionIsOnBunny(x, y))) return;
            const nextBoard = cloneBoard(level.board);
            nextBoard[y][x] = tool;
            level.board = nextBoard;
        } else if (tool === "bunnyA") {
            if (level.a.x === x && level.a.y === y) return;
            level.a = { x, y };
        } else if (tool === "bunnyB") {
            if (level.b.x === x && level.b.y === y) return;
            level.b = { x, y };
        }
    }

    function positionIsOnBunny(x: number, y: number) {
        const isBunnyA = x === level.a.x && y === level.a.y;
        const isBunnyB = x === level.b.x && y === level.b.y;

        return isBunnyA && isBunnyB;
    }

    function handleResize(newRows: number, newCols: number) {
        const nextRows = Math.min(Math.max(newRows, MIN_BOARD_SIZE), MAX_BOARD_SIZE);
        const nextCols = Math.min(Math.max(newCols, MIN_BOARD_SIZE), MAX_BOARD_SIZE);

        level.board = resizeBoard(level.board, nextRows, nextCols);
        level.a = clampPosition(level.a, nextRows, nextCols);
        level.b = clampPosition(level.b, nextRows, nextCols);
    }

    function handleExport() {
        downloadLevel(level);
    }

    function handleImportFile(file: File) {
        importError = null;

        file.text()
            .then((text) => {
                try {
                    level = parseLevel(text);
                    tool = 1;
                } catch (err) {
                    importError = err instanceof Error ? err.message : "Could not import that file.";
                }
            })
            .catch(() => {
                importError = "Could not read that file.";
            });
    }

    function clearEditor() {
        level = {
            board: cloneBoard(initBoard),
            a: { ...initA },
            b: { ...initB },
            title: initTitle,
            day: initDay,
            author: "anonymous"
        }

        showClearWarningModal = false;
    }

    $effect(() => {
        if (editorMode === "play") {
            game.status = "playing";
        } else if (editorMode === "edit" && game.status !== "menu") {
            game = new Game(level.board, level.a, level.b, level.title, level.day, level.author);
            game.status = "menu";
        }
    });
    
    $effect(() => {
        if (publishResult) {
            showLevelUploadModal = true;
        }
    });
</script>

<svelte:head>
    <title>editor</title>
</svelte:head>

<Modal
    bind:canShowModal
    bind:showModal={showUploadModal}
>
    <div class="u-modal-content">
        <header>confirm upload</header>
        <div class="subtitle">
            <div class="day">
                <img alt="" src={carrot_start}/>
                <div class="day-text">
                    {#each (`${level.title} by ` + game.author) as char, i}
                        <span class="char" style={`--index: ${i}`}>{char === ' ' ? '\u00A0' : char}</span>
                    {/each}
                </div>
                <img alt="" src={carrot_end}/>
            </div>
        </div>
        <div class="meta-menu">
            <label class="meta-field">
                <span class="meta-label">level</span>
                <input
                    type="text"
                    class="meta-input"
                    placeholder="level name"
                    maxlength="40"
                    bind:value={level.title}
                >
            </label>

            <label class="meta-field">
                <span class="meta-label">by</span>
                <input
                    type="text"
                    class="meta-input"
                    placeholder="author"
                    maxlength="40"
                    bind:value={level.author}
                >
            </label>
        </div>
        <div class="u-button-dock">
            <Button
                onclick={handleUpload}
            >
                Upload
            </Button>
            <Button
                onclick={() => { showUploadModal = false; canShowModal = true }}
                style="background-color: var(--carrot-orange)"
            >
                Back
            </Button>
        </div>
    </div>
</Modal>

<Modal 
    bind:canShowModal
    bind:showModal={showClearWarningModal}
>
    <div class="w-modal-content">
        <header>would you actually like to clear?</header>
        <p>this is irreversible!</p>

        <div class="w-button-dock">
            <Button
                onclick={clearEditor}
                style="background-color: var(--reset-red);"
            >
                Clear
            </Button>
            <Button
                onclick={() => { showClearWarningModal = false; canShowModal = true }}
            >
                Back
            </Button>
        </div>
    </div>
</Modal>

<Modal bind:canShowModal bind:showModal={showLevelUploadModal}>
    <div class="lu-modal-content">
        <div class="result">
            {publishResult}
        </div>
        
        {#if publishLink}
            <a class="link" href={publishLink}>
                {publishLink}
            </a>
        {/if}
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
        <Navlink href={"/"} title={"back"}>
            <svg fill="white" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l160 160c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L106.5 288 480 288c17.7 0 32-14.3 32-32s-14.3-32-32-32l-373.5 0 108.2-108.2c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-160 160z"></path></svg>
        </Navlink>
    </div>

    
    <div class="editor-layout">
        <div class="game" bind:this={gameEl}>
            {#if tileSheet && characterSheet && editorMode === "edit"}
                <EditorBoard
                    board={level.board}
                    a={level.a}
                    b={level.b}
                    {tool}
                    {tileSheet}
                    {characterSheet}
                    onCell={handleCell}
                />
            {:else if tileSheet && characterSheet}
                <Board 
                    {game}
                    {tileSheet}
                    {characterSheet}
                    loaded
                />
            {/if}
        </div>
    </div>

    {#if tileSheet && characterSheet}
        <EditorDeck
            bind:title={level.title}
            bind:author={level.author}
            bind:day={level.day}
            {rows}
            {cols}
            bind:tool
            {tileSheet}
            {characterSheet}
            {solveStatus}
            {importError}
            onResize={handleResize}
            onExport={handleExport}
            onImportFile={handleImportFile}
            bind:editorMode
            {game}
            publishLevel={onUpload}
            onClear={() => showClearWarningModal = true}
        />
    {/if}

</div>

<style lang="scss">
    .meta-menu {
        display: flex;
        flex-direction: column;
        gap: 4px;
        margin-bottom: 12px;
    }

    .meta-field {
        display: flex;
        flex-direction: row;
        align-items: stretch;
        box-shadow: 2px 2px #000;
    }

    .meta-label {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 8px;
        font-family: "Halogen";
        font-size: clamp(1rem, 1.1vw, 1.3rem);
        color: #fff;
        background-color: var(--grass-green);
    }

    .meta-input {
        width: 140px;
        padding: 8px;
        border: none;
        outline: none;
        font-family: "Halogen";
        font-size: clamp(1rem, 1.1vw, 1.3rem);
        color: #000;
        background-color: #fff;

        &::placeholder {
            color: #969696;
        }

        &:focus {
            background-color: #fef6d8;
        }

        @media screen and (max-width: 768px) {
            width: 100px;
        }
    }

    .subtitle {
        display: flex;
        flex-direction: row;
        font-size: clamp(1rem, 2vw, 1.2rem);
        color: #fff;
        margin: 12px;
        

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

    .w-modal-content, .u-modal-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 8px;
    }

    header {
        font-size: 1.4rem;
    }

    

    .lu-modal-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 8px;

        & .result {
            font-size: 1.4rem;
            padding: 8px;
            background-color: var(--grass-green);
            box-shadow: 2px 2px #000;
            color: #fff;
        }
    }
    .nav {
        position: absolute;
        top: 0;
        left: 0;
        padding: 8px;
        z-index: 2;
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
        padding: 16px;
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

    .editor-layout {
        position: relative;
        z-index: 1;
        display: flex;
        flex-wrap: wrap;
        align-items: flex-start;
        justify-content: center;
        gap: 16px;
    }

    .game {
        position: relative;
        width: clamp(320px, 40vw, 800px);
        aspect-ratio: 1 / 1;
    }
</style>