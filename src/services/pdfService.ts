import pdfParse from 'pdf-parse';

export class PDFService {
  /**
   * Extract text content from a PDF file
   */
  static async extractText(file: File): Promise<string> {
    try {
      // Convert File to ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      // Parse PDF
      const data = await pdfParse(buffer);
      
      if (!data.text || data.text.trim().length === 0) {
        throw new Error('No text content found in PDF');
      }
      
      return data.text;
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
      const buffer = Buffer.from(arrayBuffer);
      const data = await pdfParse(buffer);
      
      return {
        pages: data.numpages,
        title: data.info?.Title,
        author: data.info?.Author,
      };
    } catch (error) {
      console.error('Failed to get PDF metadata:', error);
      return { pages: 0 };
    }
  }
}