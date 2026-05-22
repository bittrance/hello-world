import express, { Request, Response } from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';

function makeServer(): McpServer {
  const server = new McpServer({
    name: 'express-hello-mcp',
    version: '1.0.0',
  });

  server.tool(
    'greet',
    'Returns a greeting for the given name',
    { name: z.string().describe('The name to greet') },
    async ({ name }) => ({
      content: [{ type: 'text', text: `Hello, ${name}! Welcome to the MCP server.` }],
    })
  );

  return server;
}

const app = express();
app.use(express.json());

app.post('/mcp', async (req: Request, res: Response) => {
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  const server = makeServer();
  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
  await server.close();
});

app.listen(8080, () => {
  console.log('MCP server listening on http://localhost:8080/mcp');
});
