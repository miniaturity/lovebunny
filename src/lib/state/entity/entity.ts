import type { Game } from "../game/game.svelte";
import type { Position } from "../tile/tile";
import type { Direction } from "../tile/tiles";

export type EntityType = 
    "bunny_a"   | 
    "bunny_b"   | 
    "hearts"    |
    "carrot";

export class Entity {
    constructor(
        public id: EntityType,
        public pos: Position,
        public facing: Direction,
        public alive: boolean,
        public readonly isEffector?: boolean,
    ) {}

    public effectorEnter?(game: Game): void;
}

export class CarrotEntity extends Entity {
    constructor(public readonly iid: number, ...s: ConstructorParameters<typeof Entity>) {
        super(...s);
    }

    override effectorEnter(game: Game): void {
        game.consumeCarrot(this.iid);
    }
}

