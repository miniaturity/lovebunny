import { type Position, type Move, type Tile, mapToBoard, BOARD_BORDER, type Direction } from "$lib/state/tile/tiles";
import { type Entity } from "../entity/entity";
import { solveLevel } from "./solver";

export type MoveName = "up" | "down" | "left" | "right";
export type GameStatus = 'playing' | 'won' | 'menu' | 'playback';


export const MOVE_DICT: Record<MoveName, { x: Move, y: Move }> = {
    "up": { x: 0, y: -1 }, // i know dis wrong i messed up somewhere but whatever
    "down": { x: 0, y: 1 },
    "right": { x: 1, y: 0 },
    "left": { x: -1, y: 0 }
}

export type EditorMode = "edit" | "play";
export type GameParams = ConstructorParameters<typeof Game>;
export class Game {
    public board = $state<Tile[][]>([]);
    public a = $state<Entity>({ id: 'bunny_a', pos: { x: 1, y: 1 }, facing: 'right' });
    public b = $state<Entity>({ id: 'bunny_b', pos: { x: 6, y: 5 }, facing: 'right' });
    public hearts = $state<Entity>({ id: 'hearts', pos: { x: 1, y: 1 }, facing: 'right' });
    public status = $state<GameStatus>('menu');
    public carrotScore = $state<number>(0);
    public moves = $state<MoveName[]>([]);
    public solution = $state<MoveName[] | null>(null);
    public lastMove = $state<MoveName>();
    public undone = $state<boolean>(false);

    public static SCORE_PER_CARROT = 5;

    constructor(
        initBoard: number[][],
        a: Position,
        b: Position,
        public readonly title: string,
        public readonly day: number,
        public readonly author: string
    ) {
        this.board = mapToBoard(initBoard);

        this.a.pos = { x: a.x + BOARD_BORDER, y: a.y + BOARD_BORDER };
        this.b.pos = { x: b.x + BOARD_BORDER, y: b.y + BOARD_BORDER };
        this.solution = solveLevel(initBoard, a, b);

        if (!this.solution) {
            console.error("Level is unsolvable.");
        }

        $effect(() => {

        });
    }

    public move(dx: Move, dy: Move) {
        if ((this.status !== 'playing' && this.status !== "playback") || !this.solution) return;


        this.undone = false;
        const direction = this.getDirection(dx, dy);

        if (direction) {
            this.a.facing = direction;
            this.b.facing = direction === "left" ? "right" : "left";
        }

        this.moveEntity(this.a, dx, dy);
        this.moveEntity(this.b, -dx as Move, -dy as Move);

        this.hearts.pos = { x: (this.a.pos.x + this.b.pos.x) / 2, y: (this.a.pos.y + this.b.pos.y) / 2 };

        // if they let me use objects as a key it would be cool and i wouldnt have to do this 
        // WARNING: BS AHEAD
        const move: MoveName =((Object.keys(MOVE_DICT) as Array<keyof typeof MOVE_DICT>).find((key) => MOVE_DICT[key].x === dx && MOVE_DICT[key].y === dy))!;
        this.moves.push(move);
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

            if (checkPos.x === this.b.pos.x && checkPos.y === this.b.pos.y && this.status === "playing") {
                this.status = "won";
            }
        }

        this.lastMove = move;
    }

    public undo() {
        if (this.undone || !this.lastMove || this.status !== "playing") return;

        switch (this.lastMove) {
            case "up":
                this.moveEntity(this.a, MOVE_DICT["down"].x, MOVE_DICT["down"].y);
                this.moveEntity(this.b, -MOVE_DICT["down"].x as Move, -MOVE_DICT["down"].y as Move);
                break;
            case "down":
                this.moveEntity(this.a, MOVE_DICT["up"].x, MOVE_DICT["up"].y);
                this.moveEntity(this.b, -MOVE_DICT["up"].x as Move, -MOVE_DICT["up"].y as Move);
                break;
            case "left":
                this.moveEntity(this.a, MOVE_DICT["right"].x, MOVE_DICT["right"].y);
                this.moveEntity(this.b, -MOVE_DICT["right"].x as Move, -MOVE_DICT["right"].y as Move);
                break;
            case "right":
                this.moveEntity(this.a, MOVE_DICT["left"].x, MOVE_DICT["left"].y);
                this.moveEntity(this.b, -MOVE_DICT["left"].x as Move, -MOVE_DICT["left"].y as Move);
                break;
            default:
                break;
        }

        this.moves.pop();
        this.triggerGlobalOnMove();
        this.undone = true;
    }



    public moveEntity(entity: Entity, dx: Move, dy: Move) {
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

