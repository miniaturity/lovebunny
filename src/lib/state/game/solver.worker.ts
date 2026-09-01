/// <reference lib="webworker" />

// Runs the A* solve on a dedicated worker thread so large boards don't freeze UI.

import { solveLevelCore } from "./solver-core";
import type { SolverWorkerRequest, SolverWorkerResponse } from "./solver.worker-types";

const ctx = self as unknown as DedicatedWorkerGlobalScope;

ctx.onmessage = (event: MessageEvent<SolverWorkerRequest>) => {
    const { id, map, startA, startB, carrotPositions } = event.data;
    const result = solveLevelCore(map, startA, startB, carrotPositions);
    const response: SolverWorkerResponse = { id, result };
    ctx.postMessage(response);
};
