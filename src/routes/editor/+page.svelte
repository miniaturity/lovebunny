<script lang="ts">
    import wave from "$lib/assets/images/wave.gif";

    const TILE_SIZE = 16;

    const WAVE_COUNT = 24;
    let waveTiles = $state<{ top: number; left: number }[]>([]);
    let gameEl = $state<HTMLDivElement>();
    let tileDisplaySize = $state(TILE_SIZE);

    
</script>

<div class="creator">
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

<style lang="scss">
    .creator {
        position: relative;
        width: 100dvw; min-height: 100dvh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center; 
        background-color: var(--water-blue);
        overflow: hidden;
    }

</style>