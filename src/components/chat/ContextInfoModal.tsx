import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, File, Globe, Trash2, Download } from 'lucide-react';
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

interface FileUpload {
  file: File;
  name: string;
  progress: number;
  error?: string;
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
  const [uploads, setUploads] = useState<FileUpload[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { deleteContext } = useChat();

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

    const newUploads: FileUpload[] = Array.from(selectedFiles).map(file => ({
      file,
      name: file.name,
      progress: 0,
    }));

    setUploads(prev => [...prev, ...newUploads]);
    processUploads(newUploads);
  };

  const processUploads = async (uploadsToProcess: FileUpload[]) => {
    for (const upload of uploadsToProcess) {
      try {
        // Update progress
        setUploads(prev => prev.map(u => 
          u === upload ? { ...u, progress: 50 } : u
        ));

        // Upload file to storage
        const filePath = await ContextService.uploadFile(upload.file, contextId);

        // Create file record in database
        await ContextService.createFile({
          name: upload.name,
          context_id: contextId,
          size: upload.file.size,
          type: upload.file.type,
          path: filePath,
        });

        // Update progress to complete
        setUploads(prev => prev.map(u => 
          u === upload ? { ...u, progress: 100 } : u
        ));

        // Reload files after successful upload
        await loadContextData();

        // Remove completed upload after a delay
        setTimeout(() => {
          setUploads(prev => prev.filter(u => u !== upload));
        }, 2000);

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Upload failed';
        setUploads(prev => prev.map(u => 
          u === upload ? { ...u, error: errorMessage, progress: 0 } : u
        ));
      }
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
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete file';
      setError(errorMessage);
    }
  };

  const handleDeleteContext = async () => {
    try {
      await deleteContext(contextId);
      setShowDeleteConfirm(false);
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete context';
      setError(errorMessage);
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
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <>
      <Modal 
        isOpen={isOpen} 
        onClose={onClose} 
        title={`Context: ${contextName}`} 
        className="max-w-4xl"
      >
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
              {/* File Upload Area */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-secondary-900 dark:text-white">
                  Files
                </h3>
                
                {/* Drag and Drop Area */}
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
                  <p className="text-secondary-600 dark:text-secondary-400 mb-2">
                    Drag and drop files here, or click to select
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Choose Files
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFileSelect(e.target.files)}
                  />
                </div>

                {/* Upload Progress */}
                {uploads.length > 0 && (
                  <div className="space-y-2">
                    {uploads.map((upload, index) => (
                      <div key={index} className="p-3 bg-secondary-50 dark:bg-secondary-800 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-secondary-900 dark:text-white">
                            {upload.name}
                          </span>
                          <span className="text-xs text-secondary-500">
                            {upload.progress}%
                          </span>
                        </div>
                        <div className="w-full bg-secondary-200 dark:bg-secondary-700 rounded-full h-2">
                          <div
                            className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${upload.progress}%` }}
                          />
                        </div>
                        {upload.error && (
                          <p className="text-xs text-error-600 dark:text-error-400 mt-1">
                            {upload.error}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Files List */}
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

              {/* Actions */}
              <div className="flex justify-between pt-4 border-t border-secondary-200 dark:border-secondary-700">
                <Button
                  variant="danger"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  Delete Context
                </Button>
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>

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