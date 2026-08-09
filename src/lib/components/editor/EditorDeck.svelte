<script lang="ts">
    import { BRUSHES, MIN_BOARD_SIZE, MAX_BOARD_SIZE, type LevelData } from '$lib/data/leveldata';
    import { Game, type EditorMode, type MoveName } from '$lib/state/game.svelte';
    import Button from '../button.svelte';

    export type SolveStatus =
        | { state: 'checking' }
        | { state: 'solvable'; moves: MoveName[] }
        | { state: 'unsolvable' };

    export type Tool = number | 'bunnyA' | 'bunnyB';

    let {
        title = $bindable(),
        day = $bindable(),
        rows,
        cols,
        tool = $bindable(),
        tileSheet,
        characterSheet,
        solveStatus,
        importError,
        onResize,
        onExport,
        onImportFile,
        editorMode = $bindable(),
        game,
        publishLevel,
        level
    }: {
        title: string;
        day: number;
        rows: number;
        cols: number;
        tool: Tool;
        tileSheet: HTMLImageElement;
        characterSheet: HTMLImageElement;
        solveStatus: SolveStatus;
        importError: string | null;
        onResize: (rows: number, cols: number) => void;
        onExport: () => void;
        onImportFile: (file: File) => void;
        editorMode: EditorMode;
        game: Game;
        publishLevel: () => Promise<void>
        level: LevelData;
    } = $props();


    const TILE_SHEET_SIZE = { w: 320, h: 48 };
    const CHAR_SHEET_SIZE = { w: 32, h: 48 };
    const ICON_SCALE = 3;

    function iconStyle(
        img: HTMLImageElement,
        sheetSize: { w: number; h: number },
        sprite: { x: number; y: number }
    ) {
        const cell = 16 * ICON_SCALE;
        return `
            background-image: url(${img.src});
            background-position: -${sprite.x * cell}px -${sprite.y * cell}px;
            background-size: ${sheetSize.w * ICON_SCALE}px ${sheetSize.h * ICON_SCALE}px;
            width: ${cell}px; height: ${cell}px;
        `;
    }

    let fileInput = $state<HTMLInputElement>();

    function handleFileChange(e: Event) {
        const input = e.currentTarget as HTMLInputElement;
        const file = input.files?.[0];
        if (file) onImportFile(file);
        input.value = '';
    }

    let statusHidden = $state<boolean>(true);

</script>

<section class="swatches-deck">


    <div class="swatches">
        {#each BRUSHES as brush (brush.tileId)}
            <div class="swatch-wrapper">
                <Button
                    className={`${tool === brush.tileId ? "swatch selected" : "swatch"}`}
                    onclick={() => (tool = brush.tileId)}
                    overrideStyles
                >
                    <span class="icon" style={iconStyle(tileSheet, TILE_SHEET_SIZE, brush.sprite)}></span>
                </Button>

                <div class="swatch-name">
                    {brush.name}
                </div>
            </div>
        {/each}

        <div class="swatch-wrapper">
            <Button
                className={`${tool === "bunnyA" ? "b-swatch selected" : "b-swatch"}`}
                onclick={() => (tool = "bunnyA")}
                overrideStyles
            >
                <span class="icon" style={iconStyle(characterSheet, CHAR_SHEET_SIZE, { x: 0, y: 0 })}></span>
                
            </Button>
            <div class="swatch-name">
                white bunny
            </div>
        </div>

        <div class="swatch-wrapper">
                <Button
                    className={`${tool === "bunnyB" ? "b-swatch selected" : "b-swatch"}`}
                    onclick={() => (tool = "bunnyB")}
                    overrideStyles
                >
                    <span class="icon" style={iconStyle(characterSheet, CHAR_SHEET_SIZE, { x: 0, y: 1 })}></span>
                    
                </Button>
                <div class="swatch-name">
                    brown bunny
                </div>
        </div>
    </div>


</section>



<section class="board-deck">
    <div class="size">
        <div class="indicator">{rows}<span class="sub-indicator">&nbsp;R</span></div>
        <div class="indicator">{cols}<span class="sub-indicator">&nbsp;C</span></div>
    </div>

    <div class="size-editor">
        <Button onclick={() => onResize(rows + 1, cols + 1)} style="flex-grow: 1">
            +
        </Button>
        <Button onclick={() => onResize(rows - 1, cols - 1)} style="flex-grow: 1; background-color: #c20202;">
            -
        </Button>
    </div>
</section>

<section class="solve-indicator">
    <Button onclick={() => statusHidden = !statusHidden } style={`background-color: ${!statusHidden ? "var(--carrot-orange)" : "#c20202"};`}>
        {statusHidden ? "Show" : "Hide"}
    </Button>

    {#if solveStatus.state === "checking"}
        <div class={`checking ${statusHidden ? "hide" : ""}`}>solving...</div>
    {:else if solveStatus.state === "solvable"}
        <div class={`solvable ${statusHidden ? "hide" : ""}`}>solvable in {solveStatus.moves.length} move{solveStatus.moves.length === 1 ? '' : 's'}</div>
    {:else}
        <div class={`unsolvable ${statusHidden ? "hide" : ""}`}>unsolvable!</div>
    {/if}

    <Button disabled={solveStatus.state === "unsolvable" || solveStatus.state === "checking"} style={`background-color: ${editorMode === "play" ? "var(--carrot-orange)" : "var(--grass-green)"}`} onclick={() => editorMode = editorMode === "edit" ? "play" : "edit"}>
        {editorMode === "edit" ? "Play" : "Edit"}
    </Button>
    
    {#if editorMode === "play"}
        <div class="moves">
            {game.moves.length} move{game.moves.length === 1 ? "" : "s"}
        </div>
    {/if}
</section>

<section class="file-deck">
    <Button className="export" onclick={onExport}>
        export
    </Button>
    <Button className="import" onclick={() => fileInput?.click()} style="background-color: var(--carrot-orange)">
        import
    </Button>
    <input
        bind:this={fileInput}
        type="file"
        accept="application/json,.json"
        onchange={handleFileChange}
        hidden
    />
    <div class="seperator">
        /
    </div>
    <Button className="upload" onclick={publishLevel} style="background-color: #fff; color: #000">
        upload
    </Button>
</section>

<section class="meta-deck">
    <input
        type="text"
        class="author-input"
    >

    <input
        type="text"
        class="author-input"
    >
</section>

<style lang="scss">
    .meta-deck {
        display: flex;
        flex-direction: row;
        gap: 8px;

        position: absolute;
        bottom: 0;
        left: 0;
        padding: 8px;
    }
    .file-deck {
        display: flex;
        flex-direction: row;

        position: absolute;
        top: 0;
        padding: 8px;
        gap: 8px;
    }

    .hide {
        filter: blur(8px);
        overflow: hidden;
    }

    .seperator {
        margin: 4px;
        padding: 4px;
        background-color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: "Halogen";
    }


    .checking {
        background-color: var(--carrot-orange);
        color: #fff;
    }

    .solvable {
        background-color: var(--grass-green);
        color: #fff;
    }

    .unsolvable {
        background-color: #c20202;
        color: #fff;
    }

    .play {
        background-color: var(--grass-green) !important;
    }

    .edit {
        background-color: var(--carrot-orange) !important;
    }

    .moves {
        display: flex;
        align-items: center; justify-content: center;
        padding: 8px;
        font-family: "Halogen";
        color: #000;
        background-color: #fff;
        font-size: clamp(1.2rem, 1.2vw, 1.5rem);
    }

    .solve-indicator {
        display: flex;
        flex-direction: row;
        gap: 8px;
        position: absolute;
        bottom: 0;
        padding: 8px;

        font-family: "Halogen";

        & div {
            padding: 8px;
            display: flex;
            align-items: center; justify-content: center;
            box-shadow: 2px 2px #000;
        }
    }

    .size-editor {
        display: flex;
        flex-direction: row;
        font-family: monospace
    }

    .board-deck {
        position: absolute;
        left: 0;
        padding: 8px;

        font-family: "Halogen";
        color: #000;

        display: flex;
        flex-direction: column;
        gap: 8px;

        z-index: 99;
    }

    .size {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .indicator {
        height: 35px;
        padding: 8px;
        display: flex; align-items: center; justify-content: center;
        font-size: clamp(1.2rem, 1.5vw, 1.6rem);
        background-color: #fff;
    }

    .sub-indicator {
        color: #969696;
        font-size: clamp(1rem, 1.1vw, 1.4rem);
    }

    .swatches-deck {
        position: absolute;
        right: 0;
        padding: 8px;
        z-index: 99;
    }

    

    .swatches {
        max-height: 100vh;
        gap: 8px;

        display: flex;
        flex-direction: column;

        --w: 65px;

        @media screen and (max-width: 768px) {
            --w: 45px;
        }
    }

    :global(.swatch-wrapper) {
        display: flex;
        align-items: center;
        justify-content: center;
    }

    :global(.swatch-wrapper:hover) {
        .swatch-name {
            margin-left: -200%;
            opacity: 1;
        }
    }

    :global(.swatch-wrapper:has(.swatch.selected)) {
        .swatch-name {
            margin-left: -200%;
            opacity: 1;
        }
    }

    :global(.swatch-wrapper:has(.b-swatch.selected)) {
        .swatch-name {
            margin-left: -200%;
            opacity: 1;
        }
    }

    :global(.b-swatch) {
        width: var(--w); height: var(--w);
        position: relative;

        display: flex;
        align-items: center;
        justify-content: center;

        border: 3px solid transparent;
        background-color: var(--grass-green);
        padding: 4px !important;
        cursor: pointer;

        & .icon {
            display: block;
            image-rendering: pixelated;
        }

        &:hover {
            border-color: var(--carrot-orange);
        }
    }

    :global(.swatch) {
        width: var(--w); height: var(--w);
        position: relative;

        display: flex;
        align-items: center;
        justify-content: center;

        border: 3px solid transparent;
        background-color: #fff;
        padding: 4px !important;
        cursor: pointer;

        & .icon {
            display: block;
            image-rendering: pixelated;
            
            @media screen and (max-width: 768px) {
                width: 25px !important; height: 25px !important;
                
            }
        }

        &:hover {
            border-color: var(--carrot-orange);
        }

        
    }

    .swatch-name {
        position: absolute;
        font-family: "Halogen";
        color: #fff;
        pointer-events: none;
        margin-left: 200%;
        opacity: 0;
        
        transition: margin 0.3s ease-in-out, opacity 0.3s ease-in-out;

    }

    :global(.selected) {
        border-color: var(--carrot-orange);
    }

</style>