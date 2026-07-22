<script lang="ts">
    import { Game } from '$lib/state/game.svelte';
    import { RuleTile, type Rotation } from '$lib/state/ruletile';
    import { StaticTile } from '$lib/state/tile';
    import { DIRECTION_ROWS, type EntityState, type Move } from '$lib/state/tiles';
    
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

                    const spriteCoord = tile.getSprite(game, x, y, timestamp);

                    // RuleTile sprites carry rotation/flip so a single sprite can
                    // serve every orientation; StaticTile sprites fall back to 0/none.
                    const rotationAngle = 'rotationAngle' in spriteCoord ? spriteCoord.rotationAngle as Rotation : 0;
                    const flipX = 'flipX' in spriteCoord ? spriteCoord.flipX : false;

                    if (rotationAngle === 0 && !flipX) {
                        ctx.drawImage(
                            tileSheet,
                            spriteCoord.x * SPRITE_SIZE,
                            spriteCoord.y * SPRITE_SIZE,
                            SPRITE_SIZE,
                            SPRITE_SIZE,
                            x * TILE_SIZE,
                            y * TILE_SIZE,
                            TILE_SIZE,
                            TILE_SIZE
                        );
                    } else {
                        ctx.save();
                        // rotate/flip around the tile centre
                        ctx.translate(x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2);
                        if (rotationAngle) ctx.rotate((rotationAngle * Math.PI) / 180);
                        if (flipX) ctx.scale(-1, 1);
                        ctx.drawImage(
                            tileSheet,
                            spriteCoord.x * SPRITE_SIZE,
                            spriteCoord.y * SPRITE_SIZE,
                            SPRITE_SIZE,
                            SPRITE_SIZE,
                            -TILE_SIZE / 2,
                            -TILE_SIZE / 2,
                            TILE_SIZE,
                            TILE_SIZE
                        );
                        ctx.restore();
                    }
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

    function keydown(e: KeyboardEvent) {
        if (e.key === "x") {
            game.status = 'playing';
            return;
        }
        const keyMap: Record<string, [Move, Move]> = {
            "ArrowUp": [0, -1],
            "ArrowLeft": [-1, 0],
            "ArrowDown": [0, 1],
            "ArrowRight": [1, 0],

            "w": [0, -1],
            "a": [-1, 0],
            "s": [0, 1],
            "d": [1, 0]
        }

        const move = keyMap[e.key];
        if (move) {
            game.move(move[0], move[1]);
        }
    }
</script>

<svelte:window onkeydown={keydown}/>

<canvas 
    bind:this={canvasRef} 
    width={game.board[0]?.length * TILE_SIZE || 0} 
    height={game.board.length * TILE_SIZE || 0}
    class="game-canvas"
></canvas>

<style>
    .game-canvas {
        width: 100%; height: 100%;
        
        image-rendering: pixelated; 
    }
</style>
