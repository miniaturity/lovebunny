import { Tile } from "./tile";
import type { SpriteCoord } from "./ruletile";

export abstract class AnimatedTile extends Tile {
    public defaultSprite: SpriteCoord | SpriteCoord[] = { x: 0, y: 0 };
    public defaultFrameDuration = 800;

    protected getAnimatedFrame(
        sprite: SpriteCoord | SpriteCoord[],
        timestamp: number,
        duration: number
    ): SpriteCoord {
        if (!Array.isArray(sprite)) {
            return sprite;
        }

        const frameIndex = Math.floor(timestamp / duration) % sprite.length;
        return sprite[frameIndex];
    }


}
