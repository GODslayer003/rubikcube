// cubeRenderer.js
/**
 * Generates an SVG representation of a Rubik's Cube.
 * @param {string} colors A 54-character string representing the colors of the cube faces,
 * e.g., 'rrrrrrrrrgggggggggbbbbbbbbbxxxxxxxxxyyyyyyyyyyzzzzzzzzz'.
 * Mapping: F, R, U, B, L, D (Front, Right, Up, Back, Left, Down)
 * Each face is 9 characters, read left-to-right, top-to-bottom.
 * Standard colors: r=red, g=green, b=blue, y=yellow, o=orange, w=white.
 * @returns {string} An SVG string representing the cube.
 */
function getCubeSvg(colors) {
    if (colors.length !== 54) {
        console.error("Invalid color string length. Expected 54 characters.");
        // Return a default error SVG or throw
        return `<svg width="300" height="300" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
                    <rect width="100%" height="100%" fill="#FF0000" />
                    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="20" fill="white">ERROR</text>
                </svg>`;
    }

    const colorMap = {
        'r': 'red',
        'g': 'green',
        'b': 'blue',
        'y': 'yellow',
        'o': 'orange',
        'w': 'white',
        'x': '#4A5568', // Placeholder for faces not typically visible in standard view
        'z': '#4A5568'
    };

    const getColor = (char) => colorMap[char] || 'gray';

    // SVG dimensions
    const pieceSize = 30; // Size of a single sticker
    const gap = 2;       // Gap between stickers
    const faceSize = pieceSize * 3 + gap * 2; // Size of a 3x3 face

    // Layout for the 3D projection:
    // This is a simplified 2D projection that shows F, R, U faces.
    // The faces are arranged as follows:
    //      U
    //    L F R
    //      D
    //      B (not visible in this 2D projection, but its colors are still part of the string)
    //
    // For rendering, we'll draw Front, Right, and Up faces.
    // Front face (F): 0-8
    // Right face (R): 9-17
    // Up face (U): 18-26
    // Back face (B): 27-35 (not directly shown)
    // Left face (L): 36-44 (not directly shown)
    // Down face (D): 45-53 (not directly shown)

    // Adjusted color indices for the default view (Front, Right, Up)
    // This assumes the `colors` string is ordered F R U B L D
    const faceIndices = {
        'F': 0,
        'R': 9,
        'U': 18,
        'B': 27, // Not rendered visually in this scheme
        'L': 36, // Not rendered visually in this scheme
        'D': 45  // Not rendered visually in this scheme
    };

    let svgContent = '';

    // Function to draw a 3x3 face
    // originX, originY: top-left corner of the face
    // faceColorIndices: array of 9 indices from the `colors` string for this face
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

    // Positions for F, R, U faces for a basic 2D layout mimicking 3D
    // U face is above and slightly offset
    // F face is center
    // R face is right and slightly offset

    const centerX = 150; // Center of the SVG canvas
    const centerY = 150;

    // Up Face (U) - positioned above and slightly to the left/right for perspective
    const uFaceOriginX = centerX - faceSize / 2; // Aligned with F for now
    const uFaceOriginY = centerY - faceSize - gap; // Above F face
    drawFace(uFaceOriginX, uFaceOriginY, faceIndices['U']);

    // Front Face (F) - central
    const fFaceOriginX = centerX - faceSize / 2;
    const fFaceOriginY = centerY - faceSize / 2;
    drawFace(fFaceOriginX, fFaceOriginY, faceIndices['F']);

    // Right Face (R) - positioned to the right of F
    const rFaceOriginX = centerX + faceSize / 2 + gap; // To the right of F face
    const rFaceOriginY = centerY - faceSize / 2; // Aligned with F face
    drawFace(rFaceOriginX, rFaceOriginY, faceIndices['R']);

    // Add labels for faces (optional, but helpful for understanding which face is which)
    const labelStyle = `font-family: Arial, sans-serif; font-size: 14px; fill: #eee; text-anchor: middle;`;
    svgContent += `<text x="${uFaceOriginX + faceSize / 2}" y="${uFaceOriginY - 10}" style="${labelStyle}">U</text>`;
    svgContent += `<text x="${fFaceOriginX + faceSize / 2}" y="${fFaceOriginY - 10}" style="${labelStyle}">F</text>`;
    svgContent += `<text x="${rFaceOriginX + faceSize / 2}" y="${rFaceOriginY - 10}" style="${labelStyle}">R</text>`;


    return `
        <svg width="400" height="400" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
            <rect x="0" y="0" width="400" height="400" fill="#1a202c"/> <g transform="translate(50, 50)"> ${svgContent}
            </g>
        </svg>
    `;
}