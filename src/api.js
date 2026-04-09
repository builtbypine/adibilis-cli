import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const DEFAULT_BASE_URL = 'https://adibilis-api-production.up.railway.app';
const CONFIG_DIR = path.join(os.homedir(), '.adibilis');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 120000;

export function getBaseUrl() {
  return process.env.ADIBILIS_API_URL || DEFAULT_BASE_URL;
}

export function getApiKey(flagValue) {
  if (flagValue) return flagValue;
  if (process.env.ADIBILIS_API_KEY) return process.env.ADIBILIS_API_KEY;
  return readStoredApiKey();
}

export function readStoredApiKey() {
  try {
    const data = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
    return data.apiKey || null;
  } catch {
    return null;
  }
}

export function saveApiKey(apiKey) {
  fs.mkdirSync(CONFIG_DIR, { recursive: true, mode: 0o700 });
  fs.writeFileSync(CONFIG_FILE, JSON.stringify({ apiKey }, null, 2) + '\n', 'utf-8');
  fs.chmodSync(CONFIG_FILE, 0o600);
}

const RETRYABLE_STATUSES = [429, 502, 503, 504];
const MAX_RETRIES = 3;

async function fetchWithRetry(url, options = {}) {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const response = await fetch(url, options);

    if (!RETRYABLE_STATUSES.includes(response.status) || attempt === MAX_RETRIES) {
      return response;
    }

    let delay;
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      delay = retryAfter ? parseInt(retryAfter, 10) * 1000 : 5000;
    } else {
      delay = Math.pow(2, attempt) * 1000;
    }

    await new Promise((r) => setTimeout(r, delay));
  }
}

export async function submitScan(url, options = {}) {
  const baseUrl = getBaseUrl();
  const apiKey = getApiKey(options.apiKey);

  const headers = { 'Content-Type': 'application/json' };
  let endpoint;
  let body;

  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
    endpoint = `${baseUrl}/scans`;
    body = JSON.stringify({ url, pages: options.pages });
  } else {
    endpoint = `${baseUrl}/scan`;
    body = JSON.stringify({ url });
  }

  const res = await fetchWithRetry(endpoint, { method: 'POST', headers, body });

  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error(`Invalid JSON response from server (HTTP ${res.status})`);
  }

  if (!res.ok) {
    const message = data.error || `HTTP ${res.status}`;
    throw new Error(message);
  }

  return data;
}

export async function pollScan(scanId, { apiKey, onProgress } = {}) {
  const baseUrl = getBaseUrl();
  const key = getApiKey(apiKey);

  const headers = {};
  let endpoint;

  if (key) {
    headers['Authorization'] = `Bearer ${key}`;
    endpoint = `${baseUrl}/scans/${scanId}`;
  } else {
    endpoint = `${baseUrl}/scan/${scanId}`;
  }

  const started = Date.now();

  while (true) {
    if (Date.now() - started > POLL_TIMEOUT_MS) {
      throw new Error('Scan timed out after 2 minutes');
    }

    let res;
    try {
      res = await fetchWithRetry(endpoint, { headers });
    } catch (err) {
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
      continue;
    }

    let data;
    try {
      data = await res.json();
    } catch {
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
      continue;
    }

    if (!res.ok) {
      throw new Error(data.error || `HTTP ${res.status}`);
    }

    if (onProgress) onProgress(data);

    if (data.status === 'completed' || data.status === 'failed') {
      return data;
    }

    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
}

export async function fetchFixes(scanId, { apiKey } = {}) {
  const baseUrl = getBaseUrl();
  const key = getApiKey(apiKey);

  if (!key) {
    return null;
  }

  const headers = { Authorization: `Bearer ${key}` };
  const res = await fetch(`${baseUrl}/scans/${scanId}/fixes`, { headers });

  if (!res.ok) return null;
  return res.json();
}

export async function fetchReport(scanId, { apiKey } = {}) {
  const baseUrl = getBaseUrl();
  const key = getApiKey(apiKey);

  const headers = {};
  let endpoint;

  if (key) {
    headers['Authorization'] = `Bearer ${key}`;
    endpoint = `${baseUrl}/scans/${scanId}/report`;
  } else {
    endpoint = `${baseUrl}/scan/${scanId}/report/pdf`;
  }

  const res = await fetch(endpoint, { headers });

  if (!res.ok) {
    throw new Error('Report not available');
  }

  return {
    contentType: res.headers.get('content-type'),
    body: await res.text(),
  };
}
