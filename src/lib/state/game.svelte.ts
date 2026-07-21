import { type Position, type Move, type Tile, type GameStatus, SIZE, mapToBoard, type EntityState, type Direction } from "$lib/state/tiles";

export class Game {
    public board = $state<Tile[][]>([]);
    public a = $state<EntityState>({ id: 'bunny_a', pos: { x: 1, y: 1 }, facing: 'down' });
    public b = $state<EntityState>({ id: 'bunny_b', pos: { x: 6, y: 5 }, facing: 'down' });
    public status = $state<GameStatus>('menu');

    width = SIZE;
    height = SIZE;

    constructor(
        initBoard: number[][],
        a: Position,
        b: Position,
    ) {
        this.board = mapToBoard(initBoard);
        this.a.pos = a;
        this.b.pos = b;
    }

    move(dx: Move, dy: Move) {
        if (this.status !== 'playing') return;

        const direction = this.getDirection(dx, dy);

        if (direction) {
            this.a.facing = direction;
            this.b.facing = direction;
        }

        this.moveEntity(this.a, dx, dy);
        this.moveEntity(this.b, dx, dy);

        this.triggerGlobalOnMove();
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

    private getDirection(dx: number, dy: number): Direction | null {
        if (dy > 0) return 'down';
        if (dy < 0) return 'up';
        if (dx < 0) return 'left';
        if (dx > 0) return 'right';
        return null;
    }
}

