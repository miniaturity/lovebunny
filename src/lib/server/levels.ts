import { parseLevel, type LevelData } from '$lib/data/leveldata';

export const MIN_MOVES_REQUIRED = 2;

export function validateLevelPayload(body: unknown): { level: LevelData | null; error: string | null } {
    try {
        const level = parseLevel(JSON.stringify(body));
        return { level, error: null };
    } catch (e) {
        return { level: null, error: e instanceof Error ? e.message : 'Invalid level' };
    }
}

export function sanitizeText(input: string, maxLen = 40): string {
    return input.replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, maxLen) || 'untitled';
}

export async function hashLevel(level: LevelData): Promise<string> {
    const normalized = JSON.stringify({ board: level.board, a: level.a, b: level.b });
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(normalized));
    return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

const COUNTER_KEY = 'meta/community-id-counter';

export async function nextCommunityId(bucket: R2Bucket): Promise<number> {
    for (let attempt = 0; attempt < 10; attempt++) {
        const existing = await bucket.get(COUNTER_KEY);

        if (!existing) {
            const created = await bucket.put(COUNTER_KEY, '1', {
                onlyIf: { etagDoesNotMatch: '*' }
            });
            if (created) return 0;
            continue;
        }

        const current = Number(await existing.text());
        const wrote = await bucket.put(COUNTER_KEY, String(current + 1), {
            onlyIf: { etagMatches: existing.etag } //
        });
        if (wrote) return current;
    }

    throw new Error('Could not allocate a level id — please try again.');
}