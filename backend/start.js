import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const isWin = process.platform === 'win32';

// Búsqueda inteligente del ejecutable de python con prioridad a entornos virtuales
const candidatePaths = [
  path.join(rootDir, 'backend', '.venv', isWin ? 'Scripts/python.exe' : 'bin/python'),
  path.join(rootDir, '.venv', isWin ? 'Scripts/python.exe' : 'bin/python'),
];

let pythonCmd = isWin ? 'python' : 'python3';
for (const candidate of candidatePaths) {
  if (fs.existsSync(candidate)) {
    pythonCmd = candidate;
    break;
  }
}

console.log(`========================================================`);
console.log(`  Iniciando Microservicio Sofi Neural TTS (FastAPI)`);
console.log(`  Intérprete: ${pythonCmd}`);
console.log(`  Endpoint:   http://localhost:8000/api/tts`);
console.log(`========================================================`);

const scriptPath = path.join(rootDir, 'backend', 'tts_service.py');
const child = spawn(pythonCmd, [scriptPath], {
  cwd: rootDir,
  stdio: 'inherit',
});

child.on('error', (err) => {
  console.error('\n❌ Error al iniciar el microservicio de voz:', err.message);
  console.error('Asegúrate de haber instalado los requerimientos:');
  console.error('  pip install -r backend/requirements.txt\n');
  process.exit(1);
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
