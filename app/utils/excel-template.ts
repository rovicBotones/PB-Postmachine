import * as XLSX from 'xlsx';

export function createExcelTemplate() {
  // Create workbook
  const wb = XLSX.utils.book_new();

  // Create worksheet data with headers
  const data = [
    ['caseno', 'name', 'dateofhearing'],
    ['CASE-2024-001', 'John Doe', '01/15/2025'],
    ['CASE-2024-002', 'Jane Smith', '01/16/2025'],
    ['CASE-2024-003', 'Bob Johnson', '01/17/2025'],
  ];

  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(data);

  // Set column widths
  ws['!cols'] = [
    { wch: 15 }, // caseno
    { wch: 25 }, // name
    { wch: 15 }, // dateofhearing
  ];

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Cases');

  // Generate buffer
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

  return wbout;
}

export function downloadExcelTemplate() {
  const buffer = createExcelTemplate();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'cases_template.xlsx';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export interface CaseData {
  caseno: string;
  name: string;
  dateofhearing: string;
}

export function parseExcelFile(file: File): Promise<CaseData[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });

        // Get first worksheet
        const worksheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[worksheetName];

        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as CaseData[];

        resolve(jsonData);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsArrayBuffer(file);
  });
}
