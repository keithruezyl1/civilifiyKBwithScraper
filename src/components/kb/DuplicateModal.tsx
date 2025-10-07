import React from 'react';
import Modal from '../Modal/Modal';
import { Button } from '../ui/Button';
import { AlertTriangle, CheckCircle } from 'lucide-react';

interface DuplicateEntry {
  entry_id: string;
  type: string;
  title: string;
  canonical_citation?: string;
  summary?: string;
  tags?: string[];
  created_at: string;
  match_type: 'exact_title' | 'exact_citation' | 'exact_id' | 'similar';
  similarity?: number;
}

interface DuplicateModalProps {
  isOpen: boolean;
  onClose: () => void;
  duplicates: DuplicateEntry[];
  title?: string;
  subtitle?: string;
  buttonText?: string;
  showSimilarity?: boolean;
}

export function DuplicateModal({
  isOpen,
  onClose,
  duplicates,
  title = 'Duplicates Found',
  subtitle,
  buttonText = 'I understand',
  showSimilarity = false
}: DuplicateModalProps) {
  const getMatchTypeLabel = (matchType: string) => {
    switch (matchType) {
      case 'exact_title':
        return 'Exact title match';
      case 'exact_citation':
        return 'Exact citation match';
      case 'exact_id':
        return 'Exact ID match';
      case 'similar':
        return 'Similar content';
      default:
        return 'Match';
    }
  };

  const getMatchTypeIcon = (matchType: string) => {
    switch (matchType) {
      case 'exact_title':
      case 'exact_citation':
      case 'exact_id':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'similar':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} subtitle={subtitle}>
      <div className="max-h-96 overflow-y-auto mb-6">
        <div className="space-y-3">
          {duplicates.map((duplicate, index) => (
            <div key={`${duplicate.entry_id}-${index}`} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getMatchTypeIcon(duplicate.match_type)}
                  <span className="text-sm font-medium text-gray-700">
                    {getMatchTypeLabel(duplicate.match_type)}
                  </span>
                  {showSimilarity && duplicate.similarity && (
                    <span className="text-xs text-gray-500">
                      ({Math.round(duplicate.similarity * 100)}% similar)
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {duplicate.type}
                </span>
              </div>
              
              <div className="space-y-1">
                <div className="font-medium text-gray-900">{duplicate.title}</div>
                {duplicate.canonical_citation && (
                  <div className="text-sm text-gray-600">{duplicate.canonical_citation}</div>
                )}
                <div className="text-xs text-gray-500">ID: {duplicate.entry_id}</div>
                {duplicate.summary && (
                  <div className="text-sm text-gray-600 line-clamp-2">{duplicate.summary}</div>
                )}
                {duplicate.tags && duplicate.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {duplicate.tags.slice(0, 3).map((tag, tagIndex) => (
                      <span key={tagIndex} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {tag}
                      </span>
                    ))}
                    {duplicate.tags.length > 3 && (
                      <span className="text-xs text-gray-500">+{duplicate.tags.length - 3} more</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="flex justify-end">
        <Button onClick={onClose} variant="default">
          {buttonText}
        </Button>
      </div>
    </Modal>
  );
}
