import 'dotenv/config.js';
import { config } from './config.js';
import { app } from './app.js';

/* start the server */
app.listen(config.expressPort, () =>
  console.log('Listening on port', config.expressPort),
);
