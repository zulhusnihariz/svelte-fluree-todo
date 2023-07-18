<script lang="ts">
	import { assignees, type Todo, type TodoTask } from '../stores/fluree.store';
	import { getContext } from 'svelte';
	import {
		ContextName,
		type FlureeContext,
	} from '../contexts/FlureeContext.svelte';

	export let todos;
	export let currentTask: Todo<TodoTask>;

	let {
		formatUpdate: formatFlureeUpdate,
		formatDelete: formatFlureeDelete,
		transact,
	} = getContext<FlureeContext>(ContextName.FLUREE);

	let placeholder = "Assignee's email";

	let todo: Todo<string> = {
		_id: 'todo$first', // temporary id
		name: '', // temporary id
		description: '',
		tasks: [],
	};

	let tasks: TodoTask[] = [];

	let toBeUpdated: { [key: string]: any } = {};
	let toBeDeleted: { [key: string]: any }[] = [];
	let toBeCreated: { [key: string]: any }[] = [];

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

			toBeUpdated[currentTask._id]['todo/tasks'].push(taskId);
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

				toBeUpdated[currentTask._id]['todo/tasks'].splice(idx, 1);
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

<div>
	<h2 style="margin-top:10px; margin-bottom: 0px;">Todo</h2>

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
				<div style="display:flex; width:100%; height:30px; margin-bottom: 5px;">
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
				style=" margin-top: 10px;"
				on:click|preventDefault={() => handleUpdate()}>Update</button
			>
		</div>
	</div>
</div>

<div style=" border-radius:5px; margin-top:10px; padding: 5px 10px;">
	{#each todos as todo}
		<pre class="code" style="text-align:left">{JSON.stringify(
				todo,
				null,
				2
			)}</pre>
	{/each}
</div>

<style>
	pre {
		font-size: 20px;
		border: 2px solid grey;
		border-left: 12px solid rgb(120 113 108);
		border-radius: 5px;
		padding: 14px;

		/* Fixed line height */
		line-height: 24px;

		/* Use linear-gradient for background image */
		background-image: linear-gradient(
			180deg,
			rgb(41 37 36) 50%,
			rgb(28 25 23) 50%
		);

		/* Size background so that the height is 2x line-height */
		background-size: 100% 48px;

		/* Offset the background along the y-axis by top padding */
		background-position: 0 14px;
	}
</style>
