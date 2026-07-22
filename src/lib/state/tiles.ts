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

        // Rules are ordered most-specific -> least-specific: the first match wins.
        // Corners must come before edges, otherwise a corner tile would match an
        // edge rule first. Pattern indices are [N, NE, E, SE, S, SW, W, NW] where
        // 1 = neighbour is water (same tile), 0 = neighbour is NOT water (land /
        // out-of-bounds), null = don't care.
        this.rules = [
            {
                // solid: completely surrounded by water -> deep water.
                pattern: [1, 1, 1, 1, 1, 1, 1, 1],
                sprite: { x: 2, y: 0 }
            },
            {
                // outer corner: land on two adjacent cardinal sides with the
                // opposite sides open water. Base sprite is the top-right corner
                // (land N + E); rotations produce the other three corners.
                pattern: [0, 0, 0, null, 1, null, 1, null],
                sprite: [
                    { x: 14, y: 0 },
                    { x: 15, y: 0 }
                ],
                rotations: true,
            },
            {
                // inner corner (concave): a single diagonal neighbour is land while
                // the two cardinals beside it stay open water. Rotations cover all
                // four diagonals now that the renderer honours rotationAngle.
                pattern: [1, 0, 1, 0, 0, 0, 0, 0],
                sprite: [
                    { x: 10, y: 0 },
                    { x: 11, y: 0 }
                ],
                rotations: true,
            },
            {
                // horizontal shoreline: land to the east, open water to the west.
                // mirrorX flips it to also draw the west-facing (left) shoreline.
                // Requiring the opposite side to be water keeps the map border
                // (where out-of-bounds counts as land) from becoming a beach.
                pattern: [null, null, 0, null, null, null, 1, null],
                sprite: [
                    { x: 8, y: 0 },
                    { x: 9, y: 0 }
                ],
                mirrorX: true,
            },
            {
                // vertical shoreline: land to the north, open water to the south.
                // rotations produce the south-facing (bottom) shoreline as well.
                // As above, requiring the opposite side to be water prevents the
                // outer map border from converting into a shoreline.
                pattern: [0, null, null, null, 1, null, null, null],
                sprite: [
                    { x: 0, y: 0 },
                    { x: 1, y: 0 }
                ],
                rotations: true,
            },
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

