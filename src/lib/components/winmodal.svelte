<script lang="ts">
    import type { Game, MoveName } from "$lib/state/game.svelte";
    import Button from "./button.svelte";
    import Histograph from "./histogram.svelte";

    let { game, playback, distribution, totalPlayers, isUserMade = false }: {
        game: Game;
        playback: (moves: MoveName[]) => void;
        isUserMade?: boolean
        distribution?: Record<string, number>;
        totalPlayers?: number;
    } = $props();

    let playerScore = $derived(game.moves.length);

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
        let atOrBelowYourMoveCount = -1; // includes your score
        for (const [movesStr, count] of Object.entries(distribution)) {
            if (Number(movesStr) >= yours) atOrBelowYourMoveCount += count;
        }
        return Math.round((atOrBelowYourMoveCount / totalPlayers) * 100);
    });
</script>



<div class="win-modal">
    <div class="top">
        <header>
            your score
        </header>

        <div class="score">
            <span>{playerScore}</span> moves
        </div>
        
        {#if percentile}
            <div class="percentile" style={`--p: ${percentile > 50 ? "#c20202" : "var(--grass-green)"};`}>
                top {percentile}%
            </div>
        {/if}
    </div>
    
    <div class="bottom">
        {#if distribution}
            <div class="graph">
                <Histograph {distribution} optimal={game.solution?.length ?? 0} {playerScore} />
            </div>
        {/if}
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

    .top {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        margin: 8px;
    }

    .bottom {
        width: fit-content;
        margin: 32px;
        margin-top: 40px;
    }

    .score {
        font-size: 0.8rem;
        & span {
            font-size: 3rem;
        }
    }

    .percentile {
        padding: 4px;
        background-color: var(--p);
        color: #fff;
        box-shadow: 1px 1px #000;

        display: flex;
        align-items: center;
        justify-content: center;
    }
</style>