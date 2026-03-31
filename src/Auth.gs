/**
 * Save the PriorLabs API key to script properties.
 */
function saveApiKey(key) {
  if (!key || !key.trim()) {
    throw new Error('API key cannot be empty.');
  }
  PropertiesService.getScriptProperties().setProperty('TABPFN_API_KEY', key.trim());
  return true;
}

/**
 * Retrieve the stored API key, or null if not set.
 */
function getApiKey() {
  return PropertiesService.getScriptProperties().getProperty('TABPFN_API_KEY');
}

/**
 * Delete the stored API key.
 */
function deleteApiKey() {
  PropertiesService.getScriptProperties().deleteProperty('TABPFN_API_KEY');
  return true;
}

/**
 * Check whether an API key is stored.
 */
function hasApiKey() {
  return !!getApiKey();
}
