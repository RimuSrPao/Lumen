import React from 'react';
import { Emoji } from 'emoji-picker-react';

export function TextWithEmojis({ text, size = 22, className, style }) {
    if (!text) return null;

    // Regex para capturar emojis (incluindo compostos e modificadores de pele)
    const emojiRegex = /(\p{Extended_Pictographic}|\p{Emoji_Presentation})/gu;

    const parts = text.split(emojiRegex);

    return (
        <span className={className} style={style}>
            {parts.map((part, index) => {
                if (part.match(emojiRegex)) {
                    // Calcula o unified code para o emoji
                    const unified = part.codePointAt(0).toString(16);
                    return (
                        <span key={index} style={{ display: 'inline-block', verticalAlign: 'middle', lineHeight: 1 }}>
                            <Emoji
                                unified={unified}
                                emoji={part}
                                size={size}
                                emojiStyle="apple"
                            />
                        </span>
                    );
                }
                return part;
            })}
        </span>
    );
}
