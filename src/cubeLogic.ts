import * as THREE from "three";

export interface CubieData {
  id: number;
  position: THREE.Vector3;
  quaternion: THREE.Quaternion;
  initialPosition: [number, number, number];
}

export interface MoveDefinition {
  axis: THREE.Vector3;
  angle: number;
  filter: (pos: THREE.Vector3) => boolean;
}

const X = new THREE.Vector3(1, 0, 0);
const Y = new THREE.Vector3(0, 1, 0);
const Z = new THREE.Vector3(0, 0, 1);

export const MOVE_DEFS: Record<string, MoveDefinition> = {
  R: { axis: X, angle: -Math.PI / 2, filter: (p) => p.x > 0.5 },
  "R'": { axis: X, angle: Math.PI / 2, filter: (p) => p.x > 0.5 },
  R2: { axis: X, angle: -Math.PI, filter: (p) => p.x > 0.5 },
  L: { axis: X, angle: Math.PI / 2, filter: (p) => p.x < -0.5 },
  "L'": { axis: X, angle: -Math.PI / 2, filter: (p) => p.x < -0.5 },
  L2: { axis: X, angle: Math.PI, filter: (p) => p.x < -0.5 },
  U: { axis: Y, angle: -Math.PI / 2, filter: (p) => p.y > 0.5 },
  "U'": { axis: Y, angle: Math.PI / 2, filter: (p) => p.y > 0.5 },
  U2: { axis: Y, angle: -Math.PI, filter: (p) => p.y > 0.5 },
  D: { axis: Y, angle: Math.PI / 2, filter: (p) => p.y < -0.5 },
  "D'": { axis: Y, angle: -Math.PI / 2, filter: (p) => p.y < -0.5 },
  D2: { axis: Y, angle: Math.PI, filter: (p) => p.y < -0.5 },
  F: { axis: Z, angle: -Math.PI / 2, filter: (p) => p.z > 0.5 },
  "F'": { axis: Z, angle: Math.PI / 2, filter: (p) => p.z > 0.5 },
  F2: { axis: Z, angle: -Math.PI, filter: (p) => p.z > 0.5 },
  B: { axis: Z, angle: Math.PI / 2, filter: (p) => p.z < -0.5 },
  "B'": { axis: Z, angle: -Math.PI / 2, filter: (p) => p.z < -0.5 },
  B2: { axis: Z, angle: Math.PI, filter: (p) => p.z < -0.5 },
};

export function createSolvedCube(): CubieData[] {
  const cubies: CubieData[] = [];
  let id = 0;
  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      for (let z = -1; z <= 1; z++) {
        cubies.push({
          id: id++,
          position: new THREE.Vector3(x, y, z),
          quaternion: new THREE.Quaternion(),
          initialPosition: [x, y, z],
        });
      }
    }
  }
  return cubies;
}

export function roundPosition(v: THREE.Vector3): void {
  v.x = Math.round(v.x);
  v.y = Math.round(v.y);
  v.z = Math.round(v.z);
}

export function applyMoveToCubies(
  cubies: CubieData[],
  moveName: string
): CubieData[] {
  const def = MOVE_DEFS[moveName];
  if (!def) return cubies;

  const rotQ = new THREE.Quaternion().setFromAxisAngle(def.axis, def.angle);

  return cubies.map((c) => {
    if (!def.filter(c.position)) return c;

    const newPos = c.position.clone().applyQuaternion(rotQ);
    roundPosition(newPos);

    const newQuat = rotQ.clone().multiply(c.quaternion);

    return {
      ...c,
      position: newPos,
      quaternion: newQuat,
    };
  });
}

export function parseMoves(algorithm: string): string[] {
  return algorithm
    .split(/\s+/)
    .filter((m) => m.length > 0 && MOVE_DEFS[m] !== undefined);
}
