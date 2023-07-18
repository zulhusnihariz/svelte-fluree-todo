<script lang="ts">
	import { getContext } from 'svelte';
	import FlureeContext, { ContextName } from '../contexts/FlureeContext.svelte';
	import { assignees } from '../stores/fluree.store';

	let { transact } = getContext<FlureeContext>(ContextName.FLUREE);

	let assignee = {
		_id: 'assignee$assignee0',
		name: '',
		email: '',
	};

	async function handleCreateAssignee() {
		alert(JSON.stringify(assignee, null, 2));
		await transact([assignee]);
	}
</script>

<h2 style="margin-top:10px;">Assignee</h2>

<div style="display: flex; justify-content: space-evenly;">
	<div
		style="display: flex; flex-direction: column; width:50%; padding: 0 10px;"
	>
		<h3>Add</h3>

		<label for="name">Email</label>
		<input id="name" type="text" bind:value={assignee.email} />

		<label for="name">Name</label>
		<input id="name" type="text" bind:value={assignee.name} />

		<button
			style="margin-top:10px"
			on:click|preventDefault={() => handleCreateAssignee()}
		>
			Create assignee
		</button>
	</div>

	<div style="width:50%">
		<h3>List</h3>

		{#each $assignees as assignee}
			<p>{assignee['assignee/name']} {assignee['assignee/email']}</p>
		{/each}
	</div>
</div>

<style>
	label {
		text-align: left;
	}

	p,
	h2 {
		margin: 0px;
		padding: 0px;
	}
</style>
