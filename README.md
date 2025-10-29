# Synq-Store

<p align="center">
<img src="https://raw.githubusercontent.com/IsaiahTek/synq-store/main/images/synq_store_cover.svg" />
</p>

**Sync Store** is a lightweight, hook-based state management library for JavaScript/TypeScript, with powerful, built-in features for **server data synchronization** and **optimistic updates**.

It provides two core store types:
1.  **`Store`**: A minimal, fast, global state container.
2.  **`SynqStore`**: An extended store for managing and synchronizing collections of server-side data (e.g., resources, lists) with automatic fetching, optimistic mutations, and background re-fetching.

---

## 🚀 Features

* **Server Synchronization:** The **`SynqStore`** handles data fetching, caching, and server mutations out of the box.
* **Optimistic Updates:** Experience instant UI updates on `add`, `update`, and `remove` operations, with automatic rollback on failure.
* **Interval Re-fetching:** Keep data fresh with automatic background fetching on a defined interval.
* **Microtask Queuing:** Ensures store initialization happens efficiently without blocking the main thread.
* **Framework Agnostic Core:** The core `Store` class can be used outside of any framework.

---

## 📦 Installation

```bash
# Using npm
npm install synq-store
# Using yarn
yarn add synq-store
```

## 📖 Usage

### Basic Store (Local State)

The `Store` is a lightweight global state container for managing local application state.

```typescript
import { Store } from 'synq-store';

// Create a store with initial state
const counterStore = new Store({ count: 0, user: null });

// Subscribe to store changes
const unsubscribe = counterStore.subscribe((state) => {
  console.log('State updated:', state);
});

// Update the state
counterStore.setState({ count: counterStore.getState().count + 1 });

// Get current state
const currentState = counterStore.getState();
console.log(currentState); // { count: 1, user: null }

// Clean up
unsubscribe();
```

### SynqStore (Server State Synchronization)

The `SynqStore` extends `Store` to manage server-side data with automatic fetching, caching, and optimistic updates.

```typescript
import { SynqStore } from 'synq-store';

// Define your data type
interface Todo {
  id: string;
  title: string;
  completed: boolean;
}

// Create a SynqStore with server sync configuration
const todosStore = new SynqStore<Todo>({
  // Initial state
  initialState: [],
  
  // Unique key for each item
  idKey: 'id',
  
  // Fetch function to load data from server
  fetchFn: async () => {
    const response = await fetch('https://api.example.com/todos');
    return response.json();
  },
  
  // Optional: Auto-refetch interval (in milliseconds)
  refetchInterval: 30000, // Refetch every 30 seconds
  
  // Optional: Server mutation functions
  mutations: {
    add: async (item: Omit<Todo, 'id'>) => {
      const response = await fetch('https://api.example.com/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      });
      return response.json();
    },
    
    update: async (id: string, updates: Partial<Todo>) => {
      const response = await fetch(`https://api.example.com/todos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      return response.json();
    },
    
    remove: async (id: string) => {
      await fetch(`https://api.example.com/todos/${id}`, {
        method: 'DELETE'
      });
      return id;
    }
  }
});
```


### Advanced: Combining Local and Server State

```tsx
import { Store, SynqStore, useStore, useSynqStore } from 'synq-store';

// Local UI state
const uiStore = new Store({
  sidebarOpen: false,
  theme: 'light',
  selectedFilter: 'all'
});

// Server-synced data
const postsStore = new SynqStore({
  initialState: [],
  idKey: 'id',
  fetchFn: async () => {
    const response = await fetch('https://api.example.com/posts');
    return response.json();
  },
  refetchInterval: 60000
});

function App() {
  // Use both local and server state
  const ui = useStore(uiStore);
  const { data: posts, loading } = useSynqStore(postsStore);

  // Filter posts based on local UI state
  const filteredPosts = posts.filter(post => {
    if (ui.selectedFilter === 'all') return true;
    return post.category === ui.selectedFilter;
  });

  return (
    <div className={ui.theme}>
      <Sidebar 
        open={ui.sidebarOpen}
        onToggle={() => uiStore.setState({ 
          sidebarOpen: !ui.sidebarOpen 
        })}
      />
      
      <FilterBar
        value={ui.selectedFilter}
        onChange={(filter) => uiStore.setState({ 
          selectedFilter: filter 
        })}
      />
      
      {loading ? (
        <Spinner />
      ) : (
        <PostList posts={filteredPosts} />
      )}
    </div>
  );
}
```

### Error Handling with Optimistic Updates

```tsx
function TodoListWithErrorHandling() {
  const { data: todos, add, update, remove } = useSynqStore(todosStore);

  const handleAddTodo = async (title: string) => {
    try {
      await add({ title, completed: false });
      // Success! Optimistic update was confirmed by server
    } catch (error) {
      // Automatic rollback already happened
      // Show error notification to user
      alert('Failed to add todo. Please try again.');
    }
  };

  const handleUpdateTodo = async (id: string, updates: Partial<Todo>) => {
    try {
      await update(id, updates);
    } catch (error) {
      alert('Failed to update todo. Changes have been reverted.');
    }
  };

  return (
    <div>
      {/* Your component JSX */}
    </div>
  );
}
```

### Manual Refetch and Cache Invalidation

```tsx
function DataManager() {
  const { data, loading, refetch, reset } = useSynqStore(todosStore);

  const handleForceRefresh = async () => {
    // Manually trigger a refetch from server
    await refetch();
  };

  const handleClearCache = () => {
    // Reset to initial state
    reset();
  };

  return (
    <div>
      <button onClick={handleForceRefresh} disabled={loading}>
        {loading ? 'Refreshing...' : 'Refresh Data'}
      </button>
      <button onClick={handleClearCache}>
        Clear Cache
      </button>
      
      <div>Items: {data.length}</div>
    </div>
  );
}
```

### TypeScript Support

Synq-Store is fully typed for an excellent TypeScript experience:

```typescript
interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

// Store is fully typed
const userStore = new Store<User>({
  id: 0,
  name: '',
  email: '',
  role: 'user'
});

// TypeScript knows the shape of state
const user = userStore.getState(); // Type: User

// SynqStore with typed items
const usersStore = new SynqStore<User>({
  initialState: [],
  idKey: 'id',
  fetchFn: async (): Promise<User[]> => {
    const response = await fetch('/api/users');
    return response.json();
  }
});

// Hooks are fully typed
function UserComponent() {
  const { data } = useSynqStore(usersStore); // data is User[]
  
  return <div>{data[0]?.name}</div>;
}
```


### React/NextJs Integration
Use [react-sync-state](https://www.npmjs.com/package/react-sync-state)


## Credit
Created by Engr., [Isaiah Pius](https://github.com/IsaiahTek)
### Follow Me
[Linked](https://linkedin.com/in/isaiah-pius)

[X (Twitter)](https://x.com/IsaiahCodes)

## Sponsorship
Kindly [Donate](https://github.com/sponsors/IsaiahTek) to help me continue authoring and maintaining all my open source projects.