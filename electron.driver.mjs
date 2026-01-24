import { app, BrowserWindow, screen } from "electron";

// const url = "http://localhost:3627";
const url = "https://jesmyl.ru";

const cookieEventName = "PRESENTATION_EVENT";
const cookieEventStartSliceLen = 20;

app.whenReady().then(async () => {
  /** @type BrowserWindow */
  let presentationWin;

  const appQuit = () => {
    if (process.platform !== "darwin") app.quit();
  };

  app.on("window-all-closed", appQuit);
  app.commandLine.appendSwitch("disable-http2");
  app.commandLine.appendSwitch("disable-http-cache");
  app.commandLine.appendSwitch("disable-background-networking");
  app.commandLine.appendSwitch("disable-background-timer-throttling");

  const win = new BrowserWindow({
    width: 1700,
    height: 800,
    x: 100,
    y: 100,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: true, // ВКЛЮЧЕНО!
      allowRunningInsecureContent: false, // ВЫКЛЮЧЕНО!
    },
  });

  const makeCookieEvent = (value) => {
    return {
      url,
      name: cookieEventName,
      value: `${`${Date.now()}`.padStart(cookieEventStartSliceLen, "0")}${JSON.stringify(value)}`,
    };
  };

  await win.loadURL(`${url}/cm/i`, {
    httpReferrer: "",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  });

  if (!url.startsWith("https")) win.webContents.openDevTools();

  win.on("close", appQuit);
  win.webContents.session.cookies.set(makeCookieEvent("DESCTOP"));

  win.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        "Content-Security-Policy": [
          "default-src 'self' https: http: data: blob: 'unsafe-inline'; " +
            "script-src 'self' 'unsafe-inline' https: http: blob:; " +
            "style-src 'self' 'unsafe-inline' https: http: blob:; " +
            "connect-src *; img-src *; media-src *; frame-src *",
        ],
      },
    });
  });

  win.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        "Content-Security-Policy": [
          "default-src 'self' https: http: data: blob: 'unsafe-inline'; " +
            "img-src * data: blob:; " + // ✅ data: для изображений
            "script-src 'self' 'unsafe-inline' https: http: blob: data:; " +
            "style-src 'self' 'unsafe-inline' https: http: blob: data:; " +
            "connect-src * data: blob:; " +
            "media-src * data: blob:; frame-src * data: blob:",
        ],
      },
    });
  });

  async function createSlideshowWindow(display) {
    const {
      bounds: { x, y, width, height } = {
        x: 1000,
        y: 200,
        width: 800,
        hright: 600,
      },
    } = display ?? {};

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
        webSecurity: false,
      },
    });

    presentationWin.setBackgroundColor("#000000");
    await presentationWin.loadURL(`${url}/presentation`);

    presentationWin.webContents.on("before-input-event", (_event, input) => {
      if (input.type === "keyDown" && input.code === "Escape") {
        presentationWin.close();
      }
    });
  }

  let timeout;
  let prevEventName = "";

  win.webContents.session.cookies.addListener("changed", (_event, cookie) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      if (cookie.name !== cookieEventName) return;
      const eventName = JSON.parse(
        cookie.value.slice(cookieEventStartSliceLen),
      );
      if (prevEventName === eventName) return;
      prevEventName = eventName;

      try {
        if (eventName === "CLOSE") presentationWin.close();
        if (eventName === "SHOW") {
          // if (presentationWin) presentationWin.maximize();
          // else {
          const projector = screen
            .getAllDisplays()
            .find((d) => d.bounds.x !== 0 || d.bounds.y !== 0);

          createSlideshowWindow(projector);
        }

        setTimeout(() => {
          win.focus();
          win.setAlwaysOnTop(true);
          win.setAlwaysOnTop(false);
        }, 100);
        // }
      } catch (_e) {
        console.log({ _e });
      }
    }, 100);
  });
});
