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
        public readonly isEffector?: boolean,
    ) {}

    public effectorEnter?(game: Game): void;
}

export class CarrotEntity extends Entity {
    constructor(s: ConstructorParameters<typeof Entity>) {
        super(...s);
    }

    override effectorEnter(game: Game): void {
        
    }
}

