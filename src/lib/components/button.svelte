<script lang="ts">
    import type { Snippet } from "svelte";


    let {
        style,
        children,
        href,
        onclick
    }: {
        children: Snippet;
        style?: string;
        href?: string;
        onclick?: () => void;
    } = $props();
</script>

{#if onclick}
    <button class="btn" onclick={onclick} style={style}>
        {@render children()}
    </button>
{:else if href}
    <a href={href} style={style}>
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
        background-color: #000;
        color: #fff;
    }
</style>