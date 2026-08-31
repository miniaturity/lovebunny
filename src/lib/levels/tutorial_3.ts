import type { DialogueTree } from "$lib/components/game/dialogue.svelte";
import type { GameParams } from "../state/game.svelte";

const LEVEL = [
    [1, 1, 1, 1, 0, 1, 1, 1, 1, 1],
    [1, 2, 1, 1, 0, 1, 1, 1, 5, 1],
    [1, 2, 2, 1, 0, 1, 1, 1, 1, 1],
    [1, 1, 4, 1, 0, 0, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 0, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 0, 1, 1, 1, 1],
    [1, 1, 5, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

const TITLE = "you shouldnt be able to see this.";
const DAY = 3;

export const T3_GAME: GameParams = [
    LEVEL,
    { x: 0, y: 0 }, 
    { x: 9, y: 9 },
    TITLE,
    DAY,
    "miniaturity"
]

export const T3_DIALOGUE: DialogueTree = {
    start: {
        id: "start",
        expression: "happy.png",
        text: "let's try a harder level! see if you can get the optimal solution!",
        pausePoints: [
            {
                index: 25,
                ms: 500
            }
        ],

        name: "mini",
    },



    onWin: {
        id: "onWin",
        expression: "happy.png",
        text: "wow! you're ready to play now :3! the optimal solution was 10 moves!",
        pausePoints: [
            {
                index: 4,
                ms: 500
            },
            {
                index: 33,
                continue: true
            }
        ],
        name: "mini",
        next: "editor"
    },

    editor: {
        id: "editor",
        name: "mini",
        expression: "neutral.png",
        text: "P.S. there is a level editor! make and share your custom-made levels! click the top-left wrench icon.",
        pausePoints: [
            {
                index: 29,
                ms: 500,
                expression: "happy.png"
            },
            {
                index: 69,
                ms: 500,
                expression: "neutral.png"
            }
        ]
    }
}