<script lang="ts">
    import { Game } from '$lib/state/game.svelte';
    import { RuleTile } from '$lib/state/ruletile';
    import { DIRECTION_ROWS, type EntityState } from '$lib/state/tiles';
    
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

    $effect(() => {
        const ctx = canvasRef.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;

        function render(timestamp: number) {
            if (!ctx) return;
            ctx.clearRect(0, 0, canvasRef.width, canvasRef.height);

            for (let y = 0; y < game.board.length; y++) {
                for (let x = 0; x < game.board[y].length; x++) {
                    const tile = game.board[y][x];

                    let srcX = 0;
                    let srcY = 0;
                    let rotation = 0;
                    let flipX = false;

                    if (tile instanceof RuleTile) {
                        const spriteResult = tile.getSprite(game, x, y, timestamp);
                        srcX = spriteResult.x;
                        srcY = spriteResult.y;
                        rotation = spriteResult.rotationAngle;
                        flipX = spriteResult.flipX;
                    } else {
                        srcX = 0;
                        srcY = 0;
                    }

                    drawTile(ctx, tileSheet, x, y, srcX, srcY, rotation, flipX);
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


    function drawTile(
        ctx: CanvasRenderingContext2D, 
        sheet: HTMLImageElement,
        boardX: number, boardY: number, 
        srcCol: number, srcRow: number, 
        rotationAngle: number, flipX: boolean
    ) {
        ctx.save();
        
        const destX = boardX * TILE_SIZE;
        const destY = boardY * TILE_SIZE;
        
        const centerX = destX + (TILE_SIZE / 2);
        const centerY = destY + (TILE_SIZE / 2);
        ctx.translate(centerX, centerY);

        if (rotationAngle !== 0) {
            ctx.rotate((rotationAngle * Math.PI) / 180);
        }
        if (flipX) {
            ctx.scale(-1, 1);
        }

        ctx.drawImage(
            sheet,
            srcCol * SPRITE_SIZE, 
            srcRow * SPRITE_SIZE, 
            SPRITE_SIZE, SPRITE_SIZE, 
            -TILE_SIZE / 2, 
            -TILE_SIZE / 2, 
            TILE_SIZE, TILE_SIZE
        );

        ctx.restore();
    }

    function drawEntity(
        ctx: CanvasRenderingContext2D, 
        entity: EntityState, 
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
    width={game.board[0]?.length * TILE_SIZE || 0} 
    height={game.board.length * TILE_SIZE || 0}
    class="game-canvas"
></canvas>

<style>
    .game-canvas {
        border-radius: 8px;
        
        image-rendering: pixelated; 
    }
</style>