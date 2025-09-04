<!--
BaseComponent.svelte - Template for LEGO UI components
Rule 3: LEGO Bricks - UI component
Rule 4: Four Buses - Uses EventBus for communication
Rule 6: Be Svelte-y - Uses idiomatic Svelte patterns

Instructions:
1. Copy this file to create new UI components
2. Replace BaseComponent with your component name
3. Use EventBus for all external communication
4. Follow Svelte reactivity patterns
5. Include proper accessibility attributes
-->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { eventBus } from '../buses/EventBus.js';
  
  // Component props
  export let title: string = 'Base Component';
  export let disabled: boolean = false;
  
  // Component state
  let isLoading = false;
  let data: any = null;
  
  // Unsubscribe functions
  let unsubscribeFunctions: (() => void)[] = [];

  onMount(() => {
    // Subscribe to relevant bus events
    const unsubscribeData = eventBus.subscribe('data:updated', handleDataUpdate);
    const unsubscribeError = eventBus.subscribe('error', handleError);
    
    unsubscribeFunctions = [unsubscribeData, unsubscribeError];
    
    // Request initial data
    eventBus.publish('data:request', { component: 'BaseComponent' });
  });

  onDestroy(() => {
    // Clean up subscriptions (Rule 8: Design for deletion)
    unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
  });

  // Event handlers
  function handleDataUpdate(newData: any) {
    data = newData;
    isLoading = false;
  }

  function handleError(error: { error: string; context?: string }) {
    console.warn(`[BaseComponent] Error: ${error.error}`, error.context);
    isLoading = false;
  }

  function handleClick() {
    if (disabled) return;
    
    isLoading = true;
    eventBus.publish('action:triggered', { 
      component: 'BaseComponent',
      action: 'click',
      timestamp: Date.now()
    });
  }

  // Reactive statements (Svelte-y)
  $: canClick = !disabled && !isLoading;
</script>

<div class="base-component" class:disabled class:loading={isLoading}>
  <h3>{title}</h3>
  
  {#if isLoading}
    <div class="loading-indicator" aria-live="polite">
      Loading...
    </div>
  {:else if data}
    <div class="content">
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  {:else}
    <div class="empty-state">
      No data available
    </div>
  {/if}
  
  <button 
    on:click={handleClick} 
    {disabled}
    class:can-click={canClick}
    aria-label={`${title} action button`}
  >
    {isLoading ? 'Loading...' : 'Action'}
  </button>
</div>

<style>
  .base-component {
    padding: 1rem;
    border: 1px solid var(--border-color, #ddd);
    border-radius: 8px;
    margin: 0.5rem 0;
    transition: opacity 0.2s ease;
  }

  .base-component.disabled {
    opacity: 0.6;
    pointer-events: none;
  }

  .base-component.loading {
    opacity: 0.8;
  }

  h3 {
    margin: 0 0 1rem 0;
    font-size: 1.1rem;
    color: var(--text-color, #333);
  }

  .loading-indicator {
    text-align: center;
    font-style: italic;
    color: var(--muted-color, #666);
  }

  .content {
    background: var(--bg-color, #f5f5f5);
    padding: 0.5rem;
    border-radius: 4px;
    margin-bottom: 1rem;
    font-size: 0.9rem;
  }

  .empty-state {
    text-align: center;
    color: var(--muted-color, #666);
    font-style: italic;
    margin-bottom: 1rem;
  }

  button {
    background: var(--button-bg, #007bff);
    color: var(--button-color, white);
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.2s ease;
  }

  button:hover.can-click {
    background: var(--button-hover-bg, #0056b3);
  }

  button:disabled {
    background: var(--button-disabled-bg, #ccc);
    cursor: not-allowed;
  }
</style>