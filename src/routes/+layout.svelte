<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />

    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://bunniesin.love" />
    <meta property="og:title" content="bunniesin.love" />
    <meta property="og:image" content="https://bunniesin.love/bunniesinlove.png" />

    <meta name="twitter:card" content="summary_large_image" /> 
    <meta name="twitter:image" content="https://bunniesin.love/bunniesinlove.png" />
    
    <meta name="theme-color" content="#5fade4" />
</svelte:head>

<style lang="scss">
	:global(*) {
        margin: 0; padding: 0;
        box-sizing: border-box;
    }

    :global(:root) {
        --carrot-orange: #f3802d;
        --grass-green: #257d31;
        --water-blue: #5fade4;
        --lpink: #fde0f4;
    }

    @font-face {
        font-family: "Halogen";
        src: url("$lib/assets/fonts/Halogen.ttf")
    }
</style>

{@render children()}

