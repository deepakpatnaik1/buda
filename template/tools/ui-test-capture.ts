#!/usr/bin/env tsx

/**
 * UI Test Capture Tool - Visual testing with Puppeteer
 * Part of BUDA framework tooling - Boss Rules compliant
 * 
 * Features:
 * - Screenshots of UI components and full pages
 * - Console log capture for debugging  
 * - Saves to ../PROJECT-docs/puppeteer/ for documentation
 * - Timestamp-based file naming for history tracking
 * - Configurable via environment variables
 * - NPX-compatible with local Puppeteer installation
 */

import puppeteer, { Browser, Page } from 'puppeteer';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, join, dirname } from 'path';
import { fileURLToPath } from 'url';

// ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Boss Rule #7: No hardcoding - all config externalized
const CONFIG = {
  // Base URL for local development server
  baseUrl: process.env.UI_TEST_BASE_URL || 'http://localhost:5173',
  
  // Output directories - detects project name automatically
  outputDir: (() => {
    const projectRoot = resolve(__dirname, '..');
    const projectName = projectRoot.split('/').pop() || 'project';
    return resolve(__dirname, `../../${projectName}-docs/puppeteer`);
  })(),
  
  // Browser settings - optimized for standard displays
  viewport: {
    width: parseInt(process.env.UI_TEST_WIDTH || '1920'),
    height: parseInt(process.env.UI_TEST_HEIGHT || '1080')
  },
  
  // Test scenarios - customizable per project
  scenarios: [
    {
      name: 'full-page',
      path: '/',
      description: 'Full application page',
      selector: null
    },
    {
      name: 'input-area',
      path: '/',
      description: 'Main input area',
      selector: '.input-bar, .input-area, [data-testid="input"]'
    },
    {
      name: 'content-area',
      path: '/',  
      description: 'Main content area',
      selector: '.content, .main-content, [data-testid="content"]'
    },
    {
      name: 'navigation',
      path: '/',
      description: 'Navigation elements',
      selector: 'nav, .navigation, [data-testid="nav"]'
    }
  ]
};

interface TestScenario {
  name: string;
  path: string;
  description: string;
  selector?: string | null;
  actions?: Array<{ type: string; selector: string }>;
}

class UiTestCapture {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private consoleMessages: string[] = [];
  private timestamp: string;
  private sessionDir: string;

  constructor() {
    // ISO 8601 timestamp with timezone - internationally standard
    this.timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_');
    this.sessionDir = join(CONFIG.outputDir, this.timestamp);
    this.ensureDirectories();
  }

  private ensureDirectories(): void {
    // Create base puppeteer dir and timestamped session dir
    const dirs = [
      CONFIG.outputDir,
      this.sessionDir
    ];

    dirs.forEach(dir => {
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
        console.log(`📂 Created directory: ${dir}`);
      }
    });
  }

  async initialize(): Promise<void> {
    console.log('🚀 Launching browser...');
    
    this.browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--allow-running-insecure-content'
      ]
    });

    this.page = await this.browser.newPage();
    await this.page.setViewport(CONFIG.viewport);

    // Capture console messages
    this.page.on('console', (msg) => {
      const timestamp = new Date().toISOString();
      const logEntry = `[${timestamp}] ${msg.type().toUpperCase()}: ${msg.text()}`;
      this.consoleMessages.push(logEntry);
      console.log(`📝 Console: ${logEntry}`);
    });

    // Capture page errors
    this.page.on('pageerror', (error) => {
      const timestamp = new Date().toISOString();
      const errorEntry = `[${timestamp}] PAGE ERROR: ${error.message}`;
      this.consoleMessages.push(errorEntry);
      console.error(`❌ Page Error: ${error.message}`);
    });

    console.log('✅ Browser initialized');
  }

  async captureScenario(scenario: TestScenario): Promise<void> {
    if (!this.page) {
      throw new Error('Browser not initialized');
    }

    console.log(`📸 Capturing: ${scenario.name} - ${scenario.description}`);

    // Navigate to the page
    const url = `${CONFIG.baseUrl}${scenario.path}`;
    console.log(`🌐 Navigating to: ${url}`);
    
    try {
      await this.page.goto(url, { 
        waitUntil: 'networkidle0',
        timeout: 10000 
      });

      // Perform any actions (like opening dropdowns)
      if (scenario.actions) {
        for (const action of scenario.actions) {
          console.log(`🎯 Performing ${action.type} on ${action.selector}`);
          if (action.type === 'click') {
            await this.page.click(action.selector);
            await this.page.waitForTimeout(500); // Wait for animation
          }
        }
      }

      // Take screenshot
      const screenshotName = `${scenario.name}.png`;
      const screenshotPath = join(this.sessionDir, screenshotName);

      if (scenario.selector) {
        // Try multiple selectors (CSS selector list support)
        const selectors = scenario.selector.split(', ');
        let element = null;
        
        for (const selector of selectors) {
          element = await this.page.$(selector.trim());
          if (element) {
            console.log(`✅ Found element: ${selector.trim()}`);
            break;
          }
        }
        
        if (element) {
          await element.screenshot({ path: screenshotPath });
          console.log(`✅ Element screenshot saved: ${screenshotName}`);
        } else {
          console.warn(`⚠️  No elements found for: ${scenario.selector}`);
          // Fall back to full page
          await this.page.screenshot({ 
            path: screenshotPath,
            fullPage: true 
          });
          console.log(`✅ Full page screenshot saved (fallback): ${screenshotName}`);
        }
      } else {
        // Full page screenshot
        await this.page.screenshot({ 
          path: screenshotPath,
          fullPage: true 
        });
        console.log(`✅ Full page screenshot saved: ${screenshotName}`);
      }

    } catch (error) {
      console.error(`❌ Failed to capture ${scenario.name}:`, error);
      this.consoleMessages.push(`[ERROR] Failed to capture ${scenario.name}: ${error}`);
    }
  }

  async saveConsoleLogs(): Promise<void> {
    if (this.consoleMessages.length === 0) {
      console.log('📝 No console messages to save');
      return;
    }

    const logFileName = `console-logs.txt`;
    const logPath = join(this.sessionDir, logFileName);

    const logContent = [
      `UI Test Capture - Console Logs`,
      `Generated: ${new Date().toISOString()}`,
      `Base URL: ${CONFIG.baseUrl}`,
      `Viewport: ${CONFIG.viewport.width}x${CONFIG.viewport.height}`,
      `Project: ${CONFIG.outputDir.split('/').slice(-2, -1)[0]}`,
      ``,
      `Messages (${this.consoleMessages.length}):`,
      `${'='.repeat(50)}`,
      ...this.consoleMessages,
      ``,
      `End of console logs`
    ].join('\n');

    writeFileSync(logPath, logContent, 'utf-8');
    console.log(`✅ Console logs saved: ${logFileName}`);
  }

  async cleanup(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      console.log('🔚 Browser closed');
    }
  }

  async run(): Promise<void> {
    try {
      await this.initialize();

      console.log(`\n🎯 Running ${CONFIG.scenarios.length} test scenarios...\n`);

      for (const scenario of CONFIG.scenarios) {
        await this.captureScenario(scenario);
      }

      await this.saveConsoleLogs();

      console.log(`\n🎉 UI test capture complete!`);
      console.log(`📂 Session folder: ${this.sessionDir}`);
      console.log(`📝 Contains: screenshots + console logs together`);
      console.log(`\n💡 BUDA Visual Testing:`);
      console.log(`   - Screenshots validate UI behavior`);
      console.log(`   - Console logs provide debugging context`);
      console.log(`   - Timestamped sessions track changes over time`);

    } catch (error) {
      console.error('❌ UI test capture failed:', error);
      process.exit(1);
    } finally {
      await this.cleanup();
    }
  }
}

// Run the tool (ES module direct execution)
if (import.meta.url === `file://${process.argv[1]}`) {
  const capture = new UiTestCapture();
  capture.run().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

export default UiTestCapture;