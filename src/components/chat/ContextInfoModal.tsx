import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  X, 
  Upload, 
  File, 
  Globe, 
  Trash2, 
  Download, 
  Edit2, 
  Check, 
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  ExternalLink,
  Plus,
  FileText
} from 'lucide-react';
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
  isExtension?: boolean;
}

const ContextInfoModal: React.FC<ContextInfoModalProps> = ({ 
  isOpen, 
  onClose, 
  contextId, 
  contextName,
  isExtension = false
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
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { deleteContext, refreshContexts } = useChat();

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setEditedName(contextName);
      setError(null);
      setUploadProgress({});
    }
  }, [isOpen, contextName]);

  // Load context data when modal opens
  useEffect(() => {
    if (isOpen && contextId) {
      loadContextData();
    }
  }, [isOpen, contextId]);

  const loadContextData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [filesData, sitesData] = await Promise.all([
        ContextService.getContextFiles(contextId, isExtension),
        ContextService.getContextSites(contextId, isExtension)
      ]);

      setFiles(filesData);
      setSites(sitesData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load context data';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [contextId, isExtension]);

  const handleFileSelect = useCallback((selectedFiles: FileList | null) => {
    if (!selectedFiles || selectedFiles.length === 0) return;
    processUploads(Array.from(selectedFiles));
  }, []);

  const processUploads = useCallback(async (files: File[]) => {
    if (isUploading) return;
    
    setIsUploading(true);
    setUploadProgress({});
    let successCount = 0;
    let failCount = 0;

    for (const file of files) {
      const fileId = `${file.name}-${Date.now()}`;
      setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));

      try {
        // Validate file type
        const allowedTypes = ['application/pdf', 'text/plain'];
        const allowedExtensions = ['.pdf', '.txt'];
        
        const isValidType = allowedTypes.includes(file.type) || 
                           allowedExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
        
        if (!isValidType) {
          throw new Error('Only PDF and TXT files are supported');
        }

        // Check file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
          throw new Error('File size must be less than 10MB');
        }

        setUploadProgress(prev => ({ ...prev, [fileId]: 25 }));

        // Upload file to storage
        const filePath = await ContextService.uploadFile(file, contextId, isExtension);
        setUploadProgress(prev => ({ ...prev, [fileId]: 50 }));

        // Create database record
        const dbFile = await ContextService.createFile({
          name: file.name,
          context_id: contextId,
          size: file.size,
          type: file.type,
          path: filePath,
          processing_status: 'pending',
        }, isExtension);

        setUploadProgress(prev => ({ ...prev, [fileId]: 75 }));

        // Add the new file to the local state immediately
        setFiles(prev => [dbFile, ...prev]);
        
        // Add to processing set
        setProcessingFiles(prev => new Set(prev).add(dbFile.id));
        setUploadProgress(prev => ({ ...prev, [fileId]: 100 }));

        // Process file content in background
        ContextService.processFileContent(file, dbFile.id, isExtension)
          .then(() => {
            // Update the file status in local state
            setFiles(prev => prev.map(f => 
              f.id === dbFile.id 
                ? { ...f, processing_status: 'completed' as const }
                : f
            ));
            // Remove from processing set
            setProcessingFiles(prev => {
              const newSet = new Set(prev);
              newSet.delete(dbFile.id);
              return newSet;
            });
          })
          .catch(error => {
            console.error(`Background processing failed for ${file.name}:`, error);
            // Update the file status in local state
            setFiles(prev => prev.map(f => 
              f.id === dbFile.id 
                ? { ...f, processing_status: 'failed' as const, processing_error: error.message }
                : f
            ));
            // Remove from processing set
            setProcessingFiles(prev => {
              const newSet = new Set(prev);
              newSet.delete(dbFile.id);
              return newSet;
            });
          });

        successCount++;

      } catch (err) {
        console.error(`Failed to upload ${file.name}:`, err);
        const errorMessage = err instanceof Error ? err.message : 'Upload failed';
        toast.error(`Failed to upload ${file.name}: ${errorMessage}`);
        failCount++;
      } finally {
        // Remove from progress after a delay
        setTimeout(() => {
          setUploadProgress(prev => {
            const { [fileId]: _, ...rest } = prev;
            return rest;
          });
        }, 2000);
      }
    }

    setIsUploading(false);

    // Show success/failure summary
    if (successCount > 0) {
      toast.success(`Successfully uploaded ${successCount} file${successCount > 1 ? 's' : ''}`);
    }

    if (failCount > 0 && successCount === 0) {
      toast.error(`Failed to upload ${failCount} file${failCount > 1 ? 's' : ''}`);
    } else if (failCount > 0) {
      toast.error(`${failCount} file${failCount > 1 ? 's' : ''} failed to upload`);
    }
  }, [contextId, isUploading, isExtension]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleDeleteFile = useCallback(async (fileId: string, fileName: string) => {
    try {
      await ContextService.deleteFile(fileId, isExtension);
      setFiles(prev => prev.filter(f => f.id !== fileId));
      toast.success(`"${fileName}" deleted successfully`);
    } catch (err) {
      console.error('Failed to delete file:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete file';
      toast.error(errorMessage);
    }
  }, [isExtension]);

  const handleDeleteContext = useCallback(async () => {
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
  }, [contextId, deleteContext, onClose]);

  const handleSaveEdit = useCallback(async () => {
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
  }, [editedName, contextName, contextId, refreshContexts]);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    setEditedName(contextName);
  }, [contextName]);

  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  const formatDate = useCallback((dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  const getFileIcon = useCallback((fileName: string, fileType: string) => {
    if (fileType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf')) {
      return <FileText className="h-5 w-5 text-red-500" />;
    }
    return <FileText className="h-5 w-5 text-blue-500" />;
  }, []);

  const getProcessingStatusIcon = useCallback((status: string | undefined, isProcessing: boolean) => {
    if (isProcessing || status === 'pending') {
      return <Clock className="h-4 w-4 text-yellow-500" />;
    }
    if (status === 'processing') {
      return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
    }
    if (status === 'completed') {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    if (status === 'failed') {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
    return null;
  }, []);

  const getProcessingStatusText = useCallback((status: string | undefined, isProcessing: boolean) => {
    if (isProcessing || status === 'pending') {
      return 'Pending';
    }
    if (status === 'processing') {
      return 'Processing';
    }
    if (status === 'completed') {
      return 'Ready';
    }
    if (status === 'failed') {
      return 'Failed';
    }
    return '';
  }, []);

  const getProcessingStatusColor = useCallback((status: string | undefined, isProcessing: boolean) => {
    if (isProcessing || status === 'pending') {
      return 'text-yellow-600 dark:text-yellow-400';
    }
    if (status === 'processing') {
      return 'text-blue-600 dark:text-blue-400';
    }
    if (status === 'completed') {
      return 'text-green-600 dark:text-green-400';
    }
    if (status === 'failed') {
      return 'text-red-600 dark:text-red-400';
    }
    return 'text-gray-500 dark:text-gray-400';
  }, []);

  return (
    <>
      <div className={`fixed inset-0 z-50 flex items-center justify-center ${isOpen ? '' : 'hidden'}`}>
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-5xl w-full mx-4 max-h-[95vh] overflow-hidden border border-gray-200 dark:border-gray-700">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <div className="flex items-center space-x-3 flex-1">
              {isEditing ? (
                <div className="flex items-center space-x-2 flex-1">
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="flex-1 px-3 py-2 text-lg font-semibold border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
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
                    className="p-2 bg-green-500 hover:bg-green-600"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={handleCancelEdit}
                    variant="outline"
                    size="sm"
                    className="p-2"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {contextName}
                  </h2>
                  <Button
                    onClick={() => setIsEditing(true)}
                    variant="ghost"
                    size="sm"
                    className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
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
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          {/* Content */}
          <div className="p-4 overflow-y-auto max-h-[calc(95vh-120px)]">
            <div className="space-y-4">
              {/* Error Display */}
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
                  </div>
                </div>
              )}

              {/* Loading State */}
              {isLoading && (
                <div className="flex items-center justify-center py-8">
                  <LoadingSpinner size="lg" />
                </div>
              )}

              {!isLoading && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Files Section */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                        <File className="h-4 w-4" />
                        <span>Files ({files.length})</span>
                      </h3>
                    </div>
                    
                    {files.length > 0 ? (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {files.map((file) => {
                          const isProcessing = processingFiles.has(file.id);
                          return (
                            <div
                              key={file.id}
                              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                              <div className="flex items-center space-x-2 flex-1 min-w-0">
                                {getFileIcon(file.name, file.type)}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {file.name}
                                  </p>
                                  <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                                    <span>{formatFileSize(file.size)}</span>
                                    <span>•</span>
                                    <span>{formatDate(file.created_at)}</span>
                                    {(isProcessing || file.processing_status) && (
                                      <>
                                        <span>•</span>
                                        <div className={`flex items-center space-x-1 ${getProcessingStatusColor(file.processing_status, isProcessing)}`}>
                                          {getProcessingStatusIcon(file.processing_status, isProcessing)}
                                          <span>{getProcessingStatusText(file.processing_status, isProcessing)}</span>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-1">
                                {file.path && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={async () => {
                                      try {
                                        const url = await ContextService.getFileUrl(file.path!, isExtension);
                                        window.open(url, '_blank');
                                      } catch (err) {
                                        console.error('Failed to get file URL:', err);
                                        toast.error('Failed to download file');
                                      }
                                    }}
                                    className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                    title="Download file"
                                  >
                                    <Download className="h-3 w-3" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteFile(file.id, file.name)}
                                  className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                                  title="Delete file"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <File className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                          No files uploaded yet
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Sites Section */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                        <Globe className="h-4 w-4" />
                        <span>Connected Sites ({sites.length})</span>
                      </h3>
                    </div>
                    
                    {sites.length > 0 ? (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {sites.map((site) => (
                          <div
                            key={site.id}
                            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          >
                            <div className="flex items-center space-x-2 flex-1 min-w-0">
                              <Globe className="h-4 w-4 text-blue-500" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                  {site.url}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  Added {formatDate(site.created_at)}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(site.url, '_blank')}
                              className="p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/20"
                              title="Visit site"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <Globe className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                          No sites connected yet
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* File Upload Area */}
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 ${
                  isDragOver
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-105'
                    : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {isUploading ? (
                  <div className="space-y-3">
                    <Loader2 className="h-6 w-6 mx-auto text-blue-500 animate-spin" />
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      Uploading files...
                    </p>
                    {/* Upload Progress */}
                    {Object.keys(uploadProgress).length > 0 && (
                      <div className="space-y-1">
                        {Object.entries(uploadProgress).map(([fileId, progress]) => (
                          <div key={fileId} className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                            <div 
                              className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Upload className="h-8 w-8 mx-auto text-gray-400" />
                    <div>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">
                        Drag and drop PDF or TXT files here
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mb-3">
                        Maximum file size: 10MB
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center space-x-2 text-sm"
                      >
                        <Plus className="h-3 w-3" />
                        <span>Choose Files</span>
                      </Button>
                    </div>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.txt"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e.target.files)}
                  disabled={isUploading}
                />
              </div>

              {/* Actions */}
              <div className="flex justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="danger"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center space-x-2"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete Context</span>
                </Button>
                <Button
                  onClick={onClose}
                  variant="outline"
                >
                  Close
                </Button>
              </div>
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
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <p className="text-red-700 dark:text-red-400 text-sm font-medium">
                This action cannot be undone
              </p>
            </div>
          </div>
          
          <p className="text-gray-700 dark:text-gray-300">
            Are you sure you want to delete "<strong>{contextName}</strong>"? 
            This will permanently delete:
          </p>
          
          <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
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
              className="flex items-center space-x-2"
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete Everything</span>
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default ContextInfoModal;