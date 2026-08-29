# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: user-journey.spec.ts >> MindSense End-to-End User Journey >> Complete navigation, text analysis, and data rights workflow
- Location: e2e\user-journey.spec.ts:4:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/Analysis Output & Classification/i)
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 15000ms
  - waiting for getByText(/Analysis Output & Classification/i)

```

```yaml
- banner:
  - button "MindSense Home":
    - img "MindSense Research Logo"
    - text: MindSense Research
    - paragraph: Multimodal Affective Computing AI
  - navigation "Main Navigation":
    - button "Analyze"
    - button "Insights"
    - button "Research"
    - button "Resources"
  - button "Global search": Search ⌘K
  - button "System status": Service Offline
  - button "Start Analysis"
  - button "Sign In or Register": Account
  - button "Help & User Guide"
  - button "Toggle theme"
  - button "Settings"
- main:
  - button "Back to Home"
  - navigation "Breadcrumb":
    - button "Home"
    - button "Analyze"
    - text: Live Studio
  - heading "Affective Analysis Laboratory" [level=1]
  - paragraph: Synchronize text, vocal acoustics, and facial micro-expressions into real-time cross-attention classification.
  - button "Live Analysis Studio"
  - button "Signal & Media Processing"
  - text: Affective Laboratory
  - heading "Start Analysis" [level=1]
  - paragraph: Select your input modality method, provide input data, and execute the Intermediate Cross-Attention Transformer.
  - text: "Step 1: Choose Your Input Method"
  - button "Text"
  - button "Audio"
  - button "Image"
  - button "Multimodal"
  - text: "Step 2: Provide Input Data Qualitative Text Statement 84 characters"
  - textbox "Type or paste a text statement to evaluate lexical emotion signals...": I am feeling calm, focused, and accomplished after completing our research protocol.
  - button "Clear Text"
  - button "Advanced Configuration"
  - checkbox "Rule-Based Simulation Mode Run heuristic classification without active PyTorch model weights." [checked]
  - text: Rule-Based Simulation Mode Run heuristic classification without active PyTorch model weights. Failed to fetch
  - button "Start Analysis"
- button "Open MindSense Assistant": assistant
- contentinfo:
  - text: MindSense Public Research Platform
  - paragraph: Multimodal Affective Computing & Wellness Self-Reflection. Fusing natural language text, speech prosody, and facial micro-expressions.
  - link "How to Use":
    - /url: "#/how-to-use"
  - text: •
  - link "Rules & Regulations":
    - /url: "#/rules"
  - text: •
  - link "Developer Portal":
    - /url: "#/developer"
  - heading "Public Navigation" [level=4]
  - list:
    - listitem:
      - button "Home"
    - listitem:
      - button "Analyze Studio"
    - listitem:
      - button "Insights & History"
    - listitem:
      - button "Research Methodology"
    - listitem:
      - button "Academic Resources"
  - heading "Support & Legal" [level=4]
  - list:
    - listitem:
      - link "User Guide Walkthrough":
        - /url: "#/how-to-use"
    - listitem:
      - link "Rules & Regulations":
        - /url: "#/rules"
    - listitem:
      - link "Download PDF Guide":
        - /url: /MindSense_How_to_Use_Rules_and_Regulations.pdf
    - listitem:
      - link "Privacy Architecture":
        - /url: "#/settings"
  - heading "Developer Portal" [level=4]
  - list:
    - listitem:
      - link "Developer Login":
        - /url: "#/developer"
    - listitem:
      - link "System Health Metrics":
        - /url: "#/developer"
    - listitem:
      - link "Feedback Management":
        - /url: "#/developer"
    - listitem:
      - link "Administrative Audit Logs":
        - /url: "#/developer"
  - paragraph: © 2026 MindSense Affective Computing Platform. Built for empirical research and educational study.
  - paragraph: v1.3 Fused Cross-Attention Architecture
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('MindSense End-to-End User Journey', () => {
  4  |   test('Complete navigation, text analysis, and data rights workflow', async ({ page }) => {
  5  |     // 1. Visit Home Page
  6  |     await page.goto('/');
  7  |     await expect(page).toHaveTitle(/MindSense/i);
  8  |     await expect(page.getByRole('heading', { name: 'MindSense', exact: true })).toBeVisible();
  9  |     await expect(page.getByText(/Understanding emotional expression through multimodal signals/i)).toBeVisible();
  10 | 
  11 |     // 2. Click "Start an Analysis" CTA
  12 |     const startCta = page.getByRole('button', { name: /start an analysis/i }).first();
  13 |     await startCta.click();
  14 | 
  15 |     // 3. Verify Live Analysis Studio Loaded
  16 |     await expect(page.getByText(/Affective Analysis Laboratory/i)).toBeVisible();
  17 | 
  18 |     // 4. Enable Advanced Configuration -> Rule-Based Simulation & Execute Analysis
  19 |     const advConfig = page.getByRole('button', { name: /Advanced Configuration/i });
  20 |     await advConfig.click();
  21 |     
  22 |     const demoCheck = page.getByRole('checkbox', { name: /Rule-Based Simulation Mode/i });
  23 |     await demoCheck.check();
  24 | 
  25 |     const textArea = page.getByPlaceholder(/Type or paste a text statement/i);
  26 |     await textArea.fill('I am feeling calm, focused, and accomplished after completing our research protocol.');
  27 |     
  28 |     const analyzeBtn = page.getByRole('main').getByRole('button', { name: 'Start Analysis' });
  29 |     await analyzeBtn.click();
  30 | 
  31 |     // 5. Verify Results Displayed
> 32 |     await expect(page.getByText(/Analysis Output & Classification/i)).toBeVisible({ timeout: 15000 });
     |                                                                       ^ Error: expect(locator).toBeVisible() failed
  33 |     await expect(page.getByText(/Detected Dominant Emotion/i)).toBeVisible();
  34 | 
  35 |     // 6. Navigate to Settings & Data Rights
  36 |     await page.goto('/#/settings');
  37 |     await expect(page.getByText(/System Settings & Data Subject Rights/i)).toBeVisible();
  38 |     await expect(page.getByRole('button', { name: /download my data/i })).toBeVisible();
  39 | 
  40 |     // 7. Verify Developer Portal Isolation (Unauthenticated Direct Link Attempt)
  41 |     await page.goto('/#/developer/dashboard');
  42 |     // Developer portal login screen or access denial must render
  43 |     await expect(page.getByText(/Developer Authentication/i).or(page.getByText(/Sign In/i))).toBeVisible();
  44 |   });
  45 | });
  46 | 
```