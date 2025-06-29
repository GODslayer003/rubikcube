// cubeRenderer.js
/**
 * Generates an SVG representation of a Rubik's Cube.
 * @param {string} colors A 54-character string representing the colors of the cube faces,
 * @returns {string} An SVG string representing the cube.
 */
function getCubeSvg(colors) {
    if (colors.length !== 54) {
        console.error("Invalid color string length. Expected 54 characters. Got: " + colors.length);
        return `<svg width="300" height="300" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
                    <rect width="100%" height="100%" fill="#FF0000" />
                    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="20" fill="white">RENDER ERROR</text>
                </svg>`;
    }

    const colorMap = {
        'r': 'red',
        'g': 'green',
        'b': 'blue',
        'y': 'yellow',
        'o': 'orange',
        'w': 'white',
        // Fallback for unexpected colors or placeholders
        'x': '#4A5568',
        'z': '#4A5568',
        'default': 'gray'
    };

    const getColor = (char) => colorMap[char] || colorMap['default'];

    const pieceSize = 30; // Size of a single sticker
    const gap = 2;       // Gap between stickers
    const faceSize = pieceSize * 3 + gap * 2; // Size of a 3x3 face

    let svgContent = '';

    // Function to draw a 3x3 face
    function drawFace(originX, originY, startIndex) {
        for (let i = 0; i < 9; i++) {
            const row = Math.floor(i / 3);
            const col = i % 3;
            const x = originX + col * (pieceSize + gap);
            const y = originY + row * (pieceSize + gap);
            const colorChar = colors[startIndex + i];
            svgContent += `<rect x="${x}" y="${y}" width="${pieceSize}" height="${pieceSize}" fill="${getColor(colorChar)}" stroke="#333" stroke-width="1"/>`;
        }
    }

    // Define positions for U, F, R faces
    const offsetX = 50; // Offset from left edge for better centering
    const offsetY = 50; // Offset from top edge

    // U Face (Top)
    const uFaceX = offsetX + faceSize;
    const uFaceY = offsetY;
    drawFace(uFaceX, uFaceY, 18); // U face starts at index 18

    // L Face (Left - not explicitly drawn, but provides spacing)
    // F Face (Center)
    const fFaceX = offsetX + faceSize;
    const fFaceY = offsetY + faceSize + gap;
    drawFace(fFaceX, fFaceY, 0); // F face starts at index 0

    // R Face (Right)
    const rFaceX = offsetX + faceSize * 2 + gap * 2;
    const rFaceY = offsetY + faceSize + gap;
    drawFace(rFaceX, rFaceY, 9); // R face starts at index 9

    // Add labels for faces
    const labelStyle = `font-family: Arial, sans-serif; font-size: 14px; fill: #eee; text-anchor: middle;`;
    svgContent += `<text x="${uFaceX + faceSize / 2}" y="${uFaceY - 10}" style="${labelStyle}">U</text>`;
    svgContent += `<text x="${fFaceX + faceSize / 2}" y="${fFaceY - 10}" style="${labelStyle}">F</text>`;
    svgContent += `<text x="${rFaceX + faceSize / 2}" y="${rFaceY - 10}" style="${labelStyle}">R</text>`;

    // Calculate total SVG dimensions needed
    const svgWidth = offsetX * 2 + faceSize * 3 + gap * 2;
    const svgHeight = offsetY * 2 + faceSize * 2 + gap;

    return `
        <svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" xmlns="http://www.w3.org/2000/svg">
            <rect x="0" y="0" width="${svgWidth}" height="${svgHeight}" fill="none"/> ${svgContent}
        </svg>
    `;
}