import express, { Request, Response } from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { requireBearerAuth } from '@modelcontextprotocol/sdk/server/auth/middleware/bearerAuth.js';
import { z } from 'zod';
import { JwtTokenVerifier } from './auth.js';

const issuer = process.env['HELLO_WORLD_ISSUER'];
if (!issuer) {
  console.error('HELLO_WORLD_ISSUER env var is required');
  process.exit(1);
}

// Canonical URI of this MCP server, used as the OAuth2 audience and in resource metadata.
const resourceUrl = process.env['HELLO_WORLD_RESOURCE_URL'] ?? 'http://localhost:8080/mcp';
const metadataUrl = `${new URL(resourceUrl).origin}/.well-known/oauth-protected-resource`;

const verifier = new JwtTokenVerifier(issuer, resourceUrl);

function makeServer(): McpServer {
  const server = new McpServer({
    name: 'express-hello-mcp',
    version: '1.0.0',
  });

  server.tool(
    'greet',
    'Returns a greeting for the given name',
    { name: z.string().describe('The name to greet') },
    async ({ name }, extra) => {
      if (!extra.authInfo?.scopes.includes('greet')) {
        return {
          content: [{ type: 'text', text: 'insufficient_scope: the "greet" scope is required' }],
          isError: true,
        };
      }
      return {
        content: [{ type: 'text', text: `Hello, ${name}! Welcome to the MCP server.` }],
      };
    }
  );

  return server;
}

const app = express();
app.use(express.json());

app.get('/healthz', (_req: Request, res: Response) => {
  res.send('ok');
});

// RFC 9728 – OAuth 2.0 Protected Resource Metadata
app.get('/.well-known/oauth-protected-resource', (_req: Request, res: Response) => {
  res.json({
    resource: resourceUrl,
    authorization_servers: [issuer],
    scopes_supported: ['greet'],
  });
});

app.post(
  '/mcp',
  requireBearerAuth({ verifier, resourceMetadataUrl: metadataUrl }),
  async (req: Request, res: Response) => {
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    const server = makeServer();
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
    await server.close();
  }
);

app.listen(8080, () => {
  console.log('MCP server listening on http://localhost:8080/mcp');
});
