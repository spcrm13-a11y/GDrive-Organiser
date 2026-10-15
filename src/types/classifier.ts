export type OperationalDomain =
  | 'Personal'
  | 'Financing/Investment'
  | 'Smartplanet'
  | 'Ainie'
  | 'Adaptive Living'
  | 'Masonic'
  | 'AI Code Development'
  | 'Strategy'
  | 'Others';

export interface DocumentClassificationResult {
  category: OperationalDomain;
  reason: string;
  confidence: number;
  tags: string[];
  reality_isolation_triggered?: boolean;
}

export interface ClassificationResult extends DocumentClassificationResult {
  engineUsed?: 'gemini-3.8-flash' | 'deterministic-rules-engine';
}

export interface DocumentItem {
  id: string;
  title: string;
  snippet?: string;
  fullText?: string;
  source: 'google_drive' | 'local_upload' | 'manual_input' | 'corpus';
  fileType?: string;
  drivePath?: string;
  modifiedAt?: string;
  fileSize?: string;
  classification?: DocumentClassificationResult;
  status: 'pending' | 'classifying' | 'classified' | 'error';
  targetFolder?: string;
  error?: string;
}

export interface DomainMetadata {
  domain: OperationalDomain;
  displayName: string;
  description: string;
  keySignals: string[];
  color: {
    bg: string;
    text: string;
    border: string;
    badge: string;
    accent: string;
    glow: string;
  };
  iconName: string;
}

export const OPERATIONAL_DOMAINS: DomainMetadata[] = [
  {
    domain: 'Personal',
    displayName: 'Personal',
    description: 'CRITICAL PRIORITY (Reality Isolation): Tax documents (GPM311, freelancer filings, VAT, invoices), identity (passports, IDs), medical/health records, personal travel/shipping receipts, household utilities and private correspondence. Takes absolute precedence over all other categories.',
    keySignals: [
      'GPM311 / Tax Declarations',
      'Freelancer Filings & VAT Invoices',
      'Passports & National IDs',
      'Medical / Clinical Notes',
      'Travel & Flight Itineraries',
      'Household Utilities & Rent'
    ],
    color: {
      bg: 'bg-rose-500/10',
      text: 'text-rose-400',
      border: 'border-rose-500/30',
      badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      accent: 'rose',
      glow: 'shadow-rose-500/20'
    },
    iconName: 'ShieldAlert'
  },
  {
    domain: 'Financing/Investment',
    displayName: 'Financing / Investment',
    description: 'Budgets, cap tables, term sheets, valuation models, funding proposals, financial projections, P&L statements, cost analyses, revenue shares, and royalties.',
    keySignals: [
      'Cap Tables & Valuation Models',
      'Term Sheets & SAFE Notes',
      'P&L Statements & Cost Analyses',
      'Financial Projections & EBITDA',
      'Funding Proposals & Seed Decks',
      'Revenue Shares & Royalties'
    ],
    color: {
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      border: 'border-emerald-500/30',
      badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      accent: 'emerald',
      glow: 'shadow-emerald-500/20'
    },
    iconName: 'TrendingUp'
  },
  {
    domain: 'Smartplanet',
    displayName: 'Smartplanet',
    description: 'SmartPlanet AI architecture and social media initiative, governance systems, audit engines, enforcer mechanics, MQTT spine, and server architecture (WOPR, NORAD control, DEFCON status, The Farm, The Factory).',
    keySignals: [
      'SmartPlanet AI Architecture',
      'MQTT Spine & Enforcer Mechanics',
      'Audit Engines & Governance',
      'WOPR & NORAD Control',
      'DEFCON Status Dashboard',
      'The Farm & The Factory Nodes'
    ],
    color: {
      bg: 'bg-cyan-500/10',
      text: 'text-cyan-400',
      border: 'border-cyan-500/30',
      badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
      accent: 'cyan',
      glow: 'shadow-cyan-500/20'
    },
    iconName: 'Cpu'
  },
  {
    domain: 'Ainie',
    displayName: 'Ainie',
    description: 'Personal AI assistant and digital twin architecture, Genesis Protocol, AgentDash, AgentFrame, reality isolation layers, multi-space OS, HUD, localized domains (.life variants: Faulpelz, Tinginys, Flemmard, etc.).',
    keySignals: [
      'Genesis Protocol & AgentDash',
      'AgentFrame & Digital Twin',
      'Reality Isolation Layers',
      'Multi-Space OS & HUD Specs',
      '.life Variants (Faulpelz, Tinginys)',
      'Ainie Assistant Persona'
    ],
    color: {
      bg: 'bg-violet-500/10',
      text: 'text-violet-400',
      border: 'border-violet-500/30',
      badge: 'bg-violet-500/20 text-violet-300 border-violet-500/40',
      accent: 'violet',
      glow: 'shadow-violet-500/20'
    },
    iconName: 'Bot'
  },
  {
    domain: 'Adaptive Living',
    displayName: 'Adaptive Living',
    description: 'Assisted living, ergonomic housing, accessibility systems, smart home automation for living spaces, and wellness infrastructure.',
    keySignals: [
      'Assisted Living & Ergonomics',
      'Universal Accessibility Systems',
      'Smart Home Living Automation',
      'Wellness & Ambient Infrastructure',
      'Mobility & Barrier-free Design',
      'Sensory Environmental Controls'
    ],
    color: {
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
      border: 'border-amber-500/30',
      badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      accent: 'amber',
      glow: 'shadow-amber-500/20'
    },
    iconName: 'Home'
  },
  {
    domain: 'Masonic',
    displayName: 'Masonic',
    description: 'Lodge administration, member registries, fraternal records, Grand Lodge correspondence, lodge visitations, protocol and ritual documentation.',
    keySignals: [
      'Lodge Administration & Rosters',
      'Grand Lodge Correspondence',
      'Lodge Visitations & Protocols',
      'Ritual Documentation & Trestleboard',
      'Fraternal Records & Charters',
      'Officer Degrees & Summons'
    ],
    color: {
      bg: 'bg-blue-500/10',
      text: 'text-blue-400',
      border: 'border-blue-500/30',
      badge: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
      accent: 'blue',
      glow: 'shadow-blue-500/20'
    },
    iconName: 'Compass'
  },
  {
    domain: 'AI Code Development',
    displayName: 'AI Code Development',
    description: 'Repositories, Git, GitHub, Docker/container configurations, MCP tools, Python pipelines, n8n automations, agent frameworks, DORA/SPACE metrics.',
    keySignals: [
      'Git Repos & GitHub Actions',
      'Docker & Container Configs',
      'MCP (Model Context Protocol) Tools',
      'Python Pipelines & ETL',
      'n8n Workflows & Automations',
      'DORA & SPACE Developer Metrics'
    ],
    color: {
      bg: 'bg-teal-500/10',
      text: 'text-teal-400',
      border: 'border-teal-500/30',
      badge: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
      accent: 'teal',
      glow: 'shadow-teal-500/20'
    },
    iconName: 'Terminal'
  },
  {
    domain: 'Strategy',
    displayName: 'Strategy',
    description: 'Enterprise roadmaps, operating models, Balanced Scorecards (BSC), architectural governance frameworks, organizational design, and high-level vision documents.',
    keySignals: [
      'Enterprise Roadmaps & Milestones',
      'Balanced Scorecards (BSC)',
      'Operating Models & Target State',
      'Architectural Governance',
      'Organizational Design & RACI',
      'Executive Vision & OKRs'
    ],
    color: {
      bg: 'bg-indigo-500/10',
      text: 'text-indigo-400',
      border: 'border-indigo-500/30',
      badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
      accent: 'indigo',
      glow: 'shadow-indigo-500/20'
    },
    iconName: 'Target'
  },
  {
    domain: 'Others',
    displayName: 'Others',
    description: 'Any document that does not clearly belong to the 8 primary domains above.',
    keySignals: [
      'Uncategorized General Content',
      'Cross-Domain Neutral Notes',
      'External News & General Reading',
      'Ambiguous Raw Snippets'
    ],
    color: {
      bg: 'bg-slate-500/10',
      text: 'text-slate-400',
      border: 'border-slate-500/30',
      badge: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
      accent: 'slate',
      glow: 'shadow-slate-500/20'
    },
    iconName: 'HelpCircle'
  }
];

export const CLASSIFICATION_JSON_SCHEMA = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'DocumentClassificationResponse',
  type: 'object',
  required: ['category', 'reason', 'confidence', 'tags'],
  properties: {
    category: {
      type: 'string',
      enum: [
        'Personal',
        'Financing/Investment',
        'Smartplanet',
        'Ainie',
        'Adaptive Living',
        'Masonic',
        'AI Code Development',
        'Strategy',
        'Others'
      ],
      description: 'EXACTLY ONE of the 9 defined operational domains'
    },
    reason: {
      type: 'string',
      description: 'Concise rationale in maximum 2 sentences explaining domain classification and Reality Isolation precedence if applied.'
    },
    confidence: {
      type: 'number',
      minimum: 0.0,
      maximum: 1.0,
      description: 'Accurate confidence score between 0.0 and 1.0'
    },
    tags: {
      type: 'array',
      items: { type: 'string' },
      minItems: 2,
      maxItems: 4,
      description: '2 to 4 semantic tags for secondary filtering'
    },
    reality_isolation_triggered: {
      type: 'boolean',
      description: 'True if Personal category took absolute priority due to personal tax, identity, medical, travel, or utility contents.'
    }
  }
};
