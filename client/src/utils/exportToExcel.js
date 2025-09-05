// client/src/utils/exportToExcel.js
import * as XLSX from 'xlsx';

/**
 * Export files to an Excel file.
 * @param {Array<object>} data - Array of file objects.
 * @param {Object} options
 * @param {string} [options.filename='files_report.xlsx'] - Output filename.
 * @param {Array<string>} [options.columns] - Optional subset and order of columns.
 * @param {Function} [options.mapRow] - Optional mapper to flatten/shape each row.
 */
export function exportFilesToExcel(
  data,
  { filename = 'files_report.xlsx', columns, mapRow } = {}
) {
  // Ensure non-empty data, but create a simple sheet even if empty
  if (!Array.isArray(data) || data.length === 0) {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([["No data"]]);
    XLSX.utils.book_append_sheet(wb, ws, 'Report');
    XLSX.writeFile(wb, filename);
    return;
  }

  const defaultMapRow = (row) => {
    const downloadsCount = Array.isArray(row.downloads)
      ? row.downloads.length
      : row.downloadCount || 0;
    const assignedToCount = Array.isArray(row.assignedTo)
      ? row.assignedTo.length
      : 0;

    return {
      'File Name': row.originalName || '',
      'Size (bytes)': row.size ?? '',
      'Send Date': row.createdAt ? new Date(row.createdAt).toLocaleString() : '',
      'Status': row.status || 'Pending',
      'Downloads': downloadsCount,
      'Type': row.mimetype || '',
      'Uploaded By': row.uploadedBy?.name || row.uploadedBy?.email || '',
      'Assigned To (count)': assignedToCount,
      'File ID': row._id || row.id || '',
    };
  };

  const mapped = data.map(mapRow || defaultMapRow);

  const output =
    columns && columns.length
      ? mapped.map((r) => {
          const obj = {};
          columns.forEach((c) => {
            obj[c] = r[c];
          });
          return obj;
        })
      : mapped;

  const ws = XLSX.utils.json_to_sheet(output);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Report');

  // Auto-size columns
  const colWidths = Object.keys(output[0]).map((key) => {
    const maxLen = output.reduce((max, row) => {
      const v = row[key] == null ? '' : String(row[key]);
      return Math.max(max, v.length);
    }, key.length);
    return { wch: Math.min(Math.max(maxLen + 2, 10), 60) };
  });
  ws['!cols'] = colWidths;

  XLSX.writeFile(wb, filename);
}