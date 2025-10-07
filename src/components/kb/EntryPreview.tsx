import React from 'react';

type PreviewProps = {
  data: any;
};

export default function EntryPreview({ data }: PreviewProps) {
  const {
    title,
    canonical_citation,
    type,
    status,
    effective_date,
    amendment_date,
    last_reviewed,
    summary,
    tags = [],
    jurisdiction,
  } = data || {};

  const hasSummary = Boolean(summary && String(summary).trim().length > 0);
  const hasTags = Array.isArray(tags) && tags.length > 0;

  return (
    <aside className="space-y-4">
      {/* Header */}
      <div className="p-4 pb-2">
        <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Preview</div>
        <div className="text-xl font-semibold leading-tight">{title || 'Untitled entry'}</div>
        {canonical_citation && (
          <div className="text-sm text-gray-600 mt-0.5">{canonical_citation}</div>
        )}
      </div>

      {/* Details */}
      <div className="p-4 pt-0">
        <div className="text-xs uppercase tracking-wide text-muted-foreground mt-2 mb-1">Details</div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-gray-500">Type</div>
            <div className="font-medium break-words">{type || '—'}</div>
          </div>
          <div>
            <div className="text-gray-500">Status</div>
            <div className="font-medium">{status || '—'}</div>
          </div>
          <div>
            <div className="text-gray-500">Effective</div>
            <div className="font-medium">{effective_date || '—'}</div>
          </div>
          <div>
            <div className="text-gray-500">Jurisdiction</div>
            <div className="font-medium">{jurisdiction || '—'}</div>
          </div>
          <div className="col-span-2">
            <div className="text-gray-500">Last Reviewed</div>
            <div className="font-medium">{last_reviewed || '—'}</div>
          </div>
        </div>
      </div>

      {/* Summary (optional) */}
      {hasSummary && (
        <div className="p-4 pt-0">
          <div className="text-xs uppercase tracking-wide text-muted-foreground mt-1 mb-0">Summary</div>
          <div className="text-sm text-gray-800 whitespace-pre-wrap leading-snug">{summary}</div>
        </div>
      )}

      {/* Tags (optional) */}
      {hasTags && (
        <div className="p-4 pt-0">
          <div className="text-xs uppercase tracking-wide text-muted-foreground mt-2 mb-2">Tags</div>
          <div className="flex gap-2 flex-wrap">
            {tags.map((t: string, i: number) => (
              <span key={i} className="kb-chip">#{t}</span>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}



