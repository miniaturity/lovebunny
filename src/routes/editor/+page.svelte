<script lang="ts">
    import EditorBoard from "$lib/components/editorboard.svelte";
    import EditorDeck, { type SolveStatus, type Tool } from "$lib/components/editor/EditorDeck.svelte";
    import ts from "$lib/assets/sprites/spritesheet.png";
    import cs from "$lib/assets/sprites/charactersheet.png";
    import { onMount } from "svelte";
    import wave from "$lib/assets/images/wave.gif";
    import Navlink from "$lib/components/navlink.svelte";
    import { DEFAULT_GAME } from "$lib/levels/default";
    import { solveLevel } from "$lib/state/solver";
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
    import { getTile } from "$lib/state/tiles";
    import Board from "$lib/components/board.svelte";
    import { Game, type EditorMode } from "$lib/state/game.svelte";

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
    let game = $derived<Game>(new Game(level.board, level.a, level.b, level.title, level.day));
    let tool = $state<Tool>(0);
    let importError = $state<string | null>(null);

    let rows = $derived(level.board.length);
    let cols = $derived(level.board[0]?.length ?? 0);

    let solveStatus = $state<SolveStatus>({ state: "checking" });

    $effect(() => {
        const board = level.board;
        const a = level.a;
        const b = level.b;

        solveStatus = { state: "checking" };

        const timer = setTimeout(() => {
            const solution = solveLevel(board, a, b);
            solveStatus = solution
                ? { state: "solvable", moves: solution }
                : { state: "unsolvable" };
        }, 200);

        return () => clearTimeout(timer);
    });

    function handleCell(x: number, y: number) {
        if (typeof tool === "number") {
            if (level.board[y]?.[x] === tool || (positionIsOnBunny(x, y) && !getTile(tool).isPassable)) return;
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

    $effect(() => {
        if (editorMode === "play") {
            game.status = "playing";
        } else if (editorMode === "edit" && game.status !== "menu") {
            game = new Game(level.board, level.a, level.b, level.title, level.day);
            game.status = "menu";
        }
    })
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
                />
            {/if}
        </div>
    </div>

    {#if tileSheet && characterSheet}
        <EditorDeck
            bind:title={level.title}
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
        />
    {/if}

</div>

<style lang="scss">
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