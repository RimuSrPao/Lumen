/**
 * Comprime e redimensiona uma imagem usando Canvas API.
 * @param {File} file - O arquivo de imagem original.
 * @param {number} maxWidth - Largura máxima permitida (padrão: 1920).
 * @param {number} maxHeight - Altura máxima permitida (padrão: 1920).
 * @param {number} quality - Qualidade da compressão JPEG (0 a 1, padrão: 0.7).
 * @returns {Promise<File>} - Promise que resolve com o arquivo comprimido.
 */
export const compressImage = (file, maxWidth = 1920, maxHeight = 1920, quality = 0.7) => {
    return new Promise((resolve, reject) => {
        if (!file.type.match(/image.*/)) {
            reject(new Error("O arquivo não é uma imagem."));
            return;
        }

        // Se for GIF, não comprime para manter a animação
        if (file.type === 'image/gif') {
            const maxSize = 5 * 1024 * 1024; // 5MB
            if (file.size > maxSize) {
                reject(new Error("O GIF é muito grande. O limite máximo é de 5MB."));
                return;
            }
            resolve(file);
            return;
        }

        const image = new Image();
        image.src = URL.createObjectURL(file);

        image.onload = () => {
            let width = image.width;
            let height = image.height;

            // Calcular novas dimensões mantendo proporção
            if (width > height) {
                if (width > maxWidth) {
                    height *= maxWidth / width;
                    width = maxWidth;
                }
            } else {
                if (height > maxHeight) {
                    width *= maxHeight / height;
                    height = maxHeight;
                }
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(image, 0, 0, width, height);

            canvas.toBlob((blob) => {
                if (!blob) {
                    reject(new Error("Falha ao comprimir imagem."));
                    return;
                }

                // Criar novo arquivo com o blob comprimido
                const compressedFile = new File([blob], file.name, {
                    type: 'image/jpeg',
                    lastModified: Date.now(),
                });

                resolve(compressedFile);
            }, 'image/jpeg', quality);
        };

        image.onerror = (err) => {
            reject(err);
        };
    });
};
