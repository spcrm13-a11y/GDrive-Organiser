import taxonomy from '../../taxonomy.json';
import {
  OPERATIONAL_DOMAINS as OPERATIONAL_DOMAIN_NAMES,
  type OperationalDomain,
} from './taxonomy.generated';

export { OPERATIONAL_DOMAIN_NAMES };
export type { OperationalDomain };

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

/**
 * Presentation only. The domain names, descriptions and key signals are the
 * single source of truth in taxonomy.json -- never re-list them here.
 */
const DOMAIN_PRESENTATION: Record<
  OperationalDomain,
  { color: DomainMetadata['color']; iconName: string }
> = {
  'Personal': {
    color: {
      bg: 'bg-rose-500/10',
      text: 'text-rose-400',
      border: 'border-rose-500/30',
      badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      accent: 'rose',
      glow: 'shadow-rose-500/20'
    },
    iconName: 'ShieldAlert',
  },
  'Financing/Investment': {
    color: {
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      border: 'border-emerald-500/30',
      badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      accent: 'emerald',
      glow: 'shadow-emerald-500/20'
    },
    iconName: 'TrendingUp',
  },
  'Smartplanet': {
    color: {
      bg: 'bg-cyan-500/10',
      text: 'text-cyan-400',
      border: 'border-cyan-500/30',
      badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
      accent: 'cyan',
      glow: 'shadow-cyan-500/20'
    },
    iconName: 'Cpu',
  },
  'Ainie': {
    color: {
      bg: 'bg-violet-500/10',
      text: 'text-violet-400',
      border: 'border-violet-500/30',
      badge: 'bg-violet-500/20 text-violet-300 border-violet-500/40',
      accent: 'violet',
      glow: 'shadow-violet-500/20'
    },
    iconName: 'Bot',
  },
  'Adaptive Living': {
    color: {
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
      border: 'border-amber-500/30',
      badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      accent: 'amber',
      glow: 'shadow-amber-500/20'
    },
    iconName: 'Home',
  },
  'Masonic': {
    color: {
      bg: 'bg-blue-500/10',
      text: 'text-blue-400',
      border: 'border-blue-500/30',
      badge: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
      accent: 'blue',
      glow: 'shadow-blue-500/20'
    },
    iconName: 'Compass',
  },
  'AI Code Development': {
    color: {
      bg: 'bg-teal-500/10',
      text: 'text-teal-400',
      border: 'border-teal-500/30',
      badge: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
      accent: 'teal',
      glow: 'shadow-teal-500/20'
    },
    iconName: 'Terminal',
  },
  'Strategy': {
    color: {
      bg: 'bg-indigo-500/10',
      text: 'text-indigo-400',
      border: 'border-indigo-500/30',
      badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
      accent: 'indigo',
      glow: 'shadow-indigo-500/20'
    },
    iconName: 'Target',
  },
  'Others': {
    color: {
      bg: 'bg-slate-500/10',
      text: 'text-slate-400',
      border: 'border-slate-500/30',
      badge: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
      accent: 'slate',
      glow: 'shadow-slate-500/20'
    },
    iconName: 'HelpCircle',
  },
};

export const OPERATIONAL_DOMAINS: DomainMetadata[] = taxonomy.domains.map((d) => {
  const domain = d.domain as OperationalDomain;
  const presentation = DOMAIN_PRESENTATION[domain];
  if (!presentation) {
    throw new Error(
      `taxonomy.json declares domain "${d.domain}" with no presentation entry ` +
        `in classifier.ts. Add its colour and icon.`,
    );
  }
  return {
    domain,
    displayName: d.displayName,
    description: d.description,
    keySignals: d.keySignals,
    ...presentation,
  };
});

export const CLASSIFICATION_JSON_SCHEMA = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'DocumentClassificationResponse',
  type: 'object',
  required: ['category', 'reason', 'confidence', 'tags'],
  properties: {
    category: {
      type: 'string',
      enum: [...OPERATIONAL_DOMAIN_NAMES],
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
