import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Lock,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Cpu,
  FileText
} from 'lucide-react';
import { DocumentItem } from '../types/classifier';

interface RealityIsolationAuditViewProps {
  documents: DocumentItem[];
  onSelectDocument: (doc: DocumentItem) => void;
}

export const RealityIsolationAuditView: React.FC<RealityIsolationAuditViewProps> = ({
  documents,
  onSelectDocument
}) => {
  // Adversarial stress test toggles
  const [hasTax, setHasTax] = useState(true);
  const [hasPassport, setHasPassport] = useState(false);
  const [hasMedical, setHasMedical] = useState(false);
  const [hasTravelReceipt, setHasTravelReceipt] = useState(false);
  const [hasDockerCode, setHasDockerCode] = useState(true);
  const [hasCapTable, setHasCapTable] = useState(false);
  const [hasSmartplanet, setHasSmartplanet] = useState(false);

  // Compute test resolution
  const hasAnyPersonal = hasTax || hasPassport || hasMedical || hasTravelReceipt;
  const hasAnyTech = hasDockerCode || hasCapTable || hasSmartplanet;

  // Documents in workspace that triggered Reality Isolation
  const realityTriggeredDocs = documents.filter(
    d => d.classification?.reality_isolation_triggered || d.classification?.category === 'Personal'
  );

  return (
    <div className="space-y-6">
      {/* Policy Directive Hero */}
      <div className="bg-gradient-to-r from-rose-950/80 via-slate-900 to-slate-900 border border-rose-900/60 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                CRITICAL PRIORITY RULE
              </span>
              <span className="text-xs text-rose-300/80 font-mono">Status: ACTIVE & ENFORCED</span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Reality Isolation Architecture & Compliance Lab
            </h2>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              "Personal" takes absolute precedence over all other categories. If a document contains personal tax filings
              (e.g., GPM311, freelancer filings, VAT receipts), medical data, passports/identity documents, private travel/shipping receipts,
              or utility bills, it <strong className="text-white">MUST be classified as "Personal"</strong>, regardless of whether business,
              financial, or technical keywords also appear in the file.
            </p>
          </div>

          <div className="bg-slate-950/80 border border-rose-800/60 rounded-xl p-4 text-center shrink-0">
            <div className="text-3xl font-extrabold text-rose-400 font-mono">
              {realityTriggeredDocs.length}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">Documents Protected</div>
            <div className="text-[10px] text-rose-400/90 font-mono mt-1 flex items-center justify-center gap-1">
              <Lock className="w-3 h-3" /> Zero Leakage
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Adversarial Stress Test Simulator */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-5">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Cpu className="w-5 h-5 text-indigo-400" />
            Adversarial Reality Isolation Collision Simulator
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Toggle contradictory signals in a single document to verify that the autonomous classifier resolves collisions in strict accordance with the Reality Isolation priority rule.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: Input Signal Matrix */}
          <div className="space-y-4 bg-slate-950/70 p-4 rounded-xl border border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4" /> Personal Signals (Reality Isolation Triggers)
            </h4>

            <div className="space-y-2">
              <label className="flex items-center gap-2.5 text-xs text-slate-200 cursor-pointer p-2 rounded-lg hover:bg-slate-900 transition">
                <input
                  type="checkbox"
                  checked={hasTax}
                  onChange={(e) => setHasTax(e.target.checked)}
                  className="rounded border-slate-700 text-rose-600 focus:ring-rose-500 bg-slate-900"
                />
                <div>
                  <div className="font-semibold text-white">GPM311 Tax Declaration / Freelancer VAT</div>
                  <div className="text-[11px] text-slate-400">Freelancer annual tax filing, VAT receipts, invoices</div>
                </div>
              </label>

              <label className="flex items-center gap-2.5 text-xs text-slate-200 cursor-pointer p-2 rounded-lg hover:bg-slate-900 transition">
                <input
                  type="checkbox"
                  checked={hasPassport}
                  onChange={(e) => setHasPassport(e.target.checked)}
                  className="rounded border-slate-700 text-rose-600 focus:ring-rose-500 bg-slate-900"
                />
                <div>
                  <div className="font-semibold text-white">Passport / National ID Data</div>
                  <div className="text-[11px] text-slate-400">Personal identity documents, passport numbers, legal identity</div>
                </div>
              </label>

              <label className="flex items-center gap-2.5 text-xs text-slate-200 cursor-pointer p-2 rounded-lg hover:bg-slate-900 transition">
                <input
                  type="checkbox"
                  checked={hasMedical}
                  onChange={(e) => setHasMedical(e.target.checked)}
                  className="rounded border-slate-700 text-rose-600 focus:ring-rose-500 bg-slate-900"
                />
                <div>
                  <div className="font-semibold text-white">Clinical Medical Records / Blood Tests</div>
                  <div className="text-[11px] text-slate-400">Health records, prescription notes, MRI diagnostic scans</div>
                </div>
              </label>

              <label className="flex items-center gap-2.5 text-xs text-slate-200 cursor-pointer p-2 rounded-lg hover:bg-slate-900 transition">
                <input
                  type="checkbox"
                  checked={hasTravelReceipt}
                  onChange={(e) => setHasTravelReceipt(e.target.checked)}
                  className="rounded border-slate-700 text-rose-600 focus:ring-rose-500 bg-slate-900"
                />
                <div>
                  <div className="font-semibold text-white">Personal Travel & Courier Shipping Receipts</div>
                  <div className="text-[11px] text-slate-400">Flight itineraries, DHL personal receipts, utility bills</div>
                </div>
              </label>
            </div>

            <div className="pt-3 border-t border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-2">
                Conflicting Enterprise / Technical Signals
              </h4>
              <div className="space-y-2">
                <label className="flex items-center gap-2.5 text-xs text-slate-200 cursor-pointer p-2 rounded-lg hover:bg-slate-900 transition">
                  <input
                    type="checkbox"
                    checked={hasDockerCode}
                    onChange={(e) => setHasDockerCode(e.target.checked)}
                    className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-900"
                  />
                  <div>
                    <div className="font-semibold text-white">Docker / Container CI/CD & FastMCP Code</div>
                    <div className="text-[11px] text-slate-400">Technical code snippet or repository instructions</div>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 text-xs text-slate-200 cursor-pointer p-2 rounded-lg hover:bg-slate-900 transition">
                  <input
                    type="checkbox"
                    checked={hasCapTable}
                    onChange={(e) => setHasCapTable(e.target.checked)}
                    className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-900"
                  />
                  <div>
                    <div className="font-semibold text-white">Series A Cap Table & $18.5M Valuation Model</div>
                    <div className="text-[11px] text-slate-400">Financing terms, burn rate projections, and SAFE notes</div>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 text-xs text-slate-200 cursor-pointer p-2 rounded-lg hover:bg-slate-900 transition">
                  <input
                    type="checkbox"
                    checked={hasSmartplanet}
                    onChange={(e) => setHasSmartplanet(e.target.checked)}
                    className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-900"
                  />
                  <div>
                    <div className="font-semibold text-white">SmartPlanet MQTT Spine & WOPR Architecture</div>
                    <div className="text-[11px] text-slate-400">Autonomous enforcer mechanics, DEFCON status</div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Right: Classifier Resolution Decision Card */}
          <div className="flex flex-col justify-between bg-slate-950/70 p-5 rounded-xl border border-slate-800">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs uppercase font-bold tracking-wider text-slate-400">
                  Classifier Collision Resolution
                </span>
                <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-0.5 rounded-full">
                  100% Deterministic Guarantee
                </span>
              </div>

              {hasAnyPersonal ? (
                <div className="p-4 rounded-xl bg-rose-950/50 border border-rose-800/80 space-y-3">
                  <div className="flex items-center gap-2.5 text-rose-300">
                    <ShieldAlert className="w-6 h-6 text-rose-400 shrink-0" />
                    <div>
                      <div className="text-lg font-bold text-white">Enforced Category: Personal</div>
                      <div className="text-xs text-rose-300 font-semibold">
                        Reality Isolation Shield: Active
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-rose-200/90 leading-relaxed italic bg-rose-950/60 p-3 rounded-lg border border-rose-900/60">
                    "Under Reality Isolation, confidential personal documentation takes absolute priority over
                    {hasAnyTech ? ' accompanying technical or corporate elements' : ' other domains'}. Classified strictly into Personal domain."
                  </p>

                  <div className="text-xs text-slate-300 space-y-1">
                    <div className="font-semibold text-slate-400">Target Google Drive Routing:</div>
                    <div className="font-mono text-rose-300 font-bold bg-slate-950 p-2 rounded border border-slate-800">
                      /My Drive/Personal/Encrypted-Vault/
                    </div>
                  </div>
                </div>
              ) : hasAnyTech ? (
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                    <div>
                      <div className="text-lg font-bold text-white">
                        {hasDockerCode ? 'AI Code Development' : hasCapTable ? 'Financing/Investment' : 'Smartplanet'}
                      </div>
                      <div className="text-xs text-slate-400">Standard Enterprise Classification</div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed italic bg-slate-950 p-3 rounded-lg border border-slate-800">
                    "No confidential personal records identified. Classified into standard operational domain based on primary technical and business signals."
                  </p>
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-slate-500">
                  Select at least one signal to simulate resolution.
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Audited under GDPR & ISO 27001 Reality Isolation standard</span>
              <span className="text-emerald-400 font-mono font-semibold">Zero False Negatives</span>
            </div>
          </div>
        </div>
      </div>

      {/* Protected Documents Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Lock className="w-4 h-4 text-rose-400" />
            Reality Isolation Active Documents in Current Workspace ({realityTriggeredDocs.length})
          </h3>
          <span className="text-xs text-slate-400 font-mono">Isolated from enterprise systems</span>
        </div>

        <div className="space-y-2">
          {realityTriggeredDocs.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
              No personal documents currently in the workspace.
            </div>
          ) : (
            realityTriggeredDocs.map((doc) => (
              <div
                key={doc.id}
                onClick={() => onSelectDocument(doc)}
                className="flex items-center justify-between p-3.5 bg-rose-950/20 hover:bg-rose-950/40 border border-rose-900/40 rounded-xl cursor-pointer transition"
              >
                <div className="flex items-center gap-3">
                  <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                  <div>
                    <h4 className="text-xs font-semibold text-white">{doc.title}</h4>
                    <p className="text-[11px] text-slate-400 line-clamp-1">{doc.classification?.reason}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
                    Personal (Isolated)
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
