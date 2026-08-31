import { Game, MOVE_DICT, type MoveName } from '$lib/state/game/game.svelte';
import type { LevelData } from '$lib/data/leveldata';

export interface ScoreRecord {
    playerId: string;
    date: string;
    submittedAt: string;
    moves: MoveName[]; 
}

const scoreKey = (date: string, playerId: string) => `scores/${date}/${playerId}.json`;

export async function getPlayerScore(bucket: R2Bucket, date: string, playerId: string): Promise<ScoreRecord | null> {
    const obj = await bucket.get(scoreKey(date, playerId));
    return obj ? await obj.json() : null;
}

export async function submitDailyScore(
    bucket: R2Bucket,
    date: string,
    playerId: string,
    moves: MoveName[]
): Promise<{ ok: true } | { ok: false; reason: 'already-played' }> {
    const record: ScoreRecord = { playerId, date, submittedAt: new Date().toISOString(), moves };

    const written = await bucket.put(scoreKey(date, playerId), JSON.stringify(record), {
        customMetadata: { moveCount: String(moves.length) },
        onlyIf: { etagDoesNotMatch: '*' }
    });

    return written ? { ok: true } : { ok: false, reason: 'already-played' };
}

export function verifySolution(level: LevelData, moves: MoveName[]): boolean {
    const game = new Game(level.board, level.a, level.b, level.title, level.day, level.author);
    game.status = 'playing';

    for (const move of moves) {
        const vector = MOVE_DICT[move];
        if (!vector) return false;
        game.move(vector.x, vector.y); 
    }

    // @ts-ignore
    // game.move can change game.status
    return game.status === 'won';
}

export interface ScoreDistribution {
    date: string;
    totalPlayers: number;
    distribution: Record<string, number>; 
}

export async function getDailyScoreDistribution(bucket: R2Bucket, date: string): Promise<ScoreDistribution> {
    const distribution: Record<string, number> = {};
    let totalPlayers = 0;
    let cursor: string | undefined;

    console.log(date);
    
    do {
        const listed = await bucket.list({ prefix: `scores/${date}/`, cursor, include: ['customMetadata'] });
        console.log(`[scores] prefix=scores/${date}/ found=${listed.objects.length}`,
            listed.objects.map((o) => ({ key: o.key, customMetadata: o.customMetadata }))
        );

        for (const obj of listed.objects) {
            const moveCount = obj.customMetadata?.moveCount;
            if (!moveCount) continue;
            distribution[moveCount] = (distribution[moveCount] ?? 0) + 1;
            totalPlayers++;
        }
        cursor = listed.truncated ? listed.cursor : undefined;
    } while (cursor);

    return { date, totalPlayers, distribution };
}