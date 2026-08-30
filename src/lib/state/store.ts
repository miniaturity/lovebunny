import { persisted } from "svelte-persisted-store";

export const hasVisited = persisted('has-visited', false);
export const hasCompletedTip = persisted('completed-tip', false);