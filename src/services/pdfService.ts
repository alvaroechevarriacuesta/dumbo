import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.js?url';

// Set up the worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export class PDFService {
  /**
   * Extract text content from a PDF file
   */
  static async extractText(file: File): Promise<string> {
    try {
      // Convert File to ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      
      // Load PDF document
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      let fullText = '';
      
      // Extract text from each page
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        // Combine text items into a single string
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        
        fullText += pageText + '\n';
      }
      
      if (!fullText || fullText.trim().length === 0) {
        throw new Error('No text content found in PDF');
      }
      
      return fullText.trim();
    } catch (error) {
      console.error('PDF parsing error:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to extract text from PDF: ${error.message}`);
      }
      throw new Error('Failed to extract text from PDF');
    }
  }

  /**
   * Validate if file is a PDF
   */
  static isPDF(file: File): boolean {
    return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  }

  /**
   * Get PDF metadata
   */
  static async getMetadata(file: File): Promise<{ pages: number; title?: string; author?: string }> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      // Get metadata
      const metadata = await pdf.getMetadata();
      
      return {
        pages: pdf.numPages,
        title: metadata.info?.Title,
        author: metadata.info?.Author,
      };
    } catch (error) {
      console.error('Failed to get PDF metadata:', error);
      return { pages: 0 };
    }
  }
}