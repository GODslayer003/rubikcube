// solver.js

/**
 * Represents a sequence of moves for a solution step.
 * @param {string} description A text description of the step (e.g., "Place Red-White edge").
 * @param {string[]} moves An array of move strings (e.g., ['R', 'U_PRIME', 'R_PRIME']).
 */
class SolutionStep {
    constructor(description, moves) {
        this.description = description;
        this.moves = moves;
    }
}

/**
 * Solves the Rubik's Cube using a layer-by-layer method.
 * Displays each step in the provided solutionStepsContainer.
 * @param {RubiksCube} cube The RubiksCube instance to solve.
 * @param {HTMLElement} solutionStepsContainer The DOM element to append solution steps to.
 */
async function solveCube(cube, solutionStepsContainer) {
    if (cube.isSolved()) {
        appendSolutionStep(solutionStepsContainer, new SolutionStep("Cube is already solved!", []));
        cube.render();
        return;
    }

    // Reset cube history for the solving process
    cube.history = [];

    appendSolutionStep(solutionStepsContainer, new SolutionStep("Starting solution algorithm...", []));

    // Phase 1: Solve the White Cross (Edges)
    await solveWhiteCross(cube, solutionStepsContainer);
    if (cube.isSolved()) return; // Early exit if solved during this phase

    // Phase 2: Solve White Corners
    await solveWhiteCorners(cube, solutionStepsContainer);
    if (cube.isSolved()) return;

    // Phase 3: Solve Middle Layer Edges
    await solveMiddleLayerEdges(cube, solutionStepsContainer);
    if (cube.isSolved()) return;

    // Phase 4: Orient Last Layer Edges (Yellow Cross)
    await orientLastLayerEdges(cube, solutionStepsContainer);
    if (cube.isSolved()) return;

    // Phase 5: Orient Last Layer Corners
    await orientLastLayerCorners(cube, solutionStepsContainer);
    if (cube.isSolved()) return;

    // Phase 6: Permute Last Layer Corners
    await permuteLastLayerCorners(cube, solutionStepsContainer);
    if (cube.isSolved()) return;

    // Phase 7: Permute Last Layer Edges
    await permuteLastLayerEdges(cube, solutionStepsContainer);
    if (cube.isSolved()) return;


    if (cube.isSolved()) {
        appendSolutionStep(solutionStepsContainer, new SolutionStep("Cube Solved! Congratulations!", []));
    } else {
        appendSolutionStep(solutionStepsContainer, new SolutionStep("Could not fully solve the cube. (Algorithm incomplete or encountered an unhandled state)", []));
    }
}

/**
 * Helper to append a solution step to the UI.
 * @param {HTMLElement} container
 * @param {SolutionStep} step
 * @param {RubiksCube} cube The cube state after applying the step's moves.
 */
async function appendSolutionStep(container, step, cubeStateAfterMove = null) {
    const stepDiv = document.createElement('div');
    stepDiv.className = 'solution-step';
    stepDiv.innerHTML = `
        <p class="font-bold text-lg mb-2">${step.description}</p>
        ${step.moves.length > 0 ? `<p class="text-sm text-gray-400">Moves: ${step.moves.join(', ')}</p>` : ''}
        <div class="step-cube-svg mt-3 flex justify-center"></div>
    `;
    container.appendChild(stepDiv);
    container.scrollTop = container.scrollHeight; // Scroll to bottom

    if (cubeStateAfterMove) {
        const svgContainer = stepDiv.querySelector('.step-cube-svg');
        svgContainer.innerHTML = getCubeSvg(cubeStateAfterMove.toColorString());
    }

    // Introduce a small delay for visualization
    await new Promise(resolve => setTimeout(resolve, 500)); // Adjust delay as needed
}


// --- PHASE 1: Solve White Cross (Edges) ---
async function solveWhiteCross(cube, solutionStepsContainer) {
    appendSolutionStep(solutionStepsContainer, new SolutionStep("Phase 1: Solving the White Cross", []));

    const whiteColor = cube.colors.D; // White is on the Down face
    const targetEdges = [
        { face: 'F', index: 7, otherFace: 'D', otherIndex: 1, targetColor1: cube.colors.F, targetColor2: whiteColor },
        { face: 'R', index: 7, otherFace: 'D', otherIndex: 5, targetColor1: cube.colors.R, targetColor2: whiteColor },
        { face: 'B', index: 7, otherFace: 'D', otherIndex: 7, targetColor1: cube.colors.B, targetColor2: whiteColor },
        { face: 'L', index: 7, otherFace: 'D', otherIndex: 3, targetColor1: cube.colors.L, targetColor2: whiteColor },
    ];

    for (const targetEdge of targetEdges) {
        let solved = false;
        while (!solved) {
            // Check if the edge is already correctly placed
            if (cube.state[targetEdge.face][targetEdge.index] === targetEdge.targetColor1 &&
                cube.state[targetEdge.otherFace][targetEdge.otherIndex] === targetEdge.targetColor2) {
                solved = true;
                appendSolutionStep(solutionStepsContainer, new SolutionStep(`Edge ${targetEdge.targetColor1.toUpperCase()}-${whiteColor.toUpperCase()} is correctly placed.`, []), cube.clone());
                continue;
            }

            // Find the current position of the target edge piece (white + targetEdge.targetColor1)
            let currentEdgePos = findEdgePiece(cube, whiteColor, targetEdge.targetColor1);

            if (!currentEdgePos) {
                appendSolutionStep(solutionStepsContainer, new SolutionStep(`Error: Could not find ${targetEdge.targetColor1.toUpperCase()}-${whiteColor.toUpperCase()} edge piece.`, []), cube.clone());
                break;
            }

            let moves = [];
            let description = `Placing ${targetEdge.targetColor1.toUpperCase()}-${whiteColor.toUpperCase()} edge. `;

            // Case 1: Edge is in the Up layer (U face or adjacent edges)
            if (currentEdgePos.face1 === 'U' || currentEdgePos.face2 === 'U') {
                // If on U face, rotate U to align
                if (currentEdgePos.face1 === 'U' && cube.state['U'][currentEdgePos.index1] === whiteColor) {
                    // White sticker is on U face. Need to flip it and bring down.
                    // This is complex, will need to be front or side first
                    let initialUrotations = 0;
                    while (currentEdgePos.face2 !== targetEdge.face) { // Align the colored sticker with its face
                        cube.manualRotate('U', true);
                        moves.push('U');
                        initialUrotations++;
                        currentEdgePos = findEdgePiece(cube, whiteColor, targetEdge.targetColor1); // Recalculate position
                        if (initialUrotations > 4) { console.error("U-loop issue"); break; }
                    }
                    description += `Aligning with ${currentEdgePos.face2} face. `;
                    cube.manualRotate(currentEdgePos.face2, true); moves.push(currentEdgePos.face2);
                    cube.manualRotate(currentEdgePos.face2, true); moves.push(currentEdgePos.face2); // Two rotations to bring to D and flip
                } else {
                    // White sticker is on a side face (F, R, B, L) adjacent to U.
                    let aligned = false;
                    for (let i = 0; i < 4; i++) { // Max 4 U rotations to align
                         currentEdgePos = findEdgePiece(cube, whiteColor, targetEdge.targetColor1); // Get updated position
                         // Check if the colored sticker matches its adjacent face (F, R, B, L)
                         if ( (currentEdgePos.face1 === 'F' && currentEdgePos.index1 === 1 && cube.state['F'][1] === targetEdge.targetColor1) ||
                              (currentEdgePos.face1 === 'R' && currentEdgePos.index1 === 1 && cube.state['R'][1] === targetEdge.targetColor1) ||
                              (currentEdgePos.face1 === 'B' && currentEdgePos.index1 === 1 && cube.state['B'][1] === targetEdge.targetColor1) ||
                              (currentEdgePos.face1 === 'L' && currentEdgePos.index1 === 1 && cube.state['L'][1] === targetEdge.targetColor1) ||
                              (currentEdgePos.face2 === 'F' && currentEdgePos.index2 === 1 && cube.state['F'][1] === targetEdge.targetColor1) ||
                              (currentEdgePos.face2 === 'R' && currentEdgePos.index2 === 1 && cube.state['R'][1] === targetEdge.targetColor1) ||
                              (currentEdgePos.face2 === 'B' && currentEdgePos.index2 === 1 && cube.state['B'][1] === targetEdge.targetColor1) ||
                              (currentEdgePos.face2 === 'L' && currentEdgePos.index2 === 1 && cube.state['L'][1] === targetEdge.targetColor1)
                            )
                          {
                            aligned = true;
                            break;
                          }
                          if (!aligned) {
                            cube.manualRotate('U', true);
                            moves.push('U');
                          }
                    }

                    if (aligned) {
                        description += `Aligned to bring down from U layer.`;
                        let faceToRotate;
                        if (currentEdgePos.face1 === 'U') faceToRotate = currentEdgePos.face2;
                        else if (currentEdgePos.face2 === 'U') faceToRotate = currentEdgePos.face1;
                        else { console.error("Edge not adjacent to U face as expected."); break; }

                        // Bring the aligned piece down
                        cube.manualRotate(faceToRotate, true); moves.push(faceToRotate);
                        cube.manualRotate(faceToRotate, true); moves.push(faceToRotate);
                    }
                }
            }
            // Case 2: Edge is in the middle layer (F, R, B, L faces, middle edges)
            else if (['F', 'R', 'B', 'L'].includes(currentEdgePos.face1) && ['F', 'R', 'B', 'L'].includes(currentEdgePos.face2)) {
                // Determine which face holds the white sticker
                let faceWithWhite = (cube.state[currentEdgePos.face1][currentEdgePos.index1] === whiteColor) ? currentEdgePos.face1 : currentEdgePos.face2;
                let faceWithColor = (faceWithWhite === currentEdgePos.face1) ? currentEdgePos.face2 : currentEdgePos.face1;
                let indexWithWhite = (faceWithWhite === currentEdgePos.face1) ? currentEdgePos.index1 : currentEdgePos.index2;

                description += `Moving edge from middle layer.`;

                // Bring it to the U layer first
                if (faceWithWhite === 'F' && indexWithWhite === 5) { // Right side of F
                    cube.manualRotate('R_PRIME', true); moves.push('R_PRIME');
                    cube.manualRotate('U', true); moves.push('U');
                    cube.manualRotate('R', true); moves.push('R');
                } else if (faceWithWhite === 'F' && indexWithWhite === 3) { // Left side of F
                    cube.manualRotate('L', true); moves.push('L');
                    cube.manualRotate('U_PRIME', true); moves.push('U_PRIME');
                    cube.manualRotate('L_PRIME', true); moves.push('L_PRIME');
                } else if (faceWithWhite === 'R' && indexWithWhite === 5) { // Right side of R
                    cube.manualRotate('B_PRIME', true); moves.push('B_PRIME');
                    cube.manualRotate('U', true); moves.push('U');
                    cube.manualRotate('B', true); moves.push('B');
                } else if (faceWithWhite === 'R' && indexWithWhite === 3) { // Left side of R
                    cube.manualRotate('F', true); moves.push('F');
                    cube.manualRotate('U_PRIME', true); moves.push('U_PRIME');
                    cube.manualRotate('F_PRIME', true); moves.push('F_PRIME');
                }
                // Add more conditions for B and L faces middle edges
                // ... (similar logic for B and L faces) ...
                 else if (faceWithWhite === 'B' && indexWithWhite === 5) { // Right side of B
                    cube.manualRotate('L_PRIME', true); moves.push('L_PRIME');
                    cube.manualRotate('U', true); moves.push('U');
                    cube.manualRotate('L', true); moves.push('L');
                } else if (faceWithWhite === 'B' && indexWithWhite === 3) { // Left side of B
                    cube.manualRotate('R', true); moves.push('R');
                    cube.manualRotate('U_PRIME', true); moves.push('U_PRIME');
                    cube.manualRotate('R_PRIME', true); moves.push('R_PRIME');
                } else if (faceWithWhite === 'L' && indexWithWhite === 5) { // Right side of L
                    cube.manualRotate('F_PRIME', true); moves.push('F_PRIME');
                    cube.manualRotate('U', true); moves.push('U');
                    cube.manualRotate('F', true); moves.push('F');
                } else if (faceWithWhite === 'L' && indexWithWhite === 3) { // Left side of L
                    cube.manualRotate('B', true); moves.push('B');
                    cube.manualRotate('U_PRIME', true); moves.push('U_PRIME');
                    cube.manualRotate('B_PRIME', true); moves.push('B_PRIME');
                }
            }
            // Case 3: Edge is in the Down layer but misplaced or flipped
            else if (currentEdgePos.face1 === 'D' || currentEdgePos.face2 === 'D') {
                 // Determine which adjacent face it's on (F,R,B,L)
                let adjacentFace = (currentEdgePos.face1 === 'D') ? currentEdgePos.face2 : currentEdgePos.face1;
                let indexOnAdjacent = (currentEdgePos.face1 === 'D') ? currentEdgePos.index2 : currentEdgePos.index1;
                let whiteIndexOnD = (currentEdgePos.face1 === 'D') ? currentEdgePos.index1 : currentEdgePos.index2;

                description += `Fixing edge in D layer.`;

                if (cube.state[adjacentFace][indexOnAdjacent] === targetEdge.targetColor1 && cube.state['D'][whiteIndexOnD] === whiteColor) {
                    // Correctly oriented but possibly in wrong slot on D (covered by initial check)
                    // Or oriented but not aligned. We need to get it to the U layer.
                    cube.manualRotate(adjacentFace, true); moves.push(adjacentFace); // Bring it up
                    cube.manualRotate(adjacentFace, true); moves.push(adjacentFace); // Bring it to U layer
                } else if (cube.state[adjacentFace][indexOnAdjacent] === whiteColor && cube.state['D'][whiteIndexOnD] === targetEdge.targetColor1) {
                    // Flipped in the D layer.
                    cube.manualRotate(adjacentFace, true); moves.push(adjacentFace); // Bring white to top
                    cube.manualRotate('U', true); moves.push('U'); // Move out of the way
                    cube.manualRotate(adjacentFace, true); moves.push(adjacentFace); // Bring original down
                    cube.manualRotate('U_PRIME', true); moves.push('U_PRIME'); // Bring white back
                    cube.manualRotate(adjacentFace, true); moves.push(adjacentFace); // Put white back, now flipped
                } else {
                     // Misplaced in the D layer
                    // Bring it to U layer first.
                    cube.manualRotate(adjacentFace, true); moves.push(adjacentFace); // To U
                    cube.manualRotate(adjacentFace, true); moves.push(adjacentFace); // To Flipped U
                }
            }
            // After moves, re-evaluate and loop or break if solved
            appendSolutionStep(solutionStepsContainer, new SolutionStep(description, moves), cube.clone());
        }
    }
    appendSolutionStep(solutionStepsContainer, new SolutionStep("White Cross Solved!", []), cube.clone());
}

/**
 * Finds the current location of an edge piece.
 * An edge piece has two colors.
 * Returns { face1: 'F', index1: 1, face2: 'U', index2: 7 } or null if not found.
 */
function findEdgePiece(cube, color1, color2) {
    const edgePositions = {
        'F': {
            1: { adj: 'U', adjIndex: 7 },
            3: { adj: 'L', adjIndex: 5 },
            5: { adj: 'R', adjIndex: 3 },
            7: { adj: 'D', adjIndex: 1 }
        },
        'R': {
            1: { adj: 'U', adjIndex: 5 },
            3: { adj: 'F', adjIndex: 5 },
            5: { adj: 'B', adjIndex: 3 },
            7: { adj: 'D', adjIndex: 5 }
        },
        'U': {
            1: { adj: 'B', adjIndex: 1 },
            3: { adj: 'L', adjIndex: 1 },
            5: { adj: 'R', adjIndex: 1 },
            7: { adj: 'F', adjIndex: 1 }
        },
        'B': {
            1: { adj: 'U', adjIndex: 1 },
            3: { adj: 'R', adjIndex: 5 },
            5: { adj: 'L', adjIndex: 3 },
            7: { adj: 'D', adjIndex: 7 }
        },
        'L': {
            1: { adj: 'U', adjIndex: 3 },
            3: { adj: 'B', adjIndex: 5 },
            5: { adj: 'F', adjIndex: 3 },
            7: { adj: 'D', adjIndex: 3 }
        },
        'D': {
            1: { adj: 'F', adjIndex: 7 },
            3: { adj: 'L', adjIndex: 7 },
            5: { adj: 'R', adjIndex: 7 },
            7: { adj: 'B', adjIndex: 7 }
        }
    };

    for (const faceKey in edgePositions) {
        for (const indexStr in edgePositions[faceKey]) {
            const index = parseInt(indexStr);
            const stickerColor = cube.state[faceKey][index];
            const adjacentInfo = edgePositions[faceKey][index];
            const adjacentFaceColor = cube.state[adjacentInfo.adj][adjacentInfo.adjIndex];

            // Check if the sticker pair matches the target colors
            if ((stickerColor === color1 && adjacentFaceColor === color2) ||
                (stickerColor === color2 && adjacentFaceColor === color1)) {
                return {
                    face1: faceKey,
                    index1: index,
                    face2: adjacentInfo.adj,
                    index2: adjacentInfo.adjIndex
                };
            }
        }
    }
    return null; // Edge piece not found
}


// --- Placeholder Functions for Remaining Phases ---
async function solveWhiteCorners(cube, solutionStepsContainer) {
    // This phase involves placing the 4 white corner pieces.
    // Each white corner piece has 3 colors (white, plus two adjacent face colors).
    // The general approach is:
    // 1. Find a white corner piece.
    // 2. Bring it to the U layer (if it's not already there).
    // 3. Position it above its target slot on the D layer by rotating U.
    // 4. Apply a sequence of R/R'/U/U' moves (e.g., R U R' U') to insert it.
    // Repeat for all 4 corners.
    appendSolutionStep(solutionStepsContainer, new SolutionStep("Phase 2: Solving White Corners (To be implemented)", []), cube.clone());
    // await new Promise(resolve => setTimeout(resolve, 1000));
}

async function solveMiddleLayerEdges(cube, solutionStepsContainer) {
    // This phase involves placing the 4 middle layer edge pieces (non-yellow).
    // Each piece has two colors (e.g., Red-Green, Blue-Orange).
    // The general approach is:
    // 1. Find a middle layer edge piece (on the U layer).
    // 2. Align its top color with its corresponding front/side face.
    // 3. Determine if it needs to go left or right.
    // 4. Apply a specific algorithm to insert it into the middle layer without disturbing the first layer.
    // Repeat for all 4 edges.
    appendSolutionStep(solutionStepsContainer, new SolutionStep("Phase 3: Solving Middle Layer Edges (To be implemented)", []), cube.clone());
    // await new Promise(resolve => setTimeout(resolve, 1000));
}

async function orientLastLayerEdges(cube, solutionStepsContainer) {
    // Goal: Form a yellow cross on the U face.
    // This involves orienting the 4 yellow edges. Their position doesn't matter yet, only orientation.
    // Common states:
    //   - Dot (no yellow edges pointing up)
    //   - L-shape (two adjacent yellow edges pointing up)
    //   - Line (two opposite yellow edges pointing up)
    //   - Cross (already solved)
    // Algorithm: F R U R' U' F' (or variations) for L-shape/Line.
    appendSolutionStep(solutionStepsContainer, new SolutionStep("Phase 4: Orienting Last Layer Edges (Yellow Cross) (To be implemented)", []), cube.clone());
    // await new Promise(resolve => setTimeout(resolve, 1000));
}

async function orientLastLayerCorners(cube, solutionStepsContainer) {
    // Goal: Get all yellow stickers on the U face.
    // This involves orienting the 4 yellow corner pieces. Their position doesn't matter yet.
    // Use the Sune algorithm (R U R' U R U2 R') or Anti-Sune until all corners are oriented.
    appendSolutionStep(solutionStepsContainer, new SolutionStep("Phase 5: Orienting Last Layer Corners (To be implemented)", []), cube.clone());
    // await new Promise(resolve => setTimeout(resolve, 1000));
}

async function permuteLastLayerCorners(cube, solutionStepsContainer) {
    // Goal: Get all yellow corners into their correct positions (even if still misoriented, but Phase 5 should have fixed that).
    // This involves swapping corners.
    // Use the T-Permutation (R U R' U' R' F R2 U' R' U' R U R' F') or U-Permutation.
    // The objective is to get at least one corner correctly placed, then use algorithms to cycle others.
    appendSolutionStep(solutionStepsContainer, new SolutionStep("Phase 6: Permuting Last Layer Corners (To be implemented)", []), cube.clone());
    // await new Promise(resolve => setTimeout(resolve, 1000));
}

async function permuteLastLayerEdges(cube, solutionStepsContainer) {
    // Goal: Get all yellow edges into their correct positions.
    // This is the final step, usually involving U-Permutations (cycling 3 edges).
    // Algorithms like (M2 U M2 U2 M2 U M2) can be used.
    appendSolutionStep(solutionStepsContainer, new SolutionStep("Phase 7: Permuting Last Layer Edges (To be implemented)", []), cube.clone());
    // await new Promise(resolve => setTimeout(resolve, 1000));
}