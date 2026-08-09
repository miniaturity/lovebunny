import { browser } from '$app/environment';
const KEY = 'lovebunny:player-id';

export function getPlayerId(): string {
    if (!browser) return '';
    let id = localStorage.getItem(KEY);
    if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem(KEY, id);
    }
    return id;
}