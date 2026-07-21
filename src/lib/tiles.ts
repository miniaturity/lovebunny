import type { Game } from '$lib/components/game.svelte';

export const SIZE: number = 16;
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

export class Empty extends Tile {
    constructor() { 
        super(0, "empty"); 
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

