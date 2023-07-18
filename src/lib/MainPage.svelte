<script lang="ts">
	import {
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
	import CollectionPredicateTab from './CollectionPredicateTab.svelte';
	import AssigneeTab from './AssigneeTab.svelte';
	import TodoTab from './TodoTab.svelte';

	let { fetchSchema, formatQuery } = getContext<FlureeContext>(
		ContextName.FLUREE
	);

	let formatted_todos = [];

	let currentTask: Todo<TodoTask> = {
		_id: '',
		collection: '',
		name: '',
		description: '',
		tasks: [],
	};

	let tables = {};

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

			formatted_todos = formatQuery($todos);
		});

		Object.assign(currentTask, formatted_todos[0]);
	});
</script>

<div style="margin-top:70px; height:60vh;">
	{#if $currentTab === Tab.COLLECTION_PREDICATE}
		<CollectionPredicateTab {tables} />
	{/if}

	{#if $currentTab === Tab.ASSIGNEE}
		<AssigneeTab />
	{/if}

	{#if $currentTab === Tab.TODO}
		<TodoTab todos={formatted_todos} {currentTask} />
	{/if}
</div>
