import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";

// Cache Graph tokens in-memory (shared across invocations in the same instance)
let cachedToken: { token: string; expiresAt: number } | null = null;

/**
 * GET /api/user-photo
 *
 * Proxies the authenticated user's profile photo from Microsoft Graph.
 * Uses client credentials flow (app-only) — requires User.Read.All permission.
 *
 * SWA injects x-ms-client-principal header with the authenticated user's claims.
 * We extract the email, then call Graph to fetch the photo.
 *
 * Returns:
 *   200 + image/jpeg body   — photo found
 *   204                     — user has no photo set
 *   401                     — not authenticated
 *   500                     — Graph/token error (logged server-side, silent to client)
 */
async function userPhotoHandler(
    request: HttpRequest,
    context: InvocationContext
): Promise<HttpResponseInit> {
    try {
        // ── 1. Extract user email from SWA auth header ──
        const principalHeader = request.headers.get("x-ms-client-principal");
        if (!principalHeader) {
            return { status: 401, jsonBody: { error: "Not authenticated" } };
        }

        let email: string | null = null;
        try {
            const decoded = JSON.parse(Buffer.from(principalHeader, "base64").toString("utf-8"));
            // SWA puts email in userDetails for AAD provider
            email = decoded.userDetails || null;
            // Fallback: check claims for preferred_username or email
            if (!email && decoded.claims) {
                const emailClaim = decoded.claims.find(
                    (c: any) => c.typ === "preferred_username" || c.typ === "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"
                );
                if (emailClaim) email = emailClaim.val;
            }
        } catch {
            return { status: 401, jsonBody: { error: "Invalid principal" } };
        }

        if (!email) {
            return { status: 401, jsonBody: { error: "No email in principal" } };
        }

        // ── 2. Get Graph access token (client credentials) ──
        const tenantId = process.env.AZURE_TENANT_ID;
        const clientId = process.env.AZURE_CLIENT_ID;
        const clientSecret = process.env.AZURE_CLIENT_SECRET;

        if (!tenantId || !clientId || !clientSecret) {
            context.warn("[user-photo] Missing AZURE_TENANT_ID, AZURE_CLIENT_ID, or AZURE_CLIENT_SECRET");
            return { status: 204 }; // Silent fail — avatar falls back to initials
        }

        const graphToken = await getGraphToken(tenantId, clientId, clientSecret, context);
        if (!graphToken) {
            return { status: 204 }; // Silent fail
        }

        // ── 3. Fetch photo from Graph ──
        const graphRes = await fetch(
            `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(email)}/photo/$value`,
            {
                headers: { Authorization: `Bearer ${graphToken}` },
            }
        );

        if (!graphRes.ok) {
            if (graphRes.status === 404) {
                // User has no photo set — not an error
                return { status: 204 };
            }
            context.warn(`[user-photo] Graph returned ${graphRes.status} for ${email}`);
            return { status: 204 }; // Silent fail
        }

        // ── 4. Proxy the image bytes ──
        const imageBuffer = Buffer.from(await graphRes.arrayBuffer());
        const contentType = graphRes.headers.get("content-type") || "image/jpeg";

        return {
            status: 200,
            headers: {
                "Content-Type": contentType,
                "Cache-Control": "private, max-age=3600", // Cache 1h in browser
            },
            body: imageBuffer,
        };
    } catch (error: any) {
        context.error(`[user-photo] Unexpected error: ${error.message}`);
        return { status: 204 }; // Silent fail — initials fallback
    }
}

/**
 * Get a Microsoft Graph access token using client credentials flow.
 * Caches the token in-memory until 5 minutes before expiry.
 */
async function getGraphToken(
    tenantId: string,
    clientId: string,
    clientSecret: string,
    context: InvocationContext
): Promise<string | null> {
    // Return cached token if still valid (with 5-min buffer)
    if (cachedToken && Date.now() < cachedToken.expiresAt - 300_000) {
        return cachedToken.token;
    }

    try {
        const tokenRes = await fetch(
            `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
            {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams({
                    grant_type: "client_credentials",
                    client_id: clientId,
                    client_secret: clientSecret,
                    scope: "https://graph.microsoft.com/.default",
                }),
            }
        );

        if (!tokenRes.ok) {
            const errBody = await tokenRes.text().catch(() => "");
            context.warn(`[user-photo] Token request failed (${tokenRes.status}): ${errBody}`);
            return null;
        }

        const tokenData = await tokenRes.json() as { access_token: string; expires_in: number };
        cachedToken = {
            token: tokenData.access_token,
            expiresAt: Date.now() + tokenData.expires_in * 1000,
        };

        return cachedToken.token;
    } catch (err: any) {
        context.warn(`[user-photo] Token fetch error: ${err.message}`);
        return null;
    }
}

app.http("userPhoto", {
    methods: ["GET"],
    authLevel: "anonymous",
    route: "user-photo",
    handler: userPhotoHandler,
});