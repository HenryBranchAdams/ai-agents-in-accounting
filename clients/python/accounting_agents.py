"""Zero-dependency client for the public Accounting Agents corpus."""

from __future__ import annotations

import json
from urllib.error import HTTPError
from urllib.parse import urlencode, quote
from urllib.request import Request, urlopen


class AccountingAgentsError(RuntimeError):
    def __init__(self, status: int, problem: dict):
        super().__init__(problem.get("detail") or problem.get("title") or f"HTTP {status}")
        self.status = status
        self.problem = problem


class AccountingAgentsClient:
    def __init__(self, origin: str = "https://accounting-agents.madebyhenry.chatgpt.site", timeout: float = 20.0):
        self.origin = origin.rstrip("/")
        self.timeout = timeout

    def _get(self, path: str, **parameters):
        query = urlencode([(key, item) for key, value in parameters.items() if value not in (None, "") for item in (value if isinstance(value, (list, tuple)) else [value])])
        url = f"{self.origin}{path}{'?' + query if query else ''}"
        request = Request(url, headers={"Accept": "application/json", "User-Agent": "accounting-agents-python/1.0"})
        try:
            with urlopen(request, timeout=self.timeout) as response:
                return json.load(response)
        except HTTPError as error:
            try:
                problem = json.load(error)
            except (ValueError, TypeError):
                problem = {"title": error.reason}
            raise AccountingAgentsError(error.code, problem) from error

    def meta(self):
        return self._get("/api/v1/meta")

    def search(self, query: str, **options):
        return self._get("/api/v1/search", q=query, **options)

    def workflows(self, **options):
        return self._get("/api/v1/workflows", **options)

    def workflow(self, workflow_id: str):
        return self._get(f"/api/v1/workflows/{quote(workflow_id, safe='')}")

    def packs(self, **options):
        return self._get("/api/v1/packs", **options)

    def pack(self, pack_id: str):
        return self._get(f"/api/v1/packs/{quote(pack_id, safe='')}")

    def benchmark(self, **options):
        return self._get("/api/v1/benchmark", **options)

    def resources(self, **options):
        return self._get("/api/v1/resources", **options)
