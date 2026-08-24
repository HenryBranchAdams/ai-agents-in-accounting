const DEFAULT_ORIGIN = "https://accounting-agents.madebyhenry.chatgpt.site";

export class AccountingAgentsClient {
  constructor({ origin = DEFAULT_ORIGIN, fetchImpl = globalThis.fetch } = {}) {
    if (typeof fetchImpl !== "function") throw new TypeError("A Fetch-compatible function is required.");
    this.origin = origin.replace(/\/$/, "");
    this.fetchImpl = fetchImpl;
  }

  async request(path, parameters = {}) {
    const url = new URL(path, `${this.origin}/`);
    for (const [key, value] of Object.entries(parameters)) {
      if (value === undefined || value === null || value === "") continue;
      if (Array.isArray(value)) value.forEach((item) => url.searchParams.append(key, String(item)));
      else url.searchParams.set(key, String(value));
    }
    const response = await this.fetchImpl(url, { headers: { Accept: "application/json" } });
    if (!response.ok) {
      const problem = await response.json().catch(() => ({ title: response.statusText }));
      const error = new Error(problem.detail ?? problem.title ?? `HTTP ${response.status}`);
      error.status = response.status;
      error.problem = problem;
      throw error;
    }
    return response.json();
  }

  meta() {
    return this.request("/api/v1/meta");
  }

  search(query, options = {}) {
    return this.request("/api/v1/search", { q: query, ...options });
  }

  workflows(options = {}) {
    return this.request("/api/v1/workflows", options);
  }

  workflow(id) {
    return this.request(`/api/v1/workflows/${encodeURIComponent(id)}`);
  }

  packs(options = {}) {
    return this.request("/api/v1/packs", options);
  }

  pack(id) {
    return this.request(`/api/v1/packs/${encodeURIComponent(id)}`);
  }

  benchmark(options = {}) {
    return this.request("/api/v1/benchmark", options);
  }

  resources(options = {}) {
    return this.request("/api/v1/resources", options);
  }
}

export default AccountingAgentsClient;
