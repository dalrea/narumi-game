const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  onUpdateDownloaded: (callback) => {
    ipcRenderer.on('update-downloaded', (_event, version) => callback(version));
  }
});

// Inject "simsim" logo link on game pages (not on index.html)
window.addEventListener('DOMContentLoaded', () => {
  const p = window.location.pathname.replace(/\\/g, '/');
  const isHome = p.endsWith('/index.html') || p.endsWith('/simsim/');

  if (isHome) return;

  // Determine the path to index.html based on directory depth
  const inSubdir = p.includes('/flappy/') || p.includes('/tetris/') ||
                   p.includes('/narumi/') || p.includes('/monster/') ||
                   p.includes('/metamon/');
  const homePath = inSubdir ? '../index.html' : 'index.html';

  const logo = document.createElement('a');
  logo.id = 'electron-home-logo';
  logo.href = homePath;
  logo.textContent = 'simsim';

  const style = document.createElement('style');
  style.textContent = `
    #electron-home-logo {
      position: fixed;
      top: 6px;
      left: 8px;
      z-index: 999999;
      color: rgba(255,255,255,0.5);
      font-size: 13px;
      font-weight: bold;
      font-family: 'Segoe UI', sans-serif;
      text-decoration: none;
      letter-spacing: 1px;
      transition: color 0.2s;
      cursor: pointer;
    }
    #electron-home-logo:hover {
      color: rgba(78,205,196,1);
    }
  `;

  document.head.appendChild(style);
  document.body.appendChild(logo);
});
