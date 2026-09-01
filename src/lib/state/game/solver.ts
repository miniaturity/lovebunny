import { type MoveName } from "$lib/state/game/game.svelte";
import type { Position } from "../tile/tiles";
import { solveLevelCore, SCORE_PER_CARROT, type SolveResult } from "./solver-core";
import type { SolverWorkerRequest, SolverWorkerResponse } from "./solver.worker-types";

export { SCORE_PER_CARROT };
export type { SolveResult };

/**
 * Synchronous solve, using A* over the (positions + carrot mask) state space.
 * 
 * For where Web Workers aren't available
 */
export function solveLevel(
    map: number[][],
    startA: Position,
    startB: Position,
    carrotPositions?: Position[]
): SolveResult | null {
    return solveLevelCore(map, startA, startB, carrotPositions);
}

// Web Worker
//
// One worker is created lazily and reused for every solve, rather than
// spinning up a fresh thread per call. Each request gets an id so stale
// responses (from a solve that's since been superseded, e.g. the editor
// re-solving as the user paints) can be matched up or ignored.

let worker: Worker | null = null;
let nextRequestId = 0;
const pending = new Map<number, (result: SolveResult | null) => void>();

function getWorker(): Worker {
    if (!worker) {
        worker = new Worker(new URL("./solver.worker.ts", import.meta.url), { type: "module" });
        worker.onmessage = (event: MessageEvent<SolverWorkerResponse>) => {
            const { id, result } = event.data;
            const resolve = pending.get(id);
            if (!resolve) return; // cancelled or already handled
            pending.delete(id);
            resolve(result);
        };
    }
    return worker;
}

export interface SolveHandle {
    result: Promise<SolveResult | null>;
    cancel: () => void;
}

/**
 * Solve a level off the main thread via a Web Worker, so the UI stays responsive
 * during solving.
 */
export function solveLevelAsync(
    map: number[][],
    startA: Position,
    startB: Position,
    carrotPositions?: Position[]
): SolveHandle {
    if (typeof Worker === "undefined") {
        return {
            result: Promise.resolve(solveLevelCore(map, startA, startB, carrotPositions)),
            cancel: () => {}
        };
    }
 
    const id = nextRequestId++;
    const result = new Promise<SolveResult | null>((resolve) => {
        pending.set(id, resolve);
        const request: SolverWorkerRequest = JSON.parse(
            JSON.stringify({ id, map, startA, startB, carrotPositions })
        );
        getWorker().postMessage(request);
    });
 
    return { result, cancel: () => pending.delete(id) };
}