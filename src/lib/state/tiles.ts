import type { Game } from '$lib/state/game.svelte';
import { RuleTile } from './ruletile';

export type Move = -1 | 0 | 1;
export type Position = { x: number, y: number };
export type GameStatus = 'playing' | 'won' | 'unfocused' | 'menu';
export type Entity = "fox" | "bunny_a" | "bunny_b";

export abstract class Tile {
    protected _occupant: Entity | "empty" = "empty";
    public isPassable: boolean = true; 
    public readonly variant: string;

    constructor(
        public readonly tileId: number,
        private readonly _name: string,
        variant?: string
    ) {
        this.variant = variant ?? _name;
    }

    get name() { return this._name; }
    get occupant() { return this._occupant; }
    set occupant(o: Entity | "empty") { this._occupant = o; }

    onLand?(e: Entity, pos: Position, game: Game): void;
    onMove?(game: Game): void;
    tick?(game: Game): void;
}

export class Empty extends RuleTile {
    constructor() { 
        super(0, "empty"); 
        this.isPassable = false;

        this.rules = [
            {
                // solid
                pattern: [1, 1, 1, 1, 1, 1, 1, 1],
                sprite: { x: 2, y: 0 }
            },
            {
                // shoreline
                pattern: [0, null, null, null, null, null, null],
                sprite: [
                    { x: 0, y: 0 },
                    { x: 1, y: 0 }
                ]
            }
        ]
    }
}

export class Ground extends Tile {
    constructor(id: number, variant: string) { 
        super(id, "ground", variant);
    }
}

export class Wall extends Tile {
    constructor(id: number, variant: string) {
        super(id, "wall", variant);
        this.isPassable = false; 
    }
}




const TileRegistry: Record<number, () => Tile> = {
    0: () => new Empty(),
    1: () => new Ground(0, "grass"),
    2: () => new Wall(1, "stone-wall"),
};

export function mapToBoard(map: number[][]): Tile[][] {
    const grid: Tile[][] = [];

    for (let y = 0; y < map.length; y++) {
        const row: Tile[] = [];
        for (let x = 0; x < map[y].length; x++) {
            const tileId = map[y][x];
            const createTile = TileRegistry[tileId]; 
            
            if (createTile) {
                row.push(createTile());
            } else {
                console.warn(`Unknown tile ID: ${tileId}`);
                row.push(new Ground(0, "error-tile"));
            }
        }
        grid.push(row);
    }
    return grid;
}

export type Direction = 'left' | 'right';

export interface EntityState {
    id: Entity;
    pos: Position;
    facing: Direction;
}

export const DIRECTION_ROWS: Record<Direction, number> = {
    left: 1,
    right: 2,
};

export const ENTITY_SPRITES = {
    bunny_a: { sheetX: 0 }, 
    bunny_b: { sheetX: 3 }, 
    fox:     { sheetX: 6 },
};

