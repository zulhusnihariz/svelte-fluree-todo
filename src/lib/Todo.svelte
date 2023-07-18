<script lang="ts">
	import {
		assignees,
		collections,
		predicates,
		todos,
		type Todo,
		type TodoTask,
		Tab,
		currentTab,
	} from '../stores/fluree.store';
	import { getContext, onMount } from 'svelte';
	import {
		ContextName,
		type FlureeContext,
	} from '../contexts/FlureeContext.svelte';

	let {
		fetchSchema,
		formatQuery,
		formatUpdate: formatFlureeUpdate,
		formatDelete: formatFlureeDelete,
		transact,
	} = getContext<FlureeContext>(ContextName.FLUREE);

	let placeholder = "Assignee's email";

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

	let assignee = {
		_id: 'assignee$assignee0',
		name: '',
		email: '',
	};

	let todo: Todo<string> = {
		_id: 'todo$first', // temporary id
		name: '', // temporary id
		description: '',
		tasks: [],
	};

	let tasks: TodoTask[] = [];
	let tables = {};
	let formatted = [];

	let currentTask: Todo<TodoTask> = {
		_id: '',
		collection: '',
		name: '',
		description: '',
		tasks: [],
	};

	let toBeUpdated: { [key: string]: any }[] = [];
	let toBeDeleted: { [key: string]: any }[] = [];
	let toBeCreated: { [key: string]: any }[] = [];

	onMount(async () => {
		await fetchSchema();

		let hashedCollection = $collections.reduce((acc, collection) => {
			let id = collection['_id'];
			let name = collection['_collection/name'];
			let doc = collection['_collection/doc'];

			acc[name] = { id, name, doc };
			return acc;
		}, {});

		$predicates.forEach((predicate) => {
			let keys = Object.keys(predicate);
			let temp = {};
			let name = predicate['_predicate/name'];

			let [collection, _] = name.split('/');

			let targetTable = ['todo', 'task', 'assignee'];

			if (!targetTable.find((el) => el === collection)) return;
			if (name[0] === '_') return;

			keys.forEach((key) => {
				let [_, field] = key?.split('/');
				if (!field) field = key;

				if (!tables[collection]) {
					tables[collection] = {
						table: hashedCollection[collection],
						columns: [],
					};
				}

				temp[field] = predicate[key];
			});

			tables[collection].columns.push(temp);

			formatted = formatQuery($todos);
		});

		Object.assign(currentTask, formatted[0]);
	});

	function consoleChanges() {
		console.log('existing', currentTask.tasks);
		console.log('delete', toBeDeleted);
		console.log('create', toBeCreated);
		console.log('update', Object.values(toBeUpdated));
	}

	async function handleSubmit() {
		await transact([todo, ...tasks]);
	}

	async function handleUpdate() {
		await transact([
			...toBeCreated,
			...Object.values(toBeUpdated),
			...toBeDeleted,
		]);
	}

	async function handleCreateAssignee() {
		alert(JSON.stringify(assignee, null, 2));
		await transact([assignee]);
	}

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

	function addTask(index: number, mode: 'create' | 'update' = 'create') {
		if (mode === 'create') {
			let task = {
				_id: `task$${index}`,
				name: '',
				isCompleted: false,
				assignee: {
					_id: `assignee$assignee${index}`,
					name: '',
					email: '',
					todos: ['todo$first'],
				},
			};
			tasks.push(task);
			tasks = tasks;

			todo.tasks.push(task._id);
			todo.tasks = todo.tasks;
		}

		if (mode === 'update') {
			const taskId = `task$${index}`;
			let task = {
				_id: taskId,
				name: '',
				isCompleted: false,
				assignee: {
					_id: `assignee$assignee${index}`,
					name: '',
					email: '',
					todos: [currentTask._id],
				},
			};
			currentTask.tasks.push(task);
			currentTask.tasks = currentTask.tasks;

			toBeCreated.push(task);
			toBeCreated = toBeCreated;

			if (!toBeUpdated[currentTask._id]) {
				let data = { _id: currentTask._id, collection: 'todo', tasks: [] };
				toBeUpdated[currentTask._id] = <{ tasks: string[] }>formatFlureeUpdate({
					data,
				});
			}
			toBeUpdated[currentTask._id].tasks.push(taskId);
		}

		consoleChanges();
	}

	function removeTask(index: number, mode: 'create' | 'update' = 'create') {
		if (mode === 'create') {
			tasks.splice(index, 1);
			tasks = tasks;
		}

		if (mode === 'update') {
			let target = currentTask.tasks[index];
			let idx = toBeCreated.findIndex((el) => el._id === target._id);

			if (idx >= 0) {
				toBeCreated.splice(idx, 1);
				toBeCreated = toBeCreated;

				toBeUpdated[currentTask._id].tasks.splice(idx, 1);
			} else {
				let deleteData = formatFlureeDelete<typeof target>({
					data: target,
					deleteAll: true,
				});
				toBeDeleted.push(deleteData);
			}

			currentTask.tasks.splice(index, 1);
			currentTask.tasks = currentTask.tasks;
		}

		// consoleChanges();
	}

	function handleBlurInput(e) {
		// need to handle different input type
		let { _id, collection, predicate } = JSON.parse(e.target.dataset.fluree);

		if (!collection) return;
		let value = e.target.value;

		if (!toBeUpdated[_id]) toBeUpdated[_id] = { _id, _action: 'update' };

		if (e.target.type === 'checkbox') value = e.target.checked;

		if (!isNaN(parseInt(value))) value = parseInt(value);

		toBeUpdated[_id][`${collection}/${predicate}`] = value;
	}
</script>

<div style="margin-top:70px; height:60vh;">
	{#if $currentTab === Tab.COLLECTION_PREDICATE}
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
					<input
						id="collection-doc"
						type="text"
						bind:value={collectionInput.doc}
					/>

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
					<input
						id="predicate-doc"
						type="text"
						bind:value={predicateInput.doc}
					/>

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
						``
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
	{/if}

	{#if $currentTab === Tab.ASSIGNEE}
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
	{/if}

	{#if $currentTab === Tab.TODO}
		<div>
			<h2 style="margin-top:10px;">Todo</h2>

			<div style="display:flex; justify-content: space-evenly;">
				<div
					style="display:flex; flex-direction:column; width:50%; padding: 0 10px;"
				>
					<h3>Create</h3>

					<label for="name">Name</label>
					<input id="name" type="text" bind:value={todo.name} />

					<label for="description">Description</label>
					<input id="description" type="text" bind:value={todo.description} />

					<div style="display:flex">
						<button
							style=" margin: 20px 0;"
							on:click|preventDefault={() => addTask(tasks.length + 1)}
						>
							+ Task
						</button>
					</div>

					{#each tasks as _, i}
						<div
							style="display:flex; width:100%; height:30px; margin-bottom: 5px;"
						>
							<button
								style="display:flex; align-items: center; justify-content: center; margin-right: 5px; "
								on:click|preventDefault={() => removeTask(i)}
							>
								<p style="">-</p>
							</button>
							<input
								id="task-name"
								type="text"
								bind:value={tasks[i].name}
								placeholder="Name"
							/>

							<select
								name="predicate-type"
								id="predicate-type"
								bind:value={tasks[i].assignee}
								style="margin: 0 5px;"
							>
								{#if placeholder}
									<option value="" disabled selected>{placeholder}</option>
								{/if}

								{#each $assignees as assignee, idx}
									<option value={assignee._id}>
										{assignee['assignee/email']}
									</option>
								{/each}
							</select>

							<input
								id="task-iscompleted"
								type="checkbox"
								bind:checked={tasks[i].isCompleted}
							/>
						</div>
					{/each}

					<button style="margin-top:10px" on:click={() => handleSubmit()}>
						Submit
					</button>
				</div>

				<div style="display:flex; flex-direction:column; width: 50%">
					<h3>Update</h3>

					<label for="name">Name</label>
					<input
						id="name"
						name="name"
						type="text"
						data-fluree={JSON.stringify({
							_id: currentTask._id,
							collection: currentTask.collection,
							predicate: 'name',
						})}
						bind:value={currentTask.name}
						on:blur={(e) => handleBlurInput(e)}
					/>

					<label for="description">Description</label>
					<input
						id="description"
						name="description"
						type="text"
						data-fluree={JSON.stringify({
							_id: currentTask._id,
							collection: currentTask.collection,
							predicate: 'description',
						})}
						bind:value={currentTask.description}
						on:blur={(e) => handleBlurInput(e)}
					/>

					<div style="display:flex">
						<button
							style=" margin: 20px 0;"
							on:click|preventDefault={() =>
								addTask(currentTask?.tasks.length + 1, 'update')}
						>
							+ Task
						</button>
					</div>

					{#if currentTask?.tasks.length > 0}
						{#each currentTask?.tasks as _, i}
							<div
								style="display:flex; width:100%; height:30px; margin-bottom: 5px;"
							>
								<button
									style="display:flex; align-items: center; justify-content: center; margin-right: 5px; "
									on:click|preventDefault={() => removeTask(i, 'update')}
								>
									<p style="">-</p>
								</button>
								<input
									id="task-name"
									type="text"
									bind:value={currentTask.tasks[i].name}
									placeholder="Name"
									data-fluree={JSON.stringify({
										_id: currentTask.tasks[i]._id,
										collection: currentTask.tasks[i].collection,
										predicate: 'name',
									})}
									on:blur={(e) => handleBlurInput(e)}
								/>

								<select
									name="task-assignee"
									id="task-assignee"
									style="margin: 0 5px;"
									bind:value={currentTask.tasks[i].assignee}
									data-fluree={JSON.stringify({
										_id: currentTask.tasks[i].assignee._id,
										collection: currentTask.tasks[i].assignee.collection,
										predicate: 'todo',
									})}
									on:blur={(e) => handleBlurInput(e)}
								>
									{#if placeholder}
										<option value="" disabled selected>{placeholder}</option>
									{/if}

									{#each $assignees as assignee, idx}
										<option value={assignee._id}>
											{assignee['assignee/email']}
										</option>
									{/each}
								</select>

								<input
									id="task-iscompleted"
									type="checkbox"
									bind:checked={currentTask.tasks[i].isCompleted}
									data-fluree={JSON.stringify({
										_id: currentTask.tasks[i]._id,
										collection: currentTask.tasks[i].collection,
										predicate: 'isCompleted',
									})}
									on:blur={(e) => handleBlurInput(e)}
								/>
							</div>
						{/each}
					{/if}

					<button
						style=" margin: 20px 0;"
						on:click|preventDefault={() => handleUpdate()}>Update</button
					>
				</div>
			</div>
		</div>

		<div
			style="background-color:black; border-radius:5px; margin-top:10px; padding: 5px 10px;"
		>
			{#each formatted as todo}
				<pre class="code" style="text-align:left">{JSON.stringify(
						todo,
						null,
						2
					)}</pre>
			{/each}
		</div>
	{/if}
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

	.code {
		font-family: Consolas, Menlo, Monaco, Lucida Console, Liberation Mono,
			DejaVu Sans Mono, Bitstream Vera Sans Mono, Courier New, monospace, serif;
	}
</style>
