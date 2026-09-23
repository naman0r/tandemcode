"""Reads a user's profile from Clerk rather than from the client.

A session token proves who the caller is but carries neither email nor name, so
those used to arrive in the request body. That let any signed-in user register
under someone else's email and occupy it through the UNIQUE constraint. Asking
Clerk directly removes the client from the loop entirely.
"""

from __future__ import annotations

import httpx

from app.core.config import CLERK_SECRET_KEY

_USERS_ENDPOINT = "https://api.clerk.com/v1/users"


class ClerkProfileError(Exception):
    """Clerk could not tell us who this user is."""


def _primary_email(payload: dict) -> str:
    addresses = payload.get("email_addresses") or []
    primary_id = payload.get("primary_email_address_id")
    for address in addresses:
        if address.get("id") == primary_id:
            return address["email_address"]
    if addresses:
        return addresses[0]["email_address"]
    raise ClerkProfileError(f"Clerk user {payload.get('id')!r} has no email address")


def _display_name(payload: dict) -> str:
    parts = [payload.get("first_name"), payload.get("last_name")]
    full_name = " ".join(part for part in parts if part).strip()
    # Names are shown to everyone in a room and on the room list, so the
    # fallback must not be the front of an email address.
    return full_name or payload.get("username") or f"User {str(payload.get('id', ''))[-4:]}"


async def fetch_profile(user_id: str) -> tuple[str, str]:
    """The (email, display name) Clerk holds for `user_id`."""
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(
                f"{_USERS_ENDPOINT}/{user_id}",
                headers={"Authorization": f"Bearer {CLERK_SECRET_KEY}"},
            )
            response.raise_for_status()
            payload = response.json()
    except httpx.HTTPError as exc:
        raise ClerkProfileError(f"Could not read Clerk profile for {user_id}: {exc}") from exc

    email = _primary_email(payload)
    return email, _display_name(payload)
