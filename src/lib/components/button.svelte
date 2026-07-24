<script lang="ts">
    import { onMount, type Snippet } from "svelte";

    let {

        style = "",
        children,
        href,
        onclick,
        className = "",
    }: {
        children: Snippet;
        className?: string;
        style?: string;
        href?: string;
        onclick?: () => void;
    } = $props();

    let sign = $state<number>(Math.random() < 0.5 ? -1 : 1);

    let seed = $state<number>(Math.random() * 5 + 1)
    let computedStyle = $derived(`--seed: ${sign * seed}; ${style}`.trim());
    let computedClass = $derived(`btn ${className}`.trim());

    onMount(() => {
        const interval = setInterval(() => {
            seed = Math.random() * 5 + 1;
            sign = Math.random() < 0.5 ? -1 : 1;
        }, 3100);

        return () => clearInterval(interval);
    })
</script>

{#if onclick}
    <button class={computedClass} {onclick} style={computedStyle}>
        {@render children()}
    </button>
{:else if href}
    <a class={computedClass} {href} style={computedStyle}>
        {@render children()}
    </a>
{/if}

<style lang="scss">
    .btn {
        padding: 4px 8px;
        font-family: "Halogen";
        font-size: 1.3rem;
        cursor: pointer;
        border: none;
        background-color: var(--grass-green);
        color: #fff;
        text-decoration: none;
        box-shadow: 2px 2px #000;

        animation: rotate 3.2s steps(3) infinite;
    }

    @keyframes rotate {
        0% {
            transform: rotateZ(calc(var(--seed) * 0.7deg));
        }
        50% {
            transform: rotateZ(calc(var(--seed) * -0.4deg));
        }
        100% {
            transform: rotateZ(calc(var(--seed) * 0.3deg));
        }
    }
</style>