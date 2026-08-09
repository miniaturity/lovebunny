<script lang="ts">
    import type { Game, MoveName } from "$lib/state/game.svelte";
    import Button from "./button.svelte";
    import Histograph from "./histograph.svelte";

    let { game, playback, distribution, totalPlayers, isUserMade = false }: {
        game: Game;
        playback: (moves: MoveName[]) => void;
        isUserMade?: boolean
        distribution?: Record<string, number>;
        totalPlayers?: number;
    } = $props();

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

    let percentile = $derived.by(() => {
        if (!distribution || !totalPlayers) return null;
        const yours = game.moves.length;
        let atOrBelowYourMoveCount = 0;
        for (const [movesStr, count] of Object.entries(distribution)) {
            if (Number(movesStr) >= yours) atOrBelowYourMoveCount += count;
        }
        return Math.round((atOrBelowYourMoveCount / totalPlayers) * 100);
    });
</script>



<div class="win-modal">
    <div class="left">
        <header>
            your score
        </header>

        <div class="score">
            {game.moves.length} moves
        </div>
    </div>
    
    <div class="right">
        {#if distribution}
            <div class="graph">
                <Histograph {distribution} optimal={game.solution?.length ?? 0} />
            </div>
        {/if}
    </div>
</div>

<style lang="scss">
    .win-modal {
        display: flex;
        flex-direction: row;
        align-items: center;
        min-width: 300px;
        --pad: 12px;
    }
</style>