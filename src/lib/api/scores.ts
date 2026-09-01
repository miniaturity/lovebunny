import { getPlayerId } from '$lib/client/player';
import type { MoveName } from '$lib/state/game/game.svelte';

export async function submitScore(date: string, moves: MoveName[]) {
    const res = await fetch('/api/daily/score', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ date, playerId: getPlayerId(), moves })
    });
    if (res.status === 409) return { ok: false as const, alreadyPlayed: true };
    if (!res.ok) return { ok: false as const, alreadyPlayed: false };


    return { ok: true as const };
}

export async function fetchMyScore(date: string) {
    const res = await fetch(`/api/daily/score?date=${date}&playerId=${getPlayerId()}`);
    if (!res.ok) return null;
    return (await res.json()) as { moves: MoveName[]; score: number; submittedAt: string };
}


export async function fetchScoreDistribution(date: string) {
    const res = await fetch(`/api/daily/scores?date=${date}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to load score distribution');
    return (await res.json()) as { date: string; distribution: Record<string, number>; totalPlayers: number };
}
