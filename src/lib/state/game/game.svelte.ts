import { type Position, type Move, type Tile, mapToBoard, BOARD_BORDER, type Direction } from "$lib/state/tile/tiles";
import { CarrotEntity, type Entity } from "../entity/entity";
import { solveLevelAsync, SCORE_PER_CARROT, type SolveResult } from "./solver";

export type MoveName = "up" | "down" | "left" | "right";
export type GameStatus = 'playing' | 'won' | 'menu' | 'playback';


export const MOVE_DICT: Record<MoveName, { x: Move, y: Move }> = {
    "up": { x: 0, y: -1 }, // i know dis wrong i messed up somewhere but whatever
    "down": { x: 0, y: 1 },
    "right": { x: 1, y: 0 },
    "left": { x: -1, y: 0 }
}

interface GameSnapshot {
    a: Entity;
    b: Entity;
    hearts: Entity;
    moves: MoveName[];
    carrots: CarrotEntity[];
    carrotScore: number;
    lastMove: MoveName | undefined;
    status: GameStatus;
}

export type EditorMode = "edit" | "play";
export type GameParams = ConstructorParameters<typeof Game>;
export class Game {
    public board = $state<Tile[][]>([]);
    public a = $state<Entity>({ id: 'bunny_a', pos: { x: 1, y: 1 }, facing: 'right', alive: true });
    public b = $state<Entity>({ id: 'bunny_b', pos: { x: 6, y: 5 }, facing: 'right', alive: true });
    public hearts = $state<Entity>({ id: 'hearts', pos: { x: 1, y: 1 }, facing: 'right', alive: true });
    public status = $state<GameStatus>('menu');
    public moves = $state<MoveName[]>([]);
    public solution = $state<SolveResult | null>(null);
    public lastMove = $state<MoveName>();
    public undone = $state<boolean>(false);

    private _history: GameSnapshot[] = [];
    get history() { return this._history; }

    public static SCORE_PER_CARROT = SCORE_PER_CARROT;
    public carrotScore = $state<number>(0);
    public carrots = $state<CarrotEntity[]>([]);

    constructor(
        initBoard: number[][],
        a: Position,
        b: Position,
        public readonly title: string,
        public readonly day: number,
        public readonly author: string,
        carrotPositions?: Position[]
    ) {
        this.board = mapToBoard(initBoard);

        this.a.pos = { x: a.x + BOARD_BORDER, y: a.y + BOARD_BORDER };
        this.b.pos = { x: b.x + BOARD_BORDER, y: b.y + BOARD_BORDER };

        solveLevelAsync(initBoard, a, b, carrotPositions).result.then((solution) => {
            this.solution = solution;
        });

        if (carrotPositions) {
            carrotPositions.forEach((pos: Position, idx: number) => {
                this.carrots.push(
                    new CarrotEntity(idx, "carrot", { x: pos.x + BOARD_BORDER, y: pos.y + BOARD_BORDER }, "right", true, true)
                );
            });
        }
    }

    public getScore(): number {
        return this.moves.length - (this.carrotScore * SCORE_PER_CARROT);
    }

    public consumeCarrot(iid: number) {
        const foundCarrot = this.carrots.findIndex((item: CarrotEntity) => item.iid === iid);
        if (foundCarrot === -1) {
            throw new Error("consumeCarrot: Invalid instance id");
        }

        this.carrotScore++;
        this.carrots.splice(foundCarrot, 1);
    }

    private checkCarrotPickup(entity: Entity) {
        const carrot = this.carrots.find(
            (c) => c.pos.x === entity.pos.x && c.pos.y === entity.pos.y
        );
        carrot?.effectorEnter?.(this);
    }

    private cloneEntity(e: Entity): Entity {
        return { ...e, pos: { ...e.pos } };
    }

    private cloneCarrots(carrots: CarrotEntity[]): CarrotEntity[] {
        return carrots.map(
            (c) => new CarrotEntity(c.iid, c.id, { ...c.pos }, c.facing, c.alive, c.isEffector)
        );
    }

    private pushSnapshot() {
        this._history.push({
            a: this.cloneEntity(this.a),
            b: this.cloneEntity(this.b),
            hearts: this.cloneEntity(this.hearts),
            moves: [...this.moves],
            carrots: this.cloneCarrots(this.carrots),
            carrotScore: this.carrotScore,
            lastMove: this.lastMove,
            status: this.status
        });
    }

    public move(dx: Move, dy: Move) {
        if ((this.status !== 'playing' && this.status !== "playback") || !this.solution) return;

        this.pushSnapshot();

        this.undone = false;
        const direction = this.getDirection(dx, dy);

        if (direction) {
            this.a.facing = direction;
            this.b.facing = direction === "left" ? "right" : "left";
        }

        this.moveEntity(this.a, dx, dy);
        this.moveEntity(this.b, -dx as Move, -dy as Move);

        this.checkCarrotPickup(this.a);
        this.checkCarrotPickup(this.b);

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

        const snapshot = this._history.pop();
        if (!snapshot) return;

        this.a = snapshot.a;
        this.b = snapshot.b;
        this.hearts = snapshot.hearts;
        this.moves = snapshot.moves;
        this.carrots = snapshot.carrots;
        this.carrotScore = snapshot.carrotScore;
        this.lastMove = snapshot.lastMove;
        this.status = snapshot.status;

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