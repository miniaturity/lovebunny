import type { Game } from "./game.svelte";
import type { Tile } from "./tile";
import { AnimatedTile } from "./animatedtile";

// 1 - tile must match
// 0 - tile must not match
// null - dont care
export type Match = 1 | 0 | null;

export type Rotation = 0 | 90 | 180 | 270;

const NEIGHBOR_OFFSETS = [
	{ x: 0, y: -1 },  { x: 1, y: -1 },
	{ x: 1, y: 0 },   { x: 1, y: 1 },
	{ x: 0, y: 1 },   { x: -1, y: 1 },
	{ x: -1, y: 0 },  { x: -1, y: -1 }
];

export type SpriteCoord = { x: number; y: number };

export interface TileRule {
    // N, NE, E, SE, S, SW, W, NW
    pattern: Match[];
    sprite: SpriteCoord | SpriteCoord[]; 
    frameDuration?: number; 
    rotations?: boolean;
    mirrorX?: boolean;
}
function rotate90(arr: Match[]): Match[] {
    return [
        arr[6], // New N  = Old W
        arr[7], // New NE = Old NW
        arr[0], // New E  = Old N
        arr[1], // New SE = Old NE
        arr[2], // New S  = Old E
        arr[3], // New SW = Old SE
        arr[4], // New W  = Old S
        arr[5], // New NW = Old SW
    ];
}

function flipX(arr: Match[]): Match[] {
    return [
        arr[0], // N  stays N
        arr[7], // NE becomes NW
        arr[6], // E  becomes W
        arr[5], // SE becomes SW
        arr[4], // S  stays S
        arr[3], // SW becomes SE
        arr[2], // W  becomes E
        arr[1], // NW becomes NE
    ];
}

export interface SpriteResult {
    x: number;
    y: number;
    rotationAngle: Rotation;
    flipX: boolean;
}

export abstract class RuleTile extends AnimatedTile {
    protected rules: TileRule[] = [];

    public getSprite(game: Game, x: number, y: number, timestamp: number): SpriteResult {
        const neighbors = this.getNeighbors(game, x, y);

        for (const rule of this.rules) {
            const permutations = this.getPermutations(rule);

            for (const perm of permutations) {
                if (this.checkMatch(perm.pattern, neighbors)) {
                    // calculate which frame in the animation sequence to display
                    const coord = this.getAnimatedFrame(rule.sprite, timestamp, rule.frameDuration ?? this.defaultFrameDuration);

                    return {
                        x: coord.x,
                        y: coord.y,
                        rotationAngle: perm.angle as Rotation,
                        flipX: perm.flipped
                    };
                }
            }
        }

        const defaultCoord = this.getAnimatedFrame(this.defaultSprite, timestamp, this.defaultFrameDuration);
        return { x: defaultCoord.x, y: defaultCoord.y, rotationAngle: 0, flipX: false };
    }

    private getPermutations(rule: TileRule) {
        const results: { pattern: Match[]; angle: number; flipped: boolean }[] = [];
        
        let currentPattern = rule.pattern;
        let currentAngle = 0;

        // how many rotations to perform, 4 if rotations=true, else 1
        const maxRotations = rule.rotations ? 4 : 1;

        for (let r = 0; r < maxRotations; r++) {
            results.push({ pattern: currentPattern, angle: currentAngle, flipped: false });

            // if mirrorX is enabled, add the flipped version of this rotation
            if (rule.mirrorX) {
                results.push({ pattern: flipX(currentPattern), angle: currentAngle, flipped: true });
            }

            currentPattern = rotate90(currentPattern);
            currentAngle = (currentAngle + 90) % 360;
        }

        return results;
    }

    private checkMatch(pattern: Match[], neighbors: (Tile | null)[]): boolean {
        for (let i = 0; i < 8; i++) {
            const requirement = pattern[i];
            if (requirement === null) continue;

            const neighborTile = neighbors[i];
            const isMatch = neighborTile !== null && neighborTile.name === this.name;

            if (requirement === 1 && !isMatch) return false;
            if (requirement === 0 && isMatch) return false;
        }
        return true;
    }

    private getNeighbors(game: Game, x: number, y: number) {
        return NEIGHBOR_OFFSETS.map(offset => {
            const nx = x + offset.x;
            const ny = y + offset.y;
            if (ny < 0 || ny >= game.board.length || nx < 0 || nx >= game.board[0].length) {
                return null;
            }
            return game.board[ny][nx];
        });
    }
}