"""Verification of Clerk session tokens.

Clerk signs session tokens with RS256 and publishes the matching public keys at
its issuer's JWKS endpoint. Tokens are therefore verified here, in process, and
nothing on the request path calls out to Clerk once the key set is cached.
"""

from __future__ import annotations

import jwt
from anyio import to_thread
from jwt import PyJWKClient

from app.core.config import CLERK_AUTHORIZED_PARTIES, CLERK_ISSUER

# Clerk issues short-lived tokens and its frontend SDK refreshes them, so this
# only has to absorb clock drift between us and Clerk.
_LEEWAY_SECONDS = 10

# Caches the key set internally, so this is one fetch every few minutes rather
# than one per request.
_jwks = PyJWKClient(f"{CLERK_ISSUER}/.well-known/jwks.json")


class TokenError(Exception):
    """A session token was absent, malformed, expired, or not issued to us."""


async def clerk_user_id(token: str) -> str:
    """Return the Clerk user id that `token` proves, or raise TokenError."""
    try:
        # On a cache miss this fetches over the network with a blocking client.
        signing_key = await to_thread.run_sync(_jwks.get_signing_key_from_jwt, token)
        claims = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            issuer=CLERK_ISSUER,
            leeway=_LEEWAY_SECONDS,
            # Clerk session tokens carry no `aud`. The `azp` check below is the
            # equivalent guard, so requiring an audience here would reject
            # every real token.
            options={"verify_aud": False, "require": ["exp", "iat", "sub"]},
        )
    except jwt.PyJWTError as exc:
        raise TokenError(str(exc)) from exc

    # `azp` is the origin Clerk minted the token for. Without this, a token
    # issued to any other application on the same Clerk instance would be
    # accepted here.
    azp = claims.get("azp")
    if azp not in CLERK_AUTHORIZED_PARTIES:
        raise TokenError(f"Token was issued to {azp!r}, which is not an allowed origin")

    return claims["sub"]
