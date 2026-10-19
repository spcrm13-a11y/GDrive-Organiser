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
      <div className="bg-[#fffcf7] border border-[#e2d8c8] shadow-sm rounded-xl p-3.5 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
          <Files className="w-5 h-5" />
        </div>
        <div>
          <div className="text-xl font-bold text-stone-900">{total}</div>
          <div className="text-xs text-stone-600">Ingested Documents</div>
        </div>
      </div>

      <div className="bg-[#fffcf7] border border-[#e2d8c8] shadow-sm rounded-xl p-3.5 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <div>
          <div className="text-xl font-bold text-stone-900">
            {classifiedCount} <span className="text-xs text-stone-500 font-normal">/ {total}</span>
          </div>
          <div className="text-xs text-stone-600">Autonomous Classified</div>
        </div>
      </div>

      <div className="bg-[#fffcf7] border border-[#e2d8c8] shadow-sm rounded-xl p-3.5 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <div>
          <div className="text-xl font-bold text-rose-600">{realityTriggeredCount}</div>
          <div className="text-xs text-stone-600">Reality Isolation Shields</div>
        </div>
      </div>

      <div className="bg-[#fffcf7] border border-[#e2d8c8] shadow-sm rounded-xl p-3.5 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
          {dispatched ? <FolderCheck className="w-5 h-5 text-emerald-600" /> : <Sparkles className="w-5 h-5" />}
        </div>
        <div>
          <div className="text-xl font-bold text-stone-900">
            {avgConfidence > 0 ? `${avgConfidence}%` : 'N/A'}
          </div>
          <div className="text-xs text-stone-600">
            {dispatched ? 'Drive Sync: Organized' : 'Avg Classification Confidence'}
          </div>
        </div>
      </div>
    </div>
  );
};
