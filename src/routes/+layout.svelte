<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
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

