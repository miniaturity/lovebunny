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
                // outer corner: surrounded (wall N)
                pattern: [0, null, 0, null, 1, 0, 1, null],
                sprite: [
                    { x: 12, y: 1 },
                    { x: 13, y: 1 },
                ],
                mirrorX: true
            },
            {
                // outer corner: land on two adjacent cardinal sides with the
                // opposite sides open water.
                pattern: [0, null, 0, null, 1, null, 1, null],
                sprite: [
                    { x: 14, y: 0 },
                    { x: 15, y: 0 }
                ],
                mirrorX: true
            },
            {
                // outer corner: surrounded (wall non-N)
                pattern: [1, 0, 1, null, 0, null, 0],
                sprite: [
                    { x: 18, y: 1 },
                    { x: 19, y: 1 }
                ],
                mirrorX: true,
            },
            {
                // outer corner: non-north
                pattern: [1, null, 1, null, 0, null, 0],
                sprite: [
                    { x: 16, y: 0 },
                    { x: 17, y: 0 },
                ],
                mirrorX: true
            },
            {
                // inner corner x4
                pattern: [1, 0, 1, 0, 1, 0, 1, 0],
                sprite: [
                    { x: 4, y: 1 },
                    { x: 5, y: 1 }
                ],
                rotations: true
            },
            {
                // inner corner x2 + wall (north)
                pattern: [0, null, 1, 0, 1, 0, 1, null],
                sprite: [
                    { x: 10, y: 1 },
                    { x: 11, y: 1 },
                ],
                mirrorX: true
            },
            {
                // inner corner x2 + wall (non-north)
                pattern: [1, 0, 1, null, 0, null, 1, 0],
                sprite: [
                    { x: 8, y: 1 },
                    { x: 9, y: 1 }
                ],
                rotations: true
            },
            {
                // inner corner x2
                pattern: [1, 0, 1, null, null, null, 1, 0],
                sprite: [
                    { x: 0, y: 1 },
                    { x: 1, y: 1 }
                ],
                rotations: true
            },
            {
                // inner corner + wall (north)
                pattern: [0, null, 1, 0, 1, null, 1, null],
                sprite: [
                    { x: 2, y: 2 },
                    { x: 3, y: 2 }
                ],
                mirrorX: true
            },
            {
                // inner corner + wall (non-north)
                pattern: [1, 0, 1, null, 0, null, 1, null],
                sprite: [
                    { x: 0, y: 2 },
                    { x: 1, y: 2 }
                ],
                rotations: true
            },
            {
                // inner corner (concave)
                pattern: [1, 0, 1, null, null, null, null, null],
                sprite: [
                    { x: 10, y: 0 },
                    { x: 11, y: 0 }
                ],
                rotations: true,
            },
            {
                // corridor shoreline: land n/s, water w/e
                pattern: [0, null, 1, null, 0, null, 1, null],
                sprite: [
                    { x: 16, y: 1 },
                    { x: 17, y: 1 }
                ],
                mirrorX: true
            },
            {
                // corridor shoreline: land w/e, water n and s
                pattern: [1, null, 0, null, 1, null, 0, null],
                sprite: [
                    { x: 12, y: 0 },
                    { x: 13, y: 0 }
                ],
                rotations: true,
            },
            {
                // corridor end shoreline (land n),
                pattern: [0, null, 0, null, 1, null, 0, null],
                sprite: [
                    { x: 18, y: 0 },
                    { x: 19, y: 0 }
                ],
                mirrorX: true
            },
            {
                // corridor end shoreline (horizontal, land n)
                pattern: [0, null, 1, null, 0, null, 0, null],
                sprite: [
                    { x: 14, y: 1 },
                    { x: 15, y: 1 }
                ],
                mirrorX: true
            },
            {
                // corridor end shoreline (land w/e/s),
                pattern: [0, null, 0, null, 1, null, 0, null],
                sprite: [
                    { x: 6, y: 1 },
                    { x: 7, y: 1 }
                ],
                rotations: true,
                initRotation: 270
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
                rotations: true,
            },
        ]
    }
}

export class StaticEmpty extends StaticTile {
    constructor() {
        super({ x: 2, y: 0 }, 0, "empty");
        this.isPassable = false;
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

export const BOARD_BORDER = 2;

export function mapToBoard(map: number[][]): Tile[][] {
    const mapHeight = map.length;
    const mapWidth = map[0]?.length ?? 0;
    
    const paddedHeight = mapHeight + BOARD_BORDER * 2;
    const paddedWidth = mapWidth + BOARD_BORDER * 2;

    const grid: Tile[][] = [];

    for (let y = 0; y < paddedHeight; y++) {
        const row: Tile[] = [];
        for (let x = 0; x < paddedWidth; x++) {
            
            // calculate chebyshev distance from the actual map boundaries
            let dx = 0;
            if (x < BOARD_BORDER) dx = BOARD_BORDER - x;
            else if (x >= BOARD_BORDER + mapWidth) dx = x - (BOARD_BORDER + mapWidth - 1);

            let dy = 0;
            if (y < BOARD_BORDER) dy = BOARD_BORDER - y;
            else if (y >= BOARD_BORDER + mapHeight) dy = y - (BOARD_BORDER + mapHeight - 1);

            const distance = Math.max(dx, dy);

            if (distance === 0) {
                const mapY = y - BOARD_BORDER;
                const mapX = x - BOARD_BORDER;
                const tileId = map[mapY][mapX];
                const createTile = TileRegistry[tileId]; 
                
                if (createTile) {
                    row.push(createTile());
                } else {
                    console.warn(`Unknown tile ID: ${tileId}`);
                    row.push(new Empty());
                }
            } else if (distance === 1) {
                row.push(new Empty());
            } else {
                row.push(new StaticEmpty());
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

