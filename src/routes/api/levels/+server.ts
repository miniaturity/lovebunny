import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { validateLevelPayload, sanitizeText, hashLevel, nextCommunityId, MIN_MOVES_REQUIRED } from '$lib/server/levels';
import { solveLevel } from '$lib/state/game/solver';

const MAX_LEVEL_BYTES = 20_000;
const DAILY_QUOTA_PER_IP = 8;

export const GET: RequestHandler = async ({ platform, url }) => {
    const bucket = platform?.env.lovebunny_levels;
    if (!bucket) throw error(500, 'level storage is not configured');

    const cursor = url.searchParams.get('cursor') ?? undefined;
    const listed = await bucket.list({ prefix: 'community/', limit: 20, cursor, include: ['customMetadata'] });

    const lovebunny_levels = listed.objects
        .filter((o) => !o.key.startsWith('community/byhash/'))
        .map((o) => ({
            id: o.key.replace('community/', '').replace('.json', ''),
            title: o.customMetadata?.title ?? 'untitled',
            author: o.customMetadata?.author ?? 'anonymous',
            moves: o.customMetadata?.moves ? Number(o.customMetadata.moves) : null,
            uploaded: o.uploaded
        }));

    return json({ lovebunny_levels, cursor: listed.truncated ? listed.cursor : null });
};

export const POST: RequestHandler = async ({ request, platform, getClientAddress }) => {
    const env = platform?.env;
    if (!env?.lovebunny_levels) throw error(500, 'level storage is not configured');

    const ip = getClientAddress();

    const { success } = await env.SUBMIT_LIMITER.limit({ key: ip });
    if (!success) throw error(429, 'too many requests! slow down a bit and try again.');

    const quotaKey = `quota:${ip}:${new Date().toISOString().slice(0, 10)}`;
    const used = Number((await env.SUBMIT_QUOTA.get(quotaKey)) ?? '0');
    if (used >= DAILY_QUOTA_PER_IP) throw error(429, "you've hit today's upload limit.");

    let body: unknown;
    try {
        body = await request.json();
    } catch {
        throw error(400, 'Malformed request body');
    }

    const { level, error: validationError } = validateLevelPayload(body);
    if (validationError || !level) throw error(400, validationError ?? 'Invalid level');

    const raw = JSON.stringify(level);
    if (raw.length > MAX_LEVEL_BYTES) throw error(413, 'Level is too large.');

    const moves = solveLevel(level.board, level.a, level.b);
    if (!moves) throw error(422, "this level isn't solvable. fix it in the editor before publishing.");
    if (moves.length < MIN_MOVES_REQUIRED) {
        throw error(422, 'this level is solved instantly. add more of a puzzle before publishing.');
    }

    const hash = await hashLevel(level);
    const dupe = await env.lovebunny_levels.head(`community/byhash/${hash}`);
    if (dupe) throw error(409, 'An identical level has already been submitted.');

    let id: string;
    try {
        id = String(await nextCommunityId(env.lovebunny_levels));
    } catch {
        throw error(500, 'Could not allocate a level id — please try again.');
    }
    const title = sanitizeText(level.title);
    const author = sanitizeText(level.author || 'anonymous');
    const record = { ...level, title, author, id, moves: moves.length, submittedAt: new Date().toISOString() };

    await env.lovebunny_levels.put(`community/${id}.json`, JSON.stringify(record), {
        customMetadata: { title, author, moves: String(moves.length) }
    });
    await env.lovebunny_levels.put(`community/byhash/${hash}`, id);
    await env.SUBMIT_QUOTA.put(quotaKey, String(used + 1), { expirationTtl: 60 * 60 * 24 * 2 });

    return json({ id, moves: moves.length }, { status: 201 });
};