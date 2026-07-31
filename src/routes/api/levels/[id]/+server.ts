import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ platform, params }) => {
    const bucket = platform?.env.lovebunny_levels;
    if (!bucket) throw error(500, 'Level storage is not configured');
    if (!/^[a-f0-9-]{36}$/i.test(params.id)) throw error(400, 'Invalid level id');

    const obj = await bucket.get(`community/${params.id}.json`);
    if (!obj) throw error(404, 'Level not found');

    return new Response(obj.body, {
        headers: { 'content-type': 'application/json', 'cache-control': 'public, max-age=3600' }
    });
};