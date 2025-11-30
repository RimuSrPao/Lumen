import React from 'react';
import './LoadingScreen.css';

export const LoadingScreen = () => {
    return (
        <div className="loading-container">
            <div className="loading-content">
                <div className="loading-logo">
                    <div className="logo-circle"></div>
                    <div className="logo-pulse"></div>
                </div>
                <h2 className="loading-text">Iniciando Lumen...</h2>
                <div className="loading-tips">
                    <span>Conectando ao servidor...</span>
                </div>
            </div>
        </div>
    );
};
