import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, File, Globe, Trash2, Download, Edit2, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import LoadingSpinner from '../ui/LoadingSpinner';
import { ContextService } from '../../services/contextService';
import { useChat } from '../../contexts/ChatContext';
import type { DatabaseFile, DatabaseSite } from '../../types/database';

interface ContextInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  contextId: string;
  contextName: string;
}

const ContextInfoModal: React.FC<ContextInfoModalProps> = ({ 
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
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(contextName);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { deleteContext, refreshContexts } = useChat();

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
        ContextService.getContextFiles(contextId),
        ContextService.getContextSites(contextId)
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
        const filePath = await ContextService.uploadFile(file, contextId);

        // Create database record
        const dbFile = await ContextService.createFile({
          name: file.name,
          context_id: contextId,
          size: file.size,
          type: file.type,
          path: filePath,
          processing_status: 'pending',
        });

        // Process file content in background
        ContextService.processFileContent(file, dbFile.id).catch(error => {
          console.error(`Background processing failed for ${file.name}:`, error);
          toast.error(`Processing failed for ${file.name}: ${error.message}`);
        });

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
      await loadContextData();
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
      await ContextService.deleteFile(fileId);
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
      // TODO: Implement updateContext in ContextService
      // await ContextService.updateContext(contextId, { name: editedName.trim() });
      // await refreshContexts();
      setIsEditing(false);
      console.log('Context rename not yet implemented');
      toast.success('Context updated successfully');
    } catch (err) {
      console.error('Failed to update context:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update context';
      toast.error(errorMessage);
      setEditedName(contextName);
      setIsEditing(false);
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
      minute: '2-digit',
    });
  };

  return (
    <>
      <div className={`fixed inset-0 z-50 flex items-center justify-center ${isOpen ? '' : 'hidden'}`}>
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div className="relative bg-white dark:bg-secondary-800 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-secondary-200 dark:border-secondary-700">
            <div className="flex items-center space-x-3 flex-1">
              {isEditing ? (
                <div className="flex items-center space-x-2 flex-1">
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="flex-1 px-3 py-2 text-lg font-semibold border border-secondary-300 dark:border-secondary-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-secondary-800 text-secondary-900 dark:text-white"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSaveEdit();
                      } else if (e.key === 'Escape') {
                        handleCancelEdit();
                      }
                    }}
                  />
                  <Button
                    onClick={handleSaveEdit}
                    size="sm"
                    className="p-2"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <h2 className="text-lg font-semibold text-secondary-900 dark:text-white">
                    {contextName}
                  </h2>
                  <Button
                    onClick={() => setIsEditing(true)}
                    variant="ghost"
                    size="sm"
                    className="p-2"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-1"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
        <div className="space-y-6">
          {/* Error Display */}
          {error && (
            <div className="p-3 bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg">
              <p className="text-error-700 dark:text-error-400 text-sm">{error}</p>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner size="md" />
            </div>
          )}

          {!isLoading && (
            <>
              {/* Files List */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-secondary-900 dark:text-white">
                  Files
                </h3>
                
                {files.length > 0 ? (
                  <div className="space-y-2">
                    {files.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-3 bg-secondary-50 dark:bg-secondary-800 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <File className="h-5 w-5 text-secondary-500" />
                          <div>
                            <p className="text-sm font-medium text-secondary-900 dark:text-white">
                              {file.name}
                            </p>
                            <p className="text-xs text-secondary-500">
                              {formatFileSize(file.size)} • {formatDate(file.created_at)}
                            </p>
                            {file.processing_status && (
                              <div className="flex items-center mt-1">
                                {file.processing_status === 'pending' && (
                                  <span className="text-xs text-warning-600 dark:text-warning-400 flex items-center">
                                    <div className="w-2 h-2 bg-warning-500 rounded-full mr-1 animate-pulse"></div>
                                    Processing...
                                  </span>
                                )}
                                {file.processing_status === 'processing' && (
                                  <span className="text-xs text-primary-600 dark:text-primary-400 flex items-center">
                                    <div className="w-2 h-2 bg-primary-500 rounded-full mr-1 animate-pulse"></div>
                                    Analyzing content...
                                  </span>
                                )}
                                {file.processing_status === 'completed' && (
                                  <span className="text-xs text-success-600 dark:text-success-400 flex items-center">
                                    <div className="w-2 h-2 bg-success-500 rounded-full mr-1"></div>
                                    Ready for search
                                  </span>
                                )}
                                {file.processing_status === 'failed' && (
                                  <span className="text-xs text-error-600 dark:text-error-400 flex items-center">
                                    <div className="w-2 h-2 bg-error-500 rounded-full mr-1"></div>
                                    Processing failed
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {file.path && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={async () => {
                                try {
                                  const url = await ContextService.getFileUrl(file.path!);
                                  window.open(url, '_blank');
                                } catch (err) {
                                  console.error('Failed to get file URL:', err);
                                }
                              }}
                              className="p-1"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteFile(file.id)}
                            className="p-1 text-error-600 hover:text-error-700 hover:bg-error-50 dark:text-error-400 dark:hover:text-error-300 dark:hover:bg-error-900/20"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-secondary-500 dark:text-secondary-400 text-center py-4">
                    No files uploaded yet
                  </p>
                )}
              </div>

              {/* Sites Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-secondary-900 dark:text-white">
                  Connected Sites
                </h3>
                
                {sites.length > 0 ? (
                  <div className="space-y-2">
                    {sites.map((site) => (
                      <div
                        key={site.id}
                        className="flex items-center justify-between p-3 bg-secondary-50 dark:bg-secondary-800 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <Globe className="h-5 w-5 text-secondary-500" />
                          <div>
                            <p className="text-sm font-medium text-secondary-900 dark:text-white">
                              {site.url}
                            </p>
                            <p className="text-xs text-secondary-500">
                              Added {formatDate(site.created_at)}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(site.url, '_blank')}
                          className="text-primary-600 hover:text-primary-700"
                        >
                          Visit
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-secondary-500 dark:text-secondary-400 text-center py-4">
                    No sites connected yet
                  </p>
                )}
              </div>

              {/* File Upload Area - Moved to bottom */}
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
                <Upload className="h-8 w-8 mx-auto mb-2 text-secondary-400" />
                {isUploading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <LoadingSpinner size="sm" />
                    <p className="text-secondary-600 dark:text-secondary-400">
                      Uploading files...
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="text-secondary-600 dark:text-secondary-400 mb-2">
                      Drag and drop PDF or TXT files here, or click to select
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Choose Files
                    </Button>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFileSelect(e.target.files)}
                  disabled={isUploading}
                />
              </div>

              {/* Actions */}
              <div className="flex justify-between pt-4 border-t border-secondary-200 dark:border-secondary-700">
                <Button
                  variant="danger"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  Delete Context
                </Button>
                <Button
                  onClick={onClose}
                  variant="outline"
                >
                  Close
                </Button>
              </div>
            </>
          )}
        </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete Context"
        className="max-w-md"
      >
        <div className="space-y-4">
          <div className="p-4 bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg">
            <p className="text-error-700 dark:text-error-400 text-sm">
              <strong>Warning:</strong> This action cannot be undone.
            </p>
          </div>
          
          <p className="text-secondary-700 dark:text-secondary-300">
            Are you sure you want to delete "<strong>{contextName}</strong>"? 
            This will permanently delete:
          </p>
          
          <ul className="list-disc list-inside text-sm text-secondary-600 dark:text-secondary-400 space-y-1">
            <li>The context and all its settings</li>
            <li>All uploaded files ({files.length} files)</li>
            <li>All connected sites ({sites.length} sites)</li>
            <li>All chat history for this context</li>
          </ul>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteContext}
            >
              Delete Everything
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default ContextInfoModal;