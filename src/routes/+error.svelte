<script lang="ts">
    import { page } from "$app/state";
    import Button from "$lib/components/util/button.svelte";
    import { onMount } from "svelte";
    import wave from "$lib/assets/images/wave.gif";

    const TILE_SIZE = 64;

    const WAVE_COUNT = 24;
    let waveTiles = $state<{ top: number; left: number }[]>([]);
    let tileDisplaySize = $state(TILE_SIZE);

    onMount(() => {
        waveTiles = Array.from({ length: WAVE_COUNT }, () => ({
            top: Math.random() * 100,
            left: Math.random() * 100
        }));
    });
</script>

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
                    height: ${tileDisplaySize}px;`
                }
            />
        {/each}
    </div>

<div class="page">
    <div class="card">
        <header><span class="err">error {page.status}</span> - {page.error?.message} </header>
     
        <div id="bug">report any bugs to @miniaturity on discord!</div>
        <div>
            <Button
                href="/"
            >
                home
            </Button>
        </div>
    </div>
</div>

<style lang="scss">
    .page {
        width: 100vw; height: 100vh;

        display: flex;
        align-items: center;
        justify-content: center;
    }

    .err {
        padding: 4px;
        background-color: var(--reset-red);
        box-shadow: 2px 2px #000;
        color: #fff;
    }

    .card {
        padding: 8px;
        background-color: #fff;
        box-shadow: 2px 2px #000;
        font-family: "Halogen";

        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 8px;

        max-width: 400px;
        text-align: center;

        z-index: 10;
    }

    #bug {
        margin-bottom: 12px;
    }

    header {
        font-size: 1.4rem;
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
</style>