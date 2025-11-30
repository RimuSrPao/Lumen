import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { CopyIcon, CheckIcon, ChevronDownIcon, ChevronUpIcon } from './Icons';
import { TextWithEmojis } from './TextWithEmojis';
import styles from './RichTextRenderer.module.css';

export function RichTextRenderer({ text, className }) {
    if (!text) return null;

    // Custom renderers to integrate TextWithEmojis
    const components = {
        // Paragraphs
        p: ({ children }) => {
            return (
                <p className={styles.paragraph}>
                    {React.Children.map(children, child => {
                        if (typeof child === 'string') {
                            return <TextWithEmojis text={child} />;
                        }
                        return child;
                    })}
                </p>
            );
        },
        // List items
        li: ({ children }) => {
            return (
                <li>
                    {React.Children.map(children, child => {
                        if (typeof child === 'string') {
                            return <TextWithEmojis text={child} />;
                        }
                        return child;
                    })}
                </li>
            );
        },
        // Links - ensure they open in new tab
        a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" className={styles.link}>
                {children}
            </a>
        ),
        // Code blocks
        code: ({ inline, className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '');
            const [copied, setCopied] = React.useState(false);
            const [isExpanded, setIsExpanded] = React.useState(false);

            if (!children) return null;
            const codeString = String(children).replace(/\n$/, '');
            const lineCount = codeString.split('\n').length;
            const MAX_LINES = 15;
            const shouldCollapse = lineCount > MAX_LINES;

            const handleCopy = () => {
                navigator.clipboard.writeText(codeString);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            };

            return !inline ? (
                <div style={{ position: 'relative', marginBottom: '1rem' }}>
                    <div style={{
                        position: 'relative',
                        maxHeight: !isExpanded && shouldCollapse ? '300px' : 'none',
                        overflow: 'hidden',
                        borderRadius: '8px',
                        border: '1px solid #333'
                    }}>
                        <button
                            onClick={handleCopy}
                            style={{
                                position: 'absolute',
                                top: '0.5rem',
                                right: '0.5rem',
                                background: 'rgba(255, 255, 255, 0.1)',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '4px',
                                cursor: 'pointer',
                                color: copied ? '#4caf50' : '#ccc',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                zIndex: 10,
                                transition: 'all 0.2s'
                            }}
                            title={copied ? "Copiado!" : "Copiar código"}
                        >
                            {copied ? (
                                <CheckIcon size={16} />
                            ) : (
                                <CopyIcon size={16} />
                            )}
                        </button>

                        <SyntaxHighlighter
                            style={vscDarkPlus}
                            language={match ? match[1] : 'javascript'}
                            PreTag="div"
                            showLineNumbers={true}
                            wrapLongLines={true}
                            lineNumberStyle={{
                                minWidth: '2.5em',
                                paddingRight: '1em',
                                textAlign: 'right',
                                color: '#858585',
                                borderRight: '1px solid #404040',
                                marginRight: '1em',
                                userSelect: 'none'
                            }}
                            customStyle={{
                                margin: 0,
                                borderRadius: '0', // Border radius handled by container
                                fontSize: '0.9rem',
                                backgroundColor: '#1e1e1e',
                                maxWidth: '100%',
                                padding: '1rem',
                                paddingTop: '2.5rem',
                                minHeight: '100%'
                            }}
                            codeTagProps={{
                                style: {
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-word'
                                }
                            }}
                            {...props}
                        >
                            {codeString}
                        </SyntaxHighlighter>

                        {/* Gradient overlay when collapsed */}
                        {!isExpanded && shouldCollapse && (
                            <div style={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                height: '80px',
                                background: 'linear-gradient(to bottom, transparent, #1e1e1e)',
                                pointerEvents: 'none'
                            }} />
                        )}
                    </div>

                    {shouldCollapse && (
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            style={{
                                width: '100%',
                                padding: '8px',
                                background: '#2d2d2d',
                                border: '1px solid #333',
                                borderTop: 'none',
                                borderBottomLeftRadius: '8px',
                                borderBottomRightRadius: '8px',
                                color: '#ccc',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                fontSize: '0.85rem',
                                transition: 'background 0.2s'
                            }}
                            onMouseEnter={(e) => e.target.style.background = '#3d3d3d'}
                            onMouseLeave={(e) => e.target.style.background = '#2d2d2d'}
                        >
                            {isExpanded ? (
                                <>
                                    <ChevronUpIcon size={16} /> Encolher código
                                </>
                            ) : (
                                <>
                                    <ChevronDownIcon size={16} /> Ver código completo
                                </>
                            )}
                        </button>
                    )}
                </div>
            ) : (
                <code className={styles.inlineCode} {...props}>
                    {children}
                </code>
            );
        }
    };

    // Pré-processamento para garantir que blocos de código tenham quebra de linha antes
    const processedText = React.useMemo(() => {
        if (!text) return '';
        // Adiciona \n antes de ``` se não houver (e não for o início do texto)
        return text.replace(/([^\n])```/g, '$1\n```');
    }, [text]);

    return (
        <div className={`${styles.richTextContainer} ${className || ''}`}>
            <ReactMarkdown components={components}>
                {processedText}
            </ReactMarkdown>
        </div>
    );
}
