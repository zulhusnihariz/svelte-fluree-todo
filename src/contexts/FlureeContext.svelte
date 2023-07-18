<script context="module" lang="ts">
	export enum ContextName {
		FLUREE = 'context_fluree',
	}

	export type FlureeContext = {
		fetchSchema: () => void;
		formatQuery: (args: any) => any;
		formatDelete: (args: { data: any; deleteAll?: boolean }) => any;
		formatUpdate: (args: { data: any }) => any;
		transact: (data: any) => Promise<any>;
		query: (data: any) => Promise<any>;
		multiQuery: (data: any) => Promise<any>;
	};

	export type FlureeQuery = {
		select: any[];
		from: string;
		opts: {
			compact: boolean;
			orderBy: string[];
		};
	};
</script>

<script lang="ts">
	import { setContext } from 'svelte';
	import {
		collections,
		predicates,
		assignees,
		type Collection,
		type Predicate,
		type Todo,
		type Assignee,
		todos,
	} from '../stores/fluree.store';

	const headers = {
		'Content-Type': 'application/json',
	};

	let API_KEY: string; //set if using with Fluree Nexus

	function SetFlureeAPI(action: 'query' | 'transact' | 'multi-query') {
		const BASE_URL = 'http://localhost:8090';
		const ACCOUNT = 'dev';
		const DBNAME = 'alpha-ledger';
		return `${BASE_URL}/fdb/${ACCOUNT}/${DBNAME}/${action}`;
	}

	setContext(ContextName.FLUREE, {
		fetchSchema: async function () {
			let query = {
				collections: {
					select: ['*', { '_collection/spec': ['*'] }],
					from: '_collection',
				},
				predicates: {
					select: ['*', { '_predicate/spec': ['*'] }],
					from: '_predicate',
				},
				assignees: {
					select: ['*'],
					from: 'assignee',
				},
				todos: {
					select: ['*', { 'todo/tasks': ['*', { 'task/assignee': ['*'] }] }],
					from: 'todo',
				},
			};

			const result: {
				collections: Collection[];
				predicates: Predicate[];
				assignees: Assignee[];
				todos: Todo[];
			} = await MultiQuery(query as any);

			collections.set(result.collections);
			predicates.set(result.predicates);
			assignees.set(result.assignees);
			todos.set(result.todos);
		},
		formatQuery: function (arg: any) {
			return formatFlureeDataStructure(arg);
		},
		formatUpdate: function ({ data }) {},
		formatDelete: function ({ data, deleteAll = false }) {
			if (deleteAll) {
				return { _id: data._id, _action: 'delete' };
			}

			let { _id, collection, ...rest } = data;
			let keys = Object.keys(rest);

			let transformed = keys.reduce((acc, key) => {
				acc[`${collection}/${key}`] = data[key];
				return acc;
			}, {});

			return { _id, _action: 'delete', ...transformed };
		},

		transact: async function (flureeQuery: any) {
			return await Transact(flureeQuery);
		},
		query: async function (flureeQuery: any) {
			return await Query(flureeQuery);
		},
		multiQuery: async function (flureeQuery: any) {
			return await MultiQuery(flureeQuery);
		},
	});

	function isArray(value: any) {
		return typeof value === 'object' && Array.isArray(value);
	}

	function isObject(value: any) {
		return typeof value === 'object' && !Array.isArray(value);
	}

	function formatFlureeDataStructure(arg: any) {
		const isArgTypeArray = isArray(arg);
		const isArgTypeObject = isObject(arg);

		// console.log(arg);
		let temp = {};

		if (isArgTypeArray) {
			return arg.map((el) => {
				return formatFlureeDataStructure(el);
			});
		}

		if (isArgTypeObject) {
			let keys = Object.keys(arg);

			keys.forEach((key) => {
				let [collection, field] = key?.split('/');
				if (!field) field = key;
				temp['collection'] = collection;

				if (isArray(arg[key])) {
					let formatted = formatFlureeDataStructure(arg[key]);
					temp[field] = formatted;
				} else if (isObject(arg[key])) {
					let formatted = formatFlureeDataStructure(arg[key]);
					temp[field] = formatted;
				} else {
					temp[field] = arg[key];
				}
			});
			return temp;
		}
	}

	async function Transact(body) {
		const headers = {
			'Content-Type': 'application/json',
		};

		if (typeof API_KEY != 'undefined')
			headers['Authorization'] = `Bearer ${API_KEY}`;

		let data = await fetch(SetFlureeAPI('transact'), {
			method: 'POST',
			headers,
			body: JSON.stringify(body),
		});

		return await data.json();
	}

	async function Query(body: FlureeQuery) {
		if (typeof API_KEY != 'undefined') {
			headers['Authorization'] = `Bearer ${API_KEY}`;
		}

		let data = await fetch(SetFlureeAPI('query'), {
			method: 'POST',
			headers,
			body: JSON.stringify(body),
		});
		return await data.json();
	}

	async function MultiQuery(body: FlureeQuery) {
		if (typeof API_KEY != 'undefined') {
			headers['Authorization'] = `Bearer ${API_KEY}`;
		}

		let data = await fetch(SetFlureeAPI('multi-query'), {
			method: 'POST',
			headers,
			body: JSON.stringify(body),
		});

		return await data.json();
	}
</script>

<div>
	<slot />
</div>
