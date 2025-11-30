import React, { useState, useEffect, useRef } from 'react';
import styles from './CodeEditorDialog.module.css';
import { TextWithEmojis } from './TextWithEmojis';

export function CodeEditorDialog({ isOpen, onClose, onInsert }) {
    const [code, setCode] = useState('');
    const [language, setLanguage] = useState('javascript');
    const textareaRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            setCode('');
            setLanguage('javascript');
            // Focus textarea after a short delay to ensure render
            setTimeout(() => {
                if (textareaRef.current) {
                    textareaRef.current.focus();
                }
            }, 50);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleInsert = () => {
        if (code.trim()) {
            // Format: ```language\ncode\n```
            const formattedCode = `\`\`\`${language}\n${code}\n\`\`\``;
            onInsert(formattedCode);
        }
        onClose();
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.dialog}>
                <div className={styles.header}>
                    <h3>Inserir Código</h3>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <TextWithEmojis text="✕" />
                    </button>
                </div>

                <div className={styles.body}>
                    <div className={styles.controls}>
                        <select
                            className={styles.languageSelect}
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                        >
                            <option value="javascript">JavaScript</option>
                            <option value="html">HTML</option>
                            <option value="css">CSS</option>
                            <option value="python">Python</option>
                            <option value="java">Java</option>
                            <option value="cpp">C++</option>
                            <option value="csharp">C#</option>
                            <option value="sql">SQL</option>
                            <option value="json">JSON</option>
                            <option value="typescript">TypeScript</option>
                            <option value="bash">Bash</option>
                            <option value="text">Texto Simples</option>
                        </select>
                    </div>

                    <textarea
                        ref={textareaRef}
                        className={styles.codeInput}
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="Cole ou digite seu código aqui..."
                        spellCheck={false}
                    />
                </div>

                <div className={styles.footer}>
                    <button className={styles.cancelBtn} onClick={onClose}>
                        Cancelar
                    </button>
                    <button
                        className={styles.insertBtn}
                        onClick={handleInsert}
                        disabled={!code.trim()}
                    >
                        Inserir Código
                    </button>
                </div>
            </div>
        </div>
    );
}
