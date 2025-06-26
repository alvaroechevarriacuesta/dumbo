import { supabase } from '../lib/supabase';
import type { DatabaseFile } from '../types/database';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.js`;

// PDF parsing functionality
const parsePDF = async (file: File): Promise<string> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    
    // Load PDF document using PDF.js
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    
    // Extract text from each page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      // Combine text items from the page
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      
      fullText += pageText + '\n';
    }
    
    return fullText.trim();
  } catch (error) {
    console.error('PDF parsing error:', error);
    throw new Error('Failed to parse PDF file');
  }
};

// Text file reading functionality
const readTextFile = async (file: File): Promise<string> => {
  try {
    const text = await file.text();
    return text;
  } catch (error) {
    console.error('Text file reading error:', error);
    throw new Error('Failed to read text file');
  }
};

export class FileProcessingService {
  // Validate file type and size
  static validateFile(file: File): { isValid: boolean; error?: string } {
    const allowedTypes = ['text/plain', 'application/pdf'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: 'Only .txt and .pdf files are allowed'
      };
    }

    if (file.size > maxSize) {
      return {
        isValid: false,
        error: 'File size must be less than 10MB'
      };
    }

    return { isValid: true };
  }

  // Upload file to Supabase storage
  static async uploadFile(file: File, contextId: string, userId: string): Promise<string> {
    try {
      // Generate unique file path with user ID for RLS
      const fileExt = file.name.split('.').pop();
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2);
      const fileName = `${timestamp}-${randomId}.${fileExt}`;
      const filePath = `${userId}/contexts/${contextId}/${fileName}`;

      console.log('Uploading file to path:', filePath);

      const { data, error } = await supabase.storage
        .from('files')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Storage upload error:', error);
        throw new Error(`Failed to upload file: ${error.message}`);
      }

      console.log('File uploaded successfully:', data);
      return filePath;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  }

  // Extract text content from file
  static async extractTextContent(file: File): Promise<string> {
    console.log('Extracting text from file:', file.name, 'Type:', file.type);

    try {
      let content: string;

      if (file.type === 'text/plain') {
        content = await readTextFile(file);
        console.log('Extracted text content (first 200 chars):', content.substring(0, 200));
      } else if (file.type === 'application/pdf') {
        content = await parsePDF(file);
        console.log('Extracted PDF content (first 200 chars):', content.substring(0, 200));
      } else {
        throw new Error('Unsupported file type');
      }

      return content;
    } catch (error) {
      console.error('Text extraction error:', error);
      throw error;
    }
  }

  // Create file record in database
  static async createFileRecord(fileData: {
    name: string;
    context_id: string;
    size: number;
    type: string;
    path: string;
    content: string;
  }): Promise<DatabaseFile> {
    try {
      console.log('Creating file record in database:', {
        name: fileData.name,
        context_id: fileData.context_id,
        size: fileData.size,
        type: fileData.type,
        path: fileData.path,
        contentLength: fileData.content.length
      });

      const { data, error } = await supabase
        .from('files')
        .insert([{
          name: fileData.name,
          context_id: fileData.context_id,
          size: fileData.size,
          type: fileData.type,
          path: fileData.path,
          content: fileData.content,
          processing_status: 'completed'
        }])
        .select()
        .single();

      if (error) {
        console.error('Database insert error:', error);
        throw new Error(`Failed to create file record: ${error.message}`);
      }

      console.log('File record created successfully:', data);
      return data;
    } catch (error) {
      console.error('Create file record error:', error);
      throw error;
    }
  }

  // Update file processing status
  static async updateProcessingStatus(
    fileId: string, 
    status: 'pending' | 'processing' | 'completed' | 'failed',
    error?: string
  ): Promise<void> {
    try {
      const updateData: any = { processing_status: status };
      if (error) {
        updateData.processing_error = error;
      }

      const { error: updateError } = await supabase
        .from('files')
        .update(updateData)
        .eq('id', fileId);

      if (updateError) {
        throw new Error(`Failed to update processing status: ${updateError.message}`);
      }
    } catch (error) {
      console.error('Update processing status error:', error);
      throw error;
    }
  }

  // Complete file upload and processing workflow
  static async processFileUpload(
    file: File, 
    contextId: string, 
    userId: string
  ): Promise<DatabaseFile> {
    console.log('Starting file upload and processing workflow for:', file.name);

    try {
      // Step 1: Validate file
      const validation = this.validateFile(file);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      // Step 2: Extract text content
      const content = await this.extractTextContent(file);

      // Step 3: Upload file to storage
      const filePath = await this.uploadFile(file, contextId, userId);

      // Step 4: Create file record with content
      const fileRecord = await this.createFileRecord({
        name: file.name,
        context_id: contextId,
        size: file.size,
        type: file.type,
        path: filePath,
        content: content
      });

      console.log('File upload and processing completed successfully:', fileRecord);
      return fileRecord;

    } catch (error) {
      console.error('File processing workflow error:', error);
      throw error;
    }
  }

  // Get file URL for download
  static async getFileUrl(path: string): Promise<string> {
    try {
      const { data } = supabase.storage
        .from('files')
        .getPublicUrl(path);

      return data.publicUrl;
    } catch (error) {
      console.error('Get file URL error:', error);
      throw new Error('Failed to get file URL');
    }
  }

  // Delete file from storage and database
  static async deleteFile(fileId: string, filePath?: string): Promise<void> {
    try {
      // Delete from database first
      const { error: dbError } = await supabase
        .from('files')
        .delete()
        .eq('id', fileId);

      if (dbError) {
        throw new Error(`Failed to delete file record: ${dbError.message}`);
      }

      // Delete from storage if path is provided
      if (filePath) {
        const { error: storageError } = await supabase.storage
          .from('files')
          .remove([filePath]);

        if (storageError) {
          console.error('Storage deletion error:', storageError);
          // Don't throw here as the database record is already deleted
        }
      }

      console.log('File deleted successfully:', fileId);
    } catch (error) {
      console.error('Delete file error:', error);
      throw error;
    }
  }

  // Search files by content
  static async searchFilesByContent(query: string, contextId?: string): Promise<DatabaseFile[]> {
    try {
      let queryBuilder = supabase
        .from('files')
        .select('*')
        .textSearch('content', query);

      if (contextId) {
        queryBuilder = queryBuilder.eq('context_id', contextId);
      }

      const { data, error } = await queryBuilder
        .eq('processing_status', 'completed')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to search files: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Search files error:', error);
      throw error;
    }
  }
}