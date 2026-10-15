import React from 'react';
import { Files, CheckCircle2, ShieldAlert, Sparkles, FolderCheck } from 'lucide-react';
import { DocumentItem } from '../types/classifier';

interface StatsBarProps {
  documents: DocumentItem[];
  dispatched: boolean;
}

export const StatsBar: React.FC<StatsBarProps> = ({ documents, dispatched }) => {
  const total = documents.length;
  const classified = documents.filter(d => d.status === 'classified');
  const classifiedCount = classified.length;
  const realityTriggeredCount = documents.filter(
    d => d.classification?.reality_isolation_triggered || d.classification?.category === 'Personal'
  ).length;

  const avgConfidence = classifiedCount > 0
    ? Math.round(
        (classified.reduce((acc, curr) => acc + (curr.classification?.confidence || 0), 0) / classifiedCount) * 100
      )
    : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
          <Files className="w-5 h-5" />
        </div>
        <div>
          <div className="text-xl font-bold text-white">{total}</div>
          <div className="text-xs text-slate-400">Ingested Documents</div>
        </div>
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <div>
          <div className="text-xl font-bold text-white">
            {classifiedCount} <span className="text-xs text-slate-500 font-normal">/ {total}</span>
          </div>
          <div className="text-xs text-slate-400">Autonomous Classified</div>
        </div>
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <div>
          <div className="text-xl font-bold text-rose-400">{realityTriggeredCount}</div>
          <div className="text-xs text-slate-400">Reality Isolation Shields</div>
        </div>
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
          {dispatched ? <FolderCheck className="w-5 h-5 text-emerald-400" /> : <Sparkles className="w-5 h-5" />}
        </div>
        <div>
          <div className="text-xl font-bold text-white">
            {avgConfidence > 0 ? `${avgConfidence}%` : 'N/A'}
          </div>
          <div className="text-xs text-slate-400">
            {dispatched ? 'Drive Sync: Organized' : 'Avg Classification Confidence'}
          </div>
        </div>
      </div>
    </div>
  );
};
