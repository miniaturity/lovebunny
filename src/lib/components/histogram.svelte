<script lang="ts">
    import { onMount } from "svelte";

    let {
        distribution,
        optimal,
        playerScore
    }: {
        distribution: Record<string, number>;
        optimal: number;
        playerScore: number;
    } = $props();

    const COLUMN_COUNT = 15;

    // svelte-ignore state_referenced_locally
    // intended to capture only the initial state. derived is unneeded.
    const OVERFLOW_FROM = optimal + 14;

    interface Column {
        offset: number; 
        isOverflow: boolean;
        moveLabel: string; 
        count: number;
        isPlayerColumn: boolean;
    }

    let totalPlayers = $derived(Object.values(distribution).reduce((sum, n) => sum + n, 0));

    let columns = $derived.by<Column[]>(() => {
        const cols: Column[] = [];

        for (let offset = COLUMN_COUNT - 2; offset >= 0; offset--) {
            const moves = optimal + offset;
            cols.push({
                offset,
                isOverflow: false,
                moveLabel: offset === 0 ? "opt" : `+${offset}`,
                count: distribution[String(moves)] ?? 0,
                isPlayerColumn: moves === playerScore
            });
        }

        let overflowCount = 0;
        for (const [movesStr, count] of Object.entries(distribution)) {
            if (Number(movesStr) >= OVERFLOW_FROM) overflowCount += count;
        }
        cols.unshift({
            offset: 9,
            isOverflow: true,
            moveLabel: "14+",
            count: overflowCount,
            isPlayerColumn: playerScore >= OVERFLOW_FROM
        });

        return cols;
    });

    onMount(() => {
        console.log("Player Col Exists?: " + playerScore);
    })

    let maxCount = $derived(Math.max(1, ...columns.map((c) => c.count)));

    let hovered = $state<number | null>(null);

    const CHART_WIDTH = 400;
    const CHART_HEIGHT = 220;
    const BAR_AREA_TOP = 16;
    const BAR_AREA_BOTTOM = 176;
    const BAR_AREA_HEIGHT = BAR_AREA_BOTTOM - BAR_AREA_TOP;
    const SLOT_WIDTH = CHART_WIDTH / COLUMN_COUNT;
    const BAR_WIDTH = SLOT_WIDTH;

    function barHeight(count: number): number {
        if (maxCount === 0) return 0;
        return (count / maxCount) * BAR_AREA_HEIGHT;
    }

    function percentLabel(count: number): string {
        if (totalPlayers === 0) return "0%";
        return `${Math.round((count / totalPlayers) * 100)}%`;
    }
</script>

<div class="histogram">
    {#if totalPlayers === 0}
        <p class="empty">no scores yet today</p>
    {:else}
        <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} role="img" aria-label="distribution of moves taken to solve today's puzzle">
            <line
                x1="0" y1={BAR_AREA_BOTTOM} x2={CHART_WIDTH} y2={BAR_AREA_BOTTOM}
                class="baseline"
            />

            {#each columns as col, i}
                {@const slotX = i * SLOT_WIDTH} 
                {@const h = Math.max(barHeight(col.count), col.count > 0 ? 3 : 1)}
                {@const barY = BAR_AREA_BOTTOM - h}

                <g
                    class="column"
                    role="cell"
                    aria-label={`${col.moveLabel}: ${col.count} players`}
                    onmouseenter={() => (hovered = i)}
                    onmouseleave={() => (hovered = null)}
                    onfocus={() => (hovered = i)}
                    onblur={() => (hovered = null)}
                    tabindex="0"
                >
                    <rect
                        x={slotX} y={BAR_AREA_TOP}
                        width={SLOT_WIDTH} height={BAR_AREA_HEIGHT}
                        class="hit-area"
                    />

                    <rect
                        x={slotX} y={barY}
                        width={BAR_WIDTH} height={h}
                        class="bar"
                        class:optimal={!col.isOverflow && col.offset === 0}
                        class:overflow={col.isOverflow}
                        class:hovered={hovered === i || col.isPlayerColumn}
                    />

                    <text
                        x={slotX + SLOT_WIDTH / 2} y={BAR_AREA_BOTTOM + 16}
                        class="axis-label"
                        class:optimal-label={!col.isOverflow && col.offset === 0}
                    >{col.moveLabel}</text>
                </g>
            {/each}
        </svg>

        <div class="tooltip-layer">
            {#each columns as col, i}
                {#if hovered === i || (col.isPlayerColumn && !hovered)}
                    {@const slotX = i * SLOT_WIDTH}
                    
                    {@const leftPct = ((slotX + BAR_WIDTH / 2) / CHART_WIDTH) * 100}
                    
                    <div 
                        class="tooltip" 
                        style="left: {leftPct}%; top: 0%;"
                    >
                        <strong>{col.count}</strong> player{col.count === 1 ? "" : "s"}
                        <span class="tooltip-sub">
                            {col.isOverflow ? `${optimal + 14}+ moves` : `${optimal + col.offset} move${col.offset === 0 && optimal === 1 ? "" : "s"}`}
                            &middot; {percentLabel(col.count)}
                        </span>
                    </div>
                {/if}
            {/each}
        </div>

        <p class="caption">score distribution</p>
    {/if}
</div>

<style lang="scss">
    .histogram {
        position: relative;
        width: 100%;
        max-width: 420px;
        font-family: "Halogen", sans-serif;
        color: #000;
    }

    svg {
        width: 100%;
        height: auto;
        overflow: visible;
    }

    .baseline {
        stroke: rgba(255, 255, 255, 0.3);
        stroke-width: 1;
    }

    .hit-area {
        fill: transparent;
    }

    .column {
        cursor: pointer;
        outline: none;
    }

    .bar {
        fill: var(--water-blue);
        transition: fill 0.15s ease, opacity 0.15s ease;
    }

    .bar.optimal {
        fill: var(--carrot-orange);
    }

    .bar.overflow {
        fill: #c20202;
    }

    .bar.hovered {
        fill: var(--lpink, #fde0f4);
    }

    .axis-label {
        font-size: 10px;
        fill: rgb(0, 0, 0);
        text-anchor: middle;
        font-family: "Halogen", sans-serif;
    }

    .axis-label.optimal-label {
        fill: var(--carrot-orange, #f3802d);
        font-weight: bold;
    }

    .tooltip-layer {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%; height: 100%;
        pointer-events: none;
    }

    .tooltip {
        position: absolute;
        top: 0;
        transform: translate(-50%, -100%);
        padding: 6px 10px;
        font-size: 12px;
        white-space: nowrap;
        text-align: center;
        line-height: 1.3;
        color: #000;
    }

    .tooltip-sub {
        display: block;
        font-size: 10px;
        opacity: 0.75;
        color: #000;
    }

    .caption {
        margin: 8px 0 0;
        font-size: 12px;
        text-align: center;
        opacity: 0.8;
    }

    .empty {
        text-align: center;
        opacity: 0.7;
        font-size: 13px;
    }
</style>