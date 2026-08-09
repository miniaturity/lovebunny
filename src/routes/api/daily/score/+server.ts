import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getPlayerScore, submitDailyScore, verifySolution } from '$lib/server/scores';
import { validateLevelPayload } from '$lib/server/levels';
import type { MoveName } from '$lib/state/game.svelte';

const MAX_MOVES = 500;
const VALID_MOVES = new Set<MoveName>(['up', 'down', 'left', 'right']);

export const GET: RequestHandler = async ({ platform, url }) => {
    const bucket = platform?.env.lovebunny_levels;
    if (!bucket) throw error(500, 'Level storage is not configured');

    const date = url.searchParams.get('date');
    const playerId = url.searchParams.get('playerId');
    if (!date || !playerId) throw error(400, 'date and playerId are required');

    const score = await getPlayerScore(bucket, date, playerId);
    if (!score) throw error(404, 'No score submitted yet');
    return json(score);
};

export const POST: RequestHandler = async ({ request, platform, getClientAddress }) => {
    const env = platform?.env;
    if (!env?.lovebunny_levels) throw error(500, 'Level storage is not configured');

    const { success } = await env.SCORE_LIMITER.limit({ key: getClientAddress() });
    if (!success) throw error(429, 'Too many requests — slow down a bit.');

    const body = (await request.json().catch(() => null)) as
        | { date?: string; playerId?: string; moves?: unknown }
        | null;
    const { date, playerId, moves } = body ?? {};

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) throw error(400, 'Invalid date');
    if (!playerId || typeof playerId !== 'string' || playerId.length > 100) throw error(400, 'Invalid playerId');
    if (
        !Array.isArray(moves) ||
        moves.length < 1 ||
        moves.length > MAX_MOVES ||
        !moves.every((m) => VALID_MOVES.has(m))
    ) {
        throw error(400, 'Invalid moves');
    }

    const levelObj = (await env.lovebunny_levels.get(`daily/${date}.json`)) ?? (await env.lovebunny_levels.get('daily/latest.json'));
    if (!levelObj) throw error(404, 'No daily level for that date');

    
    const { level, error: levelError } = validateLevelPayload(await levelObj.json());
    if (levelError || !level) throw error(500, `That day's level is corrupted in storage: ${levelError}`);

    if (!verifySolution(level, moves as MoveName[])) {
        throw error(400, "That move sequence doesn't solve today's puzzle.");
    }

    const result = await submitDailyScore(env.lovebunny_levels, date, playerId, moves as MoveName[]);
    if (!result.ok) throw error(409, "You've already submitted a score for today.");

    return json({ ok: true, moves: moves.length }, { status: 201 });
};