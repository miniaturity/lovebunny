import type { Game } from '$lib/state/game.svelte';
import type { SpriteCoord, SpriteResult } from './ruletile';

export type Position = { x: number, y: number };
export type Entity = "fox" | "bunny_a" | "bunny_b";

export abstract class Tile {
    protected _occupant: Entity | "empty" = "empty";
    public isPassable: boolean = true; 

    constructor(
        public readonly tileId: number,
        private readonly _name: string,
    ) {}

    get name() { return this._name; }
    get occupant() { return this._occupant; }
    set occupant(o: Entity | "empty") { this._occupant = o; }

    onLand?(e: Entity, pos: Position, game: Game): void;
    onMove?(game: Game): void;
    tick?(game: Game): void;
    abstract getSprite(game: Game, x: number, y: number, timestamp: number): { x: number; y: number };
}

export class StaticTile extends Tile {
    constructor(
        public readonly sprite: SpriteCoord, 
        ...p: ConstructorParameters<typeof Tile>) {
        super(...p);   
    }

    getSprite(_game: Game, _x: number, _y: number, _timestamp: number): SpriteCoord {
		return this.sprite;
	}
}