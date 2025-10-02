import { PDFDocument } from 'pdf-lib';

export async function analyzePDFTemplate() {
  try {
    const templateUrl = '/templates/template.pdf';
    const response = await fetch(templateUrl);
    const templateBytes = await response.arrayBuffer();

    const templatePdf = await PDFDocument.load(templateBytes, {
      ignoreEncryption: true,
      updateMetadata: false
    });

    const page = templatePdf.getPages()[0];
    const { width, height } = page.getSize();

    console.log('=== PDF TEMPLATE ANALYSIS ===');
    console.log('Page Size:', { width, height });
    console.log('');
    console.log('Coordinate System:');
    console.log('- X axis: 0 (left) to', width, '(right)');
    console.log('- Y axis: 0 (bottom) to', height, '(top)');
    console.log('');
    console.log('Common positions:');
    console.log('Top-left corner: { x: 0, y:', height, '}');
    console.log('Top-right corner: { x:', width, ', y:', height, '}');
    console.log('Bottom-left corner: { x: 0, y: 0 }');
    console.log('Bottom-right corner: { x:', width, ', y: 0 }');
    console.log('Center: { x:', width / 2, ', y:', height / 2, '}');
    console.log('');
    console.log('To find text positions, you can:');
    console.log('1. Measure from the PDF viewer (most PDF viewers show cursor position)');
    console.log('2. Or use trial and error with these coordinates');

    return { width, height };
  } catch (error) {
    console.error('Error analyzing template:', error);
    throw error;
  }
}
