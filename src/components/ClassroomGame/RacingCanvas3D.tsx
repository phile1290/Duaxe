import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Team } from '../../types';

interface RacingCanvas3DProps {
  teams: Team[];
  activeTeamIndex: number;
}

export const RacingCanvas3D: React.FC<RacingCanvas3DProps> = ({
  teams,
  activeTeamIndex,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  // References for Three.js state
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const carGroupsRef = useRef<THREE.Group[]>([]);
  const nitroFlamesRef = useRef<THREE.Mesh[]>([]);
  const wheelMeshesRef = useRef<THREE.Mesh[][]>([]);
  const animFrameIdRef = useRef<number | null>(null);

  // Target positions along track (Z-axis progression)
  // Track goes from Z = 60 (Start line) to Z = -180 (Finish line)
  const START_Z = 60;
  const FINISH_Z = -180;
  const TRACK_LENGTH = START_Z - FINISH_Z; // 240 units

  // Lane X offsets for 4 cars
  const LANE_X = [-9, -3, 3, 9];

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x87ceeb); // Bright cartoon sky blue
    scene.fog = new THREE.FogExp2(0x87ceeb, 0.004);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(
      50,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 16, 85);
    camera.lookAt(0, 2, 20);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Lights
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x447744, 0.9);
    hemiLight.position.set(0, 100, 0);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xfff5e6, 1.2);
    dirLight.position.set(30, 60, 40);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 300;
    dirLight.shadow.camera.left = -40;
    dirLight.shadow.camera.right = 40;
    dirLight.shadow.camera.top = 40;
    dirLight.shadow.camera.bottom = -40;
    scene.add(dirLight);

    // 5. Environment & Track
    // Grass Ground
    const grassGeo = new THREE.PlaneGeometry(300, 400);
    const grassMat = new THREE.MeshLambertMaterial({ color: 0x4ade80 });
    const grass = new THREE.Mesh(grassGeo, grassMat);
    grass.rotation.x = -Math.PI / 2;
    grass.position.y = -0.05;
    grass.receiveShadow = true;
    scene.add(grass);

    // Main Asphalt Road
    const roadWidth = 26;
    const roadGeo = new THREE.PlaneGeometry(roadWidth, 400);
    const roadMat = new THREE.MeshLambertMaterial({ color: 0x334155 });
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0, -60);
    road.receiveShadow = true;
    scene.add(road);

    // Kerbs (Red & White F1 Track Edges)
    const kerbGeo = new THREE.BoxGeometry(1.2, 0.2, 400);
    const kerbMatRed = new THREE.MeshLambertMaterial({ color: 0xef4444 });
    const kerbMatWhite = new THREE.MeshLambertMaterial({ color: 0xf8fafc });

    const leftKerb = new THREE.Mesh(kerbGeo, kerbMatRed);
    leftKerb.position.set(-roadWidth / 2 - 0.6, 0.1, -60);
    scene.add(leftKerb);

    const rightKerb = new THREE.Mesh(kerbGeo, kerbMatWhite);
    rightKerb.position.set(roadWidth / 2 + 0.6, 0.1, -60);
    scene.add(rightKerb);

    // Road Lane Dividers (Dashed White Lines)
    for (let x of [-3, 3]) {
      for (let z = 100; z > -220; z -= 10) {
        const dashGeo = new THREE.PlaneGeometry(0.4, 4);
        const dashMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const dash = new THREE.Mesh(dashGeo, dashMat);
        dash.rotation.x = -Math.PI / 2;
        dash.position.set(x, 0.02, z);
        scene.add(dash);
      }
    }

    // Start Line Banner
    const startLineGeo = new THREE.PlaneGeometry(roadWidth, 3);
    const startLineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const startLine = new THREE.Mesh(startLineGeo, startLineMat);
    startLine.rotation.x = -Math.PI / 2;
    startLine.position.set(0, 0.03, START_Z);
    scene.add(startLine);

    // Finish Line Arch & Checkered Flag
    const finishArchGroup = new THREE.Group();
    finishArchGroup.position.set(0, 0, FINISH_Z);

    // Left & Right Pillars
    const pillarGeo = new THREE.BoxGeometry(1.5, 12, 1.5);
    const pillarMat = new THREE.MeshLambertMaterial({ color: 0xe2e8f0 });
    const leftPillar = new THREE.Mesh(pillarGeo, pillarMat);
    leftPillar.position.set(-roadWidth / 2 - 1, 6, 0);
    const rightPillar = new THREE.Mesh(pillarGeo, pillarMat);
    rightPillar.position.set(roadWidth / 2 + 1, 6, 0);
    finishArchGroup.add(leftPillar, rightPillar);

    // Crossbar
    const crossbarGeo = new THREE.BoxGeometry(roadWidth + 4, 2, 2);
    const crossbarMat = new THREE.MeshLambertMaterial({ color: 0xf59e0b });
    const crossbar = new THREE.Mesh(crossbarGeo, crossbarMat);
    crossbar.position.set(0, 11, 0);
    finishArchGroup.add(crossbar);

    // Finish line ground checkerboard pattern
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 13; col++) {
        const isBlack = (row + col) % 2 === 0;
        const tileGeo = new THREE.PlaneGeometry(roadWidth / 13, 0.8);
        const tileMat = new THREE.MeshBasicMaterial({ color: isBlack ? 0x0f172a : 0xffffff });
        const tile = new THREE.Mesh(tileGeo, tileMat);
        tile.rotation.x = -Math.PI / 2;
        tile.position.set(-roadWidth / 2 + (col + 0.5) * (roadWidth / 13), 0.04, FINISH_Z + (row - 1.5) * 0.8);
        scene.add(tile);
      }
    }
    scene.add(finishArchGroup);

    // Trees & Decoration along track
    for (let side of [-1, 1]) {
      for (let z = 80; z > -220; z -= 25) {
        const treeGroup = new THREE.Group();
        const trunkGeo = new THREE.CylinderGeometry(0.4, 0.6, 3, 6);
        const trunkMat = new THREE.MeshLambertMaterial({ color: 0x854d0e });
        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.y = 1.5;
        trunk.castShadow = true;
        treeGroup.add(trunk);

        const foliageGeo = new THREE.ConeGeometry(2.5, 5, 6);
        const foliageMat = new THREE.MeshLambertMaterial({ color: 0x22c55e });
        const foliage = new THREE.Mesh(foliageGeo, foliageMat);
        foliage.position.y = 4.5;
        foliage.castShadow = true;
        treeGroup.add(foliage);

        treeGroup.position.set(side * (roadWidth / 2 + 6 + Math.random() * 4), 0, z);
        scene.add(treeGroup);
      }
    }

    // 6. Build the 4 Cartoon Racing Cars
    const carColors = [0xef4444, 0x3b82f6, 0xeab308, 0x10b981];
    carGroupsRef.current = [];
    nitroFlamesRef.current = [];
    wheelMeshesRef.current = [];

    for (let i = 0; i < 4; i++) {
      const carGroup = new THREE.Group();
      carGroup.position.set(LANE_X[i], 0, START_Z);

      // Chassis (main body)
      const bodyGeo = new THREE.BoxGeometry(2.4, 0.9, 4.6);
      const bodyMat = new THREE.MeshLambertMaterial({ color: carColors[i] });
      const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
      bodyMesh.position.y = 0.8;
      bodyMesh.castShadow = true;
      carGroup.add(bodyMesh);

      // Cabin / Cockpit
      const cabinGeo = new THREE.BoxGeometry(1.6, 0.7, 2.2);
      const cabinMat = new THREE.MeshLambertMaterial({ color: 0x1e293b });
      const cabinMesh = new THREE.Mesh(cabinGeo, cabinMat);
      cabinMesh.position.set(0, 1.45, -0.2);
      cabinMesh.castShadow = true;
      carGroup.add(cabinMesh);

      // Rear Spoiler Wing
      const spoilerGeo = new THREE.BoxGeometry(2.2, 0.15, 0.8);
      const spoilerMat = new THREE.MeshLambertMaterial({ color: carColors[i] });
      const spoiler = new THREE.Mesh(spoilerGeo, spoilerMat);
      spoiler.position.set(0, 1.7, 1.8);
      carGroup.add(spoiler);

      const spoilerLegGeo = new THREE.BoxGeometry(0.15, 0.6, 0.15);
      const legLeft = new THREE.Mesh(spoilerLegGeo, cabinMat);
      legLeft.position.set(-0.8, 1.35, 1.8);
      const legRight = new THREE.Mesh(spoilerLegGeo, cabinMat);
      legRight.position.set(0.8, 1.35, 1.8);
      carGroup.add(legLeft, legRight);

      // 4 Wheels (Cylinders)
      const wheelGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.5, 12);
      const wheelMat = new THREE.MeshLambertMaterial({ color: 0x0f172a });
      wheelGeo.rotateZ(Math.PI / 2);

      const carWheels: THREE.Mesh[] = [];
      const wheelPositions = [
        [-1.3, 0.55, 1.4],
        [1.3, 0.55, 1.4],
        [-1.3, 0.55, -1.4],
        [1.3, 0.55, -1.4],
      ];

      wheelPositions.forEach((pos) => {
        const wheel = new THREE.Mesh(wheelGeo, wheelMat);
        wheel.position.set(pos[0], pos[1], pos[2]);
        wheel.castShadow = true;
        carGroup.add(wheel);
        carWheels.push(wheel);
      });
      wheelMeshesRef.current.push(carWheels);

      // Nitro Flame Mesh behind car
      const flameGeo = new THREE.ConeGeometry(0.5, 2.2, 8);
      flameGeo.rotateX(-Math.PI / 2);
      const flameMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.9,
      });
      const flame = new THREE.Mesh(flameGeo, flameMat);
      flame.position.set(0, 0.8, 3.2);
      flame.visible = false;
      carGroup.add(flame);
      nitroFlamesRef.current.push(flame);

      scene.add(carGroup);
      carGroupsRef.current.push(carGroup);
    }

    // 7. Resize handling
    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    // 8. Animation Loop
    let clock = new THREE.Clock();

    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Update cars positions and rotations
      carGroupsRef.current.forEach((carGroup, idx) => {
        const team = teams[idx];
        if (!team) return;

        // Progress 0% to 100% mapped to START_Z to FINISH_Z
        const targetZ = START_Z - (team.lap / 100) * TRACK_LENGTH;
        // Smooth lerp
        carGroup.position.z += (targetZ - carGroup.position.z) * (team.isNitroActive ? 0.12 : 0.08);

        // Gentle idle suspension bounce
        carGroup.position.y = Math.sin(elapsed * 8 + idx) * 0.05;

        // Nitro flame flicker
        const flame = nitroFlamesRef.current[idx];
        if (flame) {
          flame.visible = team.isNitroActive;
          if (team.isNitroActive) {
            flame.scale.set(
              1 + Math.sin(elapsed * 30) * 0.3,
              1 + Math.cos(elapsed * 25) * 0.3,
              1.2 + Math.sin(elapsed * 40) * 0.4
            );
            // Change color dynamically between bright cyan and fire orange
            (flame.material as THREE.MeshBasicMaterial).color.setHex(
              Math.sin(elapsed * 20) > 0 ? 0x38bdf8 : 0xf97316
            );
          }
        }

        // Rotate wheels when car moves
        const wheels = wheelMeshesRef.current[idx];
        if (wheels) {
          wheels.forEach((w) => {
            w.rotation.x += delta * (team.isNitroActive ? 30 : 15);
          });
        }
      });

      // Camera smoothly tracks the lead car or active car
      if (cameraRef.current && carGroupsRef.current.length > 0) {
        const targetCar = carGroupsRef.current[activeTeamIndex] || carGroupsRef.current[0];
        const targetCamZ = targetCar.position.z + 24;
        const targetCamY = 14;
        const targetCamX = targetCar.position.x * 0.4;

        cameraRef.current.position.z += (targetCamZ - cameraRef.current.position.z) * 0.05;
        cameraRef.current.position.y += (targetCamY - cameraRef.current.position.y) * 0.05;
        cameraRef.current.position.x += (targetCamX - cameraRef.current.position.x) * 0.05;
        cameraRef.current.lookAt(targetCar.position.x * 0.2, 1.5, targetCar.position.z - 20);
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      if (rendererRef.current && rendererRef.current.domElement) {
        container.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden select-none">
      <div ref={mountRef} className="w-full h-full" />
      
      {/* Track Overlay HUD (Speed lines & Lane Indicators) */}
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        {teams.map((team, idx) => (
          <div
            key={team.id}
            className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-md border transition-all ${
              idx === activeTeamIndex
                ? 'bg-slate-900/90 text-white border-amber-400 scale-105 ring-2 ring-amber-400/50'
                : 'bg-slate-900/60 text-slate-300 border-white/20'
            }`}
          >
            <span className="text-base">{team.avatar}</span>
            <span>{team.name}</span>
            <span className="text-amber-400 font-mono">{Math.round(team.lap)}%</span>
            {team.isNitroActive && (
              <span className="animate-pulse bg-gradient-to-r from-cyan-400 to-amber-400 text-slate-950 px-1.5 py-0.2 rounded text-[10px] font-black">
                NITRO!
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
