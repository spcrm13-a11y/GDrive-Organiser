import React, { useState } from 'react';
import {
  BookOpen,
  Code,
  ShieldAlert,
  Folder,
  Tag,
  Copy,
  Check,
  CheckCircle2,
  Terminal
} from 'lucide-react';
import { OPERATIONAL_DOMAINS, CLASSIFICATION_JSON_SCHEMA } from '../types/classifier';
import { JsonViewer } from './JsonViewer';

export const TaxonomyReferenceView: React.FC = () => {
  const [copiedCurl, setCopiedCurl] = useState(false);

  const curlCommand = `curl -X POST https://ais-dev-sznmngb5k7rn7wkxlmuija-98483161321.europe-west1.run.app/api/classify \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "GPM311_Freelancer_Tax_Declaration_2025.pdf",
    "snippet": "Form GPM311 freelance annual income declaration and home office expenses.",
    "fullText": "STATE TAX INSPECTORATE DECLARATION FORM GPM311..."
  }'`;

  const handleCopyCurl = () => {
    navigator.clipboard.writeText(curlCommand);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="bg-[#fffcf7] border border-[#e2d8c8] rounded-2xl p-5 shadow-sm text-stone-900">
        <div className="flex items-center gap-2 mb-1">
          <BookOpen className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-bold text-stone-900 tracking-tight">
            Operational Taxonomy & JSON Schema Specification
          </h2>
        </div>
        <p className="text-xs text-stone-600">
          Complete formal taxonomy definitions for the 9 operational domains, response schema constraints, and integration specifications.
        </p>
      </div>

      {/* 9 Operational Domains Grid */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider text-stone-700">
          1. The 9 Operational Domains
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {OPERATIONAL_DOMAINS.map((domainMeta, index) => {
            const isPersonal = domainMeta.domain === 'Personal';
            return (
              <div
                key={domainMeta.domain}
                className={`p-4 rounded-2xl border shadow-sm ${domainMeta.color.border} bg-[#fffcf7] flex flex-col justify-between space-y-3`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-mono font-bold text-stone-500">
                      Domain {index + 1} / 9
                    </span>
                    {isPersonal && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3 text-rose-600" />
                        Absolute Precedence
                      </span>
                    )}
                  </div>

                  <h4 className={`text-base font-bold ${domainMeta.color.text} mb-1 flex items-center gap-2`}>
                    {domainMeta.displayName}
                  </h4>

                  <p className="text-xs text-stone-600 leading-relaxed mb-3">
                    {domainMeta.description}
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-[#e8dfd0]">
                  <div className="text-[11px] font-semibold text-stone-600 uppercase tracking-wider">
                    Key Taxonomy Signals:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {domainMeta.keySignals.map((signal, sIdx) => (
                      <span
                        key={sIdx}
                        className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-[#f8f4ec] text-stone-700 border border-[#e4dccd]"
                      >
                        {signal}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* JSON Schema Section */}
      <div className="space-y-4 pt-4">
        <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider text-stone-700 flex items-center gap-2">
          <Code className="w-4 h-4 text-indigo-600" />
          2. Response Constraints & JSON Schema
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#fffcf7] border border-[#e2d8c8] rounded-2xl p-5 space-y-3 shadow-sm text-stone-900">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700">
              Mandatory Response Rules
            </h4>
            <ul className="text-xs text-stone-700 space-y-2.5 leading-relaxed">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Strict JSON:</strong> Always output valid JSON conforming strictly to the defined schema.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Single Domain:</strong> Classify each document into <strong>EXACTLY ONE</strong> of the 9 operational domains.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Concise Rationale:</strong> Provide a concise rationale in "reason" (maximum 2 sentences).
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Confidence:</strong> Assign an accurate confidence score as a floating-point number between 0.0 and 1.0.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Semantic Tags:</strong> Suggest 2 to 4 semantic tags for secondary filtering and indexing.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Reality Isolation Precedence:</strong> "Personal" strictly overrides all other categories when personal tax, medical, ID, travel, or bills are present.
                </span>
              </li>
            </ul>

            {/* API cURL Snippet */}
            <div className="pt-4 border-t border-[#e8dfd0]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono text-stone-600 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-indigo-600" /> Server Classification API cURL
                </span>
                <button
                  onClick={handleCopyCurl}
                  className="text-[11px] text-stone-700 hover:text-stone-900 px-2 py-0.5 rounded bg-[#ede5d6] hover:bg-[#e4dcce] border border-[#dfd5c4] transition"
                >
                  {copiedCurl ? 'Copied' : 'Copy cURL'}
                </button>
              </div>
              <div className="p-3 bg-[#f8f4ec] rounded-xl border border-[#e2d8c8] text-[11px] font-mono text-stone-800 overflow-x-auto">
                <pre>{curlCommand}</pre>
              </div>
            </div>
          </div>

          <div>
            <JsonViewer data={CLASSIFICATION_JSON_SCHEMA} title="JSON Schema Specification" />
          </div>
        </div>
      </div>
    </div>
  );
};
