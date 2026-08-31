import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { validateLevelPayload } from '$lib/server/levels';
import { solveLevel } from '$lib/state/game/solver';

export const PUT: RequestHandler = async ({ request, platform }) => {
    const env = platform?.env;
    if (!env?.lovebunny_levels) throw error(500, 'Level storage is not configured');
    if (request.headers.get('x-admin-key') !== env.ADMIN_KEY) throw error(401, 'Unauthorized');

    const body = (await request.json()) as { date: string; level: unknown };
    if (!/^\d{4}-\d{2}-\d{2}$/.test(body.date)) throw error(400, 'date must be YYYY-MM-DD');

    const { level, error: validationError } = validateLevelPayload(body.level);
    if (validationError || !level) throw error(400, validationError ?? 'Invalid level');

    const moves = solveLevel(level.board, level.a, level.b);
    if (!moves) throw error(422, 'Level is not solvable');

    const payload = JSON.stringify(level);
    await env.lovebunny_levels.put(`daily/${body.date}.json`, payload);
    await env.lovebunny_levels.put('daily/latest.json', payload);

    return json({ ok: true, date: body.date, moves: moves.length });
};