import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { LevelData } from '$lib/data/leveldata';

export const load: PageServerLoad = async ({ platform, params }) => {
    const bucket = platform?.env.lovebunny_levels;
    if (!bucket) throw error(500, 'Level storage is not configured');
    if (!/^(0|[1-9]\d*)$/.test(params.slug)) throw error(400, 'Invalid level id');

    const obj = await bucket.get(`community/${params.slug}.json`);
    if (!obj) throw error(404, 'Level not found');

    return { level: await obj.json() as LevelData, id: params.slug };
};