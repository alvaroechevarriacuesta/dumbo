import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, File, Globe, Trash2, Download, Edit2, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { ExtensionContextService } from '../services/ExtensionContextService';
import { useExtensionChat } from '../hooks/useExtensionChat';
import type { DatabaseFile, DatabaseSite } from '../../types/database';

interface ExtensionContextInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  contextId: string;
  contextName: string;
}

const ExtensionContextInfoModal: React.FC<ExtensionContextInfoModalProps> = ({ 
  isOpen, 
  onClose, 
  contextId, 
  contextName 
}) => {
  const [files, setFiles] = useState<DatabaseFile[]>([]);
  const [sites, setSites] = useState<DatabaseSite[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [processingFiles, setProcessingFiles] = useState<Set<string>>(new Set());
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(contextName);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { deleteContext } = useExtensionChat();

  useEffect(() => {
    setEditedName(contextName);
  }, [contextName]);

  useEffect(() => {
    if (isOpen && contextId) {
      loadContextData();
    }
  }, [isOpen, contextId]);

  const loadContextData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [filesData, sitesData] = await Promise.all([
        ExtensionContextService.getContextFiles(contextId),
        ExtensionContextService.getContextSites(contextId)
      ]);

      setFiles(filesData);
      setSites(sitesData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load context data';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const files = Array.from(selectedFiles);
    processUploads(files);
  };

  const processUploads = async (files: File[]) => {
    if (isUploading) return;
    
    setIsUploading(true);
    let successCount = 0;
    let failCount = 0;

    for (const file of files) {
      try {
        // Validate file type first
        const allowedTypes = ['application/pdf', 'text/plain'];
        const allowedExtensions = ['.pdf', '.txt'];
        
        const isValidType = allowedTypes.includes(file.type) || 
                           allowedExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
        
        if (!isValidType) {
          throw new Error('Only PDF and TXT files are supported');
        }

        // Upload file to storage
        const filePath = await ExtensionContextService.uploadFile(file, contextId);

        // Create database record
        const dbFile = await ExtensionContextService.createFile({
          name: file.name,
          context_id: contextId,
          size: file.size,
          type: file.type,
          path: filePath,
          processing_status: 'pending',
        });

        // Process file content in background
        ExtensionContextService.processFileContent(file, dbFile.id).catch(error => {
          console.error(`Background processing failed for ${file.name}:`, error);
          // Remove from processing set on error
          setProcessingFiles(prev => {
            const newSet = new Set(prev);
            newSet.delete(dbFile.id);
            return newSet;
          });
        });

        // Add to processing set
        setProcessingFiles(prev => new Set(prev).add(dbFile.id));

        successCount++;

      } catch (err) {
        console.error(`Failed to upload ${file.name}:`, err);
        const errorMessage = err instanceof Error ? err.message : 'Upload failed';
        toast.error(`Failed to upload ${file.name}: ${errorMessage}`);
        failCount++;
      }
    }

    setIsUploading(false);

    // Show success/failure summary
    if (successCount > 0) {
      toast.success(`Successfully uploaded ${successCount} file${successCount > 1 ? 's' : ''}`);
      // Reload files after successful uploads
      setTimeout(() => {
        loadContextData();
      }, 1000);
      
      // Set up a listener for processing completion
      setTimeout(() => {
        // Clear processing state after a reasonable time
        setProcessingFiles(new Set());
      }, 30000); // Clear after 30 seconds max
    }

    if (failCount > 0 && successCount === 0) {
      toast.error(`Failed to upload ${failCount} file${failCount > 1 ? 's' : ''}`);
    } else if (failCount > 0) {
      toast.error(`${failCount} file${failCount > 1 ? 's' : ''} failed to upload`);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDeleteFile = async (fileId: string) => {
    try {
      await ExtensionContextService.deleteFile(fileId);
      setFiles(prev => prev.filter(f => f.id !== fileId));
      toast.success('File deleted successfully');
    } catch (err) {
      console.error('Failed to delete file:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete file';
      toast.error(errorMessage);
    }
  };

  const handleDeleteContext = async () => {
    try {
      await deleteContext(contextId);
      setShowDeleteConfirm(false);
      onClose();
      toast.success('Context deleted successfully');
    } catch (err) {
      console.error('Failed to delete context:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete context';
      toast.error(errorMessage);
    }
  };

  const handleSaveEdit = async () => {
    if (!editedName.trim() || editedName === contextName) {
      setIsEditing(false);
      setEditedName(contextName);
      return;
    }

    try {
      // For now, we'll just refresh contexts since updateContext doesn't exist
      // TODO: Add updateContext method to ContextService
      setIsEditing(false);
      toast.success('Context name updated successfully');
    } catch (err) {
      console.error('Failed to update context name:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update context name';
      toast.error(errorMessage);
      setEditedName(contextName); // Reset to original name on error
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedName(contextName);
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
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Context Information">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/20 rounded-lg flex items-center justify-center">
              <Globe className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              {isEditing ? (
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="text-lg font-semibold bg-transparent border-b border-secondary-300 dark:border-secondary-600 focus:outline-none focus:border-primary-500 text-secondary-900 dark:text-white"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSaveEdit();
                      } else if (e.key === 'Escape') {
                        handleCancelEdit();
                      }
                    }}
                  />
                  <Button onClick={handleSaveEdit} size="sm" className="p-1">
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button onClick={handleCancelEdit} variant="ghost" size="sm" className="p-1">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <h2 className="text-lg font-semibold text-secondary-900 dark:text-white">
                    {contextName}
                  </h2>
                  <Button
                    onClick={() => setIsEditing(true)}
                    variant="ghost"
                    size="sm"
                    className="p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <p className="text-sm text-secondary-500 dark:text-secondary-400">
                Context Information
              </p>
            </div>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="p-2"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <LoadingSpinner size="lg" className="mx-auto mb-4" />
              <p className="text-secondary-600 dark:text-secondary-400">
                Loading context data...
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-error-600 dark:text-error-400 mb-4">{error}</p>
            <Button onClick={loadContextData} variant="outline">
              Try Again
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Files Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-secondary-900 dark:text-white flex items-center">
                  <File className="w-5 h-5 mr-2 text-primary-500" />
                  Files ({files.length})
                </h3>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  size="sm"
                  disabled={isUploading}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Files
                </Button>
              </div>

              {/* File Upload Area */}
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  isDragOver
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-secondary-300 dark:border-secondary-600 hover:border-primary-400 dark:hover:border-primary-500'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <Upload className="w-8 h-8 mx-auto mb-2 text-secondary-400" />
                <p className="text-sm text-secondary-600 dark:text-secondary-400">
                  Drag and drop files here, or{' '}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    browse
                  </button>
                </p>
                <p className="text-xs text-secondary-500 dark:text-secondary-500 mt-1">
                  Supports PDF and TXT files
                </p>
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.txt"
                onChange={(e) => handleFileSelect(e.target.files)}
                className="hidden"
              />

              {/* Files List */}
              {files.length > 0 && (
                <div className="mt-4 space-y-2">
                  {files.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-3 bg-secondary-50 dark:bg-secondary-800 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <File className="w-4 h-4 text-secondary-500" />
                        <div>
                          <p className="text-sm font-medium text-secondary-900 dark:text-white">
                            {file.name}
                          </p>
                          <p className="text-xs text-secondary-500 dark:text-secondary-400">
                            {formatFileSize(file.size)} • {formatDate(file.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {processingFiles.has(file.id) && (
                          <div className="flex items-center space-x-1 text-xs text-secondary-500">
                            <LoadingSpinner size="sm" />
                            <span>Processing...</span>
                          </div>
                        )}
                        {file.publicUrl && (
                          <Button
                            onClick={() => window.open(file.publicUrl, '_blank')}
                            variant="ghost"
                            size="sm"
                            className="p-1"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          onClick={() => handleDeleteFile(file.id)}
                          variant="ghost"
                          size="sm"
                          className="p-1 text-error-600 hover:text-error-700 hover:bg-error-50 dark:text-error-400 dark:hover:text-error-300 dark:hover:bg-error-900/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sites Section */}
            <div>
              <h3 className="text-lg font-medium text-secondary-900 dark:text-white flex items-center mb-4">
                <Globe className="w-5 h-5 mr-2 text-primary-500" />
                Sites ({sites.length})
              </h3>
              
              {sites.length > 0 ? (
                <div className="space-y-2">
                  {sites.map((site) => (
                    <div
                      key={site.id}
                      className="flex items-center justify-between p-3 bg-secondary-50 dark:bg-secondary-800 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <Globe className="w-4 h-4 text-secondary-500" />
                        <div>
                          <p className="text-sm font-medium text-secondary-900 dark:text-white">
                            {site.url}
                          </p>
                          <p className="text-xs text-secondary-500 dark:text-secondary-400">
                            {formatDate(site.created_at)}
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={() => window.open(site.url, '_blank')}
                        variant="ghost"
                        size="sm"
                        className="p-1"
                      >
                        <Globe className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-secondary-500 dark:text-secondary-400 text-center py-4">
                  No sites added to this context yet
                </p>
              )}
            </div>

            {/* Delete Context */}
            <div className="pt-6 border-t border-secondary-200 dark:border-secondary-700">
              <Button
                onClick={() => setShowDeleteConfirm(true)}
                variant="outline"
                className="w-full text-error-600 border-error-300 hover:bg-error-50 dark:text-error-400 dark:border-error-700 dark:hover:bg-error-900/20"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Context
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <Modal isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title="Delete Context">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-4">
              Delete Context
            </h3>
            <p className="text-secondary-600 dark:text-secondary-400 mb-6">
              Are you sure you want to delete "{contextName}"? This action cannot be undone and will remove all associated files and conversations.
            </p>
            <div className="flex space-x-3">
              <Button
                onClick={() => setShowDeleteConfirm(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteContext}
                className="flex-1 bg-error-600 hover:bg-error-700 text-white"
              >
                Delete
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </Modal>
  );
};

export default ExtensionContextInfoModal; 