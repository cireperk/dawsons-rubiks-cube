export interface TutorialStep {
  title: string;
  subtitle: string;
  content: string[];
  algorithm?: string;
  tip?: string;
  demoMoves: string[];
}

export const tutorialSteps: TutorialStep[] = [
  {
    title: "Step 1",
    subtitle: "Get to Know Your Cube",
    content: [
      "Welcome! A Rubik's Cube has 6 faces, each with 9 colored stickers. The center pieces never move — they define each face's color.",
      "There are 3 types of pieces: Centers (6 total, fixed), Edges (12 total, 2 colors each), and Corners (8 total, 3 colors each).",
      "Standard color scheme: White opposite Yellow, Red opposite Orange, Blue opposite Green. Hold the cube with White on top and Green facing you.",
    ],
    tip: "The center pieces are fixed! White is always opposite Yellow, Red is always opposite Orange, and Blue is always opposite Green. Use centers as your guide.",
    demoMoves: ["R", "U", "R'", "U'", "F", "F'", "L", "L'"],
  },
  {
    title: "Step 2",
    subtitle: "Learn the Notation",
    content: [
      "Each letter represents a face: R (Right), L (Left), U (Up), D (Down), F (Front), B (Back).",
      "A letter alone means turn that face 90° clockwise (as if looking at it). A letter with an apostrophe (') means turn 90° counter-clockwise. A letter with '2' means turn 180°.",
      "For example: R means turn the right face clockwise. R' means turn the right face counter-clockwise. R2 means turn the right face 180°.",
    ],
    tip: "Practice each move slowly. Pick up your cube and try: R, then R' to undo it. Then try U, U'. Get comfortable before moving on!",
    demoMoves: ["R", "R'", "U", "U'", "F", "F'", "L", "L'", "D", "D'", "B", "B'"],
  },
  {
    title: "Step 3",
    subtitle: "The White Cross",
    content: [
      "Start by making a cross on the White face. Find white edge pieces and move them to the top to form a plus sign.",
      "The tricky part: each white edge must also match the center color of its side. The white-blue edge should be between the white center and blue center.",
      "If a white edge is in the bottom layer, turn that face twice (e.g., F2) to bring it to the top. If it's in the middle layer, use a simple move to get it out first.",
    ],
    tip: "Don't worry about corners yet — just focus on getting 4 white edges into position with matching side colors. This step is mostly intuitive!",
    demoMoves: ["F2", "R", "D'", "R'", "F2", "U", "L2"],
  },
  {
    title: "Step 4",
    subtitle: "White Corners",
    content: [
      "Now fill in the corners to complete the white face. Find a white corner piece in the bottom layer, position it below where it needs to go.",
      "Use this algorithm to insert corners: hold the cube so the corner's target spot is on the front-right-top. Then apply the algorithm below.",
      "If the white sticker faces right, do the algorithm once. If it faces front, do it three times. If it faces down, do it five times. Repeat for all 4 corners.",
    ],
    algorithm: "R' D' R D",
    tip: "This is the 'sexy move' — the most important algorithm in cubing! You might need to repeat it up to 5 times for one corner. If a corner is in the top layer but wrong, use R' D' R D to pop it out first.",
    demoMoves: ["R'", "D'", "R", "D", "R'", "D'", "R", "D", "R'", "D'", "R", "D"],
  },
  {
    title: "Step 5",
    subtitle: "Second Layer Edges",
    content: [
      "Flip the cube over so Yellow is on top. Now solve the middle layer edges.",
      "Find an edge piece in the top layer that does NOT have yellow on it. Turn U until its front color matches the front center.",
      "If the edge needs to go RIGHT, use the algorithm below. If it needs to go LEFT, mirror it (do the opposite). This inserts the edge into the middle layer.",
    ],
    algorithm: "U R U' R' U' F' U F",
    tip: "The mirror (insert left) is: U' L' U L U F U' F'. If a middle edge is in the right spot but flipped, insert any top edge into its spot to pop it out, then re-insert correctly.",
    demoMoves: ["U", "R", "U'", "R'", "U'", "F'", "U", "F"],
  },
  {
    title: "Step 6",
    subtitle: "Yellow Cross",
    content: [
      "Now make a yellow cross on top. You might see a dot, an L-shape, or a line. Apply the algorithm to cycle: dot → L → line → cross.",
      "For the L-shape: hold it in the back-left corner. For the line: hold it going left-to-right (horizontal). Then apply the algorithm.",
      "You may need to apply this 1-3 times to get the full cross.",
    ],
    algorithm: "F R U R' U' F'",
    tip: "You're only getting the cross shape — don't worry if the side colors don't match yet. That's the next step!",
    demoMoves: ["F", "R", "U", "R'", "U'", "F'"],
  },
  {
    title: "Step 7",
    subtitle: "Position Yellow Edges",
    content: [
      "Now align the yellow cross edges with their matching centers. Turn U until at least 2 edges match their centers.",
      "If 2 adjacent edges match: hold the solved pair at the back and left, then apply the algorithm.",
      "If 2 opposite edges match: apply the algorithm once to make them adjacent, then solve as above.",
    ],
    algorithm: "R U R' U R U2 R'",
    tip: "After solving, all 4 yellow edges should match their center colors. You might need to apply the algorithm twice!",
    demoMoves: ["R", "U", "R'", "U", "R", "U2", "R'"],
  },
  {
    title: "Step 8",
    subtitle: "Position Yellow Corners",
    content: [
      "Get the yellow corners into their correct positions (colors may still be twisted wrong — that's OK for now).",
      "Look at the top corners. Find any corner that's in the right position (its 3 colors match the 3 faces it touches, even if rotated wrong).",
      "Hold that correct corner at the front-right-top and apply the algorithm. If no corners are correct, apply the algorithm once from any angle, then find the correct one.",
    ],
    algorithm: "U R U' L' U R' U' L",
    tip: "Only the POSITION matters here, not the orientation. A corner is 'correct' if it has the right 3 colors, even if they're rotated to the wrong faces.",
    demoMoves: ["U", "R", "U'", "L'", "U", "R'", "U'", "L"],
  },
  {
    title: "Step 9",
    subtitle: "Orient Yellow Corners — YOU'RE ALMOST DONE!",
    content: [
      "The final step! Keep yellow on top. Put an unsolved corner at the front-right-top position.",
      "Apply R' D' R D repeatedly (2 or 4 times) until that corner is solved. The cube will look scrambled — DON'T PANIC, this is normal!",
      "Once that corner is solved, turn ONLY the U face (not the whole cube!) to bring the next unsolved corner to front-right-top. Repeat R' D' R D until all corners are solved.",
    ],
    algorithm: "R' D' R D (repeat until corner is oriented)",
    tip: "THIS IS THE MOST IMPORTANT RULE: Never rotate the whole cube during this step — only turn the U face to bring new corners into position. The cube WILL look messed up until the very last corner clicks into place. Trust the process!",
    demoMoves: [
      "R'", "D'", "R", "D",
      "R'", "D'", "R", "D",
      "U",
      "R'", "D'", "R", "D",
      "R'", "D'", "R", "D",
    ],
  },
];
