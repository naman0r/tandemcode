"""Session tokens travel in websocket query strings, which uvicorn's access log
prints in full. A token is only good for a minute, but a log line lives longer
than that, so the token is cut out before the line is written."""

from __future__ import annotations

import logging
import re

TOKEN_PATTERN = re.compile(r"(token=)[^&\s\"]+")


def redact_tokens(text: str) -> str:
    return TOKEN_PATTERN.sub(r"\1[redacted]", text)


class RedactTokens(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        if isinstance(record.msg, str):
            record.msg = redact_tokens(record.msg)
        if isinstance(record.args, tuple):
            record.args = tuple(
                redact_tokens(arg) if isinstance(arg, str) else arg for arg in record.args
            )
        return True


def install() -> None:
    logging.getLogger("uvicorn.access").addFilter(RedactTokens())
