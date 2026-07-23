<script lang="ts">
    import type { Snippet } from "svelte";

    let {
        showModal = $bindable(),
        children
    }: {
        showModal: boolean;
        children: Snippet;
    } = $props();
</script>

{#if showModal}
    <div class="modal-overlay">
        <div class="modal">
            
            <button onclick={() => showModal = false} title="close">
                <svg stroke="black" fill="black" stroke-width="0" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path d="M405 136.798L375.202 107 256 226.202 136.798 107 107 136.798 226.202 256 107 375.202 136.798 405 256 285.798 375.202 405 405 375.202 285.798 256z"></path></svg>
            </button>
            {@render children()}
        </div>
    </div>
{/if}

<style lang="scss">
    .modal-overlay {
        position: absolute;
        top: 0; left: 0;
        width: 100%; height: 100%;
        display: flex;
        align-items: center; justify-content: center;
        z-index: 99;
    }

    .modal {
        position: relative;
        background-color: #fff;
        font-family: "Halogen";

        
        & button {
            --w: 30px;
            position: absolute;
            top: calc(-1 * var(--w)); right: 0;
            width: var(--w);
            height: var(--w);
            background: #fff;
            border: none;
            cursor: pointer;

            & svg {
                animation: rot 1s steps(2) infinite;
            }
        }
    }

    @keyframes rot {
        0% {
            transform: rotateZ(5deg);
        } 100% {
            transform: rotateZ(-7deg);
        }
    }
</style>