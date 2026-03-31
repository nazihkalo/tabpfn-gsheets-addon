/**
 * Adds the TabPFN menu to the Google Sheets UI when the spreadsheet opens.
 */
function onOpen(e) {
  SpreadsheetApp.getUi()
    .createMenu('TabPFN')
    .addItem('Open Sidebar', 'showSidebar')
    .addSeparator()
    .addItem('Clear Stored Model', 'clearStoredModel')
    .addToUi();
}

/**
 * Opens the TabPFN sidebar.
 */
function showSidebar() {
  var html = HtmlService.createHtmlOutputFromFile('Sidebar')
    .setTitle('TabPFN Predictions');
  SpreadsheetApp.getUi().showSidebar(html);
}
