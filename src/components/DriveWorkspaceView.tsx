import React, { useState } from 'react';
import {
  Folder,
  FolderOpen,
  FolderSync,
  Sparkles,
  Search,
  Filter,
  Plus,
  RefreshCw,
  FileText,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  Lock,
  Layers,
  Download,
  AlertTriangle,
  FolderCheck
} from 'lucide-react';
import { DocumentItem, OperationalDomain, OPERATIONAL_DOMAINS } from '../types/classifier';

interface DriveWorkspaceViewProps {
  documents: DocumentItem[];
  onSelectDocument: (doc: DocumentItem) => void;
  onClassifySingle: (doc: DocumentItem) => void;
  onClassifyBatch: () => void;
  onOpenNewDocModal: () => void;
  onResetCorpus: () => void;
  onDispatchDrive: () => void;
  isBatchClassifying: boolean;
  batchProgress: { current: number; total: number };
  dispatched: boolean;
}

export const DriveWorkspaceView: React.FC<DriveWorkspaceViewProps> = ({
  documents,
  onSelectDocument,
  onClassifySingle,
  onClassifyBatch,
  onOpenNewDocModal,
  onResetCorpus,
  onDispatchDrive,
  isBatchClassifying,
  batchProgress,
  dispatched
}) => {
  const [selectedFolder, setSelectedFolder] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'classified'>('all');

  // Count items per domain
  const getDomainCount = (domain: OperationalDomain) => {
    return documents.filter(d => d.classification?.category === domain).length;
  };

  const pendingCount = documents.filter(d => d.status === 'pending').length;

  // Filter documents
  const filteredDocuments = documents.filter(doc => {
    // Folder filter
    if (selectedFolder !== 'all') {
      if (selectedFolder === 'inbox') {
        if (dispatched && doc.status === 'classified') return false;
      } else {
        if (doc.classification?.category !== selectedFolder) return false;
      }
    }

    // Status filter
    if (statusFilter !== 'all' && doc.status !== statusFilter) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = doc.title.toLowerCase().includes(q);
      const matchSnippet = doc.snippet?.toLowerCase().includes(q);
      const matchCategory = doc.classification?.category.toLowerCase().includes(q);
      const matchTags = doc.classification?.tags.some(t => t.toLowerCase().includes(q));
      if (!matchTitle && !matchSnippet && !matchCategory && !matchTags) return false;
    }

    return true;
  });

  // Export Manifest
  const handleExportManifest = () => {
    const exportData = {
      workspace: 'Google Drive Enterprise Organization Manifest',
      generatedAt: new Date().toISOString(),
      realityIsolationPolicy: 'Absolute Precedence for Personal Domain',
      totalDocuments: documents.length,
      classifiedDocuments: documents.filter(d => d.status === 'classified').length,
      manifest: documents.map(d => ({
        id: d.id,
        title: d.title,
        sourcePath: d.drivePath,
        targetFolder: d.targetFolder || `/Drive/${d.classification?.category || 'Unclassified'}`,
        classification: d.classification || null
      }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `google-drive-organization-manifest-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Action Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/60 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                Reality Isolation Active
              </span>
              <span className="text-xs text-slate-400">• Strict 9-Domain Single-Category Mapping</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Google Drive Enterprise Autonomous Workspace
            </h2>
            <p className="text-xs text-slate-400 max-w-2xl mt-0.5">
              Inspects titles, snippets, and full-text documents. Dispatches documents into domain folders while strictly guaranteeing Personal document isolation from business systems.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={onClassifyBatch}
              disabled={isBatchClassifying || pendingCount === 0}
              className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Sparkles className="w-4 h-4" />
              {isBatchClassifying
                ? `Classifying (${batchProgress.current}/${batchProgress.total})...`
                : `Autonomous Classify All (${pendingCount} Pending)`}
            </button>

            <button
              onClick={onDispatchDrive}
              disabled={documents.filter(d => d.status === 'classified').length === 0}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold border flex items-center gap-2 transition ${
                dispatched
                  ? 'bg-emerald-950/60 border-emerald-700/60 text-emerald-300'
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-white'
              }`}
            >
              {dispatched ? <FolderCheck className="w-4 h-4 text-emerald-400" /> : <FolderSync className="w-4 h-4 text-amber-400" />}
              {dispatched ? 'Drive Folders Synced' : 'Organize into Drive Folders'}
            </button>

            <button
              onClick={onOpenNewDocModal}
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 transition"
            >
              <Plus className="w-4 h-4" />
              Ingest Document
            </button>

            <button
              onClick={onResetCorpus}
              title="Reset sample enterprise documents"
              className="p-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white rounded-xl text-xs transition"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress Bar during Batch Analysis */}
        {isBatchClassifying && (
          <div className="mt-4 pt-3 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5 font-mono">
              <span className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
                Gemini 3.8 Flash evaluating document corpus...
              </span>
              <span>{Math.round((batchProgress.current / Math.max(1, batchProgress.total)) * 100)}%</span>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
              <div
                className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${(batchProgress.current / Math.max(1, batchProgress.total)) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Main Workspace Grid: Drive Folders (Left) & Document Queue (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Google Drive Folder Tree */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 uppercase tracking-wider">
                <Folder className="w-4 h-4 text-amber-400" />
                <span>Drive Domain Hierarchy</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">9 Folders</span>
            </div>

            <div className="space-y-1">
              {/* All Documents */}
              <button
                onClick={() => setSelectedFolder('all')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition ${
                  selectedFolder === 'all'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5" />
                  <span>All Ingested Files</span>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-black/30">{documents.length}</span>
              </button>

              {/* Unorganized Inbox */}
              <button
                onClick={() => setSelectedFolder('inbox')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition ${
                  selectedFolder === 'inbox'
                    ? 'bg-amber-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FolderSync className="w-3.5 h-3.5 text-amber-400" />
                  <span>Incoming Inbox</span>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-black/30 font-mono">
                  {dispatched ? 0 : pendingCount}
                </span>
              </button>

              <div className="pt-2 pb-1 px-2 text-[10px] uppercase font-bold tracking-wider text-slate-500">
                Operational Domains
              </div>

              {/* 9 Operational Domains */}
              {OPERATIONAL_DOMAINS.map(domainMeta => {
                const count = getDomainCount(domainMeta.domain);
                const isSelected = selectedFolder === domainMeta.domain;
                const isPersonal = domainMeta.domain === 'Personal';

                return (
                  <button
                    key={domainMeta.domain}
                    onClick={() => setSelectedFolder(domainMeta.domain)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition ${
                      isSelected
                        ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                        : 'text-slate-300 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {isPersonal ? (
                        <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      ) : (
                        <Folder className={`w-3.5 h-3.5 ${domainMeta.color.text} shrink-0`} />
                      )}
                      <span className="truncate">{domainMeta.displayName}</span>
                    </div>
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full font-mono ${
                        count > 0 ? domainMeta.color.badge : 'bg-slate-950 text-slate-600'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Export Manifest Button */}
          <button
            onClick={handleExportManifest}
            className="w-full py-2.5 px-3 bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 rounded-xl text-xs font-medium text-slate-300 hover:text-white flex items-center justify-center gap-2 transition"
          >
            <Download className="w-4 h-4 text-indigo-400" />
            <span>Export Organization Manifest</span>
          </button>
        </div>

        {/* Right Column: Ingested Documents List */}
        <div className="lg:col-span-3 space-y-4">
          {/* Filter & Search Bar */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search title, tags, or content..."
                className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1 rounded-lg ${statusFilter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  All ({documents.length})
                </button>
                <button
                  onClick={() => setStatusFilter('pending')}
                  className={`px-3 py-1 rounded-lg ${statusFilter === 'pending' ? 'bg-amber-950/80 text-amber-300' : 'text-slate-400 hover:text-white'}`}
                >
                  Pending ({pendingCount})
                </button>
                <button
                  onClick={() => setStatusFilter('classified')}
                  className={`px-3 py-1 rounded-lg ${statusFilter === 'classified' ? 'bg-emerald-950/80 text-emerald-300' : 'text-slate-400 hover:text-white'}`}
                >
                  Classified ({documents.length - pendingCount})
                </button>
              </div>
            </div>
          </div>

          {/* Document Table / Cards */}
          <div className="space-y-3">
            {filteredDocuments.length === 0 ? (
              <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl p-12 text-center">
                <FileText className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-slate-300">No documents found</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Try adjusting your search criteria or ingest new documents into the Google Drive inbox.
                </p>
                <button
                  onClick={onOpenNewDocModal}
                  className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-medium inline-flex items-center gap-1.5 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Ingest Document
                </button>
              </div>
            ) : (
              filteredDocuments.map(doc => {
                const domainMeta = OPERATIONAL_DOMAINS.find(d => d.domain === doc.classification?.category);
                const isPersonal = doc.classification?.category === 'Personal';
                const isRealityShield = doc.classification?.reality_isolation_triggered;

                return (
                  <div
                    key={doc.id}
                    onClick={() => onSelectDocument(doc)}
                    className="group bg-slate-900/60 hover:bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      {/* Left Document Identity */}
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            isPersonal
                              ? 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
                              : domainMeta
                              ? `${domainMeta.color.bg} border ${domainMeta.color.border} ${domainMeta.color.text}`
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {isPersonal ? (
                            <ShieldAlert className="w-5 h-5" />
                          ) : (
                            <FileText className="w-5 h-5" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h4 className="text-sm font-semibold text-white truncate group-hover:text-indigo-400 transition">
                              {doc.title}
                            </h4>

                            {/* Reality Isolation Badge */}
                            {isRealityShield && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1">
                                <ShieldAlert className="w-3 h-3 text-rose-400" />
                                Reality Isolation
                              </span>
                            )}

                            {/* Domain Category Badge */}
                            {doc.classification && (
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                                  domainMeta?.color.badge || 'bg-slate-800 text-slate-300'
                                }`}
                              >
                                {doc.classification.category}
                              </span>
                            )}

                            {/* Status */}
                            {doc.status === 'pending' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/30">
                                Pending Classification
                              </span>
                            )}
                          </div>

                          {/* Snippet preview */}
                          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                            {doc.snippet || doc.fullText?.substring(0, 160) || 'No snippet available.'}
                          </p>

                          {/* Tags & Path */}
                          <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px] text-slate-500">
                            <span className="font-mono text-slate-400">
                              {dispatched && doc.targetFolder ? doc.targetFolder : doc.drivePath}
                            </span>
                            <span>•</span>
                            <span>{doc.fileSize || 'N/A'}</span>

                            {doc.classification?.tags && (
                              <>
                                <span>•</span>
                                <div className="flex flex-wrap gap-1">
                                  {doc.classification.tags.slice(0, 3).map((tag, i) => (
                                    <span key={i} className="text-indigo-400 font-mono">
                                      #{tag}
                                    </span>
                                  ))}
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right Actions & Confidence Score */}
                      <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                        {doc.classification ? (
                          <div className="text-right">
                            <div className="text-xs font-mono font-bold text-emerald-400 flex items-center justify-end gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              {Math.round((doc.classification.confidence || 0) * 100)}%
                            </div>
                            <div className="text-[10px] text-slate-500">Confidence</div>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onClassifySingle(doc);
                            }}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            Classify
                          </button>
                        )}

                        <div className="w-7 h-7 rounded-lg bg-slate-800 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center text-slate-400 transition">
                          <ArrowRight className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
