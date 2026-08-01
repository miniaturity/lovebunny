import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { LevelData } from '$lib/data/leveldata';

export const load: PageServerLoad = async ({ platform }): Promise<{ daily: LevelData }> => {
    const bucket = platform?.env.lovebunny_levels;
    if (!bucket) throw error(500, 'Level storage is not configured');

    const today = new Date().toISOString().slice(0, 10);
    const obj = (await bucket.get(`daily/${today}.json`)) ?? (await bucket.get('daily/latest.json'));
    if (!obj) throw error(404, 'No daily level available yet');

    return { daily: await obj.json<LevelData>() };
};