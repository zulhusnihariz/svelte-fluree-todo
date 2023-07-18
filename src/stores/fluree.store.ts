import { writable } from 'svelte/store';

export type Collection = {
	_id: number;
	'_collection/name': string;
	'_collection/doc': string;
};

// Taken from: https://developers.flur.ee/docs/overview/schema/predicates/
enum PredicateType {
	STRING = 'string',
	REF = 'ref',
	INT = 'int',
	LONG = 'long',
	BIG_INT = 'bigint',
	FLOAT = 'float',
	DOUBLE = 'double',
	BIG_DEC = '',
	INSTANT = 'instant',
	BOOLEAN = 'boolean',
	URI = 'uri',
	UUID = 'uuid',
	BYTES = 'bytes',
	JSON = 'json',
}

export type Predicate = {
	_id: number;
	'_predicate/name': string;
	'_predicate/doc': string;
	'_predicate/index'?: boolean;
	'_predicate/fullText'?: boolean;
	'_predicate/unique'?: boolean;
	'_predicatec/multi'?: boolean;
	'_predicate/type'?: PredicateType;
	'_predicate/restrictCollection'?: boolean;
	'_predicate/upsert'?: boolean;
	'_predicate/noHistory'?: boolean;
	'_predicate/component'?: boolean;
	'_predicate/deprecated'?: boolean;
	'_predicate/restrictTag'?: boolean;
	'_predicate/encrypted'?: boolean;
	'_predicate/retractDuplicates'?: boolean;
};

export type Assignee = {
	_id: string;
	name: string;
	email: string;
	todos?: any[];
};

export interface FormattedFluree {
	collection?: string;
}

export type TodoTask = {
	_id?: string;
	collection?: string;
	name: string;
	isCompleted: boolean;
	assignee: {
		_id: string;
		email: string;
		todos: string[];
		collection?: string;
	};
};

export type FlureeTodoTask = {
	_id?: string;
	collection?: string;
	name: string;
	isCompleted: boolean;
	assignee: string | number; // _id
};

export type FlureeTodo = {
	_id?: string;
	collection?: string;
	name: string;
	description: string;
	tasks: string | number[];
};

export type Todo = {
	_id?: string;
	collection?: string;
	name: string;
	description: string;
	tasks?: TodoTask[];
};

export enum Tab {
	COLLECTION_PREDICATE = 'tab_collection_predicate',
	ASSIGNEE = 'tab_assignee',
	TODO = 'tab_todo',
}

export const collections = writable<Collection[]>([]);
export const predicates = writable<Predicate[]>([]);
export const assignees = writable<Assignee[]>([]);
export const todos = writable<Todo[]>([]);
export const currentTab = writable<Tab>(Tab.COLLECTION_PREDICATE);
