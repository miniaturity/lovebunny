import type { DialogueNode, DialogueTree } from "$lib/components/dialogue.svelte";
import type { Game } from "../state/game.svelte";

const LEVEL = [
    [1, 1, 1, 2, 1],
    [1, 4, 1, 1, 2],
    [1, 1, 2, 1, 1],
    [1, 1, 1, 2, 1],
    [4, 1, 1, 1, 2],    
];

const TITLE = "you shouldnt be able to see this.";
const DAY = -1;

export const TUTORIAL_1: ConstructorParameters<typeof Game> = [
    LEVEL,
    { x: 0, y: 0 }, 
    { x: 4, y: 4 },
    TITLE,
    DAY
]

export const T1_DIALOGUE: DialogueTree = {
    start: {
        id: "start",
        expression: "happy.png",
        text: "hello! welcome to the tutorial",
        name: "mini"
    }
}