import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

import { registerHealth, startTelemetry } from './health.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '15mb' }));

// Registered before the production catch-all below, which would otherwise
// answer /health with index.html.
registerHealth(app, Boolean(process.env.GEMINI_API_KEY));

// Initialize GoogleGenAI SDK
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

export const OPERATIONAL_DOMAINS = [
  'Personal',
  'Financing/Investment',
  'Smartplanet',
  'Ainie',
  'Adaptive Living',
  'Masonic',
  'AI Code Development',
  'Strategy',
  'Others',
] as const;

export type OperationalDomain = (typeof OPERATIONAL_DOMAINS)[number];

export interface ClassificationResult {
  category: OperationalDomain;
  reason: string;
  confidence: number;
  tags: string[];
  reality_isolation_triggered: boolean;
  engineUsed: 'gemini-3.8-flash' | 'deterministic-rules-engine';
}

// Deterministic Reality Isolation & Pattern Classifier (Rule Audit / Fallback)
function classifyDeterministically(title: string, snippet?: string, fullText?: string): ClassificationResult {
  const combined = `${title || ''} \n ${snippet || ''} \n ${fullText || ''}`.toLowerCase();

  // 1. REALITY ISOLATION (Personal) Priority Check
  const personalSignals = [
    'gpm311',
    'tax return',
    'tax declaration',
    'freelancer filing',
    'vat receipt',
    'vat invoice',
    'vat no',
    'freelance vat',
    'passport',
    'national id',
    'identity document',
    'personal id',
    'medical record',
    'clinical note',
    'clinical summary',
    'blood test',
    'prescription',
    'physician',
    'patient',
    'flight itinerary',
    'flight booking',
    'boarding pass',
    'dhl shipping',
    'package tracking',
    'shipping receipt',
    'courier dispatch',
    'utility bill',
    'home office expense',
    'private correspondence',
    'residential lease',
    'electricity bill',
    'water bill',
    'broadband reimbursement'
  ];

  const matchedPersonal = personalSignals.filter(signal => combined.includes(signal));
  if (matchedPersonal.length > 0) {
    const isTrap = combined.includes('docker') || combined.includes('valuation') || combined.includes('cap table');
    return {
      category: 'Personal',
      reason: isTrap
        ? `Reality Isolation priority rule activated: Personal tax/identity/receipt data overrides accompanying business and technical elements. Identified signals: ${matchedPersonal.slice(0, 2).join(', ')}.`
        : `Classified as Personal due to presence of confidential personal documentation (${matchedPersonal.slice(0, 2).join(', ')}).`,
      confidence: 0.98,
      tags: ['Personal', 'Reality Isolation', matchedPersonal[0] || 'Private Record', 'Restricted'],
      reality_isolation_triggered: true,
      engineUsed: 'deterministic-rules-engine'
    };
  }

  // 2. Financing / Investment
  const financeSignals = [
    'cap table', 'valuation model', 'pre-money valuation', 'post-money valuation',
    'term sheet', 'safe note', 'p&l statement', 'ebitda', 'burn rate', 'revenue share',
    'royalties', 'financial projection', 'funding proposal', 'seed round', 'series a'
  ];
  const matchedFinance = financeSignals.filter(signal => combined.includes(signal));
  if (matchedFinance.length > 0) {
    return {
      category: 'Financing/Investment',
      reason: `Document pertains to corporate financial modeling and equity structuring. Matched signals: ${matchedFinance.slice(0, 2).join(', ')}.`,
      confidence: 0.95,
      tags: ['Finance', 'Capital Structure', matchedFinance[0] || 'Valuation'],
      reality_isolation_triggered: false,
      engineUsed: 'deterministic-rules-engine'
    };
  }

  // 3. Smartplanet
  const smartplanetSignals = [
    'smartplanet', 'wopr', 'norad control', 'defcon status', 'the farm', 'the factory',
    'mqtt spine', 'enforcer mechanics', 'audit engine', 'governance systems'
  ];
  const matchedSmartplanet = smartplanetSignals.filter(signal => combined.includes(signal));
  if (matchedSmartplanet.length > 0) {
    return {
      category: 'Smartplanet',
      reason: `Pertains to SmartPlanet AI infrastructure, server architecture, and MQTT governance spine. Matched signals: ${matchedSmartplanet.slice(0, 2).join(', ')}.`,
      confidence: 0.97,
      tags: ['SmartPlanet', 'MQTT Spine', 'WOPR / NORAD', 'Enforcer'],
      reality_isolation_triggered: false,
      engineUsed: 'deterministic-rules-engine'
    };
  }

  // 4. Ainie
  const ainieSignals = [
    'ainie', 'genesis protocol', 'agentdash', 'agentframe', 'reality isolation layer',
    'multi-space os', 'hud spec', 'faulpelz', 'tinginys', 'flemmard', '.life'
  ];
  const matchedAinie = ainieSignals.filter(signal => combined.includes(signal));
  if (matchedAinie.length > 0) {
    return {
      category: 'Ainie',
      reason: `Specification for the Ainie personal digital twin system and Genesis Protocol environment. Matched signals: ${matchedAinie.slice(0, 2).join(', ')}.`,
      confidence: 0.96,
      tags: ['Ainie', 'Digital Twin', 'Genesis Protocol', 'HUD'],
      reality_isolation_triggered: false,
      engineUsed: 'deterministic-rules-engine'
    };
  }

  // 5. Adaptive Living
  const adaptiveSignals = [
    'assisted living', 'ergonomic housing', 'accessibility system', 'smart home automation',
    'barrier-free', 'wellness infrastructure', 'hydraulic cabinetry', 'circadian lighting',
    'fall detection'
  ];
  const matchedAdaptive = adaptiveSignals.filter(signal => combined.includes(signal));
  if (matchedAdaptive.length > 0) {
    return {
      category: 'Adaptive Living',
      reason: `Focuses on assisted living physical ergonomics and ambient smart home accessibility architecture. Matched signals: ${matchedAdaptive.slice(0, 2).join(', ')}.`,
      confidence: 0.94,
      tags: ['Adaptive Living', 'Accessibility', 'Ergonomics', 'Smart Home'],
      reality_isolation_triggered: false,
      engineUsed: 'deterministic-rules-engine'
    };
  }

  // 6. Masonic
  const masonicSignals = [
    'grand lodge', 'lodge administration', 'member registry', 'fraternal record',
    'visitation', 'trestleboard', 'master mason', 'worshipful master', 'lodge no',
    'ritual documentation'
  ];
  const matchedMasonic = masonicSignals.filter(signal => combined.includes(signal));
  if (matchedMasonic.length > 0) {
    return {
      category: 'Masonic',
      reason: `Relates directly to fraternal lodge administration, Grand Lodge communication, and degree registries. Matched signals: ${matchedMasonic.slice(0, 2).join(', ')}.`,
      confidence: 0.97,
      tags: ['Masonic', 'Grand Lodge', 'Fraternal Registry', 'Administration'],
      reality_isolation_triggered: false,
      engineUsed: 'deterministic-rules-engine'
    };
  }

  // 7. AI Code Development
  const devSignals = [
    'dockerfile', 'github', 'git repo', 'mcp tools', 'fastmcp', 'python pipeline',
    'n8n automation', 'dora metrics', 'space metrics', 'container config', 'poetry.lock'
  ];
  const matchedDev = devSignals.filter(signal => combined.includes(signal));
  if (matchedDev.length > 0) {
    return {
      category: 'AI Code Development',
      reason: `Technical software development asset containing container configurations, MCP tools, and automated pipelines. Matched signals: ${matchedDev.slice(0, 2).join(', ')}.`,
      confidence: 0.96,
      tags: ['AI Code Dev', 'Pipelines', 'Docker/Containers', 'MCP Tools'],
      reality_isolation_triggered: false,
      engineUsed: 'deterministic-rules-engine'
    };
  }

  // 8. Strategy
  const strategySignals = [
    'enterprise roadmap', 'operating model', 'balanced scorecard', 'bsc metrics',
    'architectural governance', 'organizational design', 'executive vision', 'target operating model'
  ];
  const matchedStrategy = strategySignals.filter(signal => combined.includes(signal));
  if (matchedStrategy.length > 0) {
    return {
      category: 'Strategy',
      reason: `Contains high-level corporate roadmap frameworks, target operating model, and Balanced Scorecards. Matched signals: ${matchedStrategy.slice(0, 2).join(', ')}.`,
      confidence: 0.95,
      tags: ['Strategy', 'Roadmap', 'Operating Model', 'Governance'],
      reality_isolation_triggered: false,
      engineUsed: 'deterministic-rules-engine'
    };
  }

  // 9. Others
  return {
    category: 'Others',
    reason: 'Content does not clearly correspond to any of the 8 specialized primary operational domains.',
    confidence: 0.82,
    tags: ['General', 'Uncategorized', 'Operational Notes'],
    reality_isolation_triggered: false,
    engineUsed: 'deterministic-rules-engine'
  };
}

function withTimeout<T>(promise: Promise<T>, timeoutMs = 7000): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Gemini request timed out after ${timeoutMs}ms`)), timeoutMs);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
}

// Server API: Classify single document
app.post('/api/classify', async (req: Request, res: Response) => {
  try {
    const { title, snippet, fullText } = req.body;

    if (!title && !snippet && !fullText) {
      res.status(400).json({ error: 'Please provide at least a title, snippet, or fullText.' });
      return;
    }

    // First, run deterministic pre-check for Reality Isolation safety
    const deterministicCheck = classifyDeterministically(title, snippet, fullText);

    // If Gemini API Key is available, use Gemini 3.8 Flash with resilient timeout
    if (apiKey) {
      try {
        const systemInstruction = `You are an autonomous enterprise document classifier and workspace organizer.
Your objective is to inspect document titles, snippets, or full text/PDF contents from Google Drive and classify each document into EXACTLY ONE of the 9 defined operational domains.

CRITICAL PRIORITY RULE (REALITY ISOLATION):
- "Personal" takes absolute precedence over all other categories. If a document contains personal tax filings (e.g., GPM311, freelancer filings, VAT receipts, invoices), medical data, passports/IDs, private travel/shipping receipts, utility bills, or household records, it MUST be classified as "Personal", regardless of whether business or technical keywords (like Docker, valuation, cap table, roadmap) also appear.

TAXONOMY & CATEGORY DEFINITIONS:
1. Personal:
   - Tax documents (GPM311, freelancer filings, VAT receipts, invoices)
   - Identity documents (passports, IDs, legal identity)
   - Medical/health records, clinical notes
   - Personal travel, flight itineraries, shipping/package receipts
   - Household utilities, home office expenses, private correspondence
2. Financing/Investment:
   - Budgets, cap tables, term sheets, valuation models, funding proposals
   - Financial projections, P&L statements, cost analyses, revenue shares, royalties
3. Smartplanet:
   - SmartPlanet AI architecture and social media initiative
   - Governance systems, audit engines, enforcer mechanics, MQTT spine
   - Server architecture (WOPR, NORAD control, DEFCON status, The Farm, The Factory)
4. Ainie:
   - Personal AI assistant and digital twin architecture
   - Genesis Protocol, AgentDash, AgentFrame, reality isolation layers
   - Multi-space OS, HUD, localized domains (.life variants: Faulpelz, Tinginys, Flemmard, etc.)
5. Adaptive Living:
   - Assisted living, ergonomic housing, accessibility systems
   - Smart home automation for living spaces, wellness infrastructure
6. Masonic:
   - Lodge administration, member registries, fraternal records
   - Grand Lodge correspondence, lodge visitations, protocol and ritual documentation
7. AI Code Development:
   - Repositories, Git, GitHub, Docker/container configurations, MCP tools
   - Python pipelines, n8n automations, agent frameworks, DORA/SPACE metrics
8. Strategy:
   - Enterprise roadmaps, operating models, Balanced Scorecards (BSC)
   - Architectural governance frameworks, organizational design, high-level vision documents
9. Others:
   - Any document that does not clearly belong to the 8 primary domains above

RESPONSE RULES:
- Always output valid JSON conforming strictly to the provided JSON Schema.
- Provide a concise rationale in "reason" (maximum 2 sentences).
- Assign an accurate confidence score between 0.0 and 1.0.
- Suggest 2 to 4 semantic tags for secondary filtering.
- Flag "reality_isolation_triggered" as true if Personal was selected due to personal data presence overriding other terms.`;

        const userPrompt = `Classify this document:
Document Title: ${title || 'N/A'}
Snippet: ${snippet || 'N/A'}
Full Content:
${fullText ? (fullText.length > 5000 ? fullText.substring(0, 5000) + '... [truncated]' : fullText) : 'N/A'}`;

        const geminiCall = ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: userPrompt,
          config: {
            systemInstruction,
            temperature: 0.1,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                category: {
                  type: Type.STRING,
                  enum: [
                    'Personal',
                    'Financing/Investment',
                    'Smartplanet',
                    'Ainie',
                    'Adaptive Living',
                    'Masonic',
                    'AI Code Development',
                    'Strategy',
                    'Others',
                  ],
                  description: 'EXACTLY ONE of the 9 defined operational domains',
                },
                reason: {
                  type: Type.STRING,
                  description: 'Concise rationale in maximum 2 sentences.',
                },
                confidence: {
                  type: Type.NUMBER,
                  description: 'Accurate confidence score between 0.0 and 1.0.',
                },
                tags: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: '2 to 4 semantic tags for secondary filtering.',
                },
                reality_isolation_triggered: {
                  type: Type.BOOLEAN,
                  description: 'Whether Reality Isolation priority rule was activated.',
                },
              },
              required: ['category', 'reason', 'confidence', 'tags'],
            },
          },
        });

        const geminiResponse = await withTimeout(geminiCall, 7000);
        const rawText = geminiResponse.text?.trim() || '';
        const parsed = JSON.parse(rawText);

        // Sanity safeguard: If deterministic engine detected critical Personal documents, ensure Reality Isolation is strictly upheld
        if (deterministicCheck.category === 'Personal' && parsed.category !== 'Personal') {
          res.json({
            category: 'Personal',
            reason: `Reality Isolation priority rule enforced: Document contains private tax/identity/receipt records which take absolute precedence over ${parsed.category}.`,
            confidence: Math.max(parsed.confidence, 0.96),
            tags: Array.from(new Set(['Personal', 'Reality Isolation', ...(parsed.tags || [])])).slice(0, 4),
            reality_isolation_triggered: true,
            engineUsed: 'gemini-3.8-flash',
          });
          return;
        }

        res.json({
          category: parsed.category,
          reason: parsed.reason,
          confidence: Number(parsed.confidence) || 0.9,
          tags: (parsed.tags || []).slice(0, 4),
          reality_isolation_triggered: Boolean(parsed.reality_isolation_triggered),
          engineUsed: 'gemini-3.8-flash',
        });
        return;
      } catch (geminiError: any) {
        console.warn('Gemini classification fallback to deterministic engine:', geminiError?.message);
      }
    }

    // Deterministic fallback
    res.json(deterministicCheck);
  } catch (error: any) {
    console.error('Classification error:', error);
    res.status(500).json({ error: error?.message || 'Failed to classify document.' });
  }
});

// Server API: Batch classification
app.post('/api/classify-batch', async (req: Request, res: Response) => {
  try {
    const { documents } = req.body;
    if (!Array.isArray(documents)) {
      res.status(400).json({ error: 'Expected an array of documents.' });
      return;
    }

    const results = await Promise.all(
      documents.map(async (doc: any) => {
        try {
          const deterministicCheck = classifyDeterministically(doc.title, doc.snippet, doc.fullText);

          if (!apiKey) {
            return {
              id: doc.id,
              status: 'classified',
              classification: deterministicCheck,
              targetFolder: `/Drive/${deterministicCheck.category.replace(/[/\\?%*:|"<>]/g, '-')}`
            };
          }

          // Use Gemini for batch item
          const userPrompt = `Classify this document:
Document Title: ${doc.title || 'N/A'}
Snippet: ${doc.snippet || 'N/A'}
Full Content: ${doc.fullText ? doc.fullText.substring(0, 2000) : 'N/A'}`;

          const geminiCall = ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: userPrompt,
            config: {
              temperature: 0.1,
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  category: {
                    type: Type.STRING,
                    enum: [
                      'Personal',
                      'Financing/Investment',
                      'Smartplanet',
                      'Ainie',
                      'Adaptive Living',
                      'Masonic',
                      'AI Code Development',
                      'Strategy',
                      'Others',
                    ],
                  },
                  reason: { type: Type.STRING },
                  confidence: { type: Type.NUMBER },
                  tags: { type: Type.ARRAY, items: { type: Type.STRING } },
                  reality_isolation_triggered: { type: Type.BOOLEAN },
                },
                required: ['category', 'reason', 'confidence', 'tags'],
              },
            },
          });

          const geminiResponse = await withTimeout(geminiCall, 6000);
          const rawText = geminiResponse.text?.trim() || '';
          const parsed = JSON.parse(rawText);

          const finalCategory = (deterministicCheck.category === 'Personal') ? 'Personal' : parsed.category;
          const isRealityTriggered = deterministicCheck.category === 'Personal' || Boolean(parsed.reality_isolation_triggered);

          return {
            id: doc.id,
            status: 'classified',
            classification: {
              category: finalCategory,
              reason: parsed.reason || deterministicCheck.reason,
              confidence: Number(parsed.confidence) || 0.95,
              tags: (parsed.tags || deterministicCheck.tags).slice(0, 4),
              reality_isolation_triggered: isRealityTriggered,
              engineUsed: 'gemini-3.8-flash'
            },
            targetFolder: `/Drive/${finalCategory.replace(/[/\\?%*:|"<>]/g, '-')}`
          };
        } catch (err: any) {
          const fallback = classifyDeterministically(doc.title, doc.snippet, doc.fullText);
          return {
            id: doc.id,
            status: 'classified',
            classification: fallback,
            targetFolder: `/Drive/${fallback.category.replace(/[/\\?%*:|"<>]/g, '-')}`
          };
        }
      })
    );

    res.json({ results });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Batch classification failed.' });
  }
});

// Server API: Status endpoint
app.get('/api/status', (req: Request, res: Response) => {
  res.json({
    status: 'online',
    model: 'gemini-3.8-flash',
    hasApiKey: Boolean(apiKey),
    supportedDomains: OPERATIONAL_DOMAINS,
    realityIsolationPriority: 'Active (Absolute Precedence)',
  });
});

async function startServer() {
  // Vite in dev mode
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Enterprise Document Classifier server running on http://0.0.0.0:${PORT}`);
    startTelemetry(Boolean(apiKey));
  });
}

startServer();
