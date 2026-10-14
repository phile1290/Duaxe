import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Racer } from '../../types';

interface RacingCanvas3DProps {
  racers: Racer[];
  activeRacerIndex: number;
}

export const RacingCanvas3D: React.FC<RacingCanvas3DProps> = ({
  racers,
  activeRacerIndex,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const carGroupsRef = useRef<THREE.Group[]>([]);
  const nitroFlamesRef = useRef<THREE.Mesh[]>([]);
  const wheelMeshesRef = useRef<THREE.Mesh[][]>([]);
  const animFrameIdRef = useRef<number | null>(null);

  // Track coordinates: Start line at Z = 50, Finish line at Z = -160
  const START_Z = 50;
  const FINISH_Z = -160;
  const TRACK_LENGTH = START_Z - FINISH_Z; // 210 units

  // Helper to create a crisp canvas text texture for name badge above car
  const createNameBadgeTexture = (name: string, carNumber: number, colorHex: string): THREE.CanvasTexture => {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 180;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Rounded pill background
      ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
      ctx.strokeStyle = colorHex;
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.roundRect(16, 16, 608, 148, 40);
      ctx.fill();
      ctx.stroke();

      // Number badge circle
      ctx.fillStyle = colorHex;
      ctx.beginPath();
      ctx.arc(88, 90, 52, 0, Math.PI * 2);
      ctx.fill();

      // Car number text
      ctx.fillStyle = '#0f172a';
      ctx.font = '900 48px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`#${carNumber}`, 88, 92);

      // Student/Team Name text (large, clear, bright white)
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 44px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';

      const displayName = name.length > 15 ? name.substring(0, 14) + '…' : name;
      ctx.fillText(displayName, 160, 90);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    return texture;
  };

  // Helper to create a number texture for the car roof
  const createRoofNumberTexture = (carNumber: number): THREE.CanvasTexture => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(128, 128, 110, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#0f172a';
      ctx.font = '900 130px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(carNumber), 128, 134);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    return texture;
  };

  const racersKey = JSON.stringify(racers.map((r) => ({ id: r.id, name: r.name, colorHex: r.colorHex })));

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x7dd3fc); // Cartoon sky blue
    scene.fog = new THREE.FogExp2(0x7dd3fc, 0.0045);

    // 2. Camera setup with adaptive FOV based on aspect ratio
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    const isPortrait = height > width;

    const camera = new THREE.PerspectiveCamera(
      isPortrait ? 65 : 48,
      width / height,
      0.1,
      1200
    );
    cameraRef.current = camera;

    // 3. Renderer with high performance antialias
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Lights
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x335533, 0.95);
    hemiLight.position.set(0, 80, 0);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xfffaed, 1.35);
    sunLight.position.set(50, 80, 40);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 400;
    sunLight.shadow.camera.left = -80;
    sunLight.shadow.camera.right = 80;
    sunLight.shadow.camera.top = 80;
    sunLight.shadow.camera.bottom = -80;
    scene.add(sunLight);

    // 5. Adaptive road width & scaling based on racer count
    const numRacers = Math.max(1, racers.length);
    const laneWidth = numRacers > 14 ? 3.8 : numRacers > 8 ? 4.5 : 5.5;
    const carScale = numRacers > 14 ? 0.75 : numRacers > 8 ? 0.88 : 1.0;
    const roadWidth = Math.max(28, numRacers * laneWidth + 6);
    const startX = -((numRacers - 1) * laneWidth) / 2;

    // Position camera initially to frame the road and cars
    const initialCamY = isPortrait ? Math.max(24, roadWidth * 0.45) : Math.max(16, roadWidth * 0.32);
    const initialCamZ = isPortrait ? Math.max(72, roadWidth * 1.3) : Math.max(62, roadWidth * 0.9);
    camera.position.set(0, initialCamY, initialCamZ);
    camera.lookAt(0, 1.5, 5);

    // Grass Field (Large enough to never show edge)
    const grassSize = Math.max(500, roadWidth * 3.5);
    const grassGeo = new THREE.PlaneGeometry(grassSize, 550);
    const grassMat = new THREE.MeshLambertMaterial({ color: 0x22c55e });
    const grass = new THREE.Mesh(grassGeo, grassMat);
    grass.rotation.x = -Math.PI / 2;
    grass.position.y = -0.05;
    grass.receiveShadow = true;
    scene.add(grass);

    // Asphalt Track
    const roadGeo = new THREE.PlaneGeometry(roadWidth, 440);
    const roadMat = new THREE.MeshLambertMaterial({ color: 0x334155 });
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0, -50);
    road.receiveShadow = true;
    scene.add(road);

    // Kerbs (Red & White F1 Track Edges)
    const kerbGeo = new THREE.BoxGeometry(1.2, 0.25, 440);
    const kerbMatRed = new THREE.MeshLambertMaterial({ color: 0xef4444 });
    const kerbMatWhite = new THREE.MeshLambertMaterial({ color: 0xf8fafc });

    const leftKerb = new THREE.Mesh(kerbGeo, kerbMatRed);
    leftKerb.position.set(-roadWidth / 2 - 0.6, 0.12, -50);
    const rightKerb = new THREE.Mesh(kerbGeo, kerbMatWhite);
    rightKerb.position.set(roadWidth / 2 + 0.6, 0.12, -50);
    scene.add(leftKerb, rightKerb);

    // Lane divider dashed lines
    for (let i = 1; i < numRacers; i++) {
      const dividerX = startX + (i - 0.5) * laneWidth;
      for (let z = 80; z > -200; z -= 10) {
        const dashGeo = new THREE.PlaneGeometry(0.3, 4.5);
        const dashMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const dash = new THREE.Mesh(dashGeo, dashMat);
        dash.rotation.x = -Math.PI / 2;
        dash.position.set(dividerX, 0.02, z);
        scene.add(dash);
      }
    }

    // Start Line
    const startLineGeo = new THREE.PlaneGeometry(roadWidth, 2.5);
    const startLineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const startLine = new THREE.Mesh(startLineGeo, startLineMat);
    startLine.rotation.x = -Math.PI / 2;
    startLine.position.set(0, 0.03, START_Z);
    scene.add(startLine);

    // Finish Line Arch & Checkerboard
    const finishArchGroup = new THREE.Group();
    finishArchGroup.position.set(0, 0, FINISH_Z);

    const pillarGeo = new THREE.BoxGeometry(1.6, 14, 1.6);
    const pillarMat = new THREE.MeshLambertMaterial({ color: 0xe2e8f0 });
    const leftPillar = new THREE.Mesh(pillarGeo, pillarMat);
    leftPillar.position.set(-roadWidth / 2 - 1.2, 7, 0);
    const rightPillar = new THREE.Mesh(pillarGeo, pillarMat);
    rightPillar.position.set(roadWidth / 2 + 1.2, 7, 0);
    finishArchGroup.add(leftPillar, rightPillar);

    const crossbarGeo = new THREE.BoxGeometry(roadWidth + 4, 2.5, 2);
    const crossbarMat = new THREE.MeshLambertMaterial({ color: 0xf59e0b });
    const crossbar = new THREE.Mesh(crossbarGeo, crossbarMat);
    crossbar.position.set(0, 13, 0);
    finishArchGroup.add(crossbar);

    // Checkerboard ground pattern at finish line
    const tilesPerRow = Math.min(28, Math.floor(roadWidth / 1.5));
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < tilesPerRow; col++) {
        const isBlack = (row + col) % 2 === 0;
        const tileGeo = new THREE.PlaneGeometry(roadWidth / tilesPerRow, 0.9);
        const tileMat = new THREE.MeshBasicMaterial({ color: isBlack ? 0x0f172a : 0xffffff });
        const tile = new THREE.Mesh(tileGeo, tileMat);
        tile.rotation.x = -Math.PI / 2;
        tile.position.set(
          -roadWidth / 2 + (col + 0.5) * (roadWidth / tilesPerRow),
          0.04,
          FINISH_Z + (row - 1.5) * 0.9
        );
        scene.add(tile);
      }
    }
    scene.add(finishArchGroup);

    // Trees alongside track
    for (let side of [-1, 1]) {
      for (let z = 80; z > -200; z -= 30) {
        const treeGroup = new THREE.Group();
        const trunkGeo = new THREE.CylinderGeometry(0.35, 0.5, 3, 6);
        const trunkMat = new THREE.MeshLambertMaterial({ color: 0x78350f });
        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.y = 1.5;
        treeGroup.add(trunk);

        const foliageGeo = new THREE.ConeGeometry(2.4, 5, 6);
        const foliageMat = new THREE.MeshLambertMaterial({ color: 0x16a34a });
        const foliage = new THREE.Mesh(foliageGeo, foliageMat);
        foliage.position.y = 4.5;
        treeGroup.add(foliage);

        treeGroup.position.set(side * (roadWidth / 2 + 5 + Math.random() * 3), 0, z);
        scene.add(treeGroup);
      }
    }

    // 6. Build 3D Cars for every single racer with Student/Team Name Badge
    carGroupsRef.current = [];
    nitroFlamesRef.current = [];
    wheelMeshesRef.current = [];

    racers.forEach((racer, idx) => {
      const carGroup = new THREE.Group();
      const laneX = startX + idx * laneWidth;
      carGroup.position.set(laneX, 0, START_Z);
      carGroup.scale.set(carScale, carScale, carScale);

      const carColor = new THREE.Color(racer.colorHex);

      // Chassis / Body
      const bodyGeo = new THREE.BoxGeometry(2.1, 0.8, 4.0);
      const bodyMat = new THREE.MeshLambertMaterial({ color: carColor });
      const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
      bodyMesh.position.y = 0.72;
      bodyMesh.castShadow = true;
      carGroup.add(bodyMesh);

      // Cockpit / Canopy
      const cabinGeo = new THREE.BoxGeometry(1.4, 0.65, 1.9);
      const cabinMat = new THREE.MeshLambertMaterial({ color: 0x0f172a });
      const cabinMesh = new THREE.Mesh(cabinGeo, cabinMat);
      cabinMesh.position.set(0, 1.3, -0.2);
      cabinMesh.castShadow = true;
      carGroup.add(cabinMesh);

      // Number Decal on Roof
      const roofDecalGeo = new THREE.PlaneGeometry(1.0, 1.0);
      const roofDecalMat = new THREE.MeshBasicMaterial({
        map: createRoofNumberTexture(racer.carNumber),
        transparent: true,
      });
      const roofDecal = new THREE.Mesh(roofDecalGeo, roofDecalMat);
      roofDecal.rotation.x = -Math.PI / 2;
      roofDecal.position.set(0, 1.63, -0.2);
      carGroup.add(roofDecal);

      // Spoiler
      const spoilerGeo = new THREE.BoxGeometry(1.9, 0.12, 0.7);
      const spoilerMat = new THREE.MeshLambertMaterial({ color: carColor });
      const spoiler = new THREE.Mesh(spoilerGeo, spoilerMat);
      spoiler.position.set(0, 1.5, 1.55);
      carGroup.add(spoiler);

      // 4 Wheels
      const wheelGeo = new THREE.CylinderGeometry(0.48, 0.48, 0.42, 12);
      const wheelMat = new THREE.MeshLambertMaterial({ color: 0x1e293b });
      wheelGeo.rotateZ(Math.PI / 2);

      const carWheels: THREE.Mesh[] = [];
      const wheelPositions = [
        [-1.15, 0.48, 1.15],
        [1.15, 0.48, 1.15],
        [-1.15, 0.48, -1.15],
        [1.15, 0.48, -1.15],
      ];

      wheelPositions.forEach((pos) => {
        const wheel = new THREE.Mesh(wheelGeo, wheelMat);
        wheel.position.set(pos[0], pos[1], pos[2]);
        wheel.castShadow = true;
        carGroup.add(wheel);
        carWheels.push(wheel);
      });
      wheelMeshesRef.current.push(carWheels);

      // Floating Name Badge Sprite directly above the car
      const badgeTexture = createNameBadgeTexture(racer.name, racer.carNumber, racer.colorHex);
      const spriteMat = new THREE.SpriteMaterial({ map: badgeTexture, transparent: true });
      const nameSprite = new THREE.Sprite(spriteMat);
      nameSprite.position.set(0, 3.2, 0);
      nameSprite.scale.set(4.6, 1.35, 1);
      carGroup.add(nameSprite);

      // Nitro Flame Mesh behind car
      const flameGeo = new THREE.ConeGeometry(0.42, 2.0, 8);
      flameGeo.rotateX(-Math.PI / 2);
      const flameMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.9,
      });
      const flame = new THREE.Mesh(flameGeo, flameMat);
      flame.position.set(0, 0.72, 2.8);
      flame.visible = false;
      carGroup.add(flame);
      nitroFlamesRef.current.push(flame);

      scene.add(carGroup);
      carGroupsRef.current.push(carGroup);
    });

    // 7. Handle Resize (responsive for mobile portrait, landscape, desktop)
    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;

      const isPortraitNow = h > w;

      cameraRef.current.aspect = w / h;
      cameraRef.current.fov = isPortraitNow ? 65 : 48;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // 8. Animation Loop
    let clock = new THREE.Clock();

    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      carGroupsRef.current.forEach((carGroup, idx) => {
        const racer = racers[idx];
        if (!racer) return;

        // Progress mapped from START_Z to FINISH_Z
        const targetZ = START_Z - (racer.progress / 100) * TRACK_LENGTH;
        const lerpFactor = racer.isNitro ? 0.14 : 0.08;
        carGroup.position.z += (targetZ - carGroup.position.z) * lerpFactor;

        // Idle suspension bounce
        carGroup.position.y = Math.sin(elapsed * 7 + idx) * 0.04;

        // Nitro flame animation
        const flame = nitroFlamesRef.current[idx];
        if (flame) {
          flame.visible = racer.isNitro;
          if (racer.isNitro) {
            flame.scale.set(
              1 + Math.sin(elapsed * 28) * 0.3,
              1 + Math.cos(elapsed * 22) * 0.3,
              1.2 + Math.sin(elapsed * 35) * 0.4
            );
          }
        }

        // Rotate wheels
        const wheels = wheelMeshesRef.current[idx];
        if (wheels) {
          wheels.forEach((w) => {
            w.rotation.x += delta * (racer.isNitro ? 28 : 14);
          });
        }
      });

      // Camera smoothly follows the active racer or the road center
      if (cameraRef.current && carGroupsRef.current.length > 0) {
        const targetCar = carGroupsRef.current[activeRacerIndex] || carGroupsRef.current[0];
        const isPortraitNow = container.clientHeight > container.clientWidth;

        const targetCamZ = targetCar.position.z + (isPortraitNow ? Math.max(30, roadWidth * 0.6) : 24);
        const targetCamY = isPortraitNow ? Math.max(22, roadWidth * 0.4) : Math.max(15, roadWidth * 0.28);
        const targetCamX = targetCar.position.x * 0.3;

        cameraRef.current.position.z += (targetCamZ - cameraRef.current.position.z) * 0.06;
        cameraRef.current.position.y += (targetCamY - cameraRef.current.position.y) * 0.06;
        cameraRef.current.position.x += (targetCamX - cameraRef.current.position.x) * 0.06;
        cameraRef.current.lookAt(targetCar.position.x * 0.2, 1.2, targetCar.position.z - 18);
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      if (rendererRef.current && rendererRef.current.domElement) {
        container.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
    };
  }, [racersKey]);

  return (
    <div className="relative w-full h-full overflow-hidden select-none bg-slate-950">
      <div ref={mountRef} className="w-full h-full" />

      {/* Floating Racer Quick Badges (Bottom Dock) */}
      <div className="absolute bottom-2 left-2 right-2 z-10 flex items-center gap-1.5 overflow-x-auto no-scrollbar pointer-events-none pb-0.5">
        {racers.map((racer, idx) => (
          <div
            key={racer.id}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1.5 shadow-md border pointer-events-auto backdrop-blur-md transition-all shrink-0 ${
              idx === activeRacerIndex
                ? 'bg-slate-900/95 text-white border-amber-400 scale-105 ring-2 ring-amber-400/50'
                : 'bg-slate-900/70 text-slate-300 border-white/10'
            }`}
          >
            <span>{racer.avatar}</span>
            <span className="truncate max-w-[85px] sm:max-w-[120px]">{racer.name}</span>
            <span className="font-mono text-amber-300 font-black">{Math.round(racer.progress)}%</span>
            {racer.isNitro && (
              <span className="animate-pulse bg-cyan-400 text-slate-950 px-1 py-0.2 rounded text-[9px] font-black">
                NITRO
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
