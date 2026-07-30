<script lang="ts">
    import { BRUSHES, MIN_BOARD_SIZE, MAX_BOARD_SIZE } from '$lib/data/leveldata';
    import type { MoveName } from '$lib/state/game.svelte';

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
        onImportFile
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
</script>

<div class="deck">
    
    <div class="swatches">
        {#each BRUSHES as brush (brush.tileId)}
            <button
                class="swatch"
                class:selected={tool === brush.tileId}
                title={brush.name}
                onclick={() => (tool = brush.tileId)}
            >
                <span class="icon" style={iconStyle(tileSheet, TILE_SHEET_SIZE, brush.sprite)}></span>
            </button>
        {/each}
    </div>
</div>

<style lang="scss">
        
</style>