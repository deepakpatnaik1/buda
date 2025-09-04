/**
 * Bus Contract Testing Suite
 * Step 6: Advanced Validation - Test architectural assumptions continuously
 */

import { describe, test, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { glob } from 'glob';
import { allEventContracts } from '../src/buses/schemas/index.js';

describe('Bus Contract Testing 🔗', () => {
  
  describe('Schema Loading and Validation', () => {
    test('should load all bus schemas successfully', () => {
      expect(allEventContracts).toBeDefined();
      expect(typeof allEventContracts).toBe('object');
    });

    test('should have valid event contracts structure', () => {
      for (const [eventName, contract] of Object.entries(allEventContracts)) {
        expect(contract).toHaveProperty('publishers');
        expect(contract).toHaveProperty('subscribers');
        expect(Array.isArray(contract.publishers)).toBe(true);
        expect(Array.isArray(contract.subscribers)).toBe(true);
      }
    });
  });

  describe('Publisher/Subscriber Contract Validation', () => {
    test('should verify all event publishers exist in codebase', async () => {
      const sourceFiles = await glob('src/**/*.{ts,js,svelte}');
      const existingFiles = sourceFiles.map(file => file.split('/').pop() || '');
      
      for (const [eventName, contract] of Object.entries(allEventContracts)) {
        for (const publisher of contract.publishers) {
          const publisherExists = existingFiles.includes(publisher);
          expect(publisherExists, `Publisher ${publisher} for event ${eventName} does not exist in codebase`).toBe(true);
        }
      }
    });

    test('should verify core theme events are properly contracted', () => {
      // Verify key theme events exist
      expect(allEventContracts['theme:switch-requested']).toBeDefined();
      expect(allEventContracts['theme:current-theme-updated']).toBeDefined();
      expect(allEventContracts['theme:request-available-themes']).toBeDefined();
      
      // Verify they have publishers and subscribers
      expect(allEventContracts['theme:switch-requested'].publishers.length).toBeGreaterThan(0);
      expect(allEventContracts['theme:switch-requested'].subscribers.length).toBeGreaterThan(0);
    });
  });

  describe('Architectural Compliance (Rule 4: LEGO Bricks)', () => {
    test('should verify Wire components exist for orchestration', async () => {
      const wireFiles = await glob('src/wire/*.ts');
      expect(wireFiles.length).toBeGreaterThan(0);
      
      // Verify ThemeWire exists as mentioned in contracts
      const themeWireExists = wireFiles.some(file => file.includes('ThemeWire'));
      expect(themeWireExists).toBe(true);
    });

    test('should verify bus files exist', async () => {
      const busFiles = await glob('src/buses/*.ts');
      expect(busFiles.length).toBeGreaterThan(0);
      
      // Verify core buses exist
      const busNames = ['EventBus', 'StateBus', 'ErrorBus', 'ConfigBus'];
      for (const busName of busNames) {
        const busExists = busFiles.some(file => file.includes(busName));
        expect(busExists, `${busName} should exist`).toBe(true);
      }
    });
  });

  describe('Bus Health Monitoring', () => {
    test('should identify orphaned events (publishers without subscribers)', () => {
      const orphanedEvents: string[] = [];
      
      for (const [eventName, contract] of Object.entries(allEventContracts)) {
        if (contract.publishers.length > 0 && contract.subscribers.length === 0) {
          // Some events like 'error' are intentionally broadcast-only
          if (!['error'].includes(eventName)) {
            orphanedEvents.push(eventName);
          }
        }
      }
      
      // This is a warning, not a failure - some events may be legitimately orphaned
      if (orphanedEvents.length > 0) {
        console.warn(`Orphaned events (publishers without subscribers): ${orphanedEvents.join(', ')}`);
      }
      
      expect(orphanedEvents.length).toBeLessThan(10); // Reasonable threshold
    });

    test('should identify dead events (subscribers without publishers)', () => {
      const deadEvents: string[] = [];
      
      for (const [eventName, contract] of Object.entries(allEventContracts)) {
        if (contract.subscribers.length > 0 && contract.publishers.length === 0) {
          deadEvents.push(eventName);
        }
      }
      
      expect(deadEvents).toHaveLength(0);
    });

    test('should verify schema files exist', () => {
      const schemaFiles = ['theme.ts', 'state.ts', 'error.ts', 'index.ts'];
      
      for (const file of schemaFiles) {
        const path = `src/buses/schemas/${file}`;
        expect(existsSync(path), `Schema file ${file} should exist`).toBe(true);
      }
    });
  });
});
