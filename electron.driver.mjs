import { app, BrowserWindow, screen } from 'electron';

// const url = 'http://localhost:3627';
const url = 'https://jesmyl.ru';

app.whenReady().then(() => {
  let presentationWin;

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });

  const win = new BrowserWindow({
    width: 1700,
    height: 800,
    x: 100,
    y: 100,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      accessibleTitle: true,
    },
  });

  win.loadURL(url);

  async function createSlideshowWindow(display) {
    const { bounds: { x, y, width, height } = { x: 1000, y: 200, width: 800, hright: 600 } } = display ?? {};

    presentationWin = new BrowserWindow({
      x,
      y,
      width,
      height,
      fullscreen: true,
      kiosk: true,
      show: false,

      webPreferences: {
        nodeIntegration: false,
        nativeWindowOpen: true,
        nodeIntegration: true,
        contextIsolation: false,
      },
    });

    presentationWin.setBackgroundColor('#000000');
    await presentationWin.loadURL(`${url}/presentation`);

    presentationWin.webContents.on('before-input-event', (_event, input) => {
      if (input.type === 'keyDown' && input.code === 'Escape') {
        presentationWin.close();
      }
    });
  }

  win.webContents.on('page-title-updated', (_event, title) => {
    try {
      if (title === ':CLOSE_PRESENTATION:') presentationWin.close();
      if (title === ':SHOW_PRESENTATION:') {
        setTimeout(() => {
          win.focus();
          win.setAlwaysOnTop(true);
          win.setAlwaysOnTop(false);
        }, 100);

        const projector = screen.getAllDisplays().find(d => d.bounds.x !== 0 || d.bounds.y !== 0);

        createSlideshowWindow(projector);
      }
    } catch (_e) {}
  });
});
