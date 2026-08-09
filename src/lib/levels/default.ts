import type { GameParams } from "$lib/state/game.svelte";

const LEVEL = [
    [1, 1, 1, 2, 1, 1, 1, 2],
    [1, 4, 1, 1, 2, 1, 2, 1],
    [1, 1, 2, 1, 1, 1, 1, 4],
    [1, 1, 1, 2, 1, 1, 2, 1],
    [4, 1, 1, 1, 2, 1, 1, 1],
    [1, 1, 1, 2, 1, 1, 1, 1],
    [1, 1, 4, 1, 1, 1, 2, 1],  
    [1, 1, 2, 1, 1, 4, 1, 1]  
];

const TITLE = "unnamed";
const DAY = -1;

export const DEFAULT_GAME: GameParams = [
    LEVEL,
    { x: 0, y: 0 }, 
    { x: 7, y: 7 },
    TITLE,
    DAY,
    "anonymous"
]