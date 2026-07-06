import { app, BrowserWindow } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 1024,
    minHeight: 680,
    title: 'Cuaderno de Ventas',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // En desarrollo: carga Vite
  if (process.env.ELECTRON_DEV) {
    win.loadURL('http://localhost:3000');
  } else {
    // En producción: usa app.getAppPath() para ruta correcta dentro del asar
    win.loadFile(path.join(app.getAppPath(), 'dist', 'index.html'));
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
