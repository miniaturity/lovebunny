import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { normalizeLevelPayload } from '$lib/data/leveldata';

export const GET: RequestHandler = async ({ platform }) => {
    const bucket = platform?.env.lovebunny_levels;
    if (!bucket) throw error(500, 'Level storage is not configured');

    const today = new Date().toISOString().slice(0, 10); // UTC YYYY-MM-DD
    const obj = (await bucket.get(`daily/${today}.json`)) ?? (await bucket.get('daily/latest.json'));
    if (!obj) throw error(404, 'No daily level available yet');

    const daily = normalizeLevelPayload(await obj.json<unknown>());
    if (!daily?.board) throw error(500, 'Stored daily level is malformed');

    return json(daily, {
        headers: { 'cache-control': 'public, max-age=300' }
    });
};