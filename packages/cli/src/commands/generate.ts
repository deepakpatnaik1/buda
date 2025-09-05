/**
 * BUDA Generate Command
 * 
 * Generates LEGO components following Boss Rule #3
 */

import { promises as fs } from 'fs';
import { join, resolve } from 'path';
import chalk from 'chalk';

interface GenerateOptions {
  tests?: boolean;
  stories?: boolean;
}

const COMPONENT_TEMPLATES = {
  model: (name: string) => `/**
 * ${name} Model - LEGO Brick 1/4
 * Rule #3: LEGO Features - Data model
 */

export interface ${name} {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export const default${name}: ${name} = {
  id: '',
  createdAt: new Date(),
  updatedAt: new Date()
};

export function validate${name}(data: any): data is ${name} {
  return data && 
    typeof data.id === 'string' &&
    data.createdAt instanceof Date &&
    data.updatedAt instanceof Date;
}`,

  service: (name: string) => `/**
 * ${name} Service - LEGO Brick 2/4  
 * Rule #3: LEGO Features - Business logic service
 * Rule #5: Thin Wrappers - Uses buses for communication
 */

import { eventBus } from '../buses/EventBus.js';
import { errorBus } from '../buses/ErrorBus.js';
import type { ${name} } from '../models/${name}.js';

export class ${name}Service {
  async create(data: Partial<${name}>): Promise<${name}> {
    try {
      // Rule #9: Instrument everything - log operations
      console.log(\`[\${${name}Service.name}] Creating ${name.toLowerCase()}\`, data);
      
      const item: ${name} = {
        id: crypto.randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date(),
        ...data
      };

      // Rule #4: Decouple with buses - publish events
      eventBus.publish('${name.toLowerCase()}.created', item);
      
      return item;
    } catch (error) {
      // Rule #9: No silent failures - always report errors
      errorBus.reportError(error as Error, '${name}Service.create');
      throw error;
    }
  }

  async update(id: string, data: Partial<${name}>): Promise<${name}> {
    try {
      console.log(\`[\${${name}Service.name}] Updating ${name.toLowerCase()}\`, { id, data });
      
      const item: ${name} = {
        ...data,
        id,
        updatedAt: new Date()
      } as ${name};

      eventBus.publish('${name.toLowerCase()}.updated', item);
      
      return item;
    } catch (error) {
      errorBus.reportError(error as Error, '${name}Service.update');
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      console.log(\`[\${${name}Service.name}] Deleting ${name.toLowerCase()}\`, { id });
      
      // Rule #8: Design for deletion - clean removal
      eventBus.publish('${name.toLowerCase()}.deleted', { id });
      
    } catch (error) {
      errorBus.reportError(error as Error, '${name}Service.delete');
      throw error;
    }
  }
}`,

  ui: (name: string) => `<!--
${name} UI Component - LEGO Brick 3/4
Rule #3: LEGO Features - User interface component
Rule #6: Be Svelte-y - Idiomatic Svelte patterns
-->
<script lang="ts">
  import { onMount } from 'svelte';
  import { eventBus } from '../buses/EventBus.js';
  import type { ${name} } from '../models/${name}.js';

  export let data: ${name} | null = null;
  
  let loading = false;
  let error: string | null = null;

  onMount(() => {
    // Rule #4: Decouple with buses - listen for updates
    const unsubscribe = eventBus.subscribe('${name.toLowerCase()}.updated', (updated: ${name}) => {
      if (data && data.id === updated.id) {
        data = updated;
      }
    });

    return unsubscribe;
  });

  function handleAction() {
    // Rule #9: Instrument everything - log user actions
    console.log('[${name}Component] User action triggered', { data });
    
    // Rule #4: Publish events instead of direct calls
    eventBus.publish('${name.toLowerCase()}.action', { id: data?.id });
  }
</script>

<div class="${name.toLowerCase()}-component">
  {#if loading}
    <div class="loading">Loading...</div>
  {:else if error}
    <div class="error">{error}</div>
  {:else if data}
    <div class="content">
      <h3>{data.id}</h3>
      <p>Created: {data.createdAt.toLocaleDateString()}</p>
      <p>Updated: {data.updatedAt.toLocaleDateString()}</p>
      
      <button on:click={handleAction}>
        Action
      </button>
    </div>
  {:else}
    <div class="empty">No data</div>
  {/if}
</div>

<style>
  .${name.toLowerCase()}-component {
    padding: 1rem;
    border: 1px solid #ddd;
    border-radius: 4px;
  }
  
  .loading, .error, .empty {
    text-align: center;
    padding: 2rem;
    color: #666;
  }
  
  .error {
    color: #d32f2f;
  }
  
  button {
    background: #1976d2;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
  }
  
  button:hover {
    background: #1565c0;
  }
</style>`,

  wire: (name: string) => `/**
 * ${name} Wire - LEGO Brick 4/4
 * Rule #3: LEGO Features - Coordination layer 
 * Rule #4: Decouple with buses - Orchestrates via events
 */

import { eventBus } from '../buses/EventBus.js';
import { ${name}Service } from '../services/${name}Service.js';
import type { ${name} } from '../models/${name}.js';

export class ${name}Wire {
  private service = new ${name}Service();

  constructor() {
    this.initializeEventHandlers();
  }

  private initializeEventHandlers(): void {
    // Rule #4: Wire components communicate only through buses
    
    eventBus.subscribe('${name.toLowerCase()}.create-requested', async (data: Partial<${name}>) => {
      try {
        const item = await this.service.create(data);
        eventBus.publish('${name.toLowerCase()}.create-succeeded', item);
      } catch (error) {
        eventBus.publish('${name.toLowerCase()}.create-failed', { error, data });
      }
    });

    eventBus.subscribe('${name.toLowerCase()}.update-requested', async ({ id, data }: { id: string, data: Partial<${name}> }) => {
      try {
        const item = await this.service.update(id, data);
        eventBus.publish('${name.toLowerCase()}.update-succeeded', item);
      } catch (error) {
        eventBus.publish('${name.toLowerCase()}.update-failed', { error, id, data });
      }
    });

    eventBus.subscribe('${name.toLowerCase()}.delete-requested', async (id: string) => {
      try {
        await this.service.delete(id);
        eventBus.publish('${name.toLowerCase()}.delete-succeeded', { id });
      } catch (error) {
        eventBus.publish('${name.toLowerCase()}.delete-failed', { error, id });
      }
    });

    // Rule #9: Instrument everything - log wire initialization
    console.log(\`[\${${name}Wire.name}] Event handlers initialized\`);
  }

  // Rule #8: Design for deletion - cleanup method
  dispose(): void {
    // In a real implementation, you'd unsubscribe from events
    console.log(\`[\${${name}Wire.name}] Wire disposed\`);
  }
}`
};

const TEST_TEMPLATES = {
  model: (name: string) => `/**
 * ${name} Model Tests - Rule #2: TDD
 */

import { describe, test, expect } from 'vitest';
import { validate${name}, default${name} } from '../src/models/${name}.js';

describe('${name} Model', () => {
  test('should validate correct ${name} object', () => {
    const valid${name} = {
      id: '123',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    expect(validate${name}(valid${name})).toBe(true);
  });

  test('should reject invalid ${name} object', () => {
    const invalid${name} = {
      id: 123, // should be string
      createdAt: new Date(),
      updatedAt: new Date()
    };

    expect(validate${name}(invalid${name})).toBe(false);
  });

  test('should have default ${name}', () => {
    expect(default${name}).toBeDefined();
    expect(validate${name}(default${name})).toBe(true);
  });
});`,

  service: (name: string) => `/**
 * ${name} Service Tests - Rule #2: TDD
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { ${name}Service } from '../src/services/${name}Service.js';
import { eventBus } from '../src/buses/EventBus.js';

// Mock buses
vi.mock('../src/buses/EventBus.js', () => ({
  eventBus: {
    publish: vi.fn()
  }
}));

vi.mock('../src/buses/ErrorBus.js', () => ({
  errorBus: {
    reportError: vi.fn()
  }
}));

describe('${name}Service', () => {
  let service: ${name}Service;

  beforeEach(() => {
    service = new ${name}Service();
    vi.clearAllMocks();
  });

  test('should create ${name.toLowerCase()}', async () => {
    const data = {};
    const result = await service.create(data);

    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result.updatedAt).toBeInstanceOf(Date);
    expect(eventBus.publish).toHaveBeenCalledWith('${name.toLowerCase()}.created', result);
  });

  test('should update ${name.toLowerCase()}', async () => {
    const id = '123';
    const data = {};
    const result = await service.update(id, data);

    expect(result.id).toBe(id);
    expect(result.updatedAt).toBeInstanceOf(Date);
    expect(eventBus.publish).toHaveBeenCalledWith('${name.toLowerCase()}.updated', result);
  });

  test('should delete ${name.toLowerCase()}', async () => {
    const id = '123';
    await service.delete(id);

    expect(eventBus.publish).toHaveBeenCalledWith('${name.toLowerCase()}.deleted', { id });
  });
});`
};

export async function generateComponent(type: string, name: string, options: GenerateOptions = {}) {
  console.log(chalk.cyan(`🔧 Generating ${type}: ${name}`));

  // Validate type
  if (!COMPONENT_TEMPLATES[type as keyof typeof COMPONENT_TEMPLATES]) {
    console.error(chalk.red(`❌ Invalid component type: ${type}`));
    console.error(chalk.yellow(`Available types: ${Object.keys(COMPONENT_TEMPLATES).join(', ')}`));
    process.exit(1);
  }

  // Validate we're in a BUDA project
  try {
    await fs.access('buda.config.js');
  } catch {
    console.error(chalk.red('❌ Not in a BUDA project directory'));
    console.error(chalk.yellow('Run this command from a BUDA project root'));
    process.exit(1);
  }

  try {
    // Create component directory if it doesn't exist
    const componentDir = `src/${type}s`;
    await fs.mkdir(componentDir, { recursive: true });

    // Generate component file
    const extension = type === 'ui' ? 'svelte' : 'ts';
    const componentPath = join(componentDir, `${name}.${extension}`);
    const template = COMPONENT_TEMPLATES[type as keyof typeof COMPONENT_TEMPLATES];
    
    await fs.writeFile(componentPath, template(name));
    console.log(chalk.green(`✅ Created ${componentPath}`));

    // Generate test file if requested
    if (options.tests && TEST_TEMPLATES[type as keyof typeof TEST_TEMPLATES]) {
      await fs.mkdir('tests', { recursive: true });
      const testPath = join('tests', `${name}.test.ts`);
      const testTemplate = TEST_TEMPLATES[type as keyof typeof TEST_TEMPLATES];
      
      await fs.writeFile(testPath, testTemplate(name));
      console.log(chalk.green(`✅ Created ${testPath}`));
    }

    console.log(chalk.cyan(`
🎯 ${name} ${type} generated successfully!

${chalk.bold('Next steps:')}
  ${chalk.gray('•')} Import and use the ${type} in your application
  ${chalk.gray('•')} Run tests: ${chalk.cyan('npm test')}
  ${chalk.gray('•')} Check Boss Rules: ${chalk.cyan('buda audit')}
`));

  } catch (error) {
    console.error(chalk.red('❌ Failed to generate component'));
    console.error(error);
    process.exit(1);
  }
}