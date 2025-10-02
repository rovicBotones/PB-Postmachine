import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import type { CaseData } from './excel-template';

export async function generatePDFFromTemplate(cases: CaseData[]): Promise<Uint8Array> {
  try {
    console.log('Starting PDF generation for', cases.length, 'cases');

    // Load the template PDF
    const templateUrl = '/templates/template.pdf';
    console.log('Fetching template from:', templateUrl);

    const response = await fetch(templateUrl);
    if (!response.ok) {
      throw new Error(`Failed to load template: ${response.status} ${response.statusText}`);
    }

    const templateBytes = await response.arrayBuffer();
    console.log('Template loaded, size:', templateBytes.byteLength, 'bytes');

    // Load the template with update metadata option
    const templatePdf = await PDFDocument.load(templateBytes, {
      ignoreEncryption: true,
      updateMetadata: false
    });
    console.log('Template PDF loaded successfully');

    const templatePages = templatePdf.getPageCount();
    console.log('Template has', templatePages, 'page(s)');

    // Process each case (each row generates one page)
    for (let i = 0; i < cases.length; i++) {
      const caseData = cases[i];
      console.log(`Processing case ${i + 1}/${cases.length}:`, caseData);

      // Get the first page as template
      const page = templatePdf.getPages()[0];
      const { width, height } = page.getSize();
      console.log('Page dimensions:', { width, height });

      // Embed font in the template document
      const font = await templatePdf.embedFont(StandardFonts.Helvetica);
      console.log('Font embedded');

      // Define field positions to match template labels:
      // "Case No. :"
      // "Date of Hearing :"
      // "Applicant(s) :"
      // Adjust these x/y values based on your template layout
      const fields = {
        caseNumber: {
          x: 320,  // Adjust: X position after "Case No. :"
          y: height - 100,  // Adjust: Y position from top
          text: String(caseData.caseno || ''),
        },
        dateOfHearing: {
          x: 150,  // Adjust: X position after "Date of Hearing :"
          y: height - 130,  // Adjust: Y position from top
          text: String(caseData.dateofhearing || ''),
        },
        applicant: {
          x: 130,  // Adjust: X position after "Applicant(s) :"
          y: height - 160,  // Adjust: Y position from top
          text: String(caseData.name || ''),
        },
      };

      // Draw the text on the page in order: Case No., Date of Hearing, Applicant(s)
      console.log('Drawing text fields...');

      // Case No.
      page.drawText(fields.caseNumber.text, {
        x: fields.caseNumber.x,
        y: fields.caseNumber.y,
        size: 11,
        font: font,
        color: rgb(0, 0, 0),
      });

      // Date of Hearing
      page.drawText(fields.dateOfHearing.text, {
        x: fields.dateOfHearing.x,
        y: fields.dateOfHearing.y,
        size: 11,
        font: font,
        color: rgb(0, 0, 0),
      });

      // Applicant(s)
      page.drawText(fields.applicant.text, {
        x: fields.applicant.x,
        y: fields.applicant.y,
        size: 11,
        font: font,
        color: rgb(0, 0, 0),
      });

      console.log(`Case ${i + 1} completed`);

      // If there are more cases, duplicate the page for the next iteration
      if (i < cases.length - 1) {
        const [copiedPage] = await templatePdf.copyPages(templatePdf, [0]);
        templatePdf.addPage(copiedPage);
      }
    }

    // Serialize the PDF to bytes
    console.log('Saving PDF...');
    const pdfBytes = await templatePdf.save();
    console.log('PDF saved successfully, size:', pdfBytes.length, 'bytes');
    return pdfBytes;
  } catch (error) {
    console.error('Error in generatePDFFromTemplate:', error);
    throw error;
  }
}

export function downloadPDF(pdfBytes: Uint8Array, filename: string = 'cases_output.pdf') {
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Helper function to find text positions in PDF (for debugging/setup)
export async function analyzeTemplate(): Promise<void> {
  const templateUrl = '/templates/template.pdf';
  const templateBytes = await fetch(templateUrl).then(res => res.arrayBuffer());
  const templatePdf = await PDFDocument.load(templateBytes);

  const page = templatePdf.getPages()[0];
  const { width, height } = page.getSize();

  console.log('PDF Template Analysis:');
  console.log('Page dimensions:', { width, height });
  console.log('Note: Y coordinates start from bottom (0) to top (height)');
  console.log('Adjust the x/y coordinates in generatePDFFromTemplate() based on your template layout');
}
