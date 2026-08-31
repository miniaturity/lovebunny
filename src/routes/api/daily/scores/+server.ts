import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { normalizeLevelPayload } from '$lib/data/leveldata';
import { emptyDistribution, calcTopPercent, type ScoreDistribution } from '$lib/data/scores';
import { solveLevel } from '$lib/state/game/solver';
import { getDailyScoreDistribution } from '$lib/server/scores';

const MAX_MOVES = 1000; 
const SCORE_QUOTA_TTL = 60 * 60 * 24 * 3; 


function scoreKey(date: string) {
	return `scores/${date}.json`;
}

async function loadTodaysLevel(bucket: R2Bucket, date: string) {
	const obj = (await bucket.get(`daily/${date}.json`)) ?? (await bucket.get('daily/latest.json'));
	if (!obj) throw error(404, 'No daily level available yet');

	const daily = normalizeLevelPayload(await obj.json<unknown>());
	if (!daily?.board) throw error(500, 'Stored dail	y level is malformed');
	return daily;
}

export const GET: RequestHandler = async ({ platform }) => {
	const bucket = platform?.env.lovebunny_levels;
	if (!bucket) throw error(500, 'Level storage is not configured');

	const date = new Date().toISOString().slice(0, 10);
	const distribution = await getDailyScoreDistribution(bucket, date);

	return json(distribution, { headers: { 'cache-control': 'public, max-age=60' } });
};

export const POST: RequestHandler = async ({ request, platform, getClientAddress }) => {
	const env = platform?.env;
	if (!env?.lovebunny_levels) throw error(500, 'Level storage is not configured');

	const ip = getClientAddress();

	const { success } = await env.SUBMIT_LIMITER.limit({ key: `score:${ip}` });
	if (!success) throw error(429, 'Too many requests');

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		throw error(400, 'Malformed request body');
	}

	const { day, moves } = (body ?? {}) as { day?: unknown; moves?: unknown };
	if (typeof day !== 'number' || !Number.isFinite(day)) throw error(400, 'Invalid day');
	if (typeof moves !== 'number' || !Number.isInteger(moves) || moves < 1 || moves > MAX_MOVES) {
		throw error(400, 'Invalid move count');
	}

	const date = new Date().toISOString().slice(0, 10);
	const bucket = env.lovebunny_levels;

	const daily = await loadTodaysLevel(bucket, date);
	if (daily.day !== day) {
		throw error(409, "That score is for a different puzzle. Refresh and try again.");
	}

	
	const solution = solveLevel(daily.board, daily.a, daily.b);
	if (solution && moves < solution.length) {
		throw error(422, "That move count is below this puzzle's optimal solution.");
	}

	const key = scoreKey(date);
	const quotaKey = `scorequota:${ip}:${date}`;
	const alreadyCounted = await env.SUBMIT_QUOTA.get(quotaKey);

	let distribution: ScoreDistribution | null = null;

	if (!alreadyCounted) {
		for (let attempt = 0; attempt < 3 && !distribution; attempt++) {
			const existing = await bucket.get(key);
			const current: ScoreDistribution = existing
				? await existing.json<ScoreDistribution>()
				: emptyDistribution(day, date);

			current.day = day;
			current.counts[moves] = (current.counts[moves] ?? 0) + 1;
			current.total += 1;

			const put = await bucket.put(key, JSON.stringify(current), {
				onlyIf: existing ? { etagMatches: existing.httpEtag } : undefined
			});

			if (put) distribution = current;
		}

		await env.SUBMIT_QUOTA.put(quotaKey, '1', { expirationTtl: SCORE_QUOTA_TTL });
	}

	if (!distribution) {
		const existing = await bucket.get(key);
		distribution = existing ? await existing.json<ScoreDistribution>() : emptyDistribution(day, date);
	}

	return json({
		distribution,
		percentile: calcTopPercent(distribution, moves),
		counted: !alreadyCounted
	});
};