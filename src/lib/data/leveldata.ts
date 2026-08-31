import type { Position } from "$lib/state/tile/tile";
import type { SpriteCoord } from "$lib/state/tile/ruletile";

export interface LevelData {
    board: number[][];
    a: Position;
    b: Position;
    title: string;
    day: number;
    author: string;
}

export const MIN_BOARD_SIZE = 3;
export const MAX_BOARD_SIZE = 20;

/**
 * Daily levels are sometimes stored in R2 wrapped in a `{ date, level }`
 * envelope (e.g. when an object is uploaded straight from the Cloudflare
 * dashboard using the same shape the admin PUT endpoint accepts), rather
 * than as a bare LevelData object (the shape the admin endpoint actually
 * persists). Accept either shape so a stray envelope doesn't crash
 * mapToBoard with `board` being undefined.
 */
export function normalizeLevelPayload(raw: unknown): LevelData {
    if (raw && typeof raw === 'object' && 'level' in raw && !('board' in raw)) {
        return (raw as { level: LevelData }).level;
    }
    return raw as LevelData;
}

export interface Brush {
    tileId: number;
    name: string;
    sprite: SpriteCoord;
}

// NOTE: Sync with tilereg
export const BRUSHES: Brush[] = [
    { tileId: 0, name: 'water', sprite: { x: 2, y: 0 } },
    { tileId: 1, name: 'ground', sprite: { x: 3, y: 0 } },
	{ tileId: 2, name: 'grass', sprite: { x: 5, y: 0 } },
	{ tileId: 4, name: 'flowers', sprite: { x: 7, y: 0 } },
	{ tileId: 3, name: 'wall', sprite: { x: 4, y: 0 } },
	{ tileId: 5, name: 'rocks', sprite: { x: 4, y: 2 } },
]

const VALID_TILE_IDS = new Set(BRUSHES.map((b) => b.tileId));

export function createEmptyBoard(rows: number, cols: number, fill = 1): number[][] {
    return Array.from({ length: rows }, () => Array.from({ length: cols }, () => fill));
}

export function cloneBoard(board: number[][]): number[][] {
    return board.map((row) => [...row]);
}

export function cloneLevel(level: LevelData): LevelData {
    return {
        board: cloneBoard(level.board),
        a: { ...level.a },
        b: { ...level.b },
        title: level.title,
        day: level.day,
        author: level.author
    };
}

export function clampPosition(pos: Position, rows: number, cols: number): Position {
    return {
		x: Math.min(Math.max(pos.x, 0), Math.max(cols - 1, 0)),
		y: Math.min(Math.max(pos.y, 0), Math.max(rows - 1, 0))
	};
}

export function resizeBoard(board: number[][], rows: number, cols: number, fill = 1): number[][] {
    const oldRows = board.length;
    const oldCols = board[0]?.length ?? 0;

    const next: number[][] = [];
    for (let y = 0; y < rows; y++) {
        const row: number[] = [];
        for (let x = 0; x < cols; x++) {
            row.push(y < oldRows && x < oldCols ? board[y][x] : fill);
        }
        next.push(row);
    }

    return next;
}

export function exportLevel(level: LevelData): string {
    return JSON.stringify(level, null, 2);
}

export function downloadLevel(level: LevelData) {
    const json = exportLevel(level);
    const filename = `${(level.title || 'level').trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-') || 'level'}.json`;
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();

    URL.revokeObjectURL(url);
}

function isPosition(value: unknown): value is Position {
    return (
        !!value &&
        typeof value === 'object' &&
        typeof (value as Position).x === 'number' &&
        typeof (value as Position).y === 'number' &&
        Number.isFinite((value as Position).x) &&
		Number.isFinite((value as Position).y)
    );
}

export function parseLevel(json: string): LevelData {
    let data: unknown;
    try {
        data = JSON.parse(json);
    } catch {
        throw new Error("Attempted to parse an invalid level!");
    }

    if (!data || typeof data !== 'object') {
        throw new Error("Level is not an object");
    }

    const candidate = data as Record<string, unknown>;
    const board = candidate.board;

    if (!Array.isArray(board) || board.length === 0 || !board.every((row) => Array.isArray(row))) {
		throw new Error('Level is missing a valid board grid.');
	}
 
	const cols = (board[0] as unknown[]).length;
	if (cols === 0 || !board.every((row) => (row as unknown[]).length === cols)) {
		throw new Error('Every board row must be the same length.');
	}
 
	for (const row of board as number[][]) {
		for (const tileId of row) {
			if (typeof tileId !== 'number' || !VALID_TILE_IDS.has(tileId)) {
				throw new Error(`Unknown tile id "${tileId}" in board.`);
			}
		}
	}
 
	if (!isPosition(candidate.a)) throw new Error('Level is missing a valid bunny "a" position.');
	if (!isPosition(candidate.b)) throw new Error('Level is missing a valid bunny "b" position.');
 
	return {
		board: (board as number[][]).map((row) => [...row]),
		a: { x: (candidate.a as Position).x, y: (candidate.a as Position).y },
		b: { x: (candidate.b as Position).x, y: (candidate.b as Position).y },
		title: typeof candidate.title === 'string' ? candidate.title : 'unnamed',
		day: typeof candidate.day === 'number' ? candidate.day : -1,
        author: typeof candidate.author === 'string' ? candidate.author : 'anonymous'
	};
}