import React, { useState } from 'react';
import { Search, X, File, Clock } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';
import LoadingSpinner from './LoadingSpinner';
import { FileProcessingService } from '../../services/fileProcessingService';
import type { DatabaseFile } from '../../types/database';

interface FileSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  contextId?: string;
  onFileSelect?: (file: DatabaseFile) => void;
}

const FileSearchModal: React.FC<FileSearchModalProps> = ({
  isOpen,
  onClose,
  contextId,
  onFileSelect
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<DatabaseFile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsSearching(true);
    setHasSearched(true);

    try {
      const searchResults = await FileProcessingService.searchFilesByContent(query, contextId);
      setResults(searchResults);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const highlightText = (text: string, searchQuery: string): string => {
    if (!searchQuery.trim()) return text;
    
    const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800">$1</mark>');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Search Files"
      className="max-w-2xl"
    >
      <div className="space-y-4">
        {/* Search Input */}
        <div className="flex space-x-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search file contents..."
              className="w-full pl-10 pr-4 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-secondary-800 text-secondary-900 dark:text-white"
            />
          </div>
          <Button
            onClick={handleSearch}
            disabled={!query.trim() || isSearching}
            className="px-6"
          >
            {isSearching ? <LoadingSpinner size="sm" /> : 'Search'}
          </Button>
        </div>

        {/* Search Results */}
        <div className="max-h-96 overflow-y-auto">
          {isSearching && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <LoadingSpinner size="md" className="mx-auto mb-2" />
                <p className="text-sm text-secondary-500 dark:text-secondary-400">
                  Searching files...
                </p>
              </div>
            </div>
          )}

          {!isSearching && hasSearched && results.length === 0 && (
            <div className="text-center py-8">
              <File className="h-12 w-12 mx-auto mb-4 text-secondary-300 dark:text-secondary-600" />
              <p className="text-secondary-600 dark:text-secondary-400">
                No files found matching your search.
              </p>
            </div>
          )}

          {!isSearching && results.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-3">
                Found {results.length} file{results.length !== 1 ? 's' : ''}
              </p>
              
              {results.map((file) => (
                <div
                  key={file.id}
                  className="p-4 border border-secondary-200 dark:border-secondary-700 rounded-lg hover:bg-secondary-50 dark:hover:bg-secondary-800 cursor-pointer transition-colors"
                  onClick={() => onFileSelect?.(file)}
                >
                  <div className="flex items-start space-x-3">
                    <File className="h-5 w-5 text-secondary-500 mt-1 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm font-medium text-secondary-900 dark:text-white truncate">
                          {file.name}
                        </h4>
                        <div className="flex items-center space-x-2 text-xs text-secondary-500">
                          <Clock className="h-3 w-3" />
                          <span>{formatDate(file.created_at)}</span>
                        </div>
                      </div>
                      
                      <p className="text-xs text-secondary-500 mb-2">
                        {formatFileSize(file.size)} • {file.type}
                      </p>
                      
                      {file.content && (
                        <div className="text-sm text-secondary-700 dark:text-secondary-300">
                          <p className="line-clamp-3">
                            <span
                              dangerouslySetInnerHTML={{
                                __html: highlightText(
                                  file.content.substring(0, 200) + (file.content.length > 200 ? '...' : ''),
                                  query
                                )
                              }}
                            />
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!hasSearched && (
            <div className="text-center py-8">
              <Search className="h-12 w-12 mx-auto mb-4 text-secondary-300 dark:text-secondary-600" />
              <p className="text-secondary-600 dark:text-secondary-400">
                Enter a search term to find files by their content.
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end pt-4 border-t border-secondary-200 dark:border-secondary-700">
          <Button
            onClick={onClose}
            variant="outline"
          >
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default FileSearchModal;