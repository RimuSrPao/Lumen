const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

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
        win.loadFile(path.join(__dirname, '../dist/index.html'));
    }

    // Customizar abertura de novas janelas (Popups como o do Google Login)
    win.webContents.setWindowOpenHandler(({ url }) => {
        return {
            action: 'allow',
            overrideBrowserWindowOptions: {
                autoHideMenuBar: true, // Remove File, Edit, View...
                backgroundColor: '#131316', // Fundo escuro
                // frame: false // CUIDADO: Se remover o frame, o usuário não consegue fechar a janela do Google!
            }
        };
    });
}

app.whenReady().then(() => {
    createWindow();

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
