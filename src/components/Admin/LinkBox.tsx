import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export default function LinkBox({ token }: { token: string }) {
  const [copied, setCopied] = useState(false);
  const url = `${window.location.origin}/?token=${token}`;

  const copy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
      <span className="flex-1 text-xs text-gray-400 truncate font-mono">{url}</span>
      <button
        onClick={copy}
        className="shrink-0 text-gray-400 hover:text-invox-blue transition-colors"
        title="Copier le lien"
      >
        {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
      </button>
    </div>
  );
}
