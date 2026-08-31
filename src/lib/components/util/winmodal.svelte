<script lang="ts">
    import type { Game, MoveName } from "$lib/state/game/game.svelte";
    import Button from "./button.svelte";
    import Histograph from "../game/histogram.svelte";

    let { game, playback, distribution, totalPlayers, id, isUserMade = false }: {
        game: Game;
        playback: (moves: MoveName[]) => void;
        isUserMade?: boolean;
        id?: string;
        distribution?: Record<string, number>;
        totalPlayers?: number;
    } = $props();

    let shareStatus = $state<"success" | "fail" | null>(null);
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

        let atOrBelowYourMoveCount = 0;
        let atOrWorseCount = 0;
         for (const [movesStr, count] of Object.entries(distribution)) {
            if (Number(movesStr) >= yours) atOrBelowYourMoveCount += count;
            if (Number(movesStr) >= yours) atOrWorseCount += count;
        }

        const percentAtOrWorse = (atOrWorseCount / totalPlayers) * 100;

        if (percentAtOrWorse >= 50) {
            const percent = Math.max(0, Math.round(100 - percentAtOrWorse));
           return { direction: "top" as const, percent };
        } else {
           const percent = Math.max(1, Math.round(percentAtOrWorse));
            return { direction: "bottom" as const, percent };
        }

     });

    async function copyResults(): Promise<void> {
        if (!game.solution) return;

        let text = 
`${!isUserMade ? `day ${game.day}` : `user level`} - "${game.title}" by ${game.author}

${"🥕".repeat(getCarrotCount())}
${game.moves.length === game.solution.length ? `\n🐰 PERFECT game!\n` : ""}
earned ${getCarrotCount()}/5 carrots
${!isUserMade && percentile ? `placed ${percentile.direction === "top" ? "top" : "bottom"} ${percentile.percent}% of ${totalPlayers} 🐇` : ``}
bunniesin.love${isUserMade ? `/levels/${id}` : ``}  `;

        try {
            await navigator.clipboard.writeText(text);
            alert("Copied message to clipboard!");
        } catch (err) {
            console.error("Failed to copy: " + err);
        }
    }

    function getCarrotCount(): number {
        if (!game.solution) return 0;

        let carrotCount = 1;

        const yourMoves = game.moves.length;
        const solution = game.solution.length;

        if (yourMoves <= solution + 10) carrotCount = 2;
        if (yourMoves <= solution + 5) carrotCount = 3;
        if (yourMoves <= solution + 2) carrotCount = 4;
        if (yourMoves === solution) carrotCount = 5;
        
        return carrotCount;
    }
</script>



<div class="win-modal">
    <div class="top">
        <div class="score">
            solved in&nbsp;<span>{playerScore}</span>&nbsp;moves
        </div>
        
        {#if !isUserMade}
            <div class="seperator">
                &middot;
            </div>

            {#if percentile !== null}
                <div class="percentile" style={`--p: ${percentile.direction === "top" ? "var(--grass-green)" : "#c20202"}`}>
                    {percentile.direction === "top" ? "Top" : "Bottom"} {percentile.percent === 0 ? "<1" : percentile.percent}%
                </div>
            {/if}
        {/if}
    </div>

    {#if !isUserMade}
        <div class="bottom">
            {#if distribution}
                <div class="graph">
                    <Histograph {distribution} optimal={game.solution?.length ?? 0} {playerScore} />
                </div>
            {/if}
        </div>
    {:else}
        <div class="score">
            optimal: {game.solution?.length ?? 0} moves
        </div>
    {/if}

    <div class="button-deck">
        <Button onclick={() => playback(game.solution!)}>
            Play Optimal
        </Button>

        <Button onclick={copyResults} style="display: flex; align-items: center; justify-content: center; width: 35px; background-color: var(--carrot-orange)">
            <svg fill="#fff"  viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path d="M378 324a69.78 69.78 0 0 0-48.83 19.91L202 272.41a69.7 69.7 0 0 0 0-32.82l127.13-71.5A69.76 69.76 0 1 0 308.87 129l-130.13 73.2a70 70 0 1 0 0 107.56L308.87 383A70 70 0 1 0 378 324"></path></svg>
        </Button>
    </div>

    {#if shareStatus}
        <div class={`share-status ${shareStatus}`}>
            {shareStatus === "success" ?
                "Copied to clipboard!" :
                "Failed to copy."
            }        
        </div>
    {/if}
</div>

<style lang="scss">
    .win-modal {
        display: flex;
        flex-direction: column;
        align-items: center;
        min-width: 300px;
        --pad: 12px;
    }

    .share-status {
        margin: 8px;
    }
    
    .button-deck {
        display: flex;
        flex-direction: row;
        gap: 8px;
        margin: 8px;
    }

    .top {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        margin: 8px;
        gap: 8px;

        width: 100%;
    }

    .bottom {
        width: fit-content;
        margin: 32px;
        margin-top: 40px;
    }

    .score {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        font-size: 1.2rem;
        & span {
            font-size: 2.5rem;
            background-color: var(--carrot-orange);
            color: #fff;
            padding: 2px 4px;   
            box-shadow: 2px 2px #000;
            animation: mov 2s steps(2) infinite;
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

    @keyframes mov {
        0% {
            transform: rotateZ(4deg);
        } 100% {
            transform: rotateZ(-1deg);
        }   
    }
</style>