# BUDA Architecture Guide

BUDA implements the Essential Boss Rules through a **4-Bus LEGO** architecture that enforces modular, deletable, and testable code.

## The 4-Bus System

### EventBus
- **Purpose**: Pub/sub communication between components
- **Usage**: `eventBus.publish('topic', data)` and `eventBus.subscribe('topic', handler)`
- **Rules**: No cross-component direct calls, only events

### StateBus  
- **Purpose**: Persistent state management via localStorage
- **Usage**: `stateBus.setState('key', value)` and `stateBus.getState('key')`
- **Rules**: Reactive state changes trigger EventBus notifications

### ConfigBus
- **Purpose**: External configuration loading
- **Usage**: `configBus.get('config-key')` loads from `/config/config-key.json`
- **Rules**: No hardcoded values, all configuration externalized

### ErrorBus
- **Purpose**: Centralized error reporting and logging
- **Usage**: `errorBus.reportError('message', context)`  
- **Rules**: No silent failures, all errors logged with context

## The LEGO Architecture

### models/ - Data Structures
```typescript
// Pure interfaces and validation
export interface UserModel {
  id: string;
  name: string;
}

export function isValidUser(obj: any): obj is UserModel {
  return obj?.id && obj?.name;
}
```

### services/ - Business Logic  
```typescript
// Stateless business logic using buses
export class UserService {
  async loadUser(id: string): Promise<UserModel | null> {
    const user = await configBus.get<UserModel>(`users/${id}`);
    return user;
  }
}
```

### ui/ - Components
```svelte
<!-- Svelte components using EventBus -->
<script lang="ts">
  import { eventBus } from '../buses/EventBus.js';
  
  onMount(() => {
    eventBus.publish('user:request', userId);
  });
</script>
```

### wire/ - Coordinators
```typescript
// Wires together models, services, and UI
export class UserWire {
  constructor() {
    eventBus.subscribe('user:request', this.handleUserRequest);
  }
  
  private async handleUserRequest(userId: string) {
    const user = await this.userService.loadUser(userId);
    eventBus.publish('user:loaded', user);
  }
}
```

## Key Architectural Principles

### 1. No Direct Dependencies
- Components communicate only via buses
- No direct imports between LEGO layers
- Enables independent testing and deletion

### 2. Deletion by Design
- Every component has a `dispose()` method
- Unsubscribe from all bus events in cleanup
- Remove state and clear references

### 3. Configuration Over Code
- All values come from ConfigBus or environment
- No hardcoded strings, numbers, or booleans
- Schema validation for all configuration

### 4. Instrumentation by Default
- All operations logged with context
- Errors reported through ErrorBus
- Metrics emitted for performance tracking

## Bus Event Schemas

Define event contracts in `src/buses/schemas/`:

```typescript
export const userEventContracts = {
  'user:request': {
    publishers: ['UserComponent.svelte'],
    subscribers: ['UserWire.ts']
  },
  'user:loaded': {
    publishers: ['UserWire.ts'], 
    subscribers: ['UserComponent.svelte']
  }
};
```

## Testing Strategy

### Bus Contract Tests
Validates publisher/subscriber relationships:
```typescript
test('should verify user events have proper contracts', () => {
  expect(userEventContracts['user:request'].publishers.length).toBeGreaterThan(0);
  expect(userEventContracts['user:request'].subscribers.length).toBeGreaterThan(0);
});
```

### Architectural Compliance Tests  
Ensures LEGO separation:
```typescript
test('should verify wire components exist for orchestration', () => {
  const wireFiles = glob.sync('src/wire/*.ts');
  expect(wireFiles.length).toBeGreaterThan(0);
});
```

### Deletion Simulation Tests
Tests system resilience by randomly deleting modules and verifying the build still works.

## Development Workflow

1. **Design First**: Create design doc in `designs/draft/`
2. **Write Tests**: TDD with failing tests first  
3. **Implement LEGO**: Model → Service → UI → Wire
4. **Validate Buses**: Ensure proper pub/sub usage
5. **Check Budget**: Complexity and size limits
6. **Simulate Deletion**: Test module independence
7. **Submit PR**: Follow Boss Rules checklist

---

*This architecture enforces the Essential Boss Rules through structure, not discipline.*