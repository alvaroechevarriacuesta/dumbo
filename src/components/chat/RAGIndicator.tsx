import React, { useState } from 'react';
import { Info, ChevronDown, ChevronUp, FileText, Zap } from 'lucide-react';
import type { RAGContext } from '../../services/ragService';

interface RAGIndicatorProps {
  ragContext: RAGContext;
  className?: string;
}

const RAGIndicator: React.FC<RAGIndicatorProps> = ({ ragContext, className = '' }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!ragContext.hasRelevantContext || ragContext.chunks.length === 0) {
    return null;
  }

  const averageRelevance = (ragContext.averageSimilarity * 100).toFixed(1);
  const uniqueSources = Array.from(new Set(
    ragContext.chunks
      .map(chunk => chunk.chunk.metadata?.fileName)
      .filter(Boolean)
  ));

  return (
    <div className={`bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg ${className}`}>
      {/* Header */}
      <div 
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors rounded-lg"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            <Zap className="w-4 h-4 text-primary-600 dark:text-primary-400" />
            <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
              Enhanced with context
            </span>
          </div>
          <div className="text-xs text-primary-600 dark:text-primary-400">
            {ragContext.chunks.length} source{ragContext.chunks.length !== 1 ? 's' : ''} • {averageRelevance}% relevance
          </div>
        </div>
        <button className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300">
          {isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-3 pb-3 border-t border-primary-200 dark:border-primary-800">
          <div className="pt-3 space-y-3">
            {/* Sources Summary */}
            <div>
              <h4 className="text-xs font-medium text-primary-700 dark:text-primary-300 mb-2 flex items-center">
                <FileText className="w-3 h-3 mr-1" />
                Sources Used ({uniqueSources.length})
              </h4>
              <div className="space-y-1">
                {uniqueSources.map((source, index) => (
                  <div key={index} className="text-xs text-primary-600 dark:text-primary-400 bg-primary-100 dark:bg-primary-900/40 px-2 py-1 rounded">
                    {source}
                  </div>
                ))}
              </div>
            </div>

            {/* Context Chunks */}
            <div>
              <h4 className="text-xs font-medium text-primary-700 dark:text-primary-300 mb-2">
                Relevant Sections
              </h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {ragContext.chunks.map((chunk, index) => (
                  <div key={chunk.chunk.id} className="text-xs bg-primary-100 dark:bg-primary-900/40 p-2 rounded">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-primary-700 dark:text-primary-300">
                        {chunk.chunk.metadata?.fileName || 'Unknown source'}
                      </span>
                      <span className="text-primary-600 dark:text-primary-400">
                        {(chunk.similarity * 100).toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-primary-600 dark:text-primary-400 line-clamp-2">
                      {chunk.chunk.content.length > 100 
                        ? chunk.chunk.content.substring(0, 100) + '...'
                        : chunk.chunk.content
                      }
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Statistics */}
            <div className="pt-2 border-t border-primary-200 dark:border-primary-800">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-primary-600 dark:text-primary-400">Total chunks found:</span>
                  <span className="ml-1 font-medium text-primary-700 dark:text-primary-300">
                    {ragContext.totalRelevantChunks}
                  </span>
                </div>
                <div>
                  <span className="text-primary-600 dark:text-primary-400">Avg. relevance:</span>
                  <span className="ml-1 font-medium text-primary-700 dark:text-primary-300">
                    {averageRelevance}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RAGIndicator;