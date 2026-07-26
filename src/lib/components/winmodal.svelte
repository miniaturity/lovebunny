<script lang="ts">
    import type { Game, MoveName } from "$lib/state/game.svelte";
    import Button from "./button.svelte";

    let { game, playback }: { game: Game, playback: (moves: MoveName[]) => void } = $props();

    export function getHex(min: number, max: number, value: number): string {
        const minR = 168, minG = 230, minB = 207;
        const maxR = 255, maxG = 139, maxB = 148;

        if (min === max) {
            return '#a8e6cf'; 
        }

        const clampedValue = Math.max(min, Math.min(max, value));

        const ratio = (clampedValue - min) / (max - min);

        const r = Math.round(minR + ratio * (maxR - minR));
        const g = Math.round(minG + ratio * (maxG - minG));
        const b = Math.round(minB + ratio * (maxB - minB));

        const toHex = (c: number) => c.toString(16).padStart(2, '0');

        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }
</script>

<div class="win-modal">
    <header class="win-header">
        <div>day {game.day} - {game.title}</div>
    </header>
    <div class="score-container" style={`--val: ${getHex(game.solution!.length, game.solution!.length + 10, game.moves.length)}`}>
        <div class="sc-title">solved in</div>
        <div class="score">{game.moves.length}</div>
        <div class="percent">Top undefined%</div>
    </div>
    <p style="white-space: pre-line;">
        Optimal: {game.solution!.length}
    </p>
    <div class="wm-button-dock">
        <Button onclick={() => { playback(game.solution!) }}>
            Play Optimal
        </Button>
    </div>
</div>

<style lang="scss">
    .win-modal {
        display: flex;
        flex-direction: column;
        align-items: center;
        min-width: 300px;
        --pad: 12px;
    }

    .win-header {
        font-size: clamp(1.3rem, 1.5vw, 1.9rem);
        padding: var(--pad);
    }

    .score-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 100%;
        background-color: var(--val);
        padding: var(--pad);
    }

    .score {
        font-size: clamp(1.8rem, 5vw, 5rem);
    }

    .wm-button-dock {
        padding: var(--pad);
    }

    p {
        padding: var(--pad);
    }
</style>