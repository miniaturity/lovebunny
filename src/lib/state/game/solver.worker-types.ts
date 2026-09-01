import type { Position } from "../tile/tiles";
import type { SolveResult } from "./solver-core";

export interface SolverWorkerRequest {
    id: number;
    map: number[][];
    startA: Position;
    startB: Position;
    carrotPositions?: Position[];
}

export interface SolverWorkerResponse {
    id: number;
    result: SolveResult | null;
}
