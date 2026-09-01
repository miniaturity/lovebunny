import { persisted } from "svelte-persisted-store";
import type { Position } from "./tile/tiles";

export const hasVisited = persisted('has-visited', false);
export const hasCompletedTip = persisted('completed-tip', false);
export const editorLevel = persisted('editor-level', {} as { board: number[][], a: Position, b: Position, carrots: Position[] });