import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ platform }) => {
    const bucket = platform?.env.lovebunny_levels;
    if (!bucket) throw error(500, 'Level storage is not configured');

    const today = new Date().toISOString().slice(0, 10); // UTC YYYY-MM-DD
    const obj = (await bucket.get(`daily/${today}.json`)) ?? (await bucket.get('daily/latest.json'));
    if (!obj) throw error(404, 'No daily level available yet');

    return new Response(obj.body, {
        headers: {
            'content-type': 'application/json',
            'cache-control': 'public, max-age=300'
        }
    });
};