import type { DialogueTree } from "$lib/components/dialogue.svelte";
import type { GameParams } from "../state/game.svelte";

const LEVEL = [
    [1, 1, 1, 2, 1],
    [1, 4, 1, 1, 2],
    [1, 1, 2, 1, 1],
    [1, 1, 1, 2, 1],
    [4, 1, 1, 1, 2],    
];

const TITLE = "you shouldnt be able to see this.";
const DAY = 1;

export const T1_GAME: GameParams = [
    LEVEL,
    { x: 0, y: 0 }, 
    { x: 4, y: 4 },
    TITLE,
    DAY,
    "miniaturity"
]

export const T1_DIALOGUE: DialogueTree = {
    start: {
        id: "start",
        expression: "introspective.png",
        text: "hey! you look new here!",
        name: "mini",
        pausePoints: [
            {
                index: 4,
                ms: 500
            }
        ],
        next: "teach"
    },

    teach: {
        id: "teach",
        expression: "happy.png",
        text: "how about i teach you the basics?",
        name: "mini",
        next: "move"
    },

    move: {
        id: "move",
        expression: "neutral.png",
        text: "to move, use WASD or your arrow keys!",
        name: "mini",
        pausePoints: [
            {
                index: 8,
                ms: 250
            }
        ],
        next: "bunnies"
    },

    bunnies: {
        id: "bunnies",
        expression: "happy.png",
        text: "the white bunny is you! the brown bunny will always move opposite of where you want.",
        name: "mini",
        pausePoints: [
            {
                index: 23,
                continue: true,
                expression: "neutral.png"
            }
        ],
        next: "win"
    },

    win: {
        id: "win",
        expression: "happy.png",
        text: "finally, to win, reunite the bunnies! they must be one tile away from each other in any cardinal direction.",
        pausePoints: [
            {
                index: 8,
                ms: 250
            },
            {
                index: 16,
                ms: 250
            },
            {
                index: 37,
                continue: true,
                expression: "neutral.png"
            }
        ],

        next: "conclude",
        name: "mini"
    },

    conclude: {
        id: "conclude",
        expression: "happy.png",
        text: "that's all you need to know! try it out now!",
        pausePoints: [
            {
                index: 28,
                ms: 500
            }
        ],
        name: "mini"
    },


    onWin: {
        id: "onWin",
        expression: "happy.png",
        text: "that was pretty easy! press next when you're ready to move on.",
        pausePoints: [
            {
                index: 21,
                ms: 500
            }
        ],
        name: "mini"
    }
}