import React from 'react';
import { TextWithEmojis } from '../TextWithEmojis';
import styles from './Modal.module.css';

export function Modal({ isOpen, onClose, title, message, type, onConfirm }) {
    if (!isOpen) return null;

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
                <div className={styles.modalHeader}>
                    <h3>{title}</h3>
                    <button className={styles.closeModalBtn} onClick={onClose}>
                        <TextWithEmojis text="✕" size={18} />
                    </button>
                </div>
                <div className={styles.modalBody}>
                    <p>{message}</p>
                </div>
                <div className={styles.modalFooter}>
                    {type === 'confirm' ? (
                        <>
                            <button className={`${styles.modalBtn} ${styles.cancel}`} onClick={onClose}>Cancelar</button>
                            <button className={`${styles.modalBtn} ${styles.confirm}`} onClick={onConfirm}>Confirmar</button>
                        </>
                    ) : (
                        <button className={`${styles.modalBtn} ${styles.confirm}`} onClick={onClose}>OK</button>
                    )}
                </div>
            </div>
        </div>
    );
}
