import React, { useState } from 'react';
import { Copy, Check, CheckCircle2 } from 'lucide-react';

interface JsonViewerProps {
  data: any;
  title?: string;
}

export const JsonViewer: React.FC<JsonViewerProps> = ({ data, title = 'JSON Schema Response' }) => {
  const [copied, setCopied] = useState(false);
  const jsonString = JSON.stringify(data, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-mono text-slate-300 font-semibold">{title}</span>
          <span className="flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-full font-mono">
            <CheckCircle2 className="w-3 h-3" /> schema compliant
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 transition"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy JSON</span>
            </>
          )}
        </button>
      </div>
      <div className="p-4 overflow-x-auto max-h-96 font-mono text-xs text-indigo-300 leading-relaxed bg-slate-950/90">
        <pre>{jsonString}</pre>
      </div>
    </div>
  );
};
