import type { Game } from "./game.svelte";
import type { EntityType, Position } from "./tile";
import type { Direction } from "./tiles";

export class Entity {
    constructor(
        public id: EntityType,
        public pos: Position,
        public facing: Direction,
        public readonly isEffector?: boolean,
    ) {}

    public effectorEnter?(game: Game): void;
}
