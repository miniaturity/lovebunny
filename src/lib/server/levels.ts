import { parseLevel, type LevelData } from '$lib/data/leveldata';

export const MIN_MOVES_REQUIRED = 2; // reject levels that are already (basically) solved

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