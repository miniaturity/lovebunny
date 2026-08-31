import type { DialogueTree } from "$lib/components/game/dialogue.svelte";
import type { GameParams } from "../state/game/game.svelte";

const LEVEL = [
    [1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 2, 1, 1],
    [1, 1, 1, 5, 1, 2, 1],
    [5, 1, 1, 4, 1, 1, 5],
    [1, 1, 1, 1, 1, 1, 1],
    [1, 4, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1]
];

const TITLE = "you shouldnt be able to see this.";
const DAY = 2;

export const T2_GAME: GameParams = [
    LEVEL,
    { x: 0, y: 0 }, 
    { x: 6, y: 6 },
    TITLE,
    DAY,
    "miniaturity"
]

export const T2_DIALOGUE: DialogueTree = {
    start: {
        id: "start",
        expression: "introspective.png",
        text: "introducing... walls!",
        name: "mini",
        pausePoints: [
            {
                index: 12,
                ms: 150
            },
            {
                index: 13,
                ms: 150
            },
            {
                index: 14,
                ms: 150,
                expression: "happy.png"
            }
        ],
        next: "teach"
    },

    teach: {
        id: "teach",
        expression: "happy.png",
        text: "they're useful for de-synchronizing movement!",
        name: "mini",
        next: "walls"
    },

    walls: {
        id: "walls",
        expression: "neutral.png",
        text: "de-synchronizing your movement is the essential mechanic for beating a level.",
        name: "mini",
        next: "desync"
    },

    desync: {
        id: "desync",
        expression: "neutral.png",
        text: "if a wall is in the way of a bunny, the other bunny will move despite the presence of a wall for the main bunny!",
        name: "mini",

        pausePoints: [
            {
                index: 35,
                ms: 350
            }
        ],

        next: "mind"
    },

    mind: {
        id: "mind",
        expression: "introspective.png",
        text: "keep in mind, though, that the other bunny moves in the opposite direction!",
        pausePoints: [
            {
                index: 13,
                ms: 300
            },
            {
                index: 21,
                ms: 300
            }
        ],
        name: "mini"
    },


    onWin: {
        id: "onWin",
        expression: "happy.png",
        text: "good job! you figured it out!",
        pausePoints: [
            {
                index: 9,
                ms: 500
            }
        ],
        name: "mini"
    }
}