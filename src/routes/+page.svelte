<script lang="ts">
    import Board from "$lib/components/board.svelte";
    import ts from "$lib/assets/sprites/spritesheet.png";
    import cs from "$lib/assets/sprites/charactersheet.png";
    import { Game } from "$lib/state/game.svelte";
    import { DEMO_LEVEL } from "$lib/demo";

    let tileSheet = new Image();
    tileSheet.src = ts;

    let characterSheet = new Image();
    characterSheet.src = cs;


    let game = $state<Game>(new Game(DEMO_LEVEL, { x: 1, y: 1 }, { x: 6, y: 5 }));
</script>

<div class="page">
    <Board 
        {game}
        {tileSheet}
        {characterSheet}
    />
</div>

<style lang="scss">

</style>