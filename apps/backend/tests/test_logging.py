"""Access logs must not hand out session tokens."""

from __future__ import annotations

import logging

from app.core.logging import RedactTokens


def test_tokens_are_cut_from_access_log_lines():
    record = logging.LogRecord(
        "uvicorn.access", logging.INFO, "", 0,
        '%s - "WebSocket %s" %s',
        ("1.2.3.4:5", "/ws/room/r1?token=eyJhbGciOi.secret.sig&x=1", "[accepted]"),
        None,
    )
    assert RedactTokens().filter(record) is True
    line = record.getMessage()
    assert "secret" not in line
    assert 'WebSocket /ws/room/r1?token=[redacted]&x=1' in line
