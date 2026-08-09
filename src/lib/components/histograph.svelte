<script lang="ts">
    let {
        distribution,
        optimal
    }: {
        distribution: Record<string, number>;
        optimal: number;
    } = $props();

    const COLUMN_COUNT = 10;

    // svelte-ignore state_referenced_locally
    // intended to capture only the initial state. derived is unneeded.
    const OVERFLOW_FROM = optimal + 9;

    interface Column {
        offset: number; 
        isOverflow: boolean;
        moveLabel: string; 
        count: number;
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
                count: distribution[String(moves)] ?? 0
            });
        }

        let overflowCount = 0;
        for (const [movesStr, count] of Object.entries(distribution)) {
            if (Number(movesStr) >= OVERFLOW_FROM) overflowCount += count;
        }
        cols.push({ offset: 9, isOverflow: true, moveLabel: "9+", count: overflowCount });

        // rightmost = optimal, leftmost = overflow
        return cols.reverse();
    });

    let maxCount = $derived(Math.max(1, ...columns.map((c) => c.count)));

    let hovered = $state<number | null>(null);

    const CHART_WIDTH = 400;
    const CHART_HEIGHT = 220;
    const BAR_AREA_TOP = 16;
    const BAR_AREA_BOTTOM = 176;
    const BAR_AREA_HEIGHT = BAR_AREA_BOTTOM - BAR_AREA_TOP;
    const SLOT_WIDTH = CHART_WIDTH / COLUMN_COUNT;
    const BAR_WIDTH = SLOT_WIDTH * 0.6;

    function barHeight(count: number): number {
        if (maxCount === 0) return 0;
        return (count / maxCount) * BAR_AREA_HEIGHT;
    }

    function percentLabel(count: number): string {
        if (totalPlayers === 0) return "0%";
        return `${Math.round((count / totalPlayers) * 100)}%`;
    }
</script>

<div class="histograph">
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
                {@const barX = slotX + (SLOT_WIDTH - BAR_WIDTH) / 2}
                {@const h = Math.max(barHeight(col.count), col.count > 0 ? 3 : 0)}
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
                    <!-- full-height invisible hit area, so short/empty bars are still easy to hover -->
                    <rect
                        x={slotX} y={BAR_AREA_TOP}
                        width={SLOT_WIDTH} height={BAR_AREA_HEIGHT}
                        class="hit-area"
                    />

                    <rect
                        x={barX} y={barY}
                        width={BAR_WIDTH} height={h}
                        rx="3"
                        class="bar"
                        class:optimal={!col.isOverflow && col.offset === 0}
                        class:overflow={col.isOverflow}
                        class:hovered={hovered === i}
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
                {#if hovered === i}
                    {@const leftPercent = ((i + 0.5) / COLUMN_COUNT) * 100}
                    <div class="tooltip" style={`left: ${leftPercent}%;`}>
                        <strong>{col.count}</strong> player{col.count === 1 ? "" : "s"}
                        <span class="tooltip-sub">
                            {col.isOverflow ? `${optimal + 9}+ moves` : `${optimal + col.offset} move${col.offset === 0 && optimal === 1 ? "" : "s"}`}
                            &middot; {percentLabel(col.count)}
                        </span>
                    </div>
                {/if}
            {/each}
        </div>

        <p class="caption">optimal solution: {optimal} move{optimal === 1 ? "" : "s"}</p>
    {/if}
</div>

<style lang="scss">
    .histograph {
        position: relative;
        width: 100%;
        max-width: 420px;
        font-family: "Halogen", sans-serif;
        color: #fff;
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
        fill: var(--water-blue, #5fade4);
        transition: fill 0.15s ease, opacity 0.15s ease;
    }

    .bar.optimal {
        fill: var(--carrot-orange, #f3802d);
    }

    .bar.overflow {
        fill: rgba(255, 255, 255, 0.35);
    }

    .bar.hovered {
        fill: var(--lpink, #fde0f4);
    }

    .axis-label {
        font-size: 10px;
        fill: rgba(255, 255, 255, 0.7);
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
        width: 100%;
        pointer-events: none;
    }

    .tooltip {
        position: absolute;
        top: 0;
        transform: translate(-50%, -100%);
        background: rgba(0, 0, 0, 0.8);
        border: 1px solid var(--lpink, #fde0f4);
        border-radius: 6px;
        padding: 6px 10px;
        font-size: 12px;
        white-space: nowrap;
        text-align: center;
        line-height: 1.3;
    }

    .tooltip-sub {
        display: block;
        font-size: 10px;
        opacity: 0.75;
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