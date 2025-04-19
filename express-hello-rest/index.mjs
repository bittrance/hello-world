import express from 'express';
import { createTerminus } from '@godaddy/terminus';

const delay = parseFloat(process.env['HELLO_REST_REQUEST_DELAY'] || '1.0') * 1000;

const app = express()

app.get('/', function (req, res) {
  setTimeout(() => res.send('Hello World\n'), delay);
})

const server = app.listen(8080);

createTerminus(server, {
  signals: ['SIGTERM', 'SIGINT'],
  useExit0: true,
  timeout: 10000,
});
