export interface ScoreDistribution {
	day: number;
	date: string; // UTC YYYY-MM-DD
	total: number;
	counts: Record<string, number>;
}

export function emptyDistribution(day: number, date: string): ScoreDistribution {
	return { day, date, total: 0, counts: {} };
}


export function calcTopPercent(distribution: ScoreDistribution, moves: number): number {
	if (distribution.total <= 0) return 100;

	let atOrBetter = 0;
	for (const [key, count] of Object.entries(distribution.counts)) {
		if (Number(key) <= moves) atOrBetter += count;
	}

	const percent = Math.round((atOrBetter / distribution.total) * 100);
	return Math.min(100, Math.max(1, percent));
}

export function sortedBuckets(distribution: ScoreDistribution): Array<[number, number]> {
	return Object.entries(distribution.counts)
		.map(([moves, count]) => [Number(moves), count] as [number, number])
		.sort((a, b) => a[0] - b[0]);
}