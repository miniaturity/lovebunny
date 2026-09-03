import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { normalizeLevelPayload, type LevelData } from '$lib/data/leveldata';


const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function todayUTC(): string {
    return new Date().toISOString().slice(0, 10);
}

function parseStrictUTCDate(value: string): string | null {
    if (!DATE_RE.test(value)) return null;
    const parsed = new Date(`${value}T00:00:00.000Z`);
    if (isNaN(parsed.getTime())) return null;
    return parsed.toISOString().slice(0, 10) === value ? value : null;
}

export const load: PageServerLoad = async (
    { platform, url }
): Promise<{ daily: LevelData; today: string; serverToday: string }> => {
    const bucket = platform?.env.lovebunny_levels;
    if (!bucket) throw error(500, 'Level storage is not configured');

    const serverToday = todayUTC();
    const requestedDate = url.searchParams.get('date');

    let targetDate: string;
    let obj: R2ObjectBody | null;

    if (requestedDate === null) {
        targetDate = serverToday;
        obj = (await bucket.get(`daily/${targetDate}.json`)) ?? (await bucket.get('daily/latest.json'));
    } else {
        const normalized = parseStrictUTCDate(requestedDate);

        if (!normalized || normalized > serverToday) {
            throw redirect(302, '/');
        }

        targetDate = normalized;
        obj = await bucket.get(`daily/${targetDate}.json`);
    }

    if (!obj) {
        obj = await bucket.get('daily/latest.json');
        if (!obj) throw error(404, "Fallback level is currently unassigned.");
    }

    const daily = normalizeLevelPayload(await obj.json<unknown>());
    if (!daily?.board) throw error(500, 'Stored daily level is malformed');

    return {
        daily,
        today: targetDate,
        serverToday
    };
};