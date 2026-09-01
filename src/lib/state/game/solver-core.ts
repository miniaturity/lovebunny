import { type MoveName } from "$lib/state/game/game.svelte";
import { mapToBoard, BOARD_BORDER, type Position, type Move } from "../tile/tiles";

export const SCORE_PER_CARROT = 3;

export interface SolveResult {
    moves: MoveName[];
    score: number;
}

const MOVE_VECTORS: Record<MoveName, { x: Move; y: Move }> = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 }
};

const ALL_MOVES: MoveName[] = ["up", "down", "right", "left"];

// Carrot mask as a bigint rather than a number.. regular 32-bit numbers corrupt if there are 31+ carrots
type CarrotMask = bigint;

interface SolverState {
    ax: number;
    ay: number;
    bx: number;
    by: number;
    mask: CarrotMask;
}

interface AStarNode extends SolverState {
    steps: number; // moves taken so far
    g: number; // cost so far = steps - SCORE_PER_CARROT * (carrots collected so far)
}

function stateKey(s: SolverState): string {
    return `${s.ax},${s.ay},${s.bx},${s.by},${s.mask}`;
}

function isWon(s: SolverState): boolean {
    return Math.abs(s.ax - s.bx) + Math.abs(s.ay - s.by) === 1;
}

function popcount(mask: CarrotMask): number {
    let n = mask;
    let count = 0;
    while (n > 0n) {
        n &= n - 1n; // clears the lowest set bit (Brian Kernighan)
        count++;
    }
    return count;
}

// tiny binary min-heap, keyed by an externally supplied priority
class MinHeap<T> {
    private items: { priority: number; value: T }[] = [];

    get size(): number {
        return this.items.length;
    }

    peekPriority(): number | undefined {
        return this.items[0]?.priority;
    }

    push(priority: number, value: T): void {
        this.items.push({ priority, value });
        let i = this.items.length - 1;
        while (i > 0) {
            const parent = (i - 1) >> 1;
            if (this.items[parent].priority <= this.items[i].priority) break;
            [this.items[parent], this.items[i]] = [this.items[i], this.items[parent]];
            i = parent;
        }
    }

    pop(): T | undefined {
        const top = this.items[0];
        if (!top) return undefined;
        const last = this.items.pop()!;
        if (this.items.length > 0) {
            this.items[0] = last;
            let i = 0;
            for (;;) {
                const left = i * 2 + 1;
                const right = i * 2 + 2;
                let smallest = i;
                if (left < this.items.length && this.items[left].priority < this.items[smallest].priority) smallest = left;
                if (right < this.items.length && this.items[right].priority < this.items[smallest].priority) smallest = right;
                if (smallest === i) break;
                [this.items[smallest], this.items[i]] = [this.items[i], this.items[smallest]];
                i = smallest;
            }
        }
        return top.value;
    }
}

// Admissible heuristic: a lower bound on how much the final cost
// (steps - SCORE_PER_CARROT * carrotsCollected) can still change from here.

function heuristic(s: SolverState, totalCarrots: number): number {
    const dist = Math.abs(s.ax - s.bx) + Math.abs(s.ay - s.by);
    if (dist <= 1) return 0;

    const minRemainingMoves = Math.ceil((dist - 1) / 2);
    const remainingCarrots = totalCarrots - popcount(s.mask);
    return minRemainingMoves - SCORE_PER_CARROT * remainingCarrots;
}

// A* algorithm
export function solveLevelCore(
    map: number[][],
    startA: Position,
    startB: Position,
    carrotPositions?: Position[]
): SolveResult | null {
    const board = mapToBoard(map);

    const isPassable = (x: number, y: number): boolean => {
        if (y < 0 || y >= board.length || x < 0 || x >= board[0].length) return false;
        return board[y][x].isPassable;
    };

    // Offset carrot positions by the border width
    const parsedCarrots = (carrotPositions || []).map((c) => ({
        x: c.x + BOARD_BORDER,
        y: c.y + BOARD_BORDER
    }));
    const totalCarrots = parsedCarrots.length;

    // O(1) collecting carrots
    // opposed to using a linear scan
    const carrotIndicesAt = new Map<string, number[]>();
    const carrotBit: CarrotMask[] = new Array(totalCarrots);
    for (let i = 0; i < totalCarrots; i++) {
        const posKey = `${parsedCarrots[i].x},${parsedCarrots[i].y}`;
        const existing = carrotIndicesAt.get(posKey);
        if (existing) existing.push(i);
        else carrotIndicesAt.set(posKey, [i]);
        carrotBit[i] = 1n << BigInt(i);
    }

    const collectCarrotsAt = (x: number, y: number, mask: CarrotMask): CarrotMask => {
        const indices = carrotIndicesAt.get(`${x},${y}`);
        if (!indices) return mask;
        for (const idx of indices) mask |= carrotBit[idx];
        return mask;
    };

    const initAx = startA.x + BOARD_BORDER;
    const initAy = startA.y + BOARD_BORDER;
    const initBx = startB.x + BOARD_BORDER;
    const initBy = startB.y + BOARD_BORDER;

    // determine initial mask in case a bunny spawns exactly on top of a carrot.
    let initialMask = collectCarrotsAt(initAx, initAy, 0n);
    initialMask = collectCarrotsAt(initBx, initBy, initialMask);

    const initial: SolverState = { ax: initAx, ay: initAy, bx: initBx, by: initBy, mask: initialMask };
    if (isWon(initial)) return { moves: [], score: 0 };

    const initialKey = stateKey(initial);
    const initialNode: AStarNode = { ...initial, steps: 0, g: -SCORE_PER_CARROT * popcount(initialMask) };

    const bestG = new Map<string, number>([[initialKey, initialNode.g]]);
    const cameFrom = new Map<string, { prev: string; move: MoveName }>();

    const open = new MinHeap<{ key: string; node: AStarNode }>();
    open.push(initialNode.g + heuristic(initial, totalCarrots), { key: initialKey, node: initialNode });

    let bestGoalG = Infinity;
    let bestGoalKey: string | null = null;

    while (open.size > 0) {
        // Nothing left in the frontier can possibly beat our best win, even
        // before considering the goal test
        const frontierBest = open.peekPriority()!;
        if (frontierBest >= bestGoalG) break;

        const entry = open.pop()!;
        const { key: currentKey, node: current } = entry;

        // Stale heap entry (a cheaper path to this state was found after this
        // one was queued)
        if (current.g > bestG.get(currentKey)!) continue;

        if (isWon(current)) {
            if (current.g < bestGoalG) {
                bestGoalG = current.g;
                bestGoalKey = currentKey;
            }
            continue; // don't expand past a win
        }

        for (const moveName of ALL_MOVES) {
            const { x: dx, y: dy } = MOVE_VECTORS[moveName];

            let ax = current.ax;
            let ay = current.ay;
            const nextAx = ax + dx;
            const nextAy = ay + dy;
            if (isPassable(nextAx, nextAy) && !(nextAx === current.bx && nextAy === current.by)) {
                ax = nextAx;
                ay = nextAy;
            }

            let bx = current.bx;
            let by = current.by;
            const nextBx = bx - dx;
            const nextBy = by - dy;
            if (isPassable(nextBx, nextBy) && !(nextBx === ax && nextBy === ay)) {
                bx = nextBx;
                by = nextBy;
            }

            // Apply carrot pickups for both A and B on this move
            let mask = collectCarrotsAt(ax, ay, current.mask);
            mask = collectCarrotsAt(bx, by, mask);

            const next: SolverState = { ax, ay, bx, by, mask };
            const nextKey = stateKey(next);
            const nextSteps = current.steps + 1;
            const nextG = nextSteps - SCORE_PER_CARROT * popcount(mask);

            const knownG = bestG.get(nextKey);
            if (knownG !== undefined && knownG <= nextG) continue;

            bestG.set(nextKey, nextG);
            cameFrom.set(nextKey, { prev: currentKey, move: moveName });

            const nextNode: AStarNode = { ...next, steps: nextSteps, g: nextG };
            open.push(nextG + heuristic(next, totalCarrots), { key: nextKey, node: nextNode });
        }
    }

    if (bestGoalKey === null) return null;

    // Backtrack to find the optimal moveset
    const moves: MoveName[] = [];
    let key = bestGoalKey;
    while (key !== initialKey) {
        const step = cameFrom.get(key)!;
        moves.unshift(step.move);
        key = step.prev;
    }

    return { moves, score: bestGoalG };
}
