import type { DialogueTree } from "$lib/components/game/dialogue.svelte";
import type { GameParams } from "../state/game/game.svelte";

const LEVEL = [
    [
      1,
      1,
      0,
      2,
      1,
      1,
      1,
      2
    ],
    [
      1,
      4,
      0,
      1,
      2,
      1,
      2,
      1
    ],
    [
      1,
      1,
      0,
      0,
      1,
      5,
      1,
      4
    ],
    [
      1,
      1,
      1,
      0,
      1,
      1,
      2,
      1
    ],
    [
      5,
      1,
      1,
      1,
      2,
      1,
      1,
      1
    ],
    [
      1,
      1,
      1,
      5,
      1,
      1,
      1,
      1
    ],
    [
      1,
      1,
      4,
      0,
      1,
      1,
      2,
      1
    ],
    [
      4,
      1,
      2,
      0,
      5,
      4,
      1,
      1
    ]
]

const TITLE = "you shouldnt be able to see this.";
const DAY = 1;

export const T4_GAME: GameParams = [
    LEVEL,
    { x: 0, y: 0 }, 
    { x: 7, y: 7 },
    TITLE,
    DAY,
    "miniaturity",
    [
        {
            x: 1,
            y: 5
        }
    ]
]

export const T4_DIALOGUE: DialogueTree = {
    start: {
        id: "start",
        expression: "introspective.png",
        text: "finally, let me teach you about.. carrots!",
        name: "mini",
        pausePoints: [
            {
                index: 8,
                ms: 250
            },
            {
                index: 33,
                ms: 150
            },
            {
                index: 34,
                ms: 500,
                expression: "happy.png"
            }
        ],
        next: "teach"
    },

    teach: {
        id: "teach",
        expression: "introspective.png",
        text: "carrots subtract 3 from your move count!",
        name: "mini",
        next: "strat"
    },

    strat: {
        id: "strat",
        expression: "neutral.png",
        text: "sometimes it is optimal to take a detour for a carrot, as opposed to reuiniting in as little moves as possible!",
         pausePoints: [
            {
                index: 54,
                ms: 250
            }
        ],
        name: "mini"
    },


    onWin: {
        id: "onWin",
        expression: "happy.png",
        text: "wow you did it! the optimal score was 7!",
        pausePoints: [
            {
                index: 15,
                ms: 500
            }
        ],
        name: "mini"
    }
}