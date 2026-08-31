import { type MoveName } from "./game.svelte";
import { mapToBoard, BOARD_BORDER, type Position, type Move } from "../tile/tiles";


const MOVE_VECTORS: Record<MoveName, { x: Move, y: Move }> = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 } 
}

const ALL_MOVES: MoveName[] = ["up", "down", "right", "left"];

interface SolverState {
    ax: number;
    ay: number;
    bx: number;
    by: number;
}

function stateKey(s: SolverState): string {
    return `${s.ax},${s.ay},${s.bx},${s.by}`;
}

function isWon(s: SolverState): boolean {
    return Math.abs(s.ax - s.bx) + Math.abs(s.ay - s.by) === 1;
}

// BFS algorithm to find optimal solution
export function solveLevel(
    map: number[][],
    startA: Position,
    startB: Position
): MoveName[] | null {
    const board = mapToBoard(map);

    const isPassible = (x: number, y: number): boolean => {
        if (y < 0 || y >= board.length || x < 0 || x >= board[0].length) return false;
        return board[y][x].isPassable;
    }

    const initial: SolverState = {
        ax: startA.x + BOARD_BORDER,
        ay: startA.y + BOARD_BORDER,
        bx: startB.x + BOARD_BORDER,
        by: startB.y + BOARD_BORDER
    }

    if (isWon(initial)) return [];

    const initialKey = stateKey(initial);
    const visited = new Set<string>([initialKey]);
    const queue: SolverState[] = [initial];
    const cameFrom = new Map<string, { prev: string; move: MoveName }>();

    let head = 0;
    while (head < queue.length) {
        const current = queue[head++];
        const currentKey = stateKey(current);

        for (const moveName of ALL_MOVES) {
            const { x: dx, y: dy } = MOVE_VECTORS[moveName];

            let ax = current.ax;
            let ay = current.ay;
            const nextAx = ax + dx;
            const nextAy = ay + dy;
            if (isPassible(nextAx, nextAy) && !(nextAx === current.bx && nextAy === current.by)) {
                ax = nextAx;
                ay = nextAy; 
            }

            let bx = current.bx;
            let by = current.by;
            const nextBx = bx - dx;
            const nextBy = by - dy;
            if (isPassible(nextBx, nextBy) && !(nextBx === ax && nextBy === ay)) {
                bx = nextBx;
                by = nextBy;
            }

            const next: SolverState = { ax, ay, bx, by };
            const nextKey = stateKey(next);
            if (visited.has(nextKey)) continue;

            visited.add(nextKey);
            cameFrom.set(nextKey, { prev: currentKey, move: moveName });

            if (isWon(next)) {
                const moves: MoveName[] = [moveName];
                let key = currentKey;
                while (key !== initialKey) {
                    const step = cameFrom.get(key)!;
                    moves.unshift(step.move);
                    key = step.prev;
                }
                return moves;
            }

            queue.push(next);
        }
    }

    return null;
}