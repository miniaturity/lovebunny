import { Game, MOVE_DICT, type MoveName } from '$lib/state/game/game.svelte';
import type { LevelData } from '$lib/data/leveldata';
import { solveLevel } from '$lib/state/game/solver';

export interface ScoreRecord {
    playerId: string;
    date: string;
    submittedAt: string;
    moves: MoveName[]; 
    score: number;
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
    moves: MoveName[],
    score: number
): Promise<{ ok: true } | { ok: false; reason: 'already-played' }> {
    const record: ScoreRecord = { playerId, date, submittedAt: new Date().toISOString(), moves, score };

    const written = await bucket.put(scoreKey(date, playerId), JSON.stringify(record), {
        customMetadata: { score: String(score) },
        onlyIf: { etagDoesNotMatch: '*' }
    });

    return written ? { ok: true } : { ok: false, reason: 'already-played' };
}

export function verifySolution(level: LevelData, moves: MoveName[]): { solved: boolean; score: number } {
    const game = new Game(level.board, level.a, level.b, level.title, level.day, level.author, level.carrots);
    game.status = 'playing';
    game.solution = solveLevel(level.board, level.a, level.b, level.carrots); 

    for (const move of moves) {
        const vector = MOVE_DICT[move];
        if (!vector) return { solved: false, score: 0 };
        game.move(vector.x, vector.y);
    }

    // @ts-ignore
    // game.move changes game.status
    return { solved: game.status === 'won', score: game.getScore() };
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
            // for levels made before score update
            const score = obj.customMetadata?.score ?? obj.customMetadata?.moveCount;
            if (!score) continue;
            distribution[score] = (distribution[score] ?? 0) + 1;
            totalPlayers++;
        }
        cursor = listed.truncated ? listed.cursor : undefined;
    } while (cursor);

    return { date, totalPlayers, distribution };
}