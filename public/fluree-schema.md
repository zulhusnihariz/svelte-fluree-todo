Create Todo

1. Create Todo (collection = table, predicate = column)

```
 [
    {
        "_id": "_collection$todoCollection",
        "name": "todo",
        "doc": "Collection for storing todo",
    },
    {
        "_id":"_predicate",
        "name": "todo/name",
        "type": "string",
        "index": true,
        "doc": "The name of the list. This is indexed for easier querying, but is not a unique value from one list to another"
    },
    {
        "_id":"_predicate",
        "name": "todo/description",
        "type": "string",
        "doc": "A string describing the list"
    },
    {
        "_id":"_predicate",
        "name": "todo/tasks",
        "type"; "ref",
        "multi": "true",
        "restrictCollection":"task",
        "doc": "Because one list can include multiple tasks, this allows a single list subject to make graph references to multiple task subjects"
    }

 ]
```

2. Create TodoTask

```
 [

    {
        "_id": "_collection$taskCollection",
        "name": "task",
        "doc": "Collection for storing task",
    },
    {
        "_id":"_predicate",
        "name":"task/name",
        "type": "string",
        "index": true,
        "doc": "The name of the task"
    },
    {
        "_id:"_predicate",
        "name": "task/isCompleted",
        "type": "boolean",
        "doc": "The completion status of the task"
    },
    {
        "_id:"_predicate",
        "name": "task/assignee",
        "type": "ref",
        "restrictCollection":"assignee",
        "doc": "A ref between a task and an assignee, modeling the individual to whom the task is assigned"
    }
 ]
```

3. Create Task Assignee

```
 [
    {
        "_id": "_collection$assigneeCollection",
        "name": "assignee",
        "doc": "Collection for storing assignee",
    },
    {
        "_id":"_predicate",
        "name":"assignee/name",
        "type": "string",
        "index": true,
        "doc": "The name of person being assigned for the task"
    },
    {
        "_id":"_predicate",
        "name":"assignee/email",
        "type": "string",
        "unique": "true",
        "doc": "Assignee's email"
    },
    {
        "_id": "_predicate",
        "name": "assignee/todos",
        "type": "ref",
        "multi": true,
        "restrictCollection": "todo",
        "doc": "The lists owned by an individual -- this is potentially different from the tasks that are assigned to a specific individual"
    }
 ]
```
