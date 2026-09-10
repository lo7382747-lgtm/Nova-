import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { NovaState } from '../types';
import { AVATAR_CONFIG } from '../config/avatarConfig';

interface Nova3DAvatarProps {
  state: NovaState;
  onClick?: () => void;
  size?: number;
  className?: string;
  onFallbackToOrb?: () => void;
}

export const Nova3DAvatar: React.FC<Nova3DAvatarProps> = ({
  state,
  onClick,
  size = 280,
  className = '',
  onFallbackToOrb,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // References for animated mesh parts
  const headGroupRef = useRef<THREE.Group | null>(null);
  const mouthMeshRef = useRef<THREE.Mesh | null>(null);
  const leftEyelidRef = useRef<THREE.Mesh | null>(null);
  const rightEyelidRef = useRef<THREE.Mesh | null>(null);
  const eyesGroupRef = useRef<THREE.Group | null>(null);
  const haloRingRef = useRef<THREE.Mesh | null>(null);
  const haloParticlesRef = useRef<THREE.Points | null>(null);
  const rimLightRef = useRef<THREE.PointLight | null>(null);

  // Target animation state
  const stateRef = useRef<NovaState>(state);
  stateRef.current = state;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Check WebGL availability
    const canvasTest = document.createElement('canvas');
    const gl = canvasTest.getContext('webgl2') || canvasTest.getContext('webgl');
    if (!gl) {
      setLoadError('WebGL not supported');
      if (onFallbackToOrb) onFallbackToOrb();
      return;
    }

    const width = container.clientWidth || size;
    const height = container.clientHeight || size;

    // Setup Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 100);
    camera.position.set(0, 0.4, 3.2);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.1;
      container.innerHTML = '';
      container.appendChild(renderer.domElement);
      rendererRef.current = renderer;
    } catch (e) {
      setLoadError('Renderer initialization failed');
      if (onFallbackToOrb) onFallbackToOrb();
      return;
    }

    // --- LIGHTING (Signature Bold Typography Teal + Obsidian) ---
    const ambientLight = new THREE.AmbientLight(0x0f172a, 1.2);
    scene.add(ambientLight);

    // Key front light
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.6);
    keyLight.position.set(1.5, 2, 2.5);
    scene.add(keyLight);

    // Soft Fill light
    const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.8);
    fillLight.position.set(-2, 1, 1.5);
    scene.add(fillLight);

    // Signature Rim light (Teal 400 glow from behind/side)
    const rimLight = new THREE.PointLight(0x2dd4bf, 3.5, 10);
    rimLight.position.set(0, 1.2, -1.2);
    scene.add(rimLight);
    rimLightRef.current = rimLight;

    // Bottom upward accent glow
    const bottomGlow = new THREE.PointLight(0x0d9488, 1.5, 6);
    bottomGlow.position.set(0, -1.5, 1);
    scene.add(bottomGlow);

    // --- CREATE 3D FEMALE ASSISTANT AVATAR MODEL ---
    const characterGroup = new THREE.Group();
    scene.add(characterGroup);

    // Head Pivot Group (allows natural head tilting and nods)
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.2, 0);
    characterGroup.add(headGroup);
    headGroupRef.current = headGroup;

    // 1. Head Mesh (Smooth stylized porcelain finish)
    const headGeo = new THREE.SphereGeometry(0.52, 32, 32);
    headGeo.scale(0.9, 1.1, 0.95);
    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xf5ebe0,
      roughness: 0.45,
      metalness: 0.05,
    });
    const headMesh = new THREE.Mesh(headGeo, skinMat);
    headGroup.add(headMesh);

    // 2. Hair Mesh (Stylized modern cyber-bob with teal gradient highlights)
    const hairGroup = new THREE.Group();
    headGroup.add(hairGroup);

    const hairMatDark = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.5,
      metalness: 0.2,
    });
    const hairMatTeal = new THREE.MeshStandardMaterial({
      color: 0x0f766e,
      emissive: 0x14b8a6,
      emissiveIntensity: 0.35,
      roughness: 0.3,
      metalness: 0.3,
    });

    // Hair base cap
    const hairBaseGeo = new THREE.SphereGeometry(0.54, 32, 24);
    hairBaseGeo.scale(0.95, 1.12, 1.02);
    const hairBase = new THREE.Mesh(hairBaseGeo, hairMatDark);
    hairBase.position.set(0, 0.06, -0.06);
    hairGroup.add(hairBase);

    // Front bangs/strands with teal accent
    const bangsGeo = new THREE.CylinderGeometry(0.08, 0.02, 0.45, 12);
    bangsGeo.rotateZ(0.4);
    const bangLeft = new THREE.Mesh(bangsGeo, hairMatTeal);
    bangLeft.position.set(-0.24, 0.3, 0.44);
    hairGroup.add(bangLeft);

    const bangRightGeo = new THREE.CylinderGeometry(0.07, 0.015, 0.4, 12);
    bangRightGeo.rotateZ(-0.4);
    const bangRight = new THREE.Mesh(bangRightGeo, hairMatDark);
    bangRight.position.set(0.25, 0.28, 0.44);
    hairGroup.add(bangRight);

    // Side hair locks framing face
    const sideLockGeo = new THREE.CylinderGeometry(0.12, 0.04, 0.7, 12);
    const sideLockLeft = new THREE.Mesh(sideLockGeo, hairMatDark);
    sideLockLeft.position.set(-0.46, -0.05, 0.1);
    hairGroup.add(sideLockLeft);

    const sideLockRight = new THREE.Mesh(sideLockGeo, hairMatTeal);
    sideLockRight.position.set(0.46, -0.05, 0.1);
    hairGroup.add(sideLockRight);

    // 3. Eyes & Facial Features
    const eyesGroup = new THREE.Group();
    headGroup.add(eyesGroup);
    eyesGroupRef.current = eyesGroup;

    // Sclera (eyeballs)
    const eyeWhiteGeo = new THREE.SphereGeometry(0.085, 16, 16);
    const eyeWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.1 });

    // Teal Glowing Irises
    const irisGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.02, 16);
    irisGeo.rotateX(Math.PI / 2);
    const irisMat = new THREE.MeshStandardMaterial({
      color: 0x2dd4bf,
      emissive: 0x2dd4bf,
      emissiveIntensity: 0.9,
      roughness: 0.1,
    });

    // Pupil
    const pupilGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.022, 16);
    pupilGeo.rotateX(Math.PI / 2);
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0x09090b });

    // Left Eye Assembly
    const leftEye = new THREE.Group();
    const leftSclera = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
    const leftIris = new THREE.Mesh(irisGeo, irisMat);
    leftIris.position.set(0, 0, 0.075);
    const leftPupil = new THREE.Mesh(pupilGeo, pupilMat);
    leftPupil.position.set(0, 0, 0.078);
    leftEye.add(leftSclera, leftIris, leftPupil);
    leftEye.position.set(-0.18, 0.08, 0.42);
    eyesGroup.add(leftEye);

    // Right Eye Assembly
    const rightEye = new THREE.Group();
    const rightSclera = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
    const rightIris = new THREE.Mesh(irisGeo, irisMat);
    rightIris.position.set(0, 0, 0.075);
    const rightPupil = new THREE.Mesh(pupilGeo, pupilMat);
    rightPupil.position.set(0, 0, 0.078);
    rightEye.add(rightSclera, rightIris, rightPupil);
    rightEye.position.set(0.18, 0.08, 0.42);
    eyesGroup.add(rightEye);

    // Eyelids for Blinking Animation
    const eyelidGeo = new THREE.SphereGeometry(0.095, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.5);
    eyelidGeo.rotateX(Math.PI);
    const eyelidMat = new THREE.MeshStandardMaterial({
      color: 0xf0e2d3,
      roughness: 0.45,
    });

    const leftEyelid = new THREE.Mesh(eyelidGeo, eyelidMat);
    leftEyelid.position.set(-0.18, 0.1, 0.42);
    leftEyelid.scale.set(1, 0.01, 1); // Opened by default
    headGroup.add(leftEyelid);
    leftEyelidRef.current = leftEyelid;

    const rightEyelid = new THREE.Mesh(eyelidGeo, eyelidMat);
    rightEyelid.position.set(0.18, 0.1, 0.42);
    rightEyelid.scale.set(1, 0.01, 1);
    headGroup.add(rightEyelid);
    rightEyelidRef.current = rightEyelid;

    // Delicate Eyebrows
    const eyebrowMat = new THREE.MeshBasicMaterial({ color: 0x27272a });
    const browGeo = new THREE.BoxGeometry(0.14, 0.02, 0.02);
    browGeo.rotateZ(0.08);
    const leftBrow = new THREE.Mesh(browGeo, eyebrowMat);
    leftBrow.position.set(-0.19, 0.22, 0.46);
    headGroup.add(leftBrow);

    const rightBrowGeo = new THREE.BoxGeometry(0.14, 0.02, 0.02);
    rightBrowGeo.rotateZ(-0.08);
    const rightBrow = new THREE.Mesh(rightBrowGeo, eyebrowMat);
    rightBrow.position.set(0.19, 0.22, 0.46);
    headGroup.add(rightBrow);

    // 4. Nose (Subtle bridge)
    const noseGeo = new THREE.ConeGeometry(0.04, 0.12, 8);
    noseGeo.rotateX(0.2);
    const noseMesh = new THREE.Mesh(noseGeo, skinMat);
    noseMesh.position.set(0, -0.05, 0.48);
    headGroup.add(noseMesh);

    // 5. Articulated Mouth for Talking & Expressions
    const mouthGeo = new THREE.CapsuleGeometry(0.035, 0.1, 8, 12);
    mouthGeo.rotateZ(Math.PI / 2);
    const mouthMat = new THREE.MeshStandardMaterial({
      color: 0xe17070,
      roughness: 0.3,
    });
    const mouthMesh = new THREE.Mesh(mouthGeo, mouthMat);
    mouthMesh.position.set(0, -0.22, 0.45);
    headGroup.add(mouthMesh);
    mouthMeshRef.current = mouthMesh;

    // 6. Cybernetic Ear Communicators / Audio sensors
    const earSensorGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.04, 16);
    earSensorGeo.rotateZ(Math.PI / 2);
    const earSensorMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      metalness: 0.8,
      roughness: 0.2,
      emissive: 0x14b8a6,
      emissiveIntensity: 0.4,
    });

    const leftSensor = new THREE.Mesh(earSensorGeo, earSensorMat);
    leftSensor.position.set(-0.48, 0.08, 0.02);
    headGroup.add(leftSensor);

    const rightSensor = new THREE.Mesh(earSensorGeo, earSensorMat);
    rightSensor.position.set(0.48, 0.08, 0.02);
    headGroup.add(rightSensor);

    // 7. High-Tech Neck & Shoulders Bust
    const neckGeo = new THREE.CylinderGeometry(0.18, 0.22, 0.35, 24);
    const neckMesh = new THREE.Mesh(neckGeo, skinMat);
    neckMesh.position.set(0, -0.42, 0);
    characterGroup.add(neckMesh);

    // Shoulders / Cyber Collar
    const collarGeo = new THREE.CylinderGeometry(0.28, 0.75, 0.5, 32);
    collarGeo.scale(1.3, 1, 0.7);
    const suitMat = new THREE.MeshStandardMaterial({
      color: 0x09090b,
      roughness: 0.3,
      metalness: 0.7,
    });
    const collarMesh = new THREE.Mesh(collarGeo, suitMat);
    collarMesh.position.set(0, -0.72, 0);
    characterGroup.add(collarMesh);

    // Geometric Circuit Line on Collar
    const circuitGeo = new THREE.TorusGeometry(0.38, 0.012, 8, 32, Math.PI);
    circuitGeo.rotateX(-Math.PI / 2);
    const circuitMat = new THREE.MeshStandardMaterial({
      color: 0x2dd4bf,
      emissive: 0x2dd4bf,
      emissiveIntensity: 0.8,
    });
    const circuitMesh = new THREE.Mesh(circuitGeo, circuitMat);
    circuitMesh.position.set(0, -0.55, 0.1);
    characterGroup.add(circuitMesh);

    // 8. Holographic Halo / Voice Aura Ring
    const haloGeo = new THREE.TorusGeometry(0.68, 0.015, 16, 64);
    haloGeo.rotateX(Math.PI / 3);
    const haloMat = new THREE.MeshStandardMaterial({
      color: 0x2dd4bf,
      emissive: 0x2dd4bf,
      emissiveIntensity: 1.0,
      transparent: true,
      opacity: 0.75,
      roughness: 0.1,
    });
    const haloRing = new THREE.Mesh(haloGeo, haloMat);
    haloRing.position.set(0, 0.62, -0.15);
    characterGroup.add(haloRing);
    haloRingRef.current = haloRing;

    // Ambient floating cyan particles
    const particleCount = 48;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 1.8;
      positions[i + 1] = Math.random() * 1.6 - 0.2;
      positions[i + 2] = (Math.random() - 0.5) * 1.2;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x5eead4,
      size: 0.035,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    characterGroup.add(particles);
    haloParticlesRef.current = particles;

    // Adjust position in frame
    characterGroup.position.set(0, -0.1, 0);

    // --- ANIMATION LOOP ---
    const timer = new THREE.Timer();
    let blinkTimer = 0;
    let isBlinking = false;
    let blinkProgress = 0;

    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);

      timer.update();
      const delta = timer.getDelta();
      const elapsed = timer.getElapsed();
      const currentState = stateRef.current;

      // 1. Idle Breathing Loop
      const breath = Math.sin(elapsed * 2.2);
      characterGroup.position.y = -0.1 + breath * 0.02;

      // 2. Periodic Blinking (Every 3-4s)
      blinkTimer += delta;
      if (blinkTimer > 3.8) {
        isBlinking = true;
        blinkTimer = 0;
        blinkProgress = 0;
      }

      if (isBlinking) {
        blinkProgress += delta * 12;
        const blinkVal = Math.sin(Math.min(blinkProgress, Math.PI));
        if (leftEyelidRef.current && rightEyelidRef.current) {
          const eyelidScale = 0.01 + blinkVal * 1.0;
          leftEyelidRef.current.scale.y = eyelidScale;
          rightEyelidRef.current.scale.y = eyelidScale;
        }
        if (blinkProgress >= Math.PI) {
          isBlinking = false;
        }
      }

      // 3. State-Specific Animation Behaviors
      if (headGroupRef.current && mouthMeshRef.current) {
        if (currentState === 'listening') {
          // LISTENING: Tilt head quizzically, focus eyes, glow intensifies
          headGroupRef.current.rotation.z = THREE.MathUtils.lerp(
            headGroupRef.current.rotation.z,
            0.12,
            0.08
          );
          headGroupRef.current.rotation.y = THREE.MathUtils.lerp(
            headGroupRef.current.rotation.y,
            -0.08,
            0.08
          );
          headGroupRef.current.rotation.x = THREE.MathUtils.lerp(
            headGroupRef.current.rotation.x,
            0.03,
            0.08
          );

          // Mouth is closed attentively
          mouthMeshRef.current.scale.y = THREE.MathUtils.lerp(mouthMeshRef.current.scale.y, 1.0, 0.1);
          mouthMeshRef.current.scale.x = THREE.MathUtils.lerp(mouthMeshRef.current.scale.x, 1.0, 0.1);

          if (rimLightRef.current) {
            rimLightRef.current.intensity = 4.2 + Math.sin(elapsed * 5) * 1.2;
          }
        } else if (currentState === 'speaking') {
          // TALKING: Articulate mouth, nod conversational accents
          const talkCycle =
            Math.sin(elapsed * 18) * 0.5 + Math.sin(elapsed * 26) * 0.3 + 0.8;
          mouthMeshRef.current.scale.y = THREE.MathUtils.lerp(
            mouthMeshRef.current.scale.y,
            1.0 + talkCycle * 1.6,
            0.25
          );
          mouthMeshRef.current.scale.x = THREE.MathUtils.lerp(
            mouthMeshRef.current.scale.x,
            0.85 + Math.sin(elapsed * 12) * 0.15,
            0.2
          );

          // Subtle rhythmic nodding
          headGroupRef.current.rotation.x = THREE.MathUtils.lerp(
            headGroupRef.current.rotation.x,
            Math.sin(elapsed * 6) * 0.06,
            0.1
          );
          headGroupRef.current.rotation.z = THREE.MathUtils.lerp(
            headGroupRef.current.rotation.z,
            Math.cos(elapsed * 4) * 0.03,
            0.1
          );
          headGroupRef.current.rotation.y = THREE.MathUtils.lerp(
            headGroupRef.current.rotation.y,
            0,
            0.08
          );

          if (rimLightRef.current) {
            rimLightRef.current.intensity = 3.5 + Math.sin(elapsed * 8) * 0.8;
          }
        } else if (currentState === 'thinking') {
          // THINKING: Gaze drifts slightly up and to side
          headGroupRef.current.rotation.x = THREE.MathUtils.lerp(
            headGroupRef.current.rotation.x,
            -0.08,
            0.08
          );
          headGroupRef.current.rotation.y = THREE.MathUtils.lerp(
            headGroupRef.current.rotation.y,
            0.08,
            0.08
          );
          headGroupRef.current.rotation.z = THREE.MathUtils.lerp(
            headGroupRef.current.rotation.z,
            -0.04,
            0.08
          );
          mouthMeshRef.current.scale.set(1.0, 1.0, 1.0);
        } else {
          // IDLE: Rest position with subtle gentle swaying
          headGroupRef.current.rotation.z = THREE.MathUtils.lerp(
            headGroupRef.current.rotation.z,
            Math.sin(elapsed * 1.2) * 0.02,
            0.05
          );
          headGroupRef.current.rotation.y = THREE.MathUtils.lerp(
            headGroupRef.current.rotation.y,
            Math.cos(elapsed * 0.8) * 0.02,
            0.05
          );
          headGroupRef.current.rotation.x = THREE.MathUtils.lerp(
            headGroupRef.current.rotation.x,
            breath * 0.015,
            0.05
          );
          mouthMeshRef.current.scale.set(1.0, 1.0, 1.0);

          if (rimLightRef.current) {
            rimLightRef.current.intensity = 3.0;
          }
        }
      }

      // Rotate Halo Ring & Particles
      if (haloRingRef.current) {
        haloRingRef.current.rotation.z += delta * (currentState === 'speaking' ? 0.8 : 0.3);
        const haloScale =
          1.0 + (currentState === 'listening' ? Math.sin(elapsed * 4) * 0.05 : 0);
        haloRingRef.current.scale.set(haloScale, haloScale, haloScale);
      }

      if (haloParticlesRef.current) {
        haloParticlesRef.current.rotation.y += delta * 0.15;
      }

      renderer.render(scene, camera);
    };

    animate();

    // Handle Container Resize
    const resizeObserver = new ResizeObserver(() => {
      if (!container || !rendererRef.current) return;
      const w = container.clientWidth || size;
      const h = container.clientHeight || size;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    });
    resizeObserver.observe(container);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
      resizeObserver.disconnect();
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
      timer.dispose();
      // Clean up geometries and materials
      scene.clear();
    };
  }, [size, onFallbackToOrb]);

  if (loadError) {
    return (
      <div
        className={`flex flex-col items-center justify-center text-center p-4 bg-white/5 rounded-3xl border border-white/10 ${className}`}
        style={{ width: size, height: size }}
      >
        <span className="text-xs text-amber-400 font-bold uppercase tracking-wider">
          3D Canvas Fallback
        </span>
        <p className="text-[11px] text-gray-400 mt-1">
          WebGL acceleration limited. Tap below to use the energetic Orb.
        </p>
        {onFallbackToOrb && (
          <button
            onClick={onFallbackToOrb}
            className="mt-3 px-3 py-1.5 bg-teal-500 text-black text-xs font-bold uppercase tracking-wider rounded-xl shadow"
          >
            Switch to Orb
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      id="nova-3d-avatar-container"
      onClick={onClick}
      className={`relative cursor-pointer select-none flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      title="Tap to talk with Nova"
    >
      {/* 3D WebGL Canvas Target */}
      <div ref={containerRef} className="w-full h-full flex items-center justify-center" />

      {/* Holographic Base Ring Reflection */}
      <div
        className={`absolute -bottom-2 w-48 h-10 rounded-[100%] blur-md transition-opacity duration-300 pointer-events-none ${
          state === 'listening'
            ? 'bg-teal-400/40 opacity-100 animate-pulse'
            : state === 'speaking'
            ? 'bg-teal-500/30 opacity-90'
            : 'bg-teal-900/20 opacity-50'
        }`}
      />

      {/* Subtle State Badge */}
      <div className="absolute -bottom-4 z-10 flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#111827]/90 border border-teal-500/30 text-[9px] font-mono font-bold tracking-widest text-teal-300 uppercase shadow-lg">
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            state === 'listening'
              ? 'bg-teal-400 animate-ping'
              : state === 'speaking'
              ? 'bg-teal-300 animate-pulse'
              : state === 'thinking'
              ? 'bg-amber-400 animate-spin'
              : 'bg-teal-500'
          }`}
        />
        <span>3D Female Avatar • {state}</span>
      </div>
    </div>
  );
};
