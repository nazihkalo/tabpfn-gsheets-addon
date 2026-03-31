/**
 * Fit a TabPFN model on training data from the sheet.
 * @param {string} trainRangeA1 - A1 notation of the training data range (including headers).
 * @param {string} targetColumn - Name of the target/label column.
 * @param {string} taskType - "classification" or "regression".
 * @returns {Object} { model_id, task }
 */
function fitModel(trainRangeA1, targetColumn, taskType) {
  var apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('No API key configured. Please set your PriorLabs API key first.');
  }

  var csvString = rangeToCsv(trainRangeA1);

  var jsonData = {
    task: taskType,
    schema: {
      target: targetColumn
    }
  };

  var response = fetchMultipart_(
    TABPFN_CONFIG.API_BASE_URL + TABPFN_CONFIG.FIT_ENDPOINT,
    apiKey,
    jsonData,
    'dataset_file',
    csvString,
    'dataset.csv'
  );

  var result = handleApiResponse_(response);

  // Store model info in script properties for the predict step
  var props = PropertiesService.getScriptProperties();
  props.setProperty('TABPFN_MODEL_ID', result.model_id);
  props.setProperty('TABPFN_TASK', result.task || taskType);
  props.setProperty('TABPFN_TARGET_COLUMN', targetColumn);
  var headers = getColumnHeaders(trainRangeA1);
  props.setProperty('TABPFN_TRAIN_HEADERS', JSON.stringify(headers));

  return {
    model_id: result.model_id,
    task: result.task || taskType
  };
}

/**
 * Predict using a previously fitted TabPFN model.
 * @param {string} testRangeA1 - A1 notation of the test data range (including headers, no target column).
 * @param {string} outputCell - A1 notation of where to write predictions (e.g., "Sheet1!F1").
 * @param {string} outputType - "probas", "preds", "mean", or "full".
 * @returns {Object} Summary info { rowCount, usedCredits, remainingQuota }
 */
function predictModel(testRangeA1, outputCell, outputType) {
  var apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('No API key configured. Please set your PriorLabs API key first.');
  }

  var props = PropertiesService.getScriptProperties();
  var modelId = props.getProperty('TABPFN_MODEL_ID');
  if (!modelId) {
    throw new Error('No model found. Please fit a model first.');
  }

  var task = props.getProperty('TABPFN_TASK') || 'classification';
  var csvString = rangeToCsv(testRangeA1);

  var jsonData = {
    model_id: modelId,
    task: task
  };

  if (outputType) {
    jsonData.params = { output_type: outputType };
  }

  var response = fetchMultipart_(
    TABPFN_CONFIG.API_BASE_URL + TABPFN_CONFIG.PREDICT_ENDPOINT,
    apiKey,
    jsonData,
    'file',
    csvString,
    'test.csv'
  );

  var result = handleApiResponse_(response);
  var predictions = result.prediction;

  // Determine header labels
  var headerLabels;
  if (Array.isArray(predictions[0])) {
    // 2D array (probabilities) — generate class headers
    headerLabels = predictions[0].map(function(_, i) { return 'Class_' + i + '_prob'; });
  } else {
    headerLabels = 'Prediction';
  }

  writePredictions(predictions, outputCell, headerLabels);

  return {
    rowCount: predictions.length,
    usedCredits: result.used_credits || 0,
    remainingQuota: result.remaining_quota || 0,
    task: result.task
  };
}

/**
 * Get stored model info (if any).
 */
function getStoredModelInfo() {
  var props = PropertiesService.getScriptProperties();
  var modelId = props.getProperty('TABPFN_MODEL_ID');
  if (!modelId) return null;
  return {
    model_id: modelId,
    task: props.getProperty('TABPFN_TASK'),
    targetColumn: props.getProperty('TABPFN_TARGET_COLUMN')
  };
}

/**
 * Clear stored model info.
 */
function clearStoredModel() {
  var props = PropertiesService.getScriptProperties();
  props.deleteProperty('TABPFN_MODEL_ID');
  props.deleteProperty('TABPFN_TASK');
  props.deleteProperty('TABPFN_TARGET_COLUMN');
  props.deleteProperty('TABPFN_TRAIN_HEADERS');
  return true;
}

/**
 * Build and send a multipart/form-data request where 'data' is a plain string field
 * and the file is a binary upload. Apps Script's built-in blob-in-object approach
 * sends 'data' as a file attachment, which the TabPFN API rejects.
 * @private
 */
function fetchMultipart_(url, apiKey, jsonData, fileFieldName, csvString, fileName) {
  var boundary = '----TabPFNBoundary' + Utilities.getUuid();
  var crlf = '\r\n';

  // 'data' field as a plain form field (no filename, content-type header for the part)
  var body = '--' + boundary + crlf;
  body += 'Content-Disposition: form-data; name="data"' + crlf;
  body += 'Content-Type: application/json' + crlf + crlf;
  body += JSON.stringify(jsonData) + crlf;

  // File field as a file upload
  body += '--' + boundary + crlf;
  body += 'Content-Disposition: form-data; name="' + fileFieldName + '"; filename="' + fileName + '"' + crlf;
  body += 'Content-Type: text/csv' + crlf + crlf;
  body += csvString + crlf;

  body += '--' + boundary + '--' + crlf;

  var options = {
    method: 'post',
    contentType: 'multipart/form-data; boundary=' + boundary,
    headers: { 'Authorization': 'Bearer ' + apiKey },
    payload: Utilities.newBlob(body).getBytes(),
    muteHttpExceptions: true
  };

  return UrlFetchApp.fetch(url, options);
}

/**
 * Parse API response and throw user-friendly errors for non-200 responses.
 * @private
 */
function handleApiResponse_(response) {
  var code = response.getResponseCode();
  var body = response.getContentText();

  if (code === 200) {
    return JSON.parse(body);
  }

  var detail = '';
  try {
    var errorJson = JSON.parse(body);
    detail = errorJson.detail || errorJson.message || JSON.stringify(errorJson);
  } catch (e) {
    detail = body;
  }

  switch (code) {
    case 401:
      throw new Error('Invalid API key. Please check your key in Settings. (' + detail + ')');
    case 403:
      throw new Error('Access denied. Please verify your account at ' + TABPFN_CONFIG.SIGNUP_URL + '. (' + detail + ')');
    case 404:
      throw new Error('Model not found. It may have expired — please fit a new model. (' + detail + ')');
    case 422:
      throw new Error('Invalid request: ' + detail);
    case 429:
      throw new Error('Rate limit exceeded. Please wait and try again. (' + detail + ')');
    default:
      throw new Error('TabPFN API error (' + code + '): ' + detail);
  }
}
