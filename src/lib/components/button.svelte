<script lang="ts">
    import type { Snippet } from "svelte";


    let {
        style,
        children,
        href,
        onclick
    }: {
        style: string
        children: Snippet;
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

</style>