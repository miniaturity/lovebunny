import { Entity } from "./entity";
import type { Game } from "./game.svelte";

export class Button extends Entity {
    
    constructor(
        private disableId?: number,
        ...p: ConstructorParameters<typeof Entity>) {
        super(...p);
    }

    public effectorEnter(game: Game): void {
        // TODO: disable isPassable on every tile of disableId.
    }

    
}