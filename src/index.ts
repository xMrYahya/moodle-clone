import debug from 'debug';

import App from './app';

debug('ts-express:server');

const port = Number.parseInt(process.env.PORT || '3000');
if (Number.isNaN(port)) {
  console.error('PORT doit etre un nombre');
  process.exit(1);
}

const server = App.listen(port, () => {
  console.info(`Serveur disponible à http://localhost:${port}`);
});
server.on('error', onError);
server.on('listening', onListening);

function onError(error: NodeJS.ErrnoException) {
  if (error.syscall !== 'listen') throw error;
  let bind = (typeof port === 'string') ? 'Canal ' + port : 'Port ' + port;
  switch (error.code) {
    case 'EACCES':
      console.error(`${bind} requiert des privileges eleves`);
      process.exit(1);
    case 'EADDRINUSE':
      console.error(`${bind} est deja utilise`);
      process.exit(1);
    default:
      throw error;
  }
}

function onListening(): void {
  let addr = server.address();
  let bind = (typeof addr === 'string') ? `canal ${addr}` :
    (addr ? `port ${addr.port}` : ``);
  debug(`Ecoute sur ${bind}`);
}
