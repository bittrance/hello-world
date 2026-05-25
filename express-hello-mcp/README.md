# express-hello-mcp

A minimal Express-based MCP server that exposes a `greet` tool. It uses OAuth2 bearer token authentication backed by AWS Cognito, with authorization code + PKCE flow.

## Architecture

```
Claude Code CLI  →  MCP endpoint (POST /mcp)
                        ↓
                   Bearer token verified against Cognito JWKS
                        ↓
                   greet tool (requires "greet" scope)
```

## Prerequisites

- Node.js 22+
- An AWS Cognito user pool with:
  - A resource server defining the `greet` scope
  - An app client configured for authorization code + PKCE flow
  - A managed login domain

Use the included Terraform config to provision all of this.

---

## Infrastructure setup (Terraform/OpenTofu)

```sh
cd express-hello-mcp
tofu init
tofu apply
```

Key variables (all have defaults, override as needed):

| Variable | Default | Description |
|---|---|---|
| `aws_region` | `eu-north-1` | AWS region |
| `domain_prefix` | `express-hello-mcp` | Cognito hosted UI subdomain (must be globally unique) |
| `mcp_resource_url` | `http://localhost:8080/mcp` | OAuth2 audience / resource identifier |
| `callback_urls` | `["http://localhost:9004/callback"]` | Allowed redirect URIs |

After `apply`, retrieve the values you'll need:

```sh
tofu output issuer          # → HELLO_WORLD_ISSUER
tofu output client_id
tofu output -raw client_secret
tofu output authorize_url
tofu output token_url
```

---

## Running locally

### 1. Build and start the server

```sh
npm install
npm run build
HELLO_WORLD_ISSUER=<issuer> npm start
```

`HELLO_WORLD_RESOURCE_URL` defaults to `http://localhost:8080/mcp` and can be left unset for local testing.

The server listens on **http://localhost:8080** and exposes:

| Path | Description |
|---|---|
| `GET /healthz` | Health check — returns `ok` |
| `GET /.well-known/oauth-protected-resource` | OAuth2 resource metadata (RFC 9728) |
| `POST /mcp` | MCP endpoint (requires bearer token) |

### 2. Obtain an access token

Use any OAuth2 client that supports authorization code + PKCE. With `oauth2c` for example:

```sh
oauth2c \
  --issuer <authorize_url> \
  --client-id <client_id> \
  --client-secret <client_secret> \
  --scopes openid,email,<mcp_resource_url>/greet \
  --grant-type authorization_code \
  --pkce \
  --callback-url http://localhost:9004/callback
```

### 3. Call the MCP endpoint manually

```sh
curl -s -X POST http://localhost:8080/mcp \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"greet","arguments":{"name":"Alice"}}}'
```

Expected response:

```json
{"result":{"content":[{"type":"text","text":"Hello, Alice! Welcome to the MCP server."}]}}
```

---

## Deploying to Kubernetes

### Build and push the image

```sh
docker build -t bittrance/hello-world:express-hello-mcp .
docker push bittrance/hello-world:express-hello-mcp
```

### Install with Helm

```sh
helm install express-hello-mcp ./chart \
  -n express-hello-mcp \
  --create-namespace \
  -f chart/values-production.yaml
```

The production values file sets the `issuer`, `resourceUrl`, ingress host, and ACM certificate ARN. Copy it and adjust for other environments:

```sh
cp chart/values-production.yaml chart/values-staging.yaml
# edit values-staging.yaml
helm install express-hello-mcp ./chart -n express-hello-mcp --create-namespace -f chart/values-staging.yaml
```

---

## Connecting from Claude Code CLI

Claude Code supports MCP servers that use OAuth2. Run:

```
/mcp add express-hello-mcp https://<ingress-host>/mcp
```

Claude Code will open a browser window to complete the authorization code flow. Once authenticated, the `greet` tool is available in your session.

To use the server locally instead:

```
/mcp add express-hello-mcp http://localhost:8080/mcp
```

Make sure the Cognito app client's `callback_urls` includes the redirect URI that Claude Code uses (default `http://localhost:9004/callback`).
