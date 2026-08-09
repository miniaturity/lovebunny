import type { LevelData } from '$lib/data/leveldata';

export async function publishLevel(level: LevelData): Promise<{ id: string; moves: number }> {
    const res = await fetch('/api/levels', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(level)
    });
    if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { message?: string } | null;
        throw new Error(body?.message ?? 'Failed to publish level');
    }
    return res.json();
}