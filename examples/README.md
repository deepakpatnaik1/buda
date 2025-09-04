# BUDA Examples

This directory contains reference implementations showing how to use BUDA for different types of applications.

## Available Examples

### `todo-app/` - Task Management
- **Features**: Create, edit, delete, filter tasks
- **Demonstrates**: Full CRUD operations with persistence  
- **LEGO Components**: TaskModel, TaskService, TaskList.svelte, TaskWire
- **Bus Usage**: State persistence, event coordination, error handling

### `chat-app/` - Real-time Communication  
- **Features**: Send/receive messages, user presence, rooms
- **Demonstrates**: Real-time updates, WebSocket integration
- **LEGO Components**: MessageModel, ChatService, ChatRoom.svelte, ChatWire  
- **Bus Usage**: Event streaming, state synchronization

### `dashboard/` - Data Visualization
- **Features**: Charts, metrics, real-time updates
- **Demonstrates**: Data fetching, visualization, updates
- **LEGO Components**: MetricModel, DataService, Chart.svelte, DashboardWire
- **Bus Usage**: Config-driven charts, error boundaries

## Running Examples

```bash
# Copy any example as a starting point
cp -r examples/todo-app my-todo-project
cd my-todo-project

# Install and run  
npm run boss:init
npm run dev
```

## Study Guide

1. **Start with `todo-app`** - Shows basic CRUD patterns
2. **Examine Bus Contracts** - See how events flow between layers
3. **Check Tests** - Understand architectural testing patterns  
4. **Review Wire Logic** - Learn coordination patterns
5. **Analyze Delete Plans** - See how features can be removed

Each example includes:
- Complete LEGO architecture implementation
- Comprehensive test suites
- Design documentation  
- Deletion simulation compatibility
- Boss Rules compliance

---

*These examples show BUDA patterns in action, not just theory.*