import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { RoundedBox, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { CubieData } from "../cubeLogic";
import {
  createSolvedCube,
  MOVE_DEFS,
  applyMoveToCubies,
  roundPosition,
} from "../cubeLogic";

const CUBE_SIZE = 0.9;
const GAP = 0.08;
const OFFSET = CUBE_SIZE + GAP;

const FACE_COLORS: Record<string, string> = {
  right: "#ff3d00",
  left: "#ff6d00",
  top: "#ffffff",
  bottom: "#ffab00",
  front: "#00e676",
  back: "#2979ff",
};

/* ——— Sticker (interactive when interactive=true) ——— */
function Sticker({
  position,
  rotation,
  color,
  faceNormal,
  cubieGridPos,
  onStickerDown,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  color: string;
  faceNormal?: THREE.Vector3;
  cubieGridPos?: THREE.Vector3;
  onStickerDown?: (
    e: THREE.Event,
    faceNormal: THREE.Vector3,
    cubiePos: THREE.Vector3
  ) => void;
}) {
  return (
    <mesh
      position={position}
      rotation={rotation}
      onPointerDown={
        onStickerDown && faceNormal && cubieGridPos
          ? (e) => {
              e.stopPropagation();
              onStickerDown(e, faceNormal, cubieGridPos);
            }
          : undefined
      }
    >
      <planeGeometry args={[CUBE_SIZE * 0.85, CUBE_SIZE * 0.85]} />
      <meshStandardMaterial color={color} side={THREE.DoubleSide} />
    </mesh>
  );
}

/* ——— Cubie ——— */
function Cubie({
  cubieData,
  onStickerDown,
}: {
  cubieData: CubieData;
  onStickerDown?: (
    e: THREE.Event,
    faceNormal: THREE.Vector3,
    cubiePos: THREE.Vector3
  ) => void;
}) {
  const [ix, iy, iz] = cubieData.initialPosition;
  const gridPos = cubieData.position;
  const quat = cubieData.quaternion;

  // Transform local face normals to world space so drag direction is correct
  // after the cubie has been rotated by previous moves
  const wrappedDown = onStickerDown
    ? (e: THREE.Event, localNormal: THREE.Vector3, pos: THREE.Vector3) => {
        const worldNormal = localNormal.clone().applyQuaternion(quat).normalize();
        // Snap to nearest axis to avoid float drift
        const ax = Math.abs(worldNormal.x);
        const ay = Math.abs(worldNormal.y);
        const az = Math.abs(worldNormal.z);
        if (ax >= ay && ax >= az) worldNormal.set(Math.sign(worldNormal.x), 0, 0);
        else if (ay >= ax && ay >= az) worldNormal.set(0, Math.sign(worldNormal.y), 0);
        else worldNormal.set(0, 0, Math.sign(worldNormal.z));
        onStickerDown(e, worldNormal, pos);
      }
    : undefined;

  return (
    <group
      position={[
        gridPos.x * OFFSET,
        gridPos.y * OFFSET,
        gridPos.z * OFFSET,
      ]}
      quaternion={quat}
    >
      <RoundedBox
        args={[CUBE_SIZE, CUBE_SIZE, CUBE_SIZE]}
        radius={0.08}
        smoothness={4}
      >
        <meshStandardMaterial color="#1a1a1a" />
      </RoundedBox>
      {ix === 1 && (
        <Sticker
          position={[CUBE_SIZE / 2 + 0.01, 0, 0]}
          rotation={[0, Math.PI / 2, 0]}
          color={FACE_COLORS.right}
          faceNormal={new THREE.Vector3(1, 0, 0)}
          cubieGridPos={gridPos}
          onStickerDown={wrappedDown}
        />
      )}
      {ix === -1 && (
        <Sticker
          position={[-CUBE_SIZE / 2 - 0.01, 0, 0]}
          rotation={[0, -Math.PI / 2, 0]}
          color={FACE_COLORS.left}
          faceNormal={new THREE.Vector3(-1, 0, 0)}
          cubieGridPos={gridPos}
          onStickerDown={wrappedDown}
        />
      )}
      {iy === 1 && (
        <Sticker
          position={[0, CUBE_SIZE / 2 + 0.01, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          color={FACE_COLORS.top}
          faceNormal={new THREE.Vector3(0, 1, 0)}
          cubieGridPos={gridPos}
          onStickerDown={wrappedDown}
        />
      )}
      {iy === -1 && (
        <Sticker
          position={[0, -CUBE_SIZE / 2 - 0.01, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          color={FACE_COLORS.bottom}
          faceNormal={new THREE.Vector3(0, -1, 0)}
          cubieGridPos={gridPos}
          onStickerDown={wrappedDown}
        />
      )}
      {iz === 1 && (
        <Sticker
          position={[0, 0, CUBE_SIZE / 2 + 0.01]}
          rotation={[0, 0, 0]}
          color={FACE_COLORS.front}
          faceNormal={new THREE.Vector3(0, 0, 1)}
          cubieGridPos={gridPos}
          onStickerDown={wrappedDown}
        />
      )}
      {iz === -1 && (
        <Sticker
          position={[0, 0, -CUBE_SIZE / 2 - 0.01]}
          rotation={[0, Math.PI, 0]}
          color={FACE_COLORS.back}
          faceNormal={new THREE.Vector3(0, 0, -1)}
          cubieGridPos={gridPos}
          onStickerDown={wrappedDown}
        />
      )}
    </group>
  );
}

/* ——— Animation helpers ——— */
interface AnimationState {
  moveIndex: number;
  progress: number;
  targetAngle: number;
  axis: THREE.Vector3;
  affectedIds: Set<number>;
}

interface DragState {
  faceNormal: THREE.Vector3;
  cubiePos: THREE.Vector3;
  plane: THREE.Plane;
  initialHitPoint: THREE.Vector3;
  determined: boolean;
  rotAxis: THREE.Vector3;
  layer: number;
  affectedIds: Set<number>;
  currentAngle: number;
}

interface SnapState {
  fromAngle: number;
  toAngle: number;
  progress: number;
  rotAxis: THREE.Vector3;
  affectedIds: Set<number>;
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

const MOVE_DURATION = 0.7;
const PAUSE_BETWEEN_MOVES = 0.5;
const PAUSE_AFTER_SEQUENCE = 2.5;
const SNAP_DURATION = 0.15;

/* ——— Main Scene ——— */
function CubeScene({
  moves,
  speed = 0.5,
  idleSpin = false,
  interactive = false,
}: {
  moves: string[];
  speed?: number;
  idleSpin?: boolean;
  interactive?: boolean;
}) {
  const { camera, gl } = useThree();
  const cubiesRef = useRef<CubieData[]>(createSolvedCube());
  const [, forceRender] = useState(0);

  // Auto-animation
  const animRef = useRef<AnimationState | null>(null);
  const groupRef = useRef<THREE.Group>(null);
  const pivotRef = useRef<THREE.Group>(null);
  const pauseTimerRef = useRef(0);
  const nextMoveIndexRef = useRef(0);
  const autoPlayRef = useRef(moves.length > 0);

  // Interactive drag
  const dragRef = useRef<DragState | null>(null);
  const snapRef = useRef<SnapState | null>(null);
  const orbitRef = useRef<any>(null);

  // Reset when moves change
  useEffect(() => {
    animRef.current = null;
    pauseTimerRef.current = 0;
    nextMoveIndexRef.current = 0;
    autoPlayRef.current = moves.length > 0;
    dragRef.current = null;
    snapRef.current = null;
    cubiesRef.current = createSolvedCube();
    forceRender((n) => n + 1);
  }, [moves]);

  /* ——— Auto-animation logic ——— */
  const startAutoMove = useCallback(
    (moveIdx: number) => {
      if (moves.length === 0) return;
      const moveName = moves[moveIdx];
      const def = MOVE_DEFS[moveName];
      if (!def) return;

      const cubies = cubiesRef.current;
      const affected = new Set<number>();
      cubies.forEach((c) => {
        if (def.filter(c.position)) affected.add(c.id);
      });

      animRef.current = {
        moveIndex: moveIdx,
        progress: 0,
        targetAngle: def.angle,
        axis: def.axis.clone(),
        affectedIds: affected,
      };
      forceRender((n) => n + 1);
    },
    [moves]
  );

  /* ——— Interactive pointer handlers ——— */
  const handleStickerDown = useCallback(
    (e: any, faceNormal: THREE.Vector3, cubiePos: THREE.Vector3) => {
      if (!interactive) return;
      if (snapRef.current) return; // don't start new drag during snap

      // Pause auto-animation
      autoPlayRef.current = false;
      animRef.current = null;
      if (pivotRef.current) pivotRef.current.quaternion.identity();

      // Disable orbit controls
      if (orbitRef.current) orbitRef.current.enabled = false;

      const hitPoint = e.point.clone();
      const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(
        faceNormal,
        hitPoint
      );

      dragRef.current = {
        faceNormal: faceNormal.clone(),
        cubiePos: cubiePos.clone(),
        plane,
        initialHitPoint: hitPoint,
        determined: false,
        rotAxis: new THREE.Vector3(),
        layer: 0,
        affectedIds: new Set(),
        currentAngle: 0,
      };

      const onPointerMove = (ev: PointerEvent) => {
        const drag = dragRef.current;
        if (!drag) return;

        // Cast ray against the drag plane
        const rect = gl.domElement.getBoundingClientRect();
        const ndcX = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
        const ndcY = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);
        const movePoint = new THREE.Vector3();
        if (!raycaster.ray.intersectPlane(drag.plane, movePoint)) return;

        const dragVec = movePoint.clone().sub(drag.initialHitPoint);
        const dragLength = dragVec.length();

        // Wait for minimum drag to determine direction
        if (!drag.determined) {
          if (dragLength < 0.12) return;

          // Cross product of face normal and drag direction gives rotation axis
          const cross = new THREE.Vector3()
            .crossVectors(drag.faceNormal, dragVec)
            .normalize();

          // Snap to nearest world axis
          const ax = Math.abs(cross.x);
          const ay = Math.abs(cross.y);
          const az = Math.abs(cross.z);

          if (ax >= ay && ax >= az) {
            drag.rotAxis.set(Math.sign(cross.x) || 1, 0, 0);
          } else if (ay >= ax && ay >= az) {
            drag.rotAxis.set(0, Math.sign(cross.y) || 1, 0);
          } else {
            drag.rotAxis.set(0, 0, Math.sign(cross.z) || 1);
          }

          // Determine which layer based on cubie position along the rotation axis
          const axIdx =
            drag.rotAxis.x !== 0 ? "x" : drag.rotAxis.y !== 0 ? "y" : "z";
          drag.layer = Math.round(drag.cubiePos[axIdx]);

          // Find all cubies in this layer
          drag.affectedIds = new Set<number>();
          cubiesRef.current.forEach((c) => {
            if (Math.round(c.position[axIdx]) === drag.layer) {
              drag.affectedIds.add(c.id);
            }
          });

          drag.determined = true;
          forceRender((n) => n + 1);
        }

        // Calculate rotation angle from drag along the tangent direction
        const tangent = new THREE.Vector3()
          .crossVectors(drag.rotAxis, drag.faceNormal)
          .normalize();
        const dragAmount = dragVec.dot(tangent);
        const angle = (dragAmount / OFFSET) * (Math.PI / 2);

        drag.currentAngle = angle;

        if (pivotRef.current) {
          pivotRef.current.quaternion.setFromAxisAngle(drag.rotAxis, angle);
        }
      };

      const onPointerUp = () => {
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", onPointerUp);

        const drag = dragRef.current;
        if (!drag || !drag.determined) {
          dragRef.current = null;
          if (orbitRef.current) orbitRef.current.enabled = true;
          forceRender((n) => n + 1);
          return;
        }

        // Snap to nearest 90°
        const snapAngle =
          Math.round(drag.currentAngle / (Math.PI / 2)) * (Math.PI / 2);

        // Start snap animation
        snapRef.current = {
          fromAngle: drag.currentAngle,
          toAngle: snapAngle,
          progress: 0,
          rotAxis: drag.rotAxis.clone(),
          affectedIds: new Set(drag.affectedIds),
        };

        dragRef.current = null;
      };

      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
    },
    [interactive, camera, gl]
  );

  /* ——— Frame loop ——— */
  useFrame((_, delta) => {
    // Idle spin for splash
    if (idleSpin && groupRef.current) {
      groupRef.current.rotation.y += delta * speed;
      groupRef.current.rotation.x += delta * speed * 0.3;
    }

    // Snap animation (after user releases drag)
    const snap = snapRef.current;
    if (snap) {
      snap.progress += delta / SNAP_DURATION;

      if (snap.progress >= 1) {
        // Snap complete — apply rotation to state
        if (Math.abs(snap.toAngle) > 0.01) {
          const rotQ = new THREE.Quaternion().setFromAxisAngle(
            snap.rotAxis,
            snap.toAngle
          );
          cubiesRef.current = cubiesRef.current.map((c) => {
            if (!snap.affectedIds.has(c.id)) return c;
            const newPos = c.position.clone().applyQuaternion(rotQ);
            roundPosition(newPos);
            const newQuat = rotQ.clone().multiply(c.quaternion);
            return { ...c, position: newPos, quaternion: newQuat };
          });
        }

        if (pivotRef.current) pivotRef.current.quaternion.identity();
        snapRef.current = null;
        if (orbitRef.current) orbitRef.current.enabled = true;
        forceRender((n) => n + 1);
      } else {
        const t = easeInOutCubic(snap.progress);
        const angle = snap.fromAngle + (snap.toAngle - snap.fromAngle) * t;
        if (pivotRef.current) {
          pivotRef.current.quaternion.setFromAxisAngle(snap.rotAxis, angle);
        }
      }
      return;
    }

    // During active drag, pivot is updated via pointer events — nothing to do here
    if (dragRef.current) return;

    // Auto-animation
    if (!autoPlayRef.current || moves.length === 0) return;

    const anim = animRef.current;

    if (!anim) {
      pauseTimerRef.current += delta;
      const pauseNeeded =
        nextMoveIndexRef.current === 0 &&
        cubiesRef.current[0].quaternion.lengthSq() > 0
          ? PAUSE_AFTER_SEQUENCE
          : nextMoveIndexRef.current === 0
            ? 0.8
            : PAUSE_BETWEEN_MOVES;

      if (pauseTimerRef.current >= pauseNeeded) {
        if (nextMoveIndexRef.current === 0) {
          cubiesRef.current = createSolvedCube();
          forceRender((n) => n + 1);
        }
        pauseTimerRef.current = 0;
        startAutoMove(nextMoveIndexRef.current);
      }
      return;
    }

    anim.progress += delta / MOVE_DURATION;

    if (anim.progress >= 1) {
      anim.progress = 1;
      const moveName = moves[anim.moveIndex];
      cubiesRef.current = applyMoveToCubies(cubiesRef.current, moveName);
      if (pivotRef.current) pivotRef.current.quaternion.identity();
      animRef.current = null;
      pauseTimerRef.current = 0;
      const nextIdx = anim.moveIndex + 1;
      nextMoveIndexRef.current = nextIdx >= moves.length ? 0 : nextIdx;
      forceRender((n) => n + 1);
    } else {
      const easedProgress = easeInOutCubic(anim.progress);
      const currentAngle = anim.targetAngle * easedProgress;
      if (pivotRef.current) {
        pivotRef.current.quaternion.setFromAxisAngle(anim.axis, currentAngle);
      }
    }
  });

  // Determine which cubies are in the pivot (being animated/dragged)
  const anim = animRef.current;
  const drag = dragRef.current;
  const snap = snapRef.current;

  const activeIds: Set<number> | null = anim
    ? anim.affectedIds
    : drag?.determined
      ? drag.affectedIds
      : snap
        ? snap.affectedIds
        : null;

  const cubies = cubiesRef.current;

  return (
    <>
      {interactive && (
        <OrbitControls
          ref={orbitRef}
          enablePan={false}
          enableZoom={false}
          rotateSpeed={0.5}
          dampingFactor={0.1}
          enableDamping
        />
      )}
      <group ref={groupRef}>
        {/* Static cubies */}
        {cubies
          .filter((c) => !activeIds || !activeIds.has(c.id))
          .map((c) => (
            <Cubie
              key={c.id}
              cubieData={c}
              onStickerDown={interactive ? handleStickerDown : undefined}
            />
          ))}

        {/* Rotating layer */}
        <group ref={pivotRef}>
          {cubies
            .filter((c) => activeIds && activeIds.has(c.id))
            .map((c) => (
              <Cubie
                key={c.id}
                cubieData={c}
                onStickerDown={interactive ? handleStickerDown : undefined}
              />
            ))}
        </group>
      </group>
    </>
  );
}

/* ——— Exported component ——— */
export default function RubiksCube3D({
  speed = 0.5,
  moves,
  interactive = false,
  style,
}: {
  speed?: number;
  moves?: string[];
  interactive?: boolean;
  style?: React.CSSProperties;
}) {
  const parsedMoves = useMemo(() => (moves ? moves : []), [moves]);

  return (
    <div style={{ width: "100%", height: "100%", touchAction: "none", ...style }}>
      <Canvas camera={{ position: [3.5, 2.5, 3.5], fov: 45 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <directionalLight position={[-3, -1, -3]} intensity={0.3} />
        <CubeScene
          moves={parsedMoves}
          speed={speed}
          idleSpin={parsedMoves.length === 0 && !interactive}
          interactive={interactive}
        />
      </Canvas>
    </div>
  );
}
