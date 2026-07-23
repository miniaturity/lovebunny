import { AnimatedTile } from "./animatedtile";
import type { SpriteCoord } from "./ruletile";


export abstract class StateTile extends AnimatedTile {
    public stateSprites: Record<string, SpriteCoord | SpriteCoord[]> = {};

    constructor(
        private _currentState: string,
        ...p: ConstructorParameters<typeof AnimatedTile>
    ) {
        super(...p);
    }

    get currentState() { return this._currentState; }
    set currentState(s: keyof typeof this.stateSprites) {
        this._currentState = s;
        this.defaultSprite = this.stateSprites[s] ?? this.defaultSprite;
    }
}