import React, { useState, useEffect, useRef } from 'react';
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
  FolderCheck,
  X,
  SlidersHorizontal,
  FileSearch
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

// Helper to highlight matching text in title or snippet
const HighlightMatch: React.FC<{ text?: string; query: string }> = ({ text, query }) => {
  if (!text) return null;
  if (!query.trim()) return <>{text}</>;

  const parts = text.split(new RegExp(`(${query.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi'));
  return (
    <>
      {parts.map((part, index) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark
            key={index}
            className="bg-amber-400/30 text-amber-200 px-1 py-0.5 rounded font-semibold border border-amber-400/40"
          >
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
};

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
  const [searchScope, setSearchScope] = useState<'all' | 'title' | 'snippet'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'classified'>('all');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut listener ('/' to focus, 'Escape' to clear)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'Escape' && document.activeElement === searchInputRef.current) {
        setSearchQuery('');
        searchInputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Count items per domain
  const getDomainCount = (domain: OperationalDomain) => {
    return documents.filter(d => d.classification?.category === domain).length;
  };

  const pendingCount = documents.filter(d => d.status === 'pending').length;

  // Filter documents by folder, status, and title/snippet text search
  const filteredDocuments = documents.filter(doc => {
    // 1. Folder filter
    if (selectedFolder !== 'all') {
      if (selectedFolder === 'inbox') {
        if (dispatched && doc.status === 'classified') return false;
      } else {
        if (doc.classification?.category !== selectedFolder) return false;
      }
    }

    // 2. Status filter
    if (statusFilter !== 'all' && doc.status !== statusFilter) return false;

    // 3. Search query filter (title or snippet text)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = doc.title.toLowerCase().includes(q);
      const matchSnippet = doc.snippet ? doc.snippet.toLowerCase().includes(q) : false;

      if (searchScope === 'title') {
        if (!matchTitle) return false;
      } else if (searchScope === 'snippet') {
        if (!matchSnippet) return false;
      } else {
        // 'all': matches title or snippet (or tags)
        const matchTags = doc.classification?.tags.some(t => t.toLowerCase().includes(q));
        if (!matchTitle && !matchSnippet && !matchTags) return false;
      }
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

  const popularSearches = [
    'GPM311',
    'Tax Return',
    'Cap Table',
    'Valuation',
    'MQTT Spine',
    'Ainie HUD',
    'Assisted Living',
    'Grand Lodge',
    'Dockerfile',
    'Balanced Scorecard'
  ];

  return (
    <div className="space-y-6">
      {/* Action Banner */}
      <div className="bg-gradient-to-r from-[#0d1d3a] via-[#112448] to-[#18315c] border border-[#213f73] rounded-2xl p-5 shadow-lg text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                Reality Isolation Active
              </span>
              <span className="text-xs text-blue-200/80">• Strict 9-Domain Single-Category Mapping</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Google Drive Enterprise Autonomous Workspace
            </h2>
            <p className="text-xs text-blue-200/80 max-w-2xl mt-0.5">
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
                  : 'bg-[#182c50] hover:bg-[#1f3763] border-[#29487d] text-white'
              }`}
            >
              {dispatched ? <FolderCheck className="w-4 h-4 text-emerald-400" /> : <FolderSync className="w-4 h-4 text-amber-300" />}
              {dispatched ? 'Drive Folders Synced' : 'Organize into Drive Folders'}
            </button>

            <button
              onClick={onOpenNewDocModal}
              className="px-3.5 py-2.5 bg-[#182c50] hover:bg-[#1f3763] border border-[#29487d] text-white rounded-xl text-xs font-medium flex items-center gap-1.5 transition"
            >
              <Plus className="w-4 h-4" />
              Ingest Document
            </button>

            <button
              onClick={onResetCorpus}
              title="Reset sample enterprise documents"
              className="p-2.5 bg-[#182c50] hover:bg-[#1f3763] border border-[#29487d] text-blue-200 hover:text-white rounded-xl text-xs transition"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress Bar during Batch Analysis */}
        {isBatchClassifying && (
          <div className="mt-4 pt-3 border-t border-blue-900/60">
            <div className="flex items-center justify-between text-xs text-blue-200 mb-1.5 font-mono">
              <span className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
                Gemini 3.8 Flash evaluating document corpus...
              </span>
              <span>{Math.round((batchProgress.current / Math.max(1, batchProgress.total)) * 100)}%</span>
            </div>
            <div className="w-full bg-[#0a162b] rounded-full h-2 overflow-hidden border border-blue-900">
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
          <div className="bg-[#fffcf7] border border-[#e2d8c8] shadow-sm rounded-2xl p-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#e8dfd0] mb-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-stone-700 uppercase tracking-wider">
                <Folder className="w-4 h-4 text-amber-600" />
                <span>Drive Domain Hierarchy</span>
              </div>
              <span className="text-[10px] text-stone-500 font-mono">9 Folders</span>
            </div>

            <div className="space-y-1">
              {/* All Documents */}
              <button
                onClick={() => setSelectedFolder('all')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition ${
                  selectedFolder === 'all'
                    ? 'bg-[#0f2142] text-white shadow-sm'
                    : 'text-stone-700 hover:bg-[#ede5d6]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5" />
                  <span>All Ingested Files</span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${selectedFolder === 'all' ? 'bg-black/30' : 'bg-[#ede5d6] text-stone-700'}`}>
                  {documents.length}
                </span>
              </button>

              {/* Unorganized Inbox */}
              <button
                onClick={() => setSelectedFolder('inbox')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition ${
                  selectedFolder === 'inbox'
                    ? 'bg-amber-700 text-white shadow-sm'
                    : 'text-stone-700 hover:bg-[#ede5d6]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FolderSync className="w-3.5 h-3.5 text-amber-600" />
                  <span>Incoming Inbox</span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${selectedFolder === 'inbox' ? 'bg-black/30' : 'bg-[#ede5d6] text-stone-700'}`}>
                  {dispatched ? 0 : pendingCount}
                </span>
              </button>

              <div className="pt-2 pb-1 px-2 text-[10px] uppercase font-bold tracking-wider text-stone-500">
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
                        ? 'bg-[#0f2142] text-white border border-[#1b3463] shadow-sm'
                        : 'text-stone-700 hover:bg-[#ede5d6]'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {isPersonal ? (
                        <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      ) : (
                        <Folder className={`w-3.5 h-3.5 ${domainMeta.color.text} shrink-0`} />
                      )}
                      <span className="truncate">{domainMeta.displayName}</span>
                    </div>
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full font-mono ${
                        count > 0 ? (isSelected ? 'bg-white/20 text-white' : domainMeta.color.badge) : 'bg-[#ede5d6] text-stone-500'
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
            className="w-full py-2.5 px-3 bg-[#fffcf7] hover:bg-white border border-[#e2d8c8] hover:border-stone-400 rounded-xl text-xs font-medium text-stone-700 hover:text-stone-900 flex items-center justify-center gap-2 transition shadow-sm"
          >
            <Download className="w-4 h-4 text-indigo-600" />
            <span>Export Organization Manifest</span>
          </button>
        </div>

        {/* Right Column: Ingested Documents List with Search Bar */}
        <div className="lg:col-span-3 space-y-4">
          {/* SEARCH BAR COMPONENT */}
          <div className="bg-[#fffcf7] border border-[#e2d8c8] rounded-2xl p-4 shadow-sm space-y-3">
            {/* Top row: Search input + Scope Selector + Status Filter */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Main Search Input */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-indigo-600 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter documents by title or snippet text (e.g. 'GPM311', 'cap table', 'MQTT')..."
                  className="w-full pl-10 pr-20 py-2.5 bg-[#fbf8f2] border border-[#d8cdb8] hover:border-stone-400 focus:border-indigo-600 rounded-xl text-xs text-stone-900 placeholder-stone-400 focus:outline-none transition shadow-inner"
                />

                {/* Right side inside input: clear button & shortcut hint */}
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="p-1 rounded-md text-stone-400 hover:text-stone-800 hover:bg-[#ede5d6] transition"
                      title="Clear search"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-stone-500 bg-[#ede5d6] border border-[#dfd5c4] rounded">
                    /
                  </kbd>
                </div>
              </div>

              {/* Scope & Status Badges */}
              <div className="flex items-center gap-2 shrink-0">
                {/* Search Scope Filter */}
                <div className="flex items-center gap-1 bg-[#ede5d6] p-1 rounded-xl border border-[#dfd5c4] text-xs">
                  <button
                    onClick={() => setSearchScope('all')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition ${
                      searchScope === 'all'
                        ? 'bg-[#0f2142] text-white shadow-sm'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    Title & Snippet
                  </button>
                  <button
                    onClick={() => setSearchScope('title')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition ${
                      searchScope === 'title'
                        ? 'bg-[#0f2142] text-white shadow-sm'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    Title Only
                  </button>
                  <button
                    onClick={() => setSearchScope('snippet')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition ${
                      searchScope === 'snippet'
                        ? 'bg-[#0f2142] text-white shadow-sm'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    Snippet Only
                  </button>
                </div>

                {/* Status Filter */}
                <div className="hidden sm:flex items-center gap-1 bg-[#ede5d6] p-1 rounded-xl border border-[#dfd5c4] text-xs">
                  <button
                    onClick={() => setStatusFilter('all')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] ${
                      statusFilter === 'all' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    All ({documents.length})
                  </button>
                  <button
                    onClick={() => setStatusFilter('pending')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] ${
                      statusFilter === 'pending'
                        ? 'bg-amber-100 text-amber-900 shadow-sm'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    Pending ({pendingCount})
                  </button>
                  <button
                    onClick={() => setStatusFilter('classified')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] ${
                      statusFilter === 'classified'
                        ? 'bg-emerald-100 text-emerald-900 shadow-sm'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    Classified ({documents.length - pendingCount})
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Search Suggestions & Active Match Status */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#e8dfd0] text-xs">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-stone-500 font-medium">Quick Filters:</span>
                {popularSearches.map((term) => (
                  <button
                    key={term}
                    onClick={() => setSearchQuery(term)}
                    className={`px-2 py-0.5 rounded-md text-[11px] transition ${
                      searchQuery.toLowerCase() === term.toLowerCase()
                        ? 'bg-[#0f2142] text-white font-semibold'
                        : 'bg-[#ede5d6] hover:bg-[#e4dcce] text-stone-700 border border-[#dfd5c4]'
                    }`}
                  >
                    {term}
                  </button>
                ))}
              </div>

              {/* Active Results Counter */}
              {searchQuery && (
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="text-stone-600">
                    Found <strong className="text-emerald-700 font-bold">{filteredDocuments.length}</strong> of{' '}
                    {documents.length}
                  </span>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-indigo-600 hover:text-indigo-800 underline font-medium"
                  >
                    Reset
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Document Table / Cards with Matched Highlighting */}
          <div className="space-y-3">
            {filteredDocuments.length === 0 ? (
              <div className="bg-[#fffcf7] border border-dashed border-[#d8cdb8] rounded-2xl p-12 text-center shadow-sm">
                <FileSearch className="w-10 h-10 text-stone-400 mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-stone-800">No matching documents found</h3>
                <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                  {searchQuery
                    ? `No document titles or snippets match "${searchQuery}". Try a different term or clear the search filter.`
                    : 'Try adjusting your folder or status filter.'}
                </p>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="mt-4 px-4 py-2 bg-[#0f2142] hover:bg-[#18315c] text-white rounded-xl text-xs font-medium inline-flex items-center gap-1.5 transition shadow-sm"
                  >
                    Clear Search Filter
                  </button>
                )}
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
                    className="group bg-[#fffcf7] hover:bg-white border border-[#e2d8c8] hover:border-[#b8aa93] rounded-2xl p-4 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      {/* Left Document Identity */}
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            isPersonal
                              ? 'bg-rose-50 border border-rose-200 text-rose-600'
                              : domainMeta
                              ? `${domainMeta.color.bg} border ${domainMeta.color.border} ${domainMeta.color.text}`
                              : 'bg-[#ede5d6] text-stone-600'
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
                            <h4 className="text-sm font-semibold text-stone-900 truncate group-hover:text-indigo-600 transition">
                              <HighlightMatch text={doc.title} query={searchQuery} />
                            </h4>

                            {/* Reality Isolation Badge */}
                            {isRealityShield && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
                                <ShieldAlert className="w-3 h-3 text-rose-600" />
                                Reality Isolation
                              </span>
                            )}

                            {/* Domain Category Badge */}
                            {doc.classification && (
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                                  domainMeta?.color.badge || 'bg-stone-100 text-stone-700'
                                }`}
                              >
                                {doc.classification.category}
                              </span>
                            )}

                            {/* Status */}
                            {doc.status === 'pending' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-800 border border-amber-300">
                                Pending Classification
                              </span>
                            )}
                          </div>

                          {/* Snippet preview with match highlighting */}
                          <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                            <HighlightMatch
                              text={doc.snippet || doc.fullText?.substring(0, 180) || 'No snippet available.'}
                              query={searchQuery}
                            />
                          </p>

                          {/* Tags & Path */}
                          <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px] text-stone-500">
                            <span className="font-mono text-stone-600 font-medium">
                              {dispatched && doc.targetFolder ? doc.targetFolder : doc.drivePath}
                            </span>
                            <span>•</span>
                            <span>{doc.fileSize || 'N/A'}</span>

                            {doc.classification?.tags && (
                              <>
                                <span>•</span>
                                <div className="flex flex-wrap gap-1">
                                  {doc.classification.tags.slice(0, 3).map((tag, i) => (
                                    <span key={i} className="text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-1.5 py-0.2 rounded font-mono">
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
                            <div className="text-xs font-mono font-bold text-emerald-700 flex items-center justify-end gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              {Math.round((doc.classification.confidence || 0) * 100)}%
                            </div>
                            <div className="text-[10px] text-stone-500">Confidence</div>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onClassifySingle(doc);
                            }}
                            className="px-3 py-1.5 bg-[#0f2142] hover:bg-[#18315c] text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition shadow-sm"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            Classify
                          </button>
                        )}

                        <div className="w-7 h-7 rounded-lg bg-[#ede5d6] group-hover:bg-[#0f2142] group-hover:text-white flex items-center justify-center text-stone-600 transition">
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
