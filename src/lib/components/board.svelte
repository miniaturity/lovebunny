<script lang="ts">
    import { Game } from "$lib/state/game.svelte";
    import { RuleTile } from "$lib/state/ruletile";

    const spriteSheet = new Image();
    // spriteSheet.src = '$lib/assets/ss.png';

    let { game }: { game: Game } = $props();

    let canvasRef: HTMLCanvasElement;
    const TILE_SIZE = 32; // size per tile on the spritesheet

    $effect(() => {
        const ctx = canvasRef.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let lastTime = 0;

        function render(timestamp: number) {
            if (!ctx) return;
            const delta = timestamp - lastTime;

            ctx.clearRect(0, 0, canvasRef.width, canvasRef.height);

            for (let y = 0; y < game.board.length; y++) {
                for (let x = 0; x < game.board[y].length; x++) {
                    const tile = game.board[y][x];
                    let spriteX = 0, spriteY = 0;

                    if (tile instanceof RuleTile) {
                        const coords = tile.getSprite(game, x, y);
                        spriteX = coords.x * TILE_SIZE;
                        spriteY = coords.y * TILE_SIZE;
                    }

                    ctx.drawImage(
                        spriteSheet,
                        spriteX, spriteY, TILE_SIZE, TILE_SIZE,
                        x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE
                    )
                }
            }
        }
    });
</script>

<div class="board-container">
    <canvas bind:this={canvasRef}>

    </canvas>


</div>