import { type Position, type Move, type Tile, type GameStatus, mapToBoard, BOARD_BORDER, type EntityState, type Direction } from "$lib/state/tiles";

type MoveName = "up" | "down" | "left" | "right";

const MOVE_DICT: Record<MoveName, { x: Move, y: Move }> = {
    "up": { x: 0, y: -1 }, // i know dis wrong i messed up somewhere but whatever
    "down": { x: 0, y: 1 },
    "right": { x: 1, y: 0 },
    "left": { x: -1, y: 0 }
}


export class Game {
    public board = $state<Tile[][]>([]);
    public a = $state<EntityState>({ id: 'bunny_a', pos: { x: 1, y: 1 }, facing: 'right' });
    public b = $state<EntityState>({ id: 'bunny_b', pos: { x: 6, y: 5 }, facing: 'right' });
    public status = $state<GameStatus>('menu');
    public moves: MoveName[] = [];

    constructor(
        initBoard: number[][],
        a: Position,
        b: Position,
        public readonly title: string,
        public readonly day: number
    ) {
        this.board = mapToBoard(initBoard);

        // mapToBoard pads the map with a border of empty tiles, so positions
        // given here (relative to the original, unpadded map) need to be
        // shifted by that same border to still land on the intended tile.
        this.a.pos = { x: a.x + BOARD_BORDER, y: a.y + BOARD_BORDER };
        this.b.pos = { x: b.x + BOARD_BORDER, y: b.y + BOARD_BORDER };
    }

    move(dx: Move, dy: Move) {
        if (this.status !== 'playing') return;

        const direction = this.getDirection(dx, dy);

        if (direction) {
            this.a.facing = direction;
            this.b.facing = direction === "left" ? "right" : "left";
        }

        this.moveEntity(this.a, dx, dy);
        this.moveEntity(this.b, -dx as Move, -dy as Move);

        // if they let me use objects as a key it would be cool and i wouldnt have to do this 
        // WARNING: BS AHEAD
        this.moves.push(((Object.keys(MOVE_DICT) as Array<keyof typeof MOVE_DICT>).find((key) => MOVE_DICT[key].x === dx && MOVE_DICT[key].y === dy))!)
        this.triggerGlobalOnMove();
        
        const CARDINAL: Position[] = [
            { x: 0, y: 1 },
            { x: 0, y: -1 },
            { x: 1, y: 0 },
            { x: -1, y: 0 }
        ];

        for (let V = 0; V < CARDINAL.length; V++) {
            const card = CARDINAL[V];
            const checkPos: Position = { x: this.a.pos.x + card.x, y: this.a.pos.y + card.y };

            if (checkPos.x === this.b.pos.x && checkPos.y === this.b.pos.y) {
                this.status = "won";
            }
        }
    }


    public moveEntity(entity: EntityState, dx: Move, dy: Move) {
        const nextX = entity.pos.x + dx;
        const nextY = entity.pos.y + dy;

        if (this.isValidPos(nextX, nextY)) {
            entity.pos.x = nextX;
            entity.pos.y = nextY;
        }
    }

    private triggerGlobalOnMove() {
        for (const row of this.board) {
            for (const tile of row) {
                tile.onMove?.(this);
            }
        }
    }

    private isValidPos(x: number, y: number): boolean {
        if (y < 0 || y >= this.board.length || x < 0 || x >= this.board[0].length) {
            return false;
        }

        const targetTile = this.board[y][x];
        if (!targetTile.isPassable) {
            return false;
        }

        if ((this.a.pos.x === x && this.a.pos.y === y) || 
            (this.b.pos.x === x && this.b.pos.y === y)) {
            return false;
        }
        

        return true; 
    }

    private getDirection(dx: number, _dy: number): Direction | null {
        if (dx < 0) return 'left';
        if (dx > 0) return 'right';
        return null;
    }

    
}

