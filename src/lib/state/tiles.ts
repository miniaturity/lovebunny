import { RuleTile } from './ruletile';
import { Tile, type Position, type Entity, StaticTile } from './tile';

export type Move = -1 | 0 | 1;
export type GameStatus = 'playing' | 'won' | 'unfocused' | 'menu';

// Re-exported so existing imports of Tile/Position/Entity from './tiles' keep working.
export { Tile };
export type { Position, Entity };

export class Empty extends RuleTile {
    constructor() { 
        super(0, "empty"); 
        this.isPassable = false;
        this.defaultSprite = { x: 2, y: 0 };

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

export class Ground extends StaticTile {
    constructor(id: number) { 
        super({ x: 3, y: 0 }, id, "ground");
    }
}

export class Wall extends StaticTile {
    constructor(id: number) {
        super({ x: 4, y: 0 }, id, "wall");
        this.isPassable = false; 
    }
}



const TileRegistry: Record<number, () => Tile> = {
    0: () => new Empty(),
    1: () => new Ground(0),
    2: () => new Wall(1),
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
                row.push(new Empty());
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

