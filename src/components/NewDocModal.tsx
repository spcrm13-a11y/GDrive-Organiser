import React, { useState } from 'react';
import { X, Plus, Upload, FileText, Sparkles } from 'lucide-react';
import { DocumentItem } from '../types/classifier';

interface NewDocModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddDocument: (doc: DocumentItem, runImmediateClassification?: boolean) => void;
}

export const NewDocModal: React.FC<NewDocModalProps> = ({ isOpen, onClose, onAddDocument }) => {
  const [title, setTitle] = useState('');
  const [snippet, setSnippet] = useState('');
  const [fullText, setFullText] = useState('');
  const [runImmediate, setRunImmediate] = useState(true);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() && !snippet.trim() && !fullText.trim()) return;

    const newDoc: DocumentItem = {
      id: `doc-custom-${Date.now()}`,
      title: title.trim() || 'Untitled_Document.txt',
      snippet: snippet.trim() || fullText.trim().substring(0, 180),
      fullText: fullText.trim(),
      source: 'manual_input',
      fileType: title.includes('.') ? title.split('.').pop() : 'txt',
      drivePath: `/My Drive/Inbox/${title.trim() || 'Untitled_Document.txt'}`,
      modifiedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      fileSize: `${Math.max(1, Math.round((fullText.length + snippet.length) / 1024))} KB`,
      status: 'pending'
    };

    onAddDocument(newDoc, runImmediate);
    setTitle('');
    setSnippet('');
    setFullText('');
    onClose();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setTitle(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setFullText(content || '');
      setSnippet(content ? content.substring(0, 200).replace(/\s+/g, ' ') : '');
    };
    reader.readAsText(file);
  };

  const handlePresetSelect = (presetKey: string) => {
    if (presetKey === 'gpm311_trap') {
      setTitle('GPM311_Freelancer_Income_Declaration_and_Docker_Repo.pdf');
      setSnippet('Form GPM311 freelance income declaration with attached VAT invoices and home utility bills, along with automated Python Docker container deployment scripts.');
      setFullText(`STATE TAX INSPECTORATE DECLARATION FORM GPM311
Taxpayer ID: 38804190234
Declaration: Freelance Annual VAT & Personal Income Statement
Attached receipts: Fiber home internet, home office electricity bill, personal medical insurance.
[NOTE]: Also contains repository git commit log and docker build instructions for container automation.`);
    } else if (presetKey === 'smartplanet_spine') {
      setTitle('SmartPlanet_NORAD_DEFCON_Audit_Engine_Spine.md');
      setSnippet('SmartPlanet AI governance system, MQTT communication spine, enforcer mechanics, and WOPR server cluster DEFCON status matrix.');
      setFullText(`# SmartPlanet AI Infrastructure
Cluster: WOPR Central Hub
Status: DEFCON 2 Escalation Protocols
Components:
- High-throughput MQTT messaging spine
- Autonomous enforcer mechanics monitoring worker threads
- The Farm and The Factory synthesis nodes`);
    } else if (presetKey === 'series_a') {
      setTitle('Cap_Table_and_Series_A_Term_Sheet.xlsx');
      setSnippet('Pre-money valuation $15M, term sheet, cap table breakdown, SAFE conversion notes, and 3-year P&L EBITDA projections.');
      setFullText(`SERIES A VALUATION MODEL & CAP TABLE
Company: NextGen Systems
Investment: $3,500,000 on $15,000,000 pre-money valuation.
Common Stock & Option Pool: 15% ESOP.
Revenue share and royalty structure included in Schedule B.`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-semibold text-white">Ingest Document to Google Drive Queue</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Presets */}
        <div className="px-6 pt-4 pb-2 bg-slate-950/40 border-b border-slate-800/80 flex items-center justify-between gap-2 overflow-x-auto">
          <span className="text-xs text-slate-400 shrink-0 font-medium">Quick Presets:</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handlePresetSelect('gpm311_trap')}
              className="text-xs px-2.5 py-1 rounded bg-rose-950/60 border border-rose-800/60 text-rose-300 hover:bg-rose-900/60 transition"
            >
              GPM311 + Docker (Personal Trap)
            </button>
            <button
              type="button"
              onClick={() => handlePresetSelect('smartplanet_spine')}
              className="text-xs px-2.5 py-1 rounded bg-cyan-950/60 border border-cyan-800/60 text-cyan-300 hover:bg-cyan-900/60 transition"
            >
              SmartPlanet MQTT Spine
            </button>
            <button
              type="button"
              onClick={() => handlePresetSelect('series_a')}
              className="text-xs px-2.5 py-1 rounded bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 hover:bg-emerald-900/60 transition"
            >
              Cap Table Valuation
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
              Document Title / File Name *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. GPM311_Personal_Tax_Filing_2025.pdf or Series_A_Valuation.xlsx"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
              Summary / Snippet
            </label>
            <input
              type="text"
              value={snippet}
              onChange={(e) => setSnippet(e.target.value)}
              placeholder="Brief summary or metadata snippet..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Full Document Text / Content
              </label>
              <label className="cursor-pointer text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Local File (.txt, .md, .csv)</span>
                <input
                  type="file"
                  accept=".txt,.md,.json,.csv,.py,.js"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
            <textarea
              rows={5}
              value={fullText}
              onChange={(e) => setFullText(e.target.value)}
              placeholder="Paste document full text, legal filings, architecture specs, cap table figures..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
              <input
                type="checkbox"
                checked={runImmediate}
                onChange={(e) => setRunImmediate(e.target.checked)}
                className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-950"
              />
              <span>Trigger autonomous classification immediately</span>
            </label>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
              >
                {runImmediate ? <Sparkles className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {runImmediate ? 'Add & Classify Now' : 'Add to Queue'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
