import { spawn, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const isWin = process.platform === 'win32';

// Liberar puerto 8000 si un proceso anterior quedó colgado en segundo plano
function liberarPuerto8000() {
  try {
    if (isWin) {
      const output = execSync('netstat -ano | findstr :8000', { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] });
      const lines = output.trim().split('\n');
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && pid !== '0' && !isNaN(Number(pid))) {
          try { execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' }); } catch {}
        }
      }
    } else {
      execSync('lsof -ti :8000 | xargs kill -9 2>/dev/null', { stdio: 'ignore' });
    }
  } catch {
    // Si no había ningún proceso escuchando en el puerto 8000, continúa normalmente
  }
}

liberarPuerto8000();

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
