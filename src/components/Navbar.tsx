import React from 'react';
import { ShieldAlert, Cpu, Sparkles, FolderSync, ShieldCheck } from 'lucide-react';

interface NavbarProps {
  activeTab: 'workspace' | 'inspector' | 'audit' | 'taxonomy';
  setActiveTab: (tab: 'workspace' | 'inspector' | 'audit' | 'taxonomy') => void;
  realityIsolationCount: number;
  totalDocs: number;
  classifiedCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  realityIsolationCount,
  totalDocs,
  classifiedCount
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-0.5 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <FolderSync className="w-5 h-5 text-indigo-400 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-base tracking-tight">DomainOrganizer AI</span>
                <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full">
                  Enterprise
                </span>
              </div>
              <p className="text-xs text-slate-400">Autonomous Classifier & Google Drive Organizer</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('workspace')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'workspace'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/40'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              Drive Workspace
            </button>
            <button
              onClick={() => setActiveTab('inspector')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'inspector'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/40'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              Document Inspector
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                activeTab === 'audit'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/40'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              Reality Isolation Lab
              {realityIsolationCount > 0 && (
                <span className="px-1.5 py-0.2 text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded-full">
                  {realityIsolationCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('taxonomy')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'taxonomy'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/40'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              Taxonomy & Schema
            </button>
          </nav>

          {/* Right Status Badge */}
          <div className="flex items-center gap-2.5">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-lg bg-rose-950/40 border border-rose-900/60 text-rose-300 text-xs font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
              <span>Priority: Reality Isolation</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/40 border border-emerald-900/60 text-emerald-300 text-xs font-medium">
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Gemini 3.8 Flash</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>
          </div>
        </div>

        {/* Mobile Nav bar */}
        <div className="flex md:hidden py-2 border-t border-slate-800/60 gap-1 overflow-x-auto text-xs">
          <button
            onClick={() => setActiveTab('workspace')}
            className={`px-3 py-1 rounded-md whitespace-nowrap ${activeTab === 'workspace' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
          >
            Drive Workspace
          </button>
          <button
            onClick={() => setActiveTab('inspector')}
            className={`px-3 py-1 rounded-md whitespace-nowrap ${activeTab === 'inspector' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
          >
            Inspector
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1 rounded-md whitespace-nowrap ${activeTab === 'audit' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
          >
            Reality Isolation
          </button>
          <button
            onClick={() => setActiveTab('taxonomy')}
            className={`px-3 py-1 rounded-md whitespace-nowrap ${activeTab === 'taxonomy' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
          >
            Taxonomy
          </button>
        </div>
      </div>
    </header>
  );
};
