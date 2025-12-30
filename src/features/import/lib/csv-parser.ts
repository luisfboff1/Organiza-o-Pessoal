import Papa from 'papaparse';

export interface ParsedCSV {
  headers: string[];
  rows: Record<string, any>[];
  preview: Record<string, any>[];
}

export async function parseCSV(file: File): Promise<ParsedCSV> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const headers = results.meta.fields || [];
        const rows = results.data as Record<string, any>[];
        const preview = rows.slice(0, 50);

        resolve({ headers, rows, preview });
      },
      error: (error) => {
        reject(error);
      },
    });
  });
}
