<script lang="ts">
    import type { Snippet } from "svelte";


    let {
        href,
        icon,
        title,
        children,
    }: {
        href: string;
        icon?: string;
        title: string;
        children?: Snippet;
    } = $props();

</script>

<a class="navlink" href={href}>
    {#if icon}
        <img src={icon} alt={title}/>
    {:else if children}
        <div class="nl-children">
            {@render children()}
        </div>
    {/if}
    
    <div class="nl-title">{title}</div>
</a>

<style lang="scss">
    .navlink {
        color: #fff;
        opacity: 0.5;
        font-size: clamp(1.4rem, 1.7vw, 2rem);
        font-family: "Halogen";
        text-decoration: none;

        display: flex;
        flex-direction: row;
        align-items: center; 
        gap: 0.5rem; 
        overflow: hidden;

        &:hover {
            opacity: 0.8;
        }
        &:visited {
            color: #fff;
        }

        &:hover {
            & .nl-children :global(svg) {
                scale: 1.1;
            }

            & .nl-title {
                margin-left: 0;
                opacity: 1;
            }
        }
    }

    .nl-title {
        margin-left: -100%;
        opacity: 0;
        transition: margin-left 0.4s ease-in-out, opacity 0.35s ease-in-out;
    }

    .nl-children {
        width: 1.2em; 
        height: 1.2em;
        display: flex;
        align-items: center;
        justify-content: center;
        transform-origin: center center;
        
        :global(svg) {
            width: 100%;
            height: 100%;
            transition: scale 0.2s ease;
        }
    }
</style>