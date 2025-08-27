import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { createServer as createHttpsServer } from 'https';
import fs from 'fs';
import { setupSocket } from './src/utils/socket';
import router from './src/routers';

const app = express();

const httpsOptions = {
    key: fs.readFileSync('server.key'),
    cert: fs.readFileSync('server.cert')
};

const server = createHttpsServer(httpsOptions, app);

const io = setupSocket(server);

app.use(cors());
app.use(express.json());

app.locals.db = require('./src/utils/firebase').db;

app.use('/api', router);

const PORT = process.env.PORT || 8080;

server.listen(PORT, () => {
    console.log(`Server running on https://localhost:${PORT}`);
    console.log(`Socket.IO ready for connections`);
    console.log(`API available at https://localhost:${PORT}/api`);
});

export { io };
