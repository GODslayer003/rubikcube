// rubiksCube.js

class RubiksCube {
    constructor() {
        // Define standard colors for each face
        // F, R, U, B, L, D (Front, Right, Up, Back, Left, Down)
        this.colors = {
            'F': 'r', // Front: Red
            'R': 'g', // Right: Green
            'U': 'y', // Up: Yellow
            'B': 'o', // Back: Orange
            'L': 'b', // Left: Blue
            'D': 'w'  // Down: White
        };

        // Initialize a solved cube state
        // Each face is a 3x3 array (or flat array of 9 chars)
        // Order: F, R, U, B, L, D
        // Each face: Row by row, left to right
        this.state = {
            'F': Array(9).fill(this.colors.F),
            'R': Array(9).fill(this.colors.R),
            'U': Array(9).fill(this.colors.U),
            'B': Array(9).fill(this.colors.B),
            'L': Array(9).fill(this.colors.L),
            'D': Array(9).fill(this.colors.D),
        };

        this.history = []; // To store the moves made
    }

    // Converts the internal state to the 54-character string for getCubeSvg
    toColorString() {
        return this.state.F.join('') +
               this.state.R.join('') +
               this.state.U.join('') +
               this.state.B.join('') +
               this.state.L.join('') +
               this.state.D.join('');
    }

    // Renders the cube to the DOM
    render() {
        const svgString = getCubeSvg(this.toColorString());
        document.getElementById('cubeSvgContainer').innerHTML = svgString;
    }

    // Deep copy of the cube state for algorithmic purposes
    clone() {
        const newCube = new RubiksCube();
        for (const face in this.state) {
            newCube.state[face] = [...this.state[face]];
        }
        newCube.colors = { ...this.colors }; // Copy color map too
        return newCube;
    }

    // --- Core Rotation Logic ---
    // Each rotation involves two parts:
    // 1. Rotating the face itself (9 stickers)
    // 2. Shifting the adjacent edge stickers

    _rotateFace(faceKey, clockwise = true) {
        const face = this.state[faceKey];
        const newFace = Array(9);
        if (clockwise) {
            newFace[0] = face[6]; newFace[1] = face[3]; newFace[2] = face[0];
            newFace[3] = face[7]; newFace[4] = face[4]; newFace[5] = face[1];
            newFace[6] = face[8]; newFace[7] = face[5]; newFace[8] = face[2];
        } else { // Counter-clockwise
            newFace[0] = face[2]; newFace[1] = face[5]; newFace[2] = face[8];
            newFace[3] = face[1]; newFace[4] = face[4]; newFace[5] = face[7];
            newFace[6] = face[0]; newFace[7] = face[3]; newFace[8] = face[6];
        }
        this.state[faceKey] = newFace;
    }

    // Helper for moving edges between faces
    // `edges` is an array of objects: { face: 'F', indices: [0,1,2] }
    _shiftEdges(edges, clockwise = true) {
        const temp = [];
        // Extract edges in order
        for (let i = 0; i < edges.length; i++) {
            const edge = edges[i];
            for (const index of edge.indices) {
                temp.push(this.state[edge.face][index]);
            }
        }

        // Shift temp array
        if (clockwise) {
            const lastSectionLength = edges[edges.length - 1].indices.length;
            const lastSection = temp.splice(temp.length - lastSectionLength, lastSectionLength);
            temp.unshift(...lastSection);
        } else { // Counter-clockwise
            const firstSectionLength = edges[0].indices.length;
            const firstSection = temp.splice(0, firstSectionLength);
            temp.push(...firstSection);
        }

        // Apply shifted edges back to state
        let tempIndex = 0;
        for (let i = 0; i < edges.length; i++) {
            const edge = edges[i];
            for (const index of edge.indices) {
                this.state[edge.face][index] = temp[tempIndex++];
            }
        }
    }

    // Manual Rotation methods for each face (R, L, U, D, F, B)
    // Each function applies a clockwise turn unless _PRIME is specified.
    // The `move` parameter helps in logging the sequence of moves.
    manualRotate(move, record = true) {
        if (record) {
            this.history.push(move);
        }
        switch (move) {
            case 'U': this._U(); break;
            case 'U_PRIME': this._U(false); break;
            case 'D': this._D(); break;
            case 'D_PRIME': this._D(false); break;
            case 'L': this._L(); break;
            case 'L_PRIME': this._L(false); break;
            case 'R': this._R(); break;
            case 'R_PRIME': this._R(false); break;
            case 'F': this._F(); break;
            case 'F_PRIME': this._F(false); break;
            case 'B': this._B(); break;
            case 'B_PRIME': this._B(false); break;
            default: console.warn("Invalid move:", move);
        }
        this.render(); // Re-render after each move
    }

    // Define the actual rotation logic for each face
    // U (Up) face rotation
    _U(clockwise = true) {
        this._rotateFace('U', clockwise);
        const edges = [
            { face: 'F', indices: [0, 1, 2] },
            { face: 'R', indices: [0, 1, 2] },
            { face: 'B', indices: [0, 1, 2] },
            { face: 'L', indices: [0, 1, 2] }
        ];
        this._shiftEdges(edges, clockwise);
    }

    // D (Down) face rotation
    _D(clockwise = true) {
        this._rotateFace('D', clockwise);
        const edges = [
            { face: 'F', indices: [6, 7, 8] },
            { face: 'L', indices: [6, 7, 8] },
            { face: 'B', indices: [6, 7, 8] },
            { face: 'R', indices: [6, 7, 8] }
        ];
        this._shiftEdges(edges, clockwise);
    }

    // L (Left) face rotation
    _L(clockwise = true) {
        this._rotateFace('L', clockwise);
        const edges = [
            { face: 'U', indices: [0, 3, 6] },
            { face: 'F', indices: [0, 3, 6] },
            { face: 'D', indices: [0, 3, 6] },
            { face: 'B', indices: [8, 5, 2] } // B face is oriented differently
        ];
        this._shiftEdges(edges, clockwise);
    }

    // R (Right) face rotation
    _R(clockwise = true) {
        this._rotateFace('R', clockwise);
        const edges = [
            { face: 'U', indices: [2, 5, 8] },
            { face: 'B', indices: [6, 3, 0] }, // B face is oriented differently
            { face: 'D', indices: [2, 5, 8] },
            { face: 'F', indices: [2, 5, 8] }
        ];
        this._shiftEdges(edges, clockwise);
    }

    // F (Front) face rotation
    _F(clockwise = true) {
        this._rotateFace('F', clockwise);
        const edges = [
            { face: 'U', indices: [6, 7, 8] },
            { face: 'R', indices: [0, 3, 6] },
            { face: 'D', indices: [0, 1, 2] },
            { face: 'L', indices: [2, 5, 8] }
        ];
        this._shiftEdges(edges, clockwise);
    }

    // B (Back) face rotation
    _B(clockwise = true) {
        this._rotateFace('B', clockwise);
        const edges = [
            { face: 'U', indices: [0, 1, 2] },
            { face: 'L', indices: [0, 3, 6] },
            { face: 'D', indices: [6, 7, 8] },
            { face: 'R', indices: [2, 5, 8] }
        ];
        this._shiftEdges(edges, clockwise);
    }

    // Scramble the cube
    scramble(numMoves) {
        const moves = ['U', 'U_PRIME', 'D', 'D_PRIME', 'L', 'L_PRIME', 'R', 'R_PRIME', 'F', 'F_PRIME', 'B', 'B_PRIME'];
        this.history = []; // Clear history for a new scramble
        for (let i = 0; i < numMoves; i++) {
            const randomMove = moves[Math.floor(Math.random() * moves.length)];
            this.manualRotate(randomMove, false); // Do not record scramble moves in history
        }
        this.render();
        console.log("Scrambled cube.");
    }

    // Check if the cube is solved
    isSolved() {
        for (const faceKey in this.state) {
            const expectedColor = this.colors[faceKey];
            if (!this.state[faceKey].every(sticker => sticker === expectedColor)) {
                return false;
            }
        }
        return true;
    }
}