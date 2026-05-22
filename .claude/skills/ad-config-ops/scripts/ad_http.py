from __future__ import annotations

import base64
import json
import ssl
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

try:
    import requests as _requests
except ImportError:
    _requests = None


def normalize_base_url(value: str) -> str:
    base = (value or "").strip()
    if not base:
        raise ValueError("AD host/base URL is required")
    if "://" not in base:
        base = "https://" + base
    return base.rstrip("/")


class UrllibResponse:
    def __init__(self, status_code: int, text: str):
        self.status_code = status_code
        self.text = text

    @property
    def ok(self) -> bool:
        return self.status_code < 400

    def json(self) -> Any:
        return json.loads(self.text)


class UrllibSession:
    def __init__(self) -> None:
        self.verify = True
        self.auth: tuple[str, str] | None = None
        self.headers: dict[str, str] = {}

    def request(self, method: str, url: str, **kwargs: Any) -> UrllibResponse:
        params = kwargs.get("params") or {}
        payload = kwargs.get("json")
        timeout_arg = kwargs.get("timeout", (5, 30))
        timeout = timeout_arg[1] if isinstance(timeout_arg, tuple) else timeout_arg
        if params:
            url = url + ("&" if "?" in url else "?") + urlencode(params)
        body = None
        headers = {"Accept": "application/json", **self.headers}
        if payload is not None:
            body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
            headers["Content-Type"] = "application/json"
        if self.auth:
            raw = f"{self.auth[0]}:{self.auth[1]}".encode("utf-8")
            headers["Authorization"] = "Basic " + base64.b64encode(raw).decode("ascii")
        req = Request(url, data=body, headers=headers, method=method.upper())
        context = ssl._create_unverified_context() if self.verify is False else None
        try:
            with urlopen(req, timeout=timeout, context=context) as response:
                text = response.read().decode("utf-8", errors="replace")
                return UrllibResponse(getattr(response, "status", 200), text)
        except HTTPError as exc:
            text = exc.read().decode("utf-8", errors="replace")
            return UrllibResponse(exc.code, text)
        except URLError as exc:
            raise RuntimeError(str(exc)) from exc

    def get(self, url: str, **kwargs: Any) -> UrllibResponse:
        return self.request("GET", url, **kwargs)


class RequestsCompat:
    Session = UrllibSession


requests = _requests or RequestsCompat()

