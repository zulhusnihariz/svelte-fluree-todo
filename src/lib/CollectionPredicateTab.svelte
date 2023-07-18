<script lang="ts">
	import { getContext } from 'svelte';
	import FlureeContext, { ContextName } from '../contexts/FlureeContext.svelte';

	let { transact } = getContext<FlureeContext>(ContextName.FLUREE);

	let collectionInput = {
		_id: '',
		name: '',
		doc: '',
	};

	$: {
		collectionInput._id = `_collection$${collectionInput.name}Collection`;
	}

	let predicateInput = {
		_id: '_predicate',
		name: '',
		type: '',
		doc: '',
		restrictCollection: '',
		multi: false,
		unique: false,
		index: false,
	};

	let predicateTypes = [
		{ id: 1, value: `string` },
		{ id: 2, value: `int` },
		{ id: 3, value: `boolean` },
		{ id: 4, value: `ref` },
	];

	export let tables;

	async function handleAddCollection() {
		try {
			await transact([collectionInput]);
			alert('success');
		} catch (e) {
			alert(e.message);
		}
	}

	async function handleAddPredicate() {
		if (predicateInput.restrictCollection === '')
			delete predicateInput.restrictCollection;

		let input = JSON.parse(JSON.stringify(predicateInput));

		Object.keys(input).forEach((el) => {
			if (input[el] === false || input[el] === undefined || input[el] === null)
				delete input[el];
		});

		try {
			await transact([input]);
			alert('success');
		} catch (e) {
			alert(e.message);
		}
	}
</script>

<h2 style="margin-top:10px;">Collection & Predicate</h2>
<div style="display: flex; justify-content: space-evenly;">
	<div style="display: flex; flex-direction: column; width: 50%">
		<h3>Create</h3>
		<div style="display: flex;	flex-direction: column;">
			<label for="collection-name">Name</label>
			<input
				id="collection-name"
				type="text"
				bind:value={collectionInput.name}
				required
			/>

			<label for="collection-doc">Description</label>
			<input id="collection-doc" type="text" bind:value={collectionInput.doc} />

			<button
				style="margin-top:10px"
				on:click|preventDefault={() => handleAddCollection()}
			>
				Add Collection
			</button>
		</div>
		<div style="display: flex; flex-direction: column; padding-left:5px">
			<label for="predicate-name">Name</label>
			<input
				id="predicate-name"
				type="text"
				bind:value={predicateInput.name}
				required
			/>

			<label for="predicate-doc">Description</label>
			<input id="predicate-doc" type="text" bind:value={predicateInput.doc} />

			<label for="predicate-restrictCollection">
				Restrict collection (Relation)
			</label>
			<input
				id="predicate-restrictCollection"
				type="text"
				bind:value={predicateInput.restrictCollection}
			/>

			<label for="predicate-type">Type</label>
			<select
				name="predicate-type"
				id="predicate-type"
				bind:value={predicateInput.type}
			>
				{#each predicateTypes as type}
					<option value={type.value}>
						{type.value.charAt(0).toUpperCase() + type.value.slice(1)}
					</option>
				{/each}
			</select>

			<div style="display:flex">
				<label for="predicate-index"> Index</label>
				<input
					type="checkbox"
					id="predicate-index"
					bind:checked={predicateInput.index}
				/>

				<label for="predicate-multi">Multi</label>
				<input
					type="checkbox"
					id="predicate-multi"
					bind:checked={predicateInput.multi}
				/>

				<label for="predicate-unique">Unique</label>
				<input
					type="checkbox"
					id="predicate-unique"
					bind:checked={predicateInput.unique}
				/>
			</div>
			<button
				style="margin-top:10px"
				on:click|preventDefault={() => handleAddPredicate()}
			>
				Add Predicate
			</button>
		</div>
	</div>

	<div style=" width: 50%">
		<h3>List</h3>

		<div
			style="max-height:300px; max-width:400px; overflow:scroll; margin:auto"
		>
			{#each Object.keys(tables) as key}
				<div
					style="padding-left: 5px; border: 1px solid white; text-align:left "
				>
					<span style="font-weight: bold; color:#F18F01">Table</span>
					<p class="table-name">
						{tables[key].table.name}
					</p>

					<span style="font-weight: bold; color: #e54b4b">Columns</span>

					{#each tables[key].columns as column}
						<p>{column.name} ({column.type})</p>
					{/each}
				</div>
			{/each}
		</div>
	</div>
</div>

<style>
	*::-webkit-scrollbar {
		display: none;
	}

	.table-name {
		text-align: left;
		text-overflow: ellipsis;
		overflow: hidden;
		white-space: nowrap;
	}

	* {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}

	label {
		text-align: left;
	}

	p,
	h2 {
		margin: 0px;
		padding: 0px;
	}
</style>
