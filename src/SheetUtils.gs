/**
 * Get the A1 notation of the currently selected range.
 */
function getActiveRangeA1() {
  var range = SpreadsheetApp.getActiveRange();
  if (!range) {
    throw new Error('No range is currently selected.');
  }
  var sheet = range.getSheet();
  return sheet.getName() + '!' + range.getA1Notation();
}

/**
 * Get the column headers (first row) from a given range.
 */
function getColumnHeaders(rangeA1) {
  var range = SpreadsheetApp.getActiveSpreadsheet().getRange(rangeA1);
  var firstRow = range.offset(0, 0, 1).getValues()[0];
  return firstRow.map(function(val) { return String(val); });
}

/**
 * Get all sheet names in the active spreadsheet.
 */
function getSheetNames() {
  return SpreadsheetApp.getActiveSpreadsheet()
    .getSheets()
    .map(function(s) { return s.getName(); });
}

/**
 * Convert a sheet range to an RFC 4180 CSV string.
 * First row is treated as headers.
 */
function rangeToCsv(rangeA1) {
  var range = SpreadsheetApp.getActiveSpreadsheet().getRange(rangeA1);
  var values = range.getValues();

  if (values.length < 2) {
    throw new Error('Range must have at least a header row and one data row.');
  }

  return values.map(function(row) {
    return row.map(csvEscapeCell_).join(',');
  }).join('\r\n');
}

/**
 * Convert a sheet range to CSV, excluding the specified column (used for test data).
 */
function rangeToCsvExcluding(rangeA1, excludeColumn) {
  var range = SpreadsheetApp.getActiveSpreadsheet().getRange(rangeA1);
  var values = range.getValues();

  if (values.length < 2) {
    throw new Error('Range must have at least a header row and one data row.');
  }

  var headers = values[0].map(function(v) { return String(v); });
  var excludeIdx = headers.indexOf(excludeColumn);

  return values.map(function(row) {
    return row.filter(function(_, idx) {
      return idx !== excludeIdx;
    }).map(csvEscapeCell_).join(',');
  }).join('\r\n');
}

/**
 * Escape a single cell value for CSV output per RFC 4180.
 * @private
 */
function csvEscapeCell_(value) {
  if (value instanceof Date) {
    return value.toISOString();
  }
  var str = String(value);
  if (str.indexOf(',') !== -1 || str.indexOf('"') !== -1 ||
      str.indexOf('\n') !== -1 || str.indexOf('\r') !== -1) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

/**
 * Write prediction results back to the sheet.
 * @param {Array} predictions - Array of prediction values (1D) or 2D array for probabilities.
 * @param {string} startCell - A1 notation of where to start writing (e.g., "Sheet1!F1").
 * @param {string|string[]} headerLabels - Column header(s) for the predictions.
 */
function writePredictions(predictions, startCell, headerLabels) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet();
  var range = sheet.getRange(startCell);
  var startRow = range.getRow();
  var startCol = range.getColumn();
  var targetSheet = range.getSheet();

  if (!Array.isArray(headerLabels)) {
    headerLabels = [headerLabels];
  }

  // Write headers
  for (var h = 0; h < headerLabels.length; h++) {
    targetSheet.getRange(startRow, startCol + h).setValue(headerLabels[h]);
  }

  // Write predictions
  if (predictions.length === 0) return;

  var is2D = Array.isArray(predictions[0]);
  var numCols = is2D ? predictions[0].length : 1;
  var numRows = predictions.length;

  var outputRange = targetSheet.getRange(startRow + 1, startCol, numRows, numCols);
  if (is2D) {
    outputRange.setValues(predictions);
  } else {
    outputRange.setValues(predictions.map(function(v) { return [v]; }));
  }
}
