import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { spawn } = require('child_process');

console.log('🚀 Iniciando Entorno H2D...');

const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function startProcess(name, args) {
    const proc = spawn(npmCmd, args, { stdio: 'inherit', shell: true });
    proc.on('close', (code) => console.log(`${name} exited with code ${code}`));
    return proc;
}

// Iniciar ambos mundos
const server = startProcess('Backend', ['run', 'server']);
const client = startProcess('Frontend', ['run', 'client']);

// Limpieza al salir
process.on('SIGINT', () => {
    server.kill();
    client.kill();
    process.exit();
});
