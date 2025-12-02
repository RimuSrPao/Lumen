import { useState, useEffect } from 'react';
import styles from './UpdateNotification.module.css';

const UpdateNotification = () => {
    const [updateState, setUpdateState] = useState('idle'); // idle, checking, available, downloading, downloaded, error
    const [updateInfo, setUpdateInfo] = useState(null);
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Verificar se estamos em ambiente Electron
        if (!window.electronAPI) {
            return;
        }

        // Configurar listeners de eventos
        window.electronAPI.onUpdateAvailable((info) => {
            console.log('Atualização disponível:', info);
            setUpdateState('available');
            setUpdateInfo(info);
        });

        window.electronAPI.onUpdateNotAvailable(() => {
            console.log('App está atualizado');
            setUpdateState('idle');
        });

        window.electronAPI.onDownloadProgress((progress) => {
            console.log('Progresso do download:', progress);
            setUpdateState('downloading');
            setDownloadProgress(Math.round(progress.percent));
        });

        window.electronAPI.onUpdateDownloaded((info) => {
            console.log('Atualização baixada:', info);
            setUpdateState('downloaded');
            setDownloadProgress(100);
        });

        window.electronAPI.onUpdateError((error) => {
            console.error('Erro no update:', error);
            setUpdateState('error');
            setError(error.message);
        });

        // Forçar verificação ao montar o componente
        window.electronAPI.checkForUpdates();
    }, []);

    const handleDownload = () => {
        if (window.electronAPI) {
            setUpdateState('downloading');
            setDownloadProgress(0);
            window.electronAPI.downloadUpdate();
        }
    };

    const handleInstall = () => {
        if (window.electronAPI) {
            window.electronAPI.installUpdate();
        }
    };

    const handleDismiss = () => {
        setUpdateState('idle');
        setUpdateInfo(null);
        setError(null);
    };

    // Não renderizar nada se não houver atualização ou se estiver idle
    if (updateState === 'idle' || updateState === 'checking') {
        return null;
    }

    return (
        <div className={styles.overlay}>
            <div className={styles.notification}>
                {/* Cabeçalho */}
                <div className={styles.header}>
                    <div className={styles.icon}>
                        {updateState === 'error' ? '⚠️' : '🚀'}
                    </div>
                    <div className={styles.title}>
                        {updateState === 'available' && 'Nova Atualização Disponível!'}
                        {updateState === 'downloading' && 'Baixando Atualização...'}
                        {updateState === 'downloaded' && 'Atualização Pronta!'}
                        {updateState === 'error' && 'Erro na Atualização'}
                    </div>
                </div>

                {/* Conteúdo */}
                <div className={styles.content}>
                    {updateState === 'available' && updateInfo && (
                        <p>
                            A versão <strong>{updateInfo.version}</strong> está disponível.
                            Deseja baixar agora?
                        </p>
                    )}

                    {updateState === 'downloading' && (
                        <>
                            <p>Baixando a atualização... {downloadProgress}%</p>
                            <div className={styles.progressBar}>
                                <div
                                    className={styles.progressFill}
                                    style={{ width: `${downloadProgress}%` }}
                                />
                            </div>
                        </>
                    )}

                    {updateState === 'downloaded' && (
                        <p>
                            A atualização foi baixada com sucesso!
                            Clique em "Instalar" para reiniciar o app e aplicar a atualização.
                        </p>
                    )}

                    {updateState === 'error' && (
                        <p className={styles.errorText}>
                            {error || 'Ocorreu um erro ao verificar atualizações.'}
                        </p>
                    )}
                </div>

                {/* Botões de ação */}
                <div className={styles.actions}>
                    {updateState === 'available' && (
                        <>
                            <button
                                className={styles.btnSecondary}
                                onClick={handleDismiss}
                            >
                                Depois
                            </button>
                            <button
                                className={styles.btnPrimary}
                                onClick={handleDownload}
                            >
                                Baixar Agora
                            </button>
                        </>
                    )}

                    {updateState === 'downloading' && (
                        <button
                            className={styles.btnSecondary}
                            disabled
                        >
                            Baixando...
                        </button>
                    )}

                    {updateState === 'downloaded' && (
                        <>
                            <button
                                className={styles.btnSecondary}
                                onClick={handleDismiss}
                            >
                                Depois
                            </button>
                            <button
                                className={styles.btnPrimary}
                                onClick={handleInstall}
                            >
                                Instalar e Reiniciar
                            </button>
                        </>
                    )}

                    {updateState === 'error' && (
                        <button
                            className={styles.btnSecondary}
                            onClick={handleDismiss}
                        >
                            Fechar
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UpdateNotification;
