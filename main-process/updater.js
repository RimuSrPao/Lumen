const { autoUpdater } = require('electron-updater');
const { app, dialog } = require('electron');
const log = require('electron-log');

// Configurar logging
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';

// Configurações do autoUpdater
autoUpdater.autoDownload = true; // Baixar automaticamente em segundo plano
autoUpdater.autoInstallOnAppQuit = true; // Instalar automaticamente ao fechar o app

let mainWindow = null;

/**
 * Inicializa o sistema de autoupdate
 * @param {BrowserWindow} win - Janela principal do aplicativo
 */
function initialize(win) {
    mainWindow = win;

    // Configurar eventos do autoUpdater
    setupAutoUpdaterEvents();

    // Verificar atualizações 5 segundos após o app iniciar
    setTimeout(() => {
        checkForUpdates();
    }, 5000);
}

/**
 * Configura os eventos do autoUpdater
 */
function setupAutoUpdaterEvents() {
    // Quando uma atualização está disponível
    autoUpdater.on('update-available', (info) => {
        log.info('Atualização disponível:', info);
        if (mainWindow) {
            mainWindow.webContents.send('update-available', {
                version: info.version,
                releaseNotes: info.releaseNotes,
                releaseDate: info.releaseDate
            });
        }
    });

    // Quando não há atualizações disponíveis
    autoUpdater.on('update-not-available', (info) => {
        log.info('App está atualizado:', info);
        if (mainWindow) {
            mainWindow.webContents.send('update-not-available');
        }
    });

    // Progresso do download
    autoUpdater.on('download-progress', (progressObj) => {
        log.info('Progresso do download:', progressObj);
        if (mainWindow) {
            mainWindow.webContents.send('download-progress', {
                percent: progressObj.percent,
                transferred: progressObj.transferred,
                total: progressObj.total,
                bytesPerSecond: progressObj.bytesPerSecond
            });
        }
    });

    // Quando o download é concluído
    autoUpdater.on('update-downloaded', (info) => {
        log.info('Atualização baixada:', info);
        if (mainWindow) {
            mainWindow.webContents.send('update-downloaded', {
                version: info.version
            });
        }
    });

    // Quando ocorre um erro
    autoUpdater.on('error', (err) => {
        log.error('Erro no autoupdate:', err);
        if (mainWindow) {
            mainWindow.webContents.send('update-error', {
                message: err.message
            });
        }
    });
}

/**
 * Verifica se há atualizações disponíveis
 */
function checkForUpdates() {
    // Não verificar em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
        log.info('Modo desenvolvimento - verificação de updates desabilitada');
        return;
    }

    log.info('Verificando atualizações...');
    autoUpdater.checkForUpdates().catch(err => {
        log.error('Erro ao verificar atualizações:', err);
    });
}

/**
 * Inicia o download da atualização
 */
function downloadUpdate() {
    log.info('Iniciando download da atualização...');
    autoUpdater.downloadUpdate().catch(err => {
        log.error('Erro ao baixar atualização:', err);
        if (mainWindow) {
            mainWindow.webContents.send('update-error', {
                message: 'Erro ao baixar atualização: ' + err.message
            });
        }
    });
}

/**
 * Instala a atualização e reinicia o app
 */
function installUpdate() {
    log.info('Instalando atualização e reiniciando...');
    autoUpdater.quitAndInstall(false, true);
}

module.exports = {
    initialize,
    checkForUpdates,
    downloadUpdate,
    installUpdate
};
