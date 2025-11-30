import './TitleBar.css';

export function TitleBar() {
    const handleMinimize = () => {
        if (window.electronAPI) {
            window.electronAPI.minimizeWindow();
        }
    };

    const handleMaximize = () => {
        if (window.electronAPI) {
            window.electronAPI.maximizeWindow();
        }
    };

    const handleClose = () => {
        if (window.electronAPI) {
            window.electronAPI.closeWindow();
        }
    };

    return (
        <div className="title-bar">
            <div className="title-bar-drag-area">
                <div className="app-title">Lumen</div>
            </div>
            <div className="title-bar-controls">
                <button className="control-btn minimize-btn" onClick={handleMinimize}>
                    <svg width="10" height="1" viewBox="0 0 10 1">
                        <path d="M0 0h10v1H0z" fill="currentColor" />
                    </svg>
                </button>
                <button className="control-btn maximize-btn" onClick={handleMaximize}>
                    <svg width="10" height="10" viewBox="0 0 10 10">
                        <path d="M0 0v10h10V0H0zm9 9H1V1h8v8z" fill="currentColor" />
                    </svg>
                </button>
                <button className="control-btn close-btn" onClick={handleClose}>
                    <svg width="10" height="10" viewBox="0 0 10 10">
                        <path d="M0 0l10 10m0-10L0 10" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
