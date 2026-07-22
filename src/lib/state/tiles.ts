import { AnimatedTile } from './animatedtile';
import type { Game } from './game.svelte';
import { RuleTile, type SpriteCoord } from './ruletile';
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
                // detect when its border and DONT convert to shoreline.
                pattern: [0, null, null, null, null, null, null],
                sprite: [
                    { x: 0, y: 0 },
                    { x: 1, y: 0 }
                ]
            },
            {
                // inner corner,
                // doesn't rotate?? fr some reason? (when its a bottom right inner corner, it acts as a top right)
                
                pattern: [1, 0, 1, 0, 0, 0, 0, 0],
                sprite: [
                    { x: 10, y: 0 },
                    { x: 11, y: 0 }
                ],
                rotations: true,
            },
            /**
             * {
             *   // TODO: implement shoreline horizontal 
             *   sprite: [
             *      { x: 8, y: 0 },
             *      { x: 9, y: 0 }
             *  ]
             * },
             * {
             *  // TODO: implement shoreliner corner
             *  sprite: [
             *      { x: 14, y: 0 },
             *      { x: 15, y: 0 }
             * ]
             * }
             * 
             */
        ]
    }
}

export class Ground extends StaticTile {
    constructor(id: number, loc?: SpriteCoord) { 
        super(loc || { x: 3, y: 0 }, id, "ground");
    }
}

export class GroundGrass extends AnimatedTile {
    constructor(id: number) {
        super(id, "ground-grass");

        this.defaultSprite = [
            { x: 5, y: 0 },
            { x: 6, y: 0 }
        ];
    }

    public getSprite(_game: Game, _x: number, _y: number, timestamp: number): SpriteCoord {
        return this.getAnimatedFrame(this.defaultSprite, timestamp, this.defaultFrameDuration);
    }
}

export class Wall extends StaticTile {
    constructor(id: number, loc?: SpriteCoord) {
        super(loc || { x: 4, y: 0 }, id, "wall");
        this.isPassable = false; 
    }
}



const TileRegistry: Record<number, () => Tile> = {
    0: () => new Empty(),
    1: () => new Ground(0),
    2: () => new GroundGrass(1),
    3: () => new Wall(2),

    
    
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

