const { spawn } = require('child_process');
const path = require('path');

console.log('Starting SLV PG Application...');

// Start Backend API Server (server.js)
const backend = spawn('node', [path.join(__dirname, 'server.js')], { stdio: 'inherit' });

// Start Frontend Server (serve_frontend.js)
const frontend = spawn('node', [path.join(__dirname, 'serve_frontend.js')], { stdio: 'inherit' });

backend.on('close', (code) => {
  console.log(`Backend process exited with code ${code}`);
  process.exit(code);
});

frontend.on('close', (code) => {
  console.log(`Frontend process exited with code ${code}`);
  process.exit(code);
});

// Handle termination signals to kill child processes cleanly
const cleanExit = () => {
  console.log('\nShutting down servers...');
  backend.kill();
  frontend.kill();
  process.exit(0);
};

process.on('SIGINT', cleanExit);
process.on('SIGTERM', cleanExit);
process.on('exit', cleanExit);
