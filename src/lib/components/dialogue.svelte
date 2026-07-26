<script lang="ts">
    import { browser } from '$app/environment';
    import text_sfx_file from "$lib/assets/sfx/text.mp3";

    const preloadAudio = (src: string): HTMLAudioElement | undefined => {
        if (browser) {
            const audio = new Audio(src);
            audio.preload = "auto";
            audio.preservesPitch = false;
            audio.load();
            return audio;
        }

        return undefined;
    }

    export type DialogueTree = Record<string, DialogueNode>;
    export interface DialogueNode {
        id: string;
        expression: string; // path to img (PUBLIC)
        text: string;
        name: string;
        pausePoints?: { 
            index: number, 
            ms?: number, 
            continue?: boolean, 
            expression?: string 
        }[]
        next?: string; // id
    }

    let {
        renderDialogue = $bindable(),
        dialogue,
        dialogueKey,
        finished = $bindable()
    }: {
        renderDialogue: boolean;
        dialogue: DialogueTree;
        dialogueKey: string;
        finished: boolean;
    } = $props();

    const sfx_TEXT = preloadAudio(text_sfx_file);

    const SPEED_MS = 30;
    
    let currentDialogue = $derived(dialogue[dialogueKey]);
    let currentText = $state<string>("");
    let currentExpression = $derived<string>(currentDialogue.expression);
    let index = $state<number>(0);
    let continueFlag = $state<boolean>(false);

    let typingTimeout: number | undefined;

    function startTyping() { 
        currentText = "";
        index = 0;
        finished = false;

        clearTimeout(typingTimeout);

        typeNextChar();
    }

    function typeNextChar() {
        continueFlag = false;
        if (finished) {
            currentText = currentDialogue.text;
            return;
        }

        const pausePoints = currentDialogue.pausePoints;
        const lastPause = pausePoints?.find(p => p.index === index - 1);
        if (lastPause?.expression) currentExpression = lastPause.expression;

        if (index >= currentDialogue.text.length) return;

        currentText += currentDialogue.text[index];
        index++;

        const pause = pausePoints?.find(p => p.index === index);
        const delay = (pause ? pause?.ms || 250 : SPEED_MS);

        if (index % 3 === 0 && sfx_TEXT) {
            sfx_TEXT.volume = 1;
            sfx_TEXT.currentTime = 0;
            sfx_TEXT.playbackRate = Math.random() * (1.8 - 0.99) + 0.9;
            sfx_TEXT.play();
        }

        if (!pause?.continue)
            typingTimeout = window.setTimeout(typeNextChar, delay);
        else continueFlag = true;
    }

    function finish() { finished = true; }

    function nextOrFinish() {
        if (continueFlag) {
            typeNextChar();
            return;
        }

        if (currentText !== currentDialogue.text) {
            finish();
            return;
        }

        if (currentDialogue.next) {
            currentDialogue = dialogue[currentDialogue.next];
            startTyping();
        } else {
            renderDialogue = false;
        }
    }

    const controls: Record<string, () => void> = {
        Enter: nextOrFinish,
        " ": nextOrFinish
    }

    let keyPressed = $state<boolean>(false);

    function handleKeyUp() { keyPressed = false; }
    function handleKeyDown(e: KeyboardEvent) {
        if (keyPressed) return; // prevents skipping all dialogue by holding down enter or space
        keyPressed = true;
        const action = controls[e.key];
        action?.();
    }

    let prevDialogueId: string | number | undefined;

    $effect(() => {
        const id = currentDialogue?.id;
        if (id === prevDialogueId) return;
        prevDialogueId = id;

        Promise.resolve().then(() => startTyping());

        return () => clearTimeout(typingTimeout);
    });

</script>

<svelte:window onkeydown={handleKeyDown} onkeyup={handleKeyUp}/>

{#if currentDialogue}
    <button class="dialogue-box" onclick={nextOrFinish} role="dialog">
        <div class="db-content">
            <div class="db-dialogue">
                <div class="db-name">
                    {currentDialogue.name}
                </div>
                <div class="db-text">
                    {currentText}
                </div>

                {#if currentText.length === currentDialogue.text.length || continueFlag}
                    <div class="arrow">{"->"}</div>
                {/if}
            </div>

            
        </div>

        <div class="db-expression">
            <img
                alt={currentExpression}
                src={`/expressions/${currentExpression}`}
                onerror={() => console.error("expression " + currentExpression + " does not exist")}
            />
        </div>

        
    </button>
{/if}

<style lang="scss">
    .dialogue-box {
        position: absolute;
        bottom: 0; left: 0;
        z-index: 999;
        align-self: flex-end;

        display: flex;
        flex-direction: row;
        align-items: flex-start;
        justify-content: center;

        --pad-bottom: 50px;

        height: calc(clamp(150px, 25vh, 500px) + var(--pad-bottom));
        width: 100%;

        padding-bottom: var(--pad-bottom);
        overflow: visible;

        cursor: pointer;

        border: none;
        color: #000;
        background: #ffffff;
        background: linear-gradient(180deg,rgba(255, 255, 255, 0) 0%, rgba(235, 251, 255, 0.5) 100%);
    }

    .db-content {
        position: relative;
        width: clamp(200px, 50vw, 500px);
        height: 100%;
        
        

        display: flex;
        flex-direction: row;

        &::before {
            position: absolute;
            width: 100%; height: 100%;
            top: 0; left: 0;
            content: "";
            background-image: url("$lib/assets/images/paper-bg.png");
            background-repeat: no-repeat;
            z-index: -1;

            animation: paper-rotate 2s steps(2) infinite;
        }
    }

    .db-text {
        width: 95%;
        display: flex;
        align-items: flex-start;
        font-size: clamp(1rem, 1.5dvw, 1.2rem);
        flex-grow: 1;
        text-align: left;
        text-shadow: 2px 2px 0px #fff;
        z-index: 9;
    }

    .db-name {
        width: 100%;
        
        display: flex;
        align-items: flex-start;
        font-weight: bold;
        font-size: clamp(1.4rem, 2.5dvw, 2rem);
    }

    .db-dialogue {
        width: 100%; height: 50%;
        display: flex;
        align-self: center;
        flex-direction: column;
        padding-left: 12px;
        font-family: "Halogen";
    }

    .db-expression {
        position: relative;
        height: 100%;
        aspect-ratio: 1 / 1;

        margin-left: -5%;

        &::before {
            position: absolute;
            content: "";
            width: 125%; height: 125%;
            top: -12.5%; left: -12.5%;

            background-image: url("$lib/assets/images/note-bg.png");
            background-repeat: no-repeat;
            background-size: 100% 100%;

            z-index: -1;
        }

        & img {
            width: 100%; height: 100%;
            object-fit: cover;
        }
    }

    .arrow {
        position: absolute;
        bottom: 15%; right: 20%;

        font-size: 2rem;
    }

    @keyframes paper-rotate {
        0% {
            transform: rotateZ(1.2deg);
        } 100% {
            transform: rotateZ(-1deg);
        }
    }
</style>