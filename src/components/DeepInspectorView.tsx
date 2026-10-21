import React, { useState } from 'react';
import {
  Sparkles,
  ShieldAlert,
  FileText,
  Tag,
  CheckCircle2,
  Copy,
  Check,
  AlertTriangle,
  RotateCcw,
  Sliders,
  Cpu,
  Layers
} from 'lucide-react';
import { ClassificationResult } from '../types/classifier';
import { OPERATIONAL_DOMAINS } from '../types/classifier';
import { JsonViewer } from './JsonViewer';

export const DeepInspectorView: React.FC = () => {
  const [title, setTitle] = useState(
    'GPM311_Freelancer_Income_Tax_Declaration_and_Docker_Repo.pdf'
  );
  const [snippet, setSnippet] = useState(
    'Form GPM311 freelance annual income declaration, personal health insurance contributions, residential utility receipts, and attached Python Docker automation script.'
  );
  const [fullText, setFullText] = useState(`STATE TAX INSPECTORATE DECLARATION FORM GPM311
Taxpayer ID: 38804190234 | Period: Fiscal Year 2025
Activity: Freelance Software Engineering & AI Consulting
Gross Receipts: €78,400.00
Deductible Expenses: 30% flat allowance
Personal Health Insurance (PSD): €2,140.00
Attached Receipts:
- Telia high-speed fiber internet (€48.00/month)
- Ignitis home office electricity (€112.50/month)
- Private clinical consultation fee (€95.00)

[MARGIN NOTE]:
Attached snippet used for calculating daily ECB conversion rates:
import docker
client = docker.from_env()
client.containers.run("ai-pipeline:latest", detach=True)`);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ClassificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleClassify = async () => {
    if (!title && !snippet && !fullText) {
      setError('Please provide at least a title, snippet, or content.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, snippet, fullText }),
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to classify document.');
    } finally {
      setLoading(false);
    }
  };

  const loadPreset = (presetType: string) => {
    setError(null);
    if (presetType === 'personal_trap') {
      setTitle('GPM311_Freelancer_Income_Tax_Declaration_and_Docker_Repo.pdf');
      setSnippet('Form GPM311 freelance annual income declaration, personal health insurance contributions, residential utility receipts, and attached Python Docker automation script.');
      setFullText(`STATE TAX INSPECTORATE DECLARATION FORM GPM311
Taxpayer ID: 38804190234 | Period: Fiscal Year 2025
Activity: Freelance Software Engineering & AI Consulting
Gross Receipts: €78,400.00
Deductible Expenses: 30% flat allowance
Personal Health Insurance (PSD): €2,140.00
Attached Receipts:
- Telia high-speed fiber internet (€48.00/month)
- Ignitis home office electricity (€112.50/month)
- Private clinical consultation fee (€95.00)

[MARGIN NOTE]:
Attached snippet used for calculating daily ECB conversion rates:
import docker
client = docker.from_env()
client.containers.run("ai-pipeline:latest", detach=True)`);
    } else if (presetType === 'finance_cap') {
      setTitle('Series_A_Cap_Table_and_Convertible_SAFE_Model.xlsx');
      setSnippet('Series A $4.5M equity financing model on $18.5M pre-money valuation. Cap table fully diluted breakdown, employee stock option pool (ESOP 15%), and 3-year P&L EBITDA projections.');
      setFullText(`CAPITALIZATION TABLE & VALUATION MODEL
Round: Series A Preferred Stock
Pre-Money Valuation: $18,500,000
Capital Raised: $4,500,000
Post-Money Valuation: $23,000,000
Total Fully Diluted Shares: 12,500,000

Projections:
- 36-month burn rate forecast
- Revenue sharing and royalty agreements for enterprise distribution
- Cost analysis of GPU cluster operating expenditure`);
    } else if (presetType === 'smartplanet_core') {
      setTitle('SmartPlanet_MQTT_Spine_WOPR_DEFCON_Specification.md');
      setSnippet('SmartPlanet AI social media governance architecture. MQTT spine real-time topics, autonomous enforcer mechanics, WOPR and NORAD control nodes with DEFCON status escalation.');
      setFullText(`# SmartPlanet AI Infrastructure Specification
System: WOPR Central Hub
Status: DEFCON 2 Monitoring
Architecture:
- High-availability MQTT broker messaging spine
- Enforcer mechanics continuously verifying compliance across agent swarms
- The Farm and The Factory data generation pipelines
- Audit engine telemetry streaming to NORAD operations console`);
    } else if (presetType === 'ainie_twin') {
      setTitle('Ainie_Genesis_Protocol_and_AgentDash_HUD.docx');
      setSnippet('Personal AI assistant and digital twin architecture. Genesis Protocol bootstrap, AgentDash, AgentFrame, reality isolation cognitive partitions, and localized .life domain spaces.');
      setFullText(`AINIE ARCHITECTURE: GENESIS PROTOCOL
Entity: Autonomous Digital Twin & Personal AI Companion
Core Components:
- AgentDash HUD: Wearable and ambient visual heads-up display.
- AgentFrame: Execution container for cognitive synchronization.
- Localized domains: faulpelz.life, tinginys.life, flemmard.life.
- Reality Isolation Layer: Strictly shields private host memory from external interaction agents.`);
    } else if (presetType === 'adaptive_living') {
      setTitle('Ergonomic_Assisted_Living_Smart_Home_Blueprint.pdf');
      setSnippet('Universal accessibility residence blueprint, ergonomic hydraulic cabinetry, zero-threshold barrier-free entries, and ambient sensory wellness infrastructure.');
      setFullText(`BLUEPRINT: ADAPTIVE LIVING RESIDENCE
Universal Design & Assisted Living System
Features:
- Barrier-free flooring transitions and ergonomic kitchen counters
- Fall detection radar and voice-controlled smart home automation
- Circadian light sequencing and ambient wellness monitoring`);
    } else if (presetType === 'masonic_roster') {
      setTitle('Grand_Lodge_Fraternal_Registry_and_Visitation_Minutes.pdf');
      setSnippet('Administrative records of Lodge No. 42, fraternal registry of Master Masons, Grand Lodge official communication, and trestleboard ritual degree schedule.');
      setFullText(`GRAND LODGE OF ANCIENT FREE AND ACCEPTED MASONS
Official Communication & Lodge Administration Roster
Lodge: St. Andrew Lodge No. 42
Business:
- Approval of previous meeting minutes and fraternal alms allocations
- Trestleboard: Degree conferring schedule for Entered Apprentice and Fellowcraft
- Grand Lodge visitation protocol and membership register update`);
    } else if (presetType === 'ai_code_dev') {
      setTitle('Dockerfile_and_FastMCP_Agent_Server_Pipeline.py');
      setSnippet('Docker container specifications, Model Context Protocol (MCP) tool server in Python, GitHub Actions CI/CD workflows, and DORA lead-time metric trackers.');
      setFullText(`from mcp.server.fastmcp import FastMCP
mcp = FastMCP("DevOps-Tool-Spine")

@mcp.tool()
async def trigger_pipeline(commit_hash: str) -> str:
    # Trigger GitHub Actions and calculate DORA metrics
    return f"Pipeline for {commit_hash} completed in 8 minutes."`);
    } else if (presetType === 'strategy_bsc') {
      setTitle('Enterprise_Target_Operating_Model_and_Balanced_Scorecard.pdf');
      setSnippet('Executive 5-year transformation roadmap, Balanced Scorecard (BSC) metrics across 4 perspectives, target operating model, and architectural governance charter.');
      setFullText(`ENTERPRISE STRATEGIC ROADMAP 2026-2030
Balanced Scorecard (BSC) Framework:
1. Financial Perspective: 24% YoY ARR growth
2. Customer Perspective: NPS score > 70
3. Internal Processes: ARB architectural review board governance
4. Organizational Design: Value-stream agile pod transformation`);
    }
  };

  const domainMeta = result ? OPERATIONAL_DOMAINS.find(d => d.domain === result.category) : null;
  const isPersonal = result?.category === 'Personal';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#fffcf7] border border-[#e2d8c8] rounded-2xl p-5 shadow-sm text-stone-900">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                DEEP INSPECTOR
              </span>
              <span className="text-xs text-stone-500">Gemini 3.8 Flash • Strict JSON Schema</span>
            </div>
            <h2 className="text-lg font-bold text-stone-900 tracking-tight">
              Single Document Autonomous Classifier & Test Bench
            </h2>
            <p className="text-xs text-stone-600">
              Inspect document title, snippet, or full content with strict 9-domain classification and Reality Isolation precedence.
            </p>
          </div>

          {/* Quick Scenario Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-stone-600 font-medium mr-1">Test Edge Cases:</span>
            <button
              onClick={() => loadPreset('personal_trap')}
              className="px-2.5 py-1 text-xs rounded-lg bg-rose-100 border border-rose-300 text-rose-800 hover:bg-rose-200 transition"
            >
              GPM311 + Docker (Personal Trap)
            </button>
            <button
              onClick={() => loadPreset('finance_cap')}
              className="px-2.5 py-1 text-xs rounded-lg bg-emerald-100 border border-emerald-300 text-emerald-800 hover:bg-emerald-200 transition"
            >
              Cap Table / Valuation
            </button>
            <button
              onClick={() => loadPreset('smartplanet_core')}
              className="px-2.5 py-1 text-xs rounded-lg bg-cyan-100 border border-cyan-300 text-cyan-800 hover:bg-cyan-200 transition"
            >
              SmartPlanet MQTT
            </button>
            <button
              onClick={() => loadPreset('ainie_twin')}
              className="px-2.5 py-1 text-xs rounded-lg bg-violet-100 border border-violet-300 text-violet-800 hover:bg-violet-200 transition"
            >
              Ainie HUD
            </button>
            <button
              onClick={() => loadPreset('masonic_roster')}
              className="px-2.5 py-1 text-xs rounded-lg bg-blue-100 border border-blue-300 text-blue-800 hover:bg-blue-200 transition"
            >
              Masonic Roster
            </button>
          </div>
        </div>
      </div>

      {/* Two-Column Layout: Input Form (Left) & Live Classification Output (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Input Form */}
        <div className="bg-[#fffcf7] border border-[#e2d8c8] rounded-2xl p-5 space-y-4 shadow-sm text-stone-900">
          <div className="flex items-center justify-between pb-3 border-b border-[#e8dfd0]">
            <div className="flex items-center gap-2 text-xs font-semibold text-stone-700 uppercase tracking-wider">
              <FileText className="w-4 h-4 text-indigo-600" />
              <span>Document Inspection Payload</span>
            </div>
            <button
              onClick={() => {
                setTitle('');
                setSnippet('');
                setFullText('');
                setResult(null);
              }}
              className="text-xs text-stone-500 hover:text-stone-900 flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> Clear
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
              Document Title / File Name
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. GPM311_Freelancer_Income_Tax_Declaration.pdf"
              className="w-full px-3 py-2 bg-[#fbf8f2] border border-[#d8cdb8] rounded-xl text-xs text-stone-900 focus:outline-none focus:border-indigo-600 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
              Summary / Snippet
            </label>
            <textarea
              rows={2}
              value={snippet}
              onChange={(e) => setSnippet(e.target.value)}
              placeholder="Brief overview or metadata snippet..."
              className="w-full px-3 py-2 bg-[#fbf8f2] border border-[#d8cdb8] rounded-xl text-xs text-stone-900 focus:outline-none focus:border-indigo-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
              Full Document Text / Content Stream
            </label>
            <textarea
              rows={7}
              value={fullText}
              onChange={(e) => setFullText(e.target.value)}
              placeholder="Full text extracted from PDF, DOCX, or Google Doc..."
              className="w-full px-3 py-2 bg-[#fbf8f2] border border-[#d8cdb8] rounded-xl text-xs font-mono text-stone-900 focus:outline-none focus:border-indigo-600"
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-100 border border-rose-300 text-rose-800 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            onClick={handleClassify}
            disabled={loading}
            className="w-full py-3 bg-[#0f2142] hover:bg-[#18315c] text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-md flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            {loading ? 'Evaluating with Gemini 3.8 Flash...' : 'Run Autonomous Classification'}
          </button>
        </div>

        {/* Right Column: Live Output */}
        <div className="space-y-4">
          {result ? (
            <div className="space-y-4 animate-fade-in">
              {/* Reality Isolation Alert Banner */}
              {result.reality_isolation_triggered && (
                <div className="bg-rose-50 border border-rose-300 rounded-2xl p-4 text-rose-900 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-rose-200 border border-rose-300 flex items-center justify-center text-rose-700 shrink-0">
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-rose-800 uppercase tracking-wide">
                        Reality Isolation Protocol Activated
                      </h4>
                      <p className="text-xs text-rose-700 mt-1 leading-relaxed">
                        Personal tax, identity, medical, travel, or utility records detected. Under the core directive,
                        <strong> "Personal" takes absolute precedence over all other categories</strong>, overriding any business or technical elements.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Classification Category Card */}
              <div
                className={`border rounded-2xl p-5 shadow-sm bg-white ${
                  domainMeta ? domainMeta.color.border : 'border-[#e2d8c8]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs uppercase font-bold tracking-wider text-stone-500">
                    Target Operational Domain
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#f4efe6] border border-[#d8cdb8] text-stone-600">
                      Engine: {result.engineUsed}
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded-full">
                      Confidence: {Math.round(result.confidence * 100)}%
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 mb-2">
                  {isPersonal ? (
                    <ShieldAlert className="w-6 h-6 text-rose-600" />
                  ) : (
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                  )}
                  <h3 className="text-2xl font-bold text-stone-900 tracking-tight">
                    {result.category}
                  </h3>
                </div>

                <p className="text-xs text-stone-600 leading-relaxed">
                  {domainMeta?.description}
                </p>
              </div>

              {/* Rationale Section */}
              <div className="bg-[#fffcf7] border border-[#e2d8c8] rounded-2xl p-5 shadow-sm text-stone-900">
                <h4 className="text-xs font-semibold text-stone-600 uppercase tracking-wider mb-2">
                  Classification Rationale (Max 2 Sentences)
                </h4>
                <div className="p-3 rounded-xl bg-[#f8f4ec] border border-[#e2d8c8] text-xs text-stone-800 italic leading-relaxed">
                  "{result.reason}"
                </div>
              </div>

              {/* Semantic Filter Tags */}
              <div className="bg-[#fffcf7] border border-[#e2d8c8] rounded-2xl p-5 shadow-sm text-stone-900">
                <h4 className="text-xs font-semibold text-stone-600 uppercase tracking-wider mb-2.5 flex items-center gap-2">
                  <Tag className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Semantic Tags for Secondary Filtering (2-4 Tags)</span>
                </h4>
                <div className="flex flex-wrap gap-2">
                  {result.tags?.map((tag: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-xl text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Validated JSON Schema Output */}
              <JsonViewer
                data={{
                  category: result.category,
                  reason: result.reason,
                  confidence: result.confidence,
                  tags: result.tags,
                  reality_isolation_triggered: Boolean(result.reality_isolation_triggered)
                }}
                title="Strict JSON Output (Conforms to Schema)"
              />
            </div>
          ) : (
            <div className="bg-[#fffcf7] border border-dashed border-[#d8cdb8] rounded-2xl p-12 text-center h-full flex flex-col items-center justify-center shadow-sm">
              <Sparkles className="w-12 h-12 text-stone-400 mb-3" />
              <h3 className="text-sm font-semibold text-stone-800">Ready for Autonomous Inspection</h3>
              <p className="text-xs text-stone-500 mt-1 max-w-xs">
                Select a preset test case or enter a document title/snippet on the left, then click "Run Autonomous Classification".
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
