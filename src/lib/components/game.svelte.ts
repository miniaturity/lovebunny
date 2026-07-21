import { type Position, type Move, type Tile, type GameStatus, SIZE, mapToBoard, type Entity } from "$lib/tiles";

export class Game {
    public board = $state<Tile[][]>([]);
    public a = $state<Position>({ x: -1, y: -1 });
    public b = $state<Position>({ x: -1, y: -1 });
    public status = $state<GameStatus>('menu');

    width = SIZE;
    height = SIZE;

    constructor(
        initBoard: number[][],
        a: Position,
        b: Position,
    ) {
        this.board = mapToBoard(initBoard);
        this.a = a;
        this.b = b;
    }


    public moveEntity(entity: Entity, currentPos: Position, dx: Move, dy: Move) {
        const nextX = currentPos.x + dx;
        const nextY = currentPos.y + dy;

        if (!this.validPos({ x: nextX, y: nextY })) {
            return false; 
        }

        const targetTile = this.board[nextY][nextX];

        if (!targetTile.isPassable || targetTile.occupant !== "empty") {
            return false;
        }

        const currentTile = this.board[currentPos.y][currentPos.x];
        currentTile.occupant = "empty";
        targetTile.occupant = entity;
        
        currentPos.x = nextX;
        currentPos.y = nextY;

        targetTile.onLand?.(entity, { x: nextX, y: nextY }, this);

        this.triggerGlobalOnMove();

        return true;
    }

    private triggerGlobalOnMove() {
        for (const row of this.board) {
            for (const tile of row) {
                tile.onMove?.(this);
            }
        }
    }

    private validPos(pos: Position): boolean {
        return pos.y >= 0 && pos.y < this.board.length && pos.x >= 0 && pos.x < this.board[0].length;
    }
}

