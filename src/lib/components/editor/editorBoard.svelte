<script lang="ts">
    import { mapToBoard, BOARD_BORDER, getTile } from '$lib/state/tile/tiles';
    import type { Position } from '$lib/state/tile/tile';
    import { type Rotation } from '$lib/state/tile/ruletile';

    let {
        board,
        a,
        b,
        tool,
        tileSheet,
        characterSheet,
        onCell
    }: {
        board: number[][];
        a: Position;
        b: Position;
        tool: number | 'bunnyA' | 'bunnyB';
        tileSheet: HTMLImageElement;
        characterSheet: HTMLImageElement;
        onCell: (x: number, y: number) => void;
    } = $props();

    let canvasRef: HTMLCanvasElement;
    let painting = false;
    let lastCell: { x: number; y: number } | null = null;
    let hoveredCell = $state<{ x: number; y: number } | null>(null);

    const TILE_SIZE = 16;
    const SPRITE_SIZE = 16;
    const SCALE = 4;

    let renderBoard = $derived(mapToBoard(board));
    let boardStandin = $derived({ board: renderBoard } as unknown as import('$lib/state/game/game.svelte').Game);

    let canvasWidth = $derived((renderBoard[0]?.length ?? 0) * TILE_SIZE * SCALE);
    let canvasHeight = $derived(renderBoard.length * TILE_SIZE * SCALE);

    function getTileBorderColor(): string {
        const fallback = 'rgba(253, 224, 244, 0.5)';
        if (!canvasRef) return fallback;

        const raw = getComputedStyle(canvasRef).getPropertyValue('--lpink').trim();
        if (!raw) return fallback;

        let r: number, g: number, b: number;

        if (raw.startsWith('#')) {
            let hex = raw.slice(1);
            if (hex.length === 3) {
                hex = hex.split('').map((c) => c + c).join('');
            }
            r = parseInt(hex.slice(0, 2), 16);
            g = parseInt(hex.slice(2, 4), 16);
            b = parseInt(hex.slice(4, 6), 16);
        } else {
            const match = raw.match(/[\d.]+/g);
            if (!match || match.length < 3) return fallback;
            [r, g, b] = match.map(Number);
        }

        if ([r, g, b].some((v) => Number.isNaN(v))) return fallback;

        return `rgba(${r}, ${g}, ${b}, 0.1)`;
    }

    $effect(() => {
        const ctx = canvasRef.getContext('2d');
        if (!ctx) return;

        const tileBorderColor = getTileBorderColor();
        let animationFrameId: number;

        function render(timestamp: number) {
            if (!ctx) return;

            ctx.resetTransform();
            ctx.clearRect(0, 0, canvasRef.width, canvasRef.height);

            ctx.imageSmoothingEnabled = false;
            ctx.scale(SCALE, SCALE);

            for (let y = 0; y < renderBoard.length; y++) {
                for (let x = 0; x < renderBoard[y].length; x++) {
                    const isHoveredPreview =
                        typeof tool === 'number' &&
                        x - BOARD_BORDER === hoveredCell?.x &&
                        y - BOARD_BORDER === hoveredCell?.y;

                    const tile = isHoveredPreview ? getTile(tool) : renderBoard[y][x];
                    const spriteCoord = tile.getSprite(boardStandin, x, y, timestamp);

                    const rotationAngle = 'rotationAngle' in spriteCoord ? (spriteCoord.rotationAngle as Rotation) : 0;
                    const flipX = 'flipX' in spriteCoord ? spriteCoord.flipX : false;

                    if (rotationAngle === 0 && !flipX) {
                        ctx.drawImage(
                            tileSheet,
                            spriteCoord.x * SPRITE_SIZE,
                            spriteCoord.y * SPRITE_SIZE,
                            SPRITE_SIZE, SPRITE_SIZE,
                            x * TILE_SIZE, y * TILE_SIZE,
                            TILE_SIZE, TILE_SIZE
                        );
                    } else {
                        ctx.save();
                        ctx.translate(x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2);
                        if (rotationAngle) ctx.rotate((rotationAngle * Math.PI) / 180);
                        if (flipX) ctx.scale(-1, 1);
                        ctx.drawImage(
                            tileSheet,
                            spriteCoord.x * SPRITE_SIZE, spriteCoord.y * SPRITE_SIZE,
                            SPRITE_SIZE, SPRITE_SIZE,
                            -TILE_SIZE / 2, -TILE_SIZE / 2,
                            TILE_SIZE, TILE_SIZE
                        );
                        ctx.restore();
                    }

                    const isEditable = x > 1 && x < renderBoard[0].length - 2 && y > 1 && y < renderBoard.length - 2;
                    if (isEditable) {
                        ctx.strokeStyle = tileBorderColor;
                        ctx.lineWidth = 1 / SCALE;
                        const offset = (1 / SCALE) / 2;

                        ctx.strokeRect(
                            x * TILE_SIZE + offset,
                            y * TILE_SIZE + offset,
                            TILE_SIZE - (offset * 2),
                            TILE_SIZE - (offset * 2)
                        );
                    }
                }
            }

            if (hoveredCell) {
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 1.5 / SCALE;
                ctx.strokeRect(
                    (hoveredCell.x + BOARD_BORDER) * TILE_SIZE + 1,
                    (hoveredCell.y + BOARD_BORDER) * TILE_SIZE + 1,
                    TILE_SIZE - 2,
                    TILE_SIZE - 2
                );
            }

            drawEntity(ctx, a, 0, timestamp);
            drawEntity(ctx, b, 1, timestamp);

            animationFrameId = requestAnimationFrame(render);
        }

        animationFrameId = requestAnimationFrame(render);

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    });


    function drawEntity(
        ctx: CanvasRenderingContext2D,
        pos: Position,
        entityRow: number,
        timestamp: number
    ) {
        ctx.save();

        const IDLE_FRAME_MS = 400;
        const frameIndex = Math.floor(timestamp / IDLE_FRAME_MS) % 2;

        const destX = (pos.x + BOARD_BORDER) * TILE_SIZE;
        const destY = (pos.y + BOARD_BORDER) * TILE_SIZE;

        const centerX = destX + (TILE_SIZE / 2);
        const centerY = destY + (TILE_SIZE / 2);
        ctx.translate(centerX, centerY);

        const srcX = frameIndex * SPRITE_SIZE;
        const srcY = entityRow * SPRITE_SIZE;

        ctx.drawImage(
            characterSheet,
            srcX, srcY,
            SPRITE_SIZE, SPRITE_SIZE,
            -TILE_SIZE / 2, -TILE_SIZE / 2,
            TILE_SIZE, TILE_SIZE
        );

        ctx.restore();
    }

    function cellFromPointer(e: PointerEvent): { x: number; y: number } | null {
        const rect = canvasRef.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return null;

        const scaleX = canvasRef.width / rect.width;
        const scaleY = canvasRef.height / rect.height;

        const px = (e.clientX - rect.left) * scaleX;
        const py = (e.clientY - rect.top) * scaleY;

        const paddedX = Math.floor(px / (TILE_SIZE * SCALE));
        const paddedY = Math.floor(py / (TILE_SIZE * SCALE));

        const x = paddedX - BOARD_BORDER;
        const y = paddedY - BOARD_BORDER;

        const rows = board.length;
        const cols = board[0]?.length ?? 0;
        if (x < 0 || y < 0 || x >= cols || y >= rows) return null;

        return { x, y };
    }

    function handlePointerDown(e: PointerEvent) {
        const cell = cellFromPointer(e);
        if (!cell) return;

        canvasRef.setPointerCapture(e.pointerId);
        painting = true;
        lastCell = cell;
        onCell(cell.x, cell.y);
    }

    function handlePointerMove(e: PointerEvent) {
        const cell = cellFromPointer(e);
        hoveredCell = cell;
        if (!cell) return;
        
        if (painting && (!lastCell || lastCell.x !== cell.x || lastCell.y !== cell.y)) {
            lastCell = cell;
            onCell(cell.x, cell.y);
        }
    }

    function stopPainting() {
        painting = false;
        lastCell = null;
    }

</script>

<canvas
    bind:this={canvasRef}
    width={canvasWidth}
    height={canvasHeight}
    class="editor-canvas"
    class:tool-bunny={tool === 'bunnyA' || tool === 'bunnyB'}
    onpointerdown={handlePointerDown}
    onpointermove={handlePointerMove}
    onpointerup={stopPainting}
    onpointercancel={stopPainting}
    onpointerleave={() => { hoveredCell = null; }}
></canvas>

<style>
    .editor-canvas {
        width: 100%; height: 100%;
        touch-action: none;

        image-rendering: pixelated;
    }

    .editor-canvas.tool-bunny {
        cursor: pointer;
    }
</style>