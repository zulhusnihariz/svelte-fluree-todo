<script context="module" lang="ts">
</script>

<script lang="ts">
	import FlurreContext from './contexts/FlureeContext.svelte';
	import Todo from './lib/Todo.svelte';
	import { Tab, currentTab } from './stores/fluree.store';
</script>

<main style="display: relative;">
	<div style="position: absolute; top: 30px; left: 0; right: 0;">
		<h1>Fluree Demo</h1>
		<div>
			<button
				style="margin-top:10px"
				on:click|preventDefault={() => currentTab.set(Tab.COLLECTION_PREDICATE)}
			>
				Collection & Predicate
			</button>
			<button
				style="margin-top:10px"
				on:click|preventDefault={() => currentTab.set(Tab.ASSIGNEE)}
			>
				Assignee
			</button>
			<button
				style="margin-top:10px"
				on:click|preventDefault={() => currentTab.set(Tab.TODO)}
			>
				Todo
			</button>
		</div>
	</div>

	<div class="card">
		<FlurreContext>
			<Todo />
		</FlurreContext>
	</div>
</main>

<style>
	h1 {
		margin: 0;
		padding: 0;
	}
</style>
