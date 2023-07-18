<script context="module" lang="ts">
	export enum ContextName {
		FLUREE = 'context_fluree',
	}

	export type TransactResolve = {
		tempids: { [key: string]: number };
		block: number;
		hash: string;
		instant: number;
		type: string;
		duration: string;
		fuel: number;
		auth: string;
		status: number;
		id: string;
		bytes: string;
		flakes: any;
	};

	export type TransactReject = {
		status: number;
		error: string;
		message: string;
	};

	type FormatQuery = <A, R>(args: A) => R;
	type TransactType = (args: any) => Promise<TransactResolve>;

	export type FlureeContext = {
		fetchSchema: () => void;
		formatQuery: FormatQuery;
		formatDelete: <R>(args: {
			data: any;
			deleteAll?: boolean;
		}) => { _id: number; action: 'delete' } & R;
		formatUpdate: <R>(args: {
			data: any;
		}) => { _id: number; action: 'update' } & R;
		transact: TransactType;
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
		type TodoTask,
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

	interface FlureeQuery {
		select: ({ [key: string]: any } | string)[];
		from: string;
	}

	setContext(ContextName.FLUREE, {
		fetchSchema: async function () {
			let query: { [key: string]: FlureeQuery } = {
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

			const result = await MultiQuery<{
				collections: Collection[];
				predicates: Predicate[];
				assignees: Assignee[];
				todos: Todo<TodoTask>[];
			}>(query);

			collections.set(result.collections);
			predicates.set(result.predicates);
			assignees.set(result.assignees);
			todos.set(result.todos);
		},
		formatQuery: function <A, R>(arg: A) {
			return formatFlureeDataStructure(arg) as R;
		},
		formatUpdate: function ({ data }) {
			let { _id, collection, ...rest } = data;

			let keys = Object.keys(rest);
			let transformed = keys.reduce((acc, key) => {
				acc[`${collection}/${key}`] = data[key];
				return acc;
			}, {});

			return { _id, _action: 'update', ...transformed };
		},
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

		transact: async function <R>(flureeQuery: any) {
			return (await Transact(flureeQuery)) as R;
		},
	});

	function isArray(value: any) {
		return typeof value === 'object' && Array.isArray(value);
	}

	function isObject(value: any) {
		return typeof value === 'object' && !Array.isArray(value);
	}

	function formatFlureeDataStructure(arg: any[] | { [key: string]: any }) {
		const isArgTypeArray = isArray(arg);
		const isArgTypeObject = isObject(arg);

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
		let response = await data.json();

		if (response.status === 200) return response;

		let e = response as unknown as TransactReject;
		throw new Error(`${e.error}: ${e.message}`);
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

	async function MultiQuery<T>(body: { [key: string]: FlureeQuery }) {
		if (typeof API_KEY != 'undefined') {
			headers['Authorization'] = `Bearer ${API_KEY}`;
		}

		let data = await fetch(SetFlureeAPI('multi-query'), {
			method: 'POST',
			headers,
			body: JSON.stringify(body),
		});

		return (await data.json()) as T;
	}
</script>

<div>
	<slot />
</div>
