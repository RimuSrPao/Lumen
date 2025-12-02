const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const updater = require('./updater');


ipcMain.on('resize-window', (event, width, height) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
        if (win.isMaximized()) {
            win.unmaximize();
        }
        win.setSize(width, height, true);
        win.center();
    }
});

ipcMain.on('maximize-window', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
        if (win.isMaximized()) {
            win.unmaximize();
        } else {
            win.maximize();
        }
    }
});

ipcMain.on('minimize-window', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
        win.minimize();
    }
});

ipcMain.on('close-window', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
        win.close();
    }
});

// Handlers de autoupdate
ipcMain.on('check-for-updates', () => {
    updater.checkForUpdates();
});

ipcMain.on('download-update', () => {
    updater.downloadUpdate();
});

ipcMain.on('install-update', () => {
    updater.installUpdate();
});


function createWindow() {
    const win = new BrowserWindow({
        width: 1000,
        height: 700,
        minWidth: 800,
        minHeight: 600,
        resizable: true,
        backgroundColor: '#1a1a1a', // Cor de fundo escura para evitar flash branco
        frame: false, // Remove a barra de título e bordas padrão do Windows
        titleBarStyle: 'hidden', // Necessário para alguns comportamentos de drag
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        },
        autoHideMenuBar: true,
    });


    const isDev = process.env.NODE_ENV === 'development';

    if (isDev) {
        // Aguarda um pouco para garantir que o Vite subiu, ou usa wait-on no script
        win.loadURL('http://localhost:5173');
        // win.webContents.openDevTools(); // Opcional: abrir devtools automaticamente
    } else {
        // Em produção, servir via HTTP local (localhost) para compatibilidade total com Firebase Auth e Google OAuth
        const http = require('http');
        const handler = require('serve-handler');

        const server = http.createServer((request, response) => {
            return handler(request, response, {
                public: path.join(__dirname, '../dist'),
                rewrites: [
                    { source: '**', destination: '/index.html' } // Support for client-side routing if needed
                ]
            });
        });

        server.listen(0, () => {
            const port = server.address().port;
            console.log(`Server running at http://localhost:${port}`);
            win.loadURL(`http://localhost:${port}`);
        });
    }

    // Customizar abertura de novas janelas (Popups como o do Google Login)
    win.webContents.setWindowOpenHandler(({ url }) => {
        // Permitir popups do Google OAuth
        if (url.includes('accounts.google.com') || url.includes('firebase')) {
            return {
                action: 'allow',
                overrideBrowserWindowOptions: {
                    autoHideMenuBar: true,
                    backgroundColor: '#ffffff', // Fundo branco para o Google
                    width: 500,
                    height: 600,
                    webPreferences: {
                        nodeIntegration: false,
                        contextIsolation: true
                    }
                }
            };
        }

        return {
            action: 'allow',
            overrideBrowserWindowOptions: {
                autoHideMenuBar: true,
                backgroundColor: '#131316',
            }
        };
    });
}

app.whenReady().then(() => {
    createWindow();

    // Inicializar autoupdate apenas em produção
    const isDev = process.env.NODE_ENV === 'development';
    if (!isDev) {
        const win = BrowserWindow.getAllWindows()[0];
        if (win) {
            updater.initialize(win);
        }
    }

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
