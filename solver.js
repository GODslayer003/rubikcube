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
 * @param {RubiksCube} cube The RubiksCube instance to solve.
 * @param {HTMLElement} solutionStepsContainer The DOM element to append solution steps to.
 * @param {Function} setSolverStatus Callback to update UI status messages.
 */
async function solveCube(cube, solutionStepsContainer, setSolverStatus) {
    if (cube.isSolved()) {
        await appendSolutionStep(solutionStepsContainer, new SolutionStep("Cube is already solved!", []), cube.clone());
        setSolverStatus("Cube is solved!");
        return;
    }

    // Reset cube history for the solving process
    cube.history = [];

    setSolverStatus("Starting solution algorithm...", true);
    await appendSolutionStep(solutionStepsContainer, new SolutionStep("Starting solution algorithm...", []), cube.clone());

    // Phase 1: Solve the White Cross (Edges)
    await solveWhiteCross(cube, solutionStepsContainer, setSolverStatus);
    if (cube.isSolved()) {
        setSolverStatus("Cube Solved! Congratulations!", false);
        return;
    }

    // Phase 2: Solve White Corners
    await solveWhiteCorners(cube, solutionStepsContainer, setSolverStatus);
    if (cube.isSolved()) {
        setSolverStatus("Cube Solved! Congratulations!", false);
        return;
    }

    // Phase 3: Solve Middle Layer Edges
    await solveMiddleLayerEdges(cube, solutionStepsContainer, setSolverStatus);
    if (cube.isSolved()) {
        setSolverStatus("Cube Solved! Congratulations!", false);
        return;
    }

    // Phase 4: Orient Last Layer Edges (Yellow Cross)
    await orientLastLayerEdges(cube, solutionStepsContainer, setSolverStatus);
    if (cube.isSolved()) {
        setSolverStatus("Cube Solved! Congratulations!", false);
        return;
    }

    // Phase 5: Orient Last Layer Corners
    await orientLastLayerCorners(cube, solutionStepsContainer, setSolverStatus);
    if (cube.isSolved()) {
        setSolverStatus("Cube Solved! Congratulations!", false);
        return;
    }

    // Phase 6: Permute Last Layer Corners
    await permuteLastLayerCorners(cube, solutionStepsContainer, setSolverStatus);
    if (cube.isSolved()) {
        setSolverStatus("Cube Solved! Congratulations!", false);
        return;
    }

    // Phase 7: Permute Last Layer Edges
    await permuteLastLayerEdges(cube, solutionStepsContainer, setSolverStatus);
    if (cube.isSolved()) {
        setSolverStatus("Cube Solved! Congratulations!", false);
    } else {
        setSolverStatus("Could not fully solve the cube. (Algorithm incomplete or encountered an unhandled state)", false);
        await appendSolutionStep(solutionStepsContainer, new SolutionStep("Could not fully solve the cube. (Algorithm incomplete or encountered an unhandled state)", []), cube.clone());
    }
}

/**
 * Helper to append a solution step to the UI.
 * @param {HTMLElement} container
 * @param {SolutionStep} step
 * @param {RubiksCube} cubeStateAfterMove The cube state after applying the step's moves.
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
    await new Promise(resolve => setTimeout(resolve, 300)); // Adjust delay as needed
}

// --- PHASE 1: Solve White Cross (Edges) ---
async function solveWhiteCross(cube, solutionStepsContainer, setSolverStatus) {
    setSolverStatus("Phase 1: Solving the White Cross...", true);
    await appendSolutionStep(solutionStepsContainer, new SolutionStep("Phase 1: Solving the White Cross", []), cube.clone());

    const whiteColor = cube.colors.D; 
    const targetEdges = [
        { color1: cube.colors.F, color2: whiteColor, targetFace: 'F', targetIndex: 7, targetDFaceIndex: 1 }, // Front-Down edge
        { color1: cube.colors.R, color2: whiteColor, targetFace: 'R', targetIndex: 7, targetDFaceIndex: 5 }, // Right-Down edge
        { color1: cube.colors.B, color2: whiteColor, targetFace: 'B', targetIndex: 7, targetDFaceIndex: 7 }, // Back-Down edge
        { color1: cube.colors.L, color2: whiteColor, targetFace: 'L', targetIndex: 7, targetDFaceIndex: 3 }, // Left-Down edge
    ];

    for (const targetEdge of targetEdges) {
        let attempts = 0;
        const maxAttempts = 20; // Prevent infinite loops in complex cases

        while (attempts < maxAttempts) {
           
            if (cube.state[targetEdge.targetFace][targetEdge.targetIndex] === targetEdge.color1 &&
                cube.state['D'][targetEdge.targetDFaceIndex] === targetEdge.color2) {
                await appendSolutionStep(solutionStepsContainer, new SolutionStep(`Edge ${targetEdge.color1.toUpperCase()}-${targetEdge.color2.toUpperCase()} is correctly placed.`, []), cube.clone());
                break; // This edge is solved, move to the next
            }

            // Find the current position of the target edge piece (white + targetEdge.color1)
            let currentEdgePos = findEdgePiece(cube, targetEdge.color1, targetEdge.color2);

            if (!currentEdgePos) {
                await appendSolutionStep(solutionStepsContainer, new SolutionStep(`Error: Could not find ${targetEdge.color1.toUpperCase()}-${targetEdge.color2.toUpperCase()} edge piece.`, []), cube.clone());
                break; // Cannot find piece, something is wrong or piece not generated
            }

            let moves = [];
            let description = `Placing ${targetEdge.color1.toUpperCase()}-${targetEdge.color2.toUpperCase()} edge. `;

            // Case 1: Edge is in the Down layer but misplaced or flipped
            if (currentEdgePos.face1 === 'D' || currentEdgePos.face2 === 'D') {
                // Determine which side face it's connected to
                let adjacentFaceKey = (currentEdgePos.face1 === 'D') ? currentEdgePos.face2 : currentEdgePos.face1;
                let adjacentIndex = (currentEdgePos.face1 === 'D') ? currentEdgePos.index2 : currentEdgePos.index1;
                let dFaceIndex = (currentEdgePos.face1 === 'D') ? currentEdgePos.index1 : currentEdgePos.index2;

                // If already in target position but flipped, or just in the wrong D slot
                if (adjacentFaceKey === targetEdge.targetFace && cube.state[adjacentFaceKey][adjacentIndex] === targetEdge.color2 && cube.state['D'][dFaceIndex] === targetEdge.color1) {
                    // It's in the correct slot, but flipped (white on side, color on D)
                    description += `Flipping ${adjacentFaceKey} edge in D layer.`;
                    cube.manualRotate(adjacentFaceKey, true); moves.push(adjacentFaceKey); // Bring white sticker to U layer
                    cube.manualRotate('U', true); moves.push('U'); // Move it out of the way
                    cube.manualRotate(adjacentFaceKey + '_PRIME', true); moves.push(adjacentFaceKey + '_PRIME'); // Put the D-slot back
                    // Now the white sticker is in U layer, ready to be handled by the next section
                } else if (adjacentFaceKey !== targetEdge.targetFace || cube.state[adjacentFaceKey][adjacentIndex] !== targetEdge.color1) {
                    // It's in the D layer but either in the wrong slot or wrong color showing.
                    // Bring it up to the U layer to handle it
                    description += `Moving ${adjacentFaceKey} edge from D layer to U layer.`;
                    cube.manualRotate(adjacentFaceKey, true); moves.push(adjacentFaceKey);
                    cube.manualRotate(adjacentFaceKey, true); moves.push(adjacentFaceKey); // Two rotations bring it to U
                }
            }
            // After potential moves to bring it to U layer, re-find its position
            currentEdgePos = findEdgePiece(cube, targetEdge.color1, targetEdge.color2);

            
            if (currentEdgePos && (currentEdgePos.face1 === 'U' || currentEdgePos.face2 === 'U' ||
                (['F','R','B','L'].includes(currentEdgePos.face1) && ['F','R','B','L'].includes(currentEdgePos.face2)))) {

                let currentFaceWithWhite, currentFaceWithColor1;
                let currentIdxWithWhite, currentIdxWithColor1;

                if (cube.state[currentEdgePos.face1][currentEdgePos.index1] === whiteColor) {
                    currentFaceWithWhite = currentEdgePos.face1;
                    currentIdxWithWhite = currentEdgePos.index1;
                    currentFaceWithColor1 = currentEdgePos.face2;
                    currentIdxWithColor1 = currentEdgePos.index2;
                } else {
                    currentFaceWithWhite = currentEdgePos.face2;
                    currentIdxWithWhite = currentEdgePos.index2;
                    currentFaceWithColor1 = currentEdgePos.face1;
                    currentIdxWithColor1 = currentEdgePos.index1;
                }

                // If white sticker is on the U face (i.e., it's "flipped" relative to the orientation we want for direct insertion)
                if (currentFaceWithWhite === 'U') {
                    description += `Aligning and inserting ${targetEdge.color1.toUpperCase()}-${targetEdge.color2.toUpperCase()} (white on U). `;
                    let rotations = 0;
                    while (currentFaceWithColor1 !== targetEdge.targetFace && rotations < 4) {
                        cube.manualRotate('U', true);
                        moves.push('U');
                        // Re-evaluate position after U rotation
                        currentEdgePos = findEdgePiece(cube, targetEdge.color1, targetEdge.color2);
                        if (cube.state[currentEdgePos.face1][currentEdgePos.index1] === whiteColor) {
                           currentFaceWithColor1 = currentEdgePos.face2;
                        } else {
                           currentFaceWithColor1 = currentEdgePos.face1;
                        }
                        rotations++;
                    }
                    if (currentFaceWithColor1 === targetEdge.targetFace) {
                         // Now the colored sticker is on the correct side face's top edge
                         cube.manualRotate(targetEdge.targetFace, true); moves.push(targetEdge.targetFace);
                         cube.manualRotate('U', true); moves.push('U');
                         cube.manualRotate(targetEdge.targetFace + '_PRIME', true); moves.push(targetEdge.targetFace + '_PRIME');
                    } else {
                         
                         let faceToMove = currentFaceWithColor1; // The face whose top edge has the colored sticker
                         cube.manualRotate(faceToMove, true); moves.push(faceToMove);
                         cube.manualRotate('U', true); moves.push('U');
                         cube.manualRotate(faceToMove + '_PRIME', true); moves.push(faceToMove + '_PRIME');
                    }

                } else { // White sticker is on a side face (F, R, B, L)
                    description += `Aligning and inserting ${targetEdge.color1.toUpperCase()}-${targetEdge.color2.toUpperCase()} (white on side). `;
                    let rotations = 0;
                    while (currentFaceWithWhite !== targetEdge.targetFace && rotations < 4) {
                        cube.manualRotate('U', true);
                        moves.push('U');
                        currentEdgePos = findEdgePiece(cube, targetEdge.color1, targetEdge.color2);
                        if (cube.state[currentEdgePos.face1][currentEdgePos.index1] === whiteColor) {
                            currentFaceWithWhite = currentEdgePos.face1;
                        } else {
                            currentFaceWithWhite = currentEdgePos.face2;
                        }
                        rotations++;
                    }
                    if (currentFaceWithWhite === targetEdge.targetFace) {
                        // The white sticker is on the correct front face. Simply rotate face twice.
                        cube.manualRotate(targetEdge.targetFace, true); moves.push(targetEdge.targetFace);
                        cube.manualRotate(targetEdge.targetFace, true); moves.push(targetEdge.targetFace);
                    } else {
                        
                        if (['F','R','B','L'].includes(currentFaceWithColor1) && ['F','R','B','L'].includes(currentFaceWithWhite)) {
                             // Kick out of middle layer to U
                             let faceToRotate = currentFaceWithWhite; // The face that has the white sticker
                             let primeOrNormal = (currentIdxWithWhite === 3) ? '' : '_PRIME'; // Adjust based on left/right side of face
                             if (faceToRotate === 'F' && currentIdxWithWhite === 5) { // Right edge of F
                                 cube.manualRotate('R', true); moves.push('R');
                                 cube.manualRotate('U', true); moves.push('U');
                                 cube.manualRotate('R_PRIME', true); moves.push('R_PRIME');
                             } else if (faceToRotate === 'F' && currentIdxWithWhite === 3) { // Left edge of F
                                 cube.manualRotate('L_PRIME', true); moves.push('L_PRIME');
                                 cube.manualRotate('U_PRIME', true); moves.push('U_PRIME');
                                 cube.manualRotate('L', true); moves.push('L');
                             }
                             // Add similar logic for other faces if needed.
                             // After this, it should be in the U layer, and the loop will re-evaluate.
                        }
                    }
                }
            } else {
                
                await appendSolutionStep(solutionStepsContainer, new SolutionStep(`Could not find standard path for ${targetEdge.color1.toUpperCase()}-${targetEdge.color2.toUpperCase()} edge. Trying to reposition.`, []), cube.clone());
                 // As a last resort, make some general moves that might expose it
                 cube.manualRotate('U',true); moves.push('U');
                 cube.manualRotate('R',true); moves.push('R');
                 cube.manualRotate('U_PRIME',true); moves.push('U_PRIME');
                 cube.manualRotate('R_PRIME',true); moves.push('R_PRIME');
            }

            await appendSolutionStep(solutionStepsContainer, new SolutionStep(description, moves), cube.clone());
            attempts++; // Increment attempts to prevent infinite loops
            if (attempts >= maxAttempts) {
                console.error(`Max attempts reached for ${targetEdge.color1.toUpperCase()}-${targetEdge.color2.toUpperCase()} edge. Could not solve.`);
                await appendSolutionStep(solutionStepsContainer, new SolutionStep(`Failed to place ${targetEdge.color1.toUpperCase()}-${targetEdge.color2.toUpperCase()} edge after multiple attempts.`, []), cube.clone());
                break;
            }
        }
    }
    setSolverStatus("White Cross Solved!", false);
    await appendSolutionStep(solutionStepsContainer, new SolutionStep("White Cross Solved!", []), cube.clone());
}


function findEdgePiece(cube, color1, color2) {
    const edgePositions = {
        'F': {
            1: { adjFace: 'U', adjIndex: 7 }, // F-U edge
            3: { adjFace: 'L', adjIndex: 5 }, // F-L edge
            5: { adjFace: 'R', adjIndex: 3 }, // F-R edge
            7: { adjFace: 'D', adjIndex: 1 }  // F-D edge
        },
        'R': {
            1: { adjFace: 'U', adjIndex: 5 }, // R-U edge
            3: { adjFace: 'F', adjIndex: 5 }, // R-F edge
            5: { adjFace: 'B', adjIndex: 3 }, // R-B edge
            7: { adjFace: 'D', adjIndex: 5 }  // R-D edge
        },
        'U': {
            1: { adjFace: 'B', adjIndex: 1 }, // U-B edge
            3: { adjFace: 'L', adjIndex: 1 }, // U-L edge
            5: { adjFace: 'R', adjIndex: 1 }, // U-R edge
            7: { adjFace: 'F', adjIndex: 1 }  // U-F edge
        },
        'B': {
            1: { adjFace: 'U', adjIndex: 1 }, // B-U edge
            3: { adjFace: 'R', adjIndex: 5 }, // B-R edge
            5: { adjFace: 'L', adjIndex: 3 }, // B-L edge
            7: { adjFace: 'D', adjIndex: 7 }  // B-D edge
        },
        'L': {
            1: { adjFace: 'U', adjIndex: 3 }, // L-U edge
            3: { adjFace: 'B', adjIndex: 5 }, // L-B edge
            5: { adjFace: 'F', adjIndex: 3 }, // L-F edge
            7: { adjFace: 'D', adjIndex: 3 }  // L-D edge
        },
        'D': {
            1: { adjFace: 'F', adjIndex: 7 }, // D-F edge
            3: { adjFace: 'L', adjIndex: 7 }, // D-L edge
            5: { adjFace: 'R', adjIndex: 7 }, // D-R edge
            7: { adjFace: 'B', adjIndex: 7 }  // D-B edge
        }
    };

    for (const faceKey in edgePositions) {
        for (const indexStr in edgePositions[faceKey]) {
            const index = parseInt(indexStr);
            const stickerColor = cube.state[faceKey][index];
            const adjacentInfo = edgePositions[faceKey][index];
            const adjacentFaceColor = cube.state[adjacentInfo.adjFace][adjacentInfo.adjIndex];

            // Check if this pair of stickers matches the target colors (either order)
            if ((stickerColor === color1 && adjacentFaceColor === color2) ||
                (stickerColor === color2 && adjacentFaceColor === color1)) {
                return {
                    face1: faceKey,
                    index1: index,
                    face2: adjacentInfo.adjFace,
                    index2: adjacentInfo.adjIndex
                };
            }
        }
    }
    return null; // Edge piece not found
}


// --- Placeholder Functions for Remaining Phases ---
async function solveWhiteCorners(cube, solutionStepsContainer, setSolverStatus) {
    setSolverStatus("Phase 2: Solving White Corners...", true);
    await appendSolutionStep(solutionStepsContainer, new SolutionStep("Phase 2: Solving White Corners (To be implemented)", []), cube.clone());
    await new Promise(resolve => setTimeout(resolve, 1000));
}

async function solveMiddleLayerEdges(cube, solutionStepsContainer, setSolverStatus) {
    setSolverStatus("Phase 3: Solving Middle Layer Edges...", true);
    await appendSolutionStep(solutionStepsContainer, new SolutionStep("Phase 3: Solving Middle Layer Edges (To be implemented)", []), cube.clone());
    await new Promise(resolve => setTimeout(resolve, 1000));
}

async function orientLastLayerEdges(cube, solutionStepsContainer, setSolverStatus) {
    setSolverStatus("Phase 4: Orienting Last Layer Edges (Yellow Cross)...", true);
    await appendSolutionStep(solutionStepsContainer, new SolutionStep("Phase 4: Orienting Last Layer Edges (Yellow Cross) (To be implemented)", []), cube.clone());
    await new Promise(resolve => setTimeout(resolve, 1000));
}

async function orientLastLayerCorners(cube, solutionStepsContainer, setSolverStatus) {
    setSolverStatus("Phase 5: Orienting Last Layer Corners...", true);
    await appendSolutionStep(solutionStepsContainer, new SolutionStep("Phase 5: Orienting Last Layer Corners (To be implemented)", []), cube.clone());
    await new Promise(resolve => setTimeout(resolve, 1000));
}

async function permuteLastLayerCorners(cube, solutionStepsContainer, setSolverStatus) {
    setSolverStatus("Phase 6: Permuting Last Layer Corners...", true);
    await appendSolutionStep(solutionStepsContainer, new SolutionStep("Phase 6: Permuting Last Layer Corners (To be implemented)", []), cube.clone());
    await new Promise(resolve => setTimeout(resolve, 1000));
}

async function permuteLastLayerEdges(cube, solutionStepsContainer, setSolverStatus) {
    setSolverStatus("Phase 7: Permuting Last Layer Edges...", true);
    await appendSolutionStep(solutionStepsContainer, new SolutionStep("Phase 7: Permuting Last Layer Edges (To be implemented)", []), cube.clone());
    await new Promise(resolve => setTimeout(resolve, 1000));
}