# Enterprise authentication & provisioning

Status of the enterprise identity features (roadmap Phase 2).

## OIDC / SSO — implemented (env-gated)
Single sign-on via OpenID Connect. Off by default; enable with `app.sso.enabled=true` plus a client
registration (see `application.properties` and `SsoController`). The login page shows the SSO button
only when the backend reports SSO is configured.

## SCIM 2.0 provisioning — implemented (token-gated)
Automatic user provisioning/deprovisioning from an IdP (Okta, Entra ID, etc.) via the SCIM 2.0
protocol (RFC 7644).

- Endpoint: `/scim/v2/Users` — `POST` (provision), `GET /{id}`, `GET ?filter=userName eq "..."`
  (search), `PATCH /{id}` (activate/deactivate), `DELETE /{id}` (deprovision → deactivate).
- Auth: its own bearer token, independent of the app JWT. Enable by setting `SCIM_TOKEN`
  (and optionally `SCIM_ORGANIZATION_ID`, default 1). Disabled — returns 503 — until the token is set.
- Provisioned users belong to the configured organization and authenticate via SSO (a random local
  password is set). Deprovisioning deactivates the account, preserving its history/attribution.
- In the IdP, set the SCIM Base URL to `https://<host>/scim/v2` and the bearer token to `SCIM_TOKEN`.

Covered by `ScimIntegrationTest` (token rejection + provision → search → deprovision lifecycle).

### Follow-up
- **Per-organization SCIM tokens.** The current implementation uses a single token → single org.
  Multi-org SaaS should issue a token per organization (e.g. a `ScimToken` entity mapping token → org)
  so each tenant provisions into its own org. Straightforward extension of `ScimController.authorize`.

## SAML 2.0 SSO — planned (not yet implemented)
SAML is a larger, IdP-dependent integration that can't be verified without a live IdP + certificates,
so it is deliberately deferred rather than shipped untested.

Recommended approach when scheduled:
1. Add `spring-security-saml2-service-provider`.
2. Configure a `RelyingPartyRegistration` from the IdP metadata (env-gated, mirroring the OIDC setup),
   with the SP entity id + ACS URL.
3. Add the SAML filter chain and map the SAML assertion → an `allUsers` account (reusing the same
   just-in-time user creation as OIDC).
4. Surface a "Sign in with SAML" button on the login page, gated on a `saml.enabled` status endpoint.

Most enterprises accept **OIDC + SCIM** (both present) for SSO + lifecycle management; SAML is the
remaining option for IdPs that don't offer OIDC.
