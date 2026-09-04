import { persisted, type Persisted } from "svelte-persisted-store";
import type { Position } from "./tile/tiles";
import type { GameParams } from "./game/game.svelte";

export const hasVisited = persisted('has-visited', false);
export const hasCompletedTip = persisted('completed-tip', false);
export const editorLevel = persisted('editor-level', {} as { board: number[][], a: Position, b: Position, carrots: Position[] });
export const gameSnapshot: Persisted<GameParams | null> = persisted('game-snapshot', null);