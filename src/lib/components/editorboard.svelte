<script lang="ts">
    import { Game } from '$lib/state/game.svelte';
    import { type Rotation } from '$lib/state/ruletile';
    import { type Entity } from '$lib/state/entity';

    let {
        game,
        tileSheet,
        characterSheet
    }: {
        game: Game;
        tileSheet: HTMLImageElement;
        characterSheet: HTMLImageElement;
    } = $props();

    let canvasRef: HTMLCanvasElement;

    const TILE_SIZE = 16;
    const SPRITE_SIZE = 16;


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

        const SCALE = 4;

        function render(timestamp: number) {
            if (!ctx) return;

            ctx.resetTransform();
            ctx.clearRect(0, 0, canvasRef.width, canvasRef.height);

            ctx.imageSmoothingEnabled = false;
            ctx.scale(SCALE, SCALE);

            for (let y = 0; y < game.board.length; y++) {
                for (let x = 0; x < game.board[y].length; x++) {
                    const tile = game.board[y][x];
                    const spriteCoord = tile.getSprite(game, x, y, timestamp);

                    const rotationAngle = 'rotationAngle' in spriteCoord ? spriteCoord.rotationAngle as Rotation : 0;
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


                    if (x <= 1 || x >= game.board.length - 2) continue;
                    if (y <= 1 || y >= game.board.length - 2) continue;
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

            drawEntity(ctx, game.a, 0, timestamp);
            drawEntity(ctx, game.b, 1, timestamp);

            animationFrameId = requestAnimationFrame(render);
        }

        animationFrameId = requestAnimationFrame(render);

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    });


    function drawEntity(
        ctx: CanvasRenderingContext2D,
        entity: Entity,
        entityRow: number,
        timestamp: number
    ) {
        ctx.save();

        const IDLE_FRAME_MS = 400;
        const frameIndex = Math.floor(timestamp / IDLE_FRAME_MS) % 2;

        const destX = entity.pos.x * TILE_SIZE;
        const destY = entity.pos.y * TILE_SIZE;

        const centerX = destX + (TILE_SIZE / 2);
        const centerY = destY + (TILE_SIZE / 2);
        ctx.translate(centerX, centerY);

        if (entity.facing === 'left') {
            ctx.scale(-1, 1);
        }

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
</script>

<canvas
    bind:this={canvasRef}
    width={(game.board[0]?.length * TILE_SIZE || 0) * 4}
    height={(game.board.length * TILE_SIZE || 0) * 4}
    class="editor-canvas"
></canvas>

<style>
    .editor-canvas {
        width: 100%; height: 100%;

        image-rendering: pixelated;
    }
</style>
