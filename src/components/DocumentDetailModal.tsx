import React, { useState } from 'react';
import { X, ShieldAlert, Sparkles, Folder, Tag, FileText, CheckCircle2 } from 'lucide-react';
import { DocumentItem, OPERATIONAL_DOMAINS } from '../types/classifier';
import { JsonViewer } from './JsonViewer';

interface DocumentDetailModalProps {
  document: DocumentItem | null;
  onClose: () => void;
  onClassifySingle: (doc: DocumentItem) => void;
  isClassifying: boolean;
}

export const DocumentDetailModal: React.FC<DocumentDetailModalProps> = ({
  document,
  onClose,
  onClassifySingle,
  isClassifying
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'json' | 'fulltext'>('overview');

  if (!document) return null;

  const domainMeta = OPERATIONAL_DOMAINS.find(d => d.domain === document.classification?.category);
  const isPersonal = document.classification?.category === 'Personal';
  const isRealityTriggered = document.classification?.reality_isolation_triggered;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white truncate max-w-md">
                {document.title}
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                {document.drivePath || `/My Drive/Inbox/${document.title}`} • {document.fileSize || 'N/A'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Reality Isolation Alert Banner if applicable */}
        {isRealityTriggered && (
          <div className="bg-rose-950/70 border-b border-rose-800/80 px-4 py-2.5 flex items-center gap-2.5 text-rose-200 text-xs">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            <div className="flex-1">
              <span className="font-bold text-rose-300">REALITY ISOLATION ENFORCED: </span>
              Personal confidential records detected. All secondary enterprise or technical classifications overridden with absolute precedence.
            </div>
          </div>
        )}

        {/* Sub Navigation */}
        <div className="flex border-b border-slate-800 px-4 bg-slate-950/30 gap-2">
          <button
            onClick={() => setActiveSubTab('overview')}
            className={`py-2 px-3 text-xs font-medium border-b-2 transition ${
              activeSubTab === 'overview'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Classification Overview
          </button>
          <button
            onClick={() => setActiveSubTab('fulltext')}
            className={`py-2 px-3 text-xs font-medium border-b-2 transition ${
              activeSubTab === 'fulltext'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Document Content / Snippet
          </button>
          <button
            onClick={() => setActiveSubTab('json')}
            className={`py-2 px-3 text-xs font-medium border-b-2 transition ${
              activeSubTab === 'json'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Raw JSON Output
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {activeSubTab === 'overview' && (
            <div className="space-y-4">
              {document.classification ? (
                <>
                  {/* Category Card */}
                  <div className={`p-4 rounded-xl border ${domainMeta ? domainMeta.color.border : 'border-slate-800'} ${domainMeta ? domainMeta.color.bg : 'bg-slate-800/20'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs uppercase font-bold tracking-wider text-slate-400">
                        Operational Domain
                      </span>
                      <span className="text-xs font-mono font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-full">
                        Confidence: {Math.round((document.classification.confidence || 0) * 100)}%
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xl font-bold text-white mb-1">
                      {isPersonal && <ShieldAlert className="w-5 h-5 text-rose-400" />}
                      {document.classification.category}
                    </div>
                    <p className="text-xs text-slate-300">
                      {domainMeta?.description}
                    </p>
                  </div>

                  {/* Rationale Section */}
                  <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                      Autonomous Classification Rationale (Max 2 sentences)
                    </h4>
                    <p className="text-sm text-slate-200 leading-relaxed italic bg-slate-900/60 p-3 rounded-lg border border-slate-800/80">
                      "{document.classification.reason}"
                    </p>
                  </div>

                  {/* Semantic Tags */}
                  <div>
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5" /> Semantic Secondary Filter Tags (2-4 Tags)
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {document.classification.tags?.map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 text-xs rounded-lg font-medium bg-indigo-950/50 text-indigo-300 border border-indigo-800/50"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Google Drive Target Folder */}
                  <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Folder className="w-4 h-4 text-amber-400" />
                      <span className="text-xs text-slate-400">Target Google Drive Folder:</span>
                      <span className="text-xs font-mono text-amber-300 font-semibold">
                        {document.targetFolder || `/Drive/${document.classification.category.replace(/[/\\?%*:|"<>]/g, '-')}`}
                      </span>
                    </div>
                    <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Ready to dispatch
                    </span>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 bg-slate-950/40 rounded-xl border border-dashed border-slate-800">
                  <p className="text-sm text-slate-400 mb-3">This document has not been classified yet.</p>
                  <button
                    onClick={() => onClassifySingle(document)}
                    disabled={isClassifying}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium inline-flex items-center gap-2 transition"
                  >
                    <Sparkles className="w-4 h-4" />
                    {isClassifying ? 'Classifying with Gemini...' : 'Run Autonomous Classifier'}
                  </button>
                </div>
              )}
            </div>
          )}

          {activeSubTab === 'fulltext' && (
            <div className="space-y-4">
              {document.snippet && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Document Snippet
                  </h4>
                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs text-slate-300">
                    {document.snippet}
                  </div>
                </div>
              )}
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Full Document Content / Ingestion Stream
                </h4>
                <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono text-slate-300 whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto">
                  {document.fullText || document.snippet || 'No text extracted.'}
                </div>
              </div>
            </div>
          )}

          {activeSubTab === 'json' && (
            <div>
              {document.classification ? (
                <JsonViewer
                  data={{
                    category: document.classification.category,
                    reason: document.classification.reason,
                    confidence: document.classification.confidence,
                    tags: document.classification.tags,
                    reality_isolation_triggered: Boolean(document.classification.reality_isolation_triggered)
                  }}
                  title={`Classification Response [${document.id}]`}
                />
              ) : (
                <div className="text-center py-8 text-xs text-slate-400">
                  No classification JSON available yet. Run classifier first.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Source: <span className="text-slate-400 uppercase">{document.source}</span>
          </div>
          <div className="flex gap-2">
            {!document.classification && (
              <button
                onClick={() => onClassifySingle(document)}
                disabled={isClassifying}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {isClassifying ? 'Analyzing...' : 'Classify with Gemini'}
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
