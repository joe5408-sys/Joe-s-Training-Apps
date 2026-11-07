import React, {useMemo} from 'react';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';

/** Real-time 3D crown (Three.js via @remotion/three). Procedural geometry, no external models. */
const CrownMesh: React.FC<{rot: number; tilt: number}> = ({rot, tilt}) => {
  const spikes = useMemo(() => Array.from({length: 8}, (_, i) => (i / 8) * Math.PI * 2), []);
  return (
    <group rotation={[tilt, rot, 0]}>
      <mesh>
        <cylinderGeometry args={[1.25, 1.2, 0.55, 48, 1, true]} />
        <meshStandardMaterial color="#e8b23a" metalness={0.85} roughness={0.28} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, -0.28, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.22, 0.09, 16, 64]} />
        <meshStandardMaterial color="#ffe08a" metalness={0.9} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0.28, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.25, 0.07, 16, 64]} />
        <meshStandardMaterial color="#ffe08a" metalness={0.9} roughness={0.2} />
      </mesh>
      {spikes.map((a, i) => (
        <group key={i} position={[Math.cos(a) * 1.22, 0.62, Math.sin(a) * 1.22]}>
          <mesh>
            <coneGeometry args={[0.2, 0.75, 16]} />
            <meshStandardMaterial color="#e8b23a" metalness={0.85} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.46, 0]}>
            <sphereGeometry args={[0.12, 20, 20]} />
            <meshStandardMaterial color="#fff2c0" metalness={0.6} roughness={0.15} />
          </mesh>
          <mesh position={[Math.cos(a) * 0.06, -0.62, Math.sin(a) * 0.06]}>
            <octahedronGeometry args={[0.13]} />
            <meshStandardMaterial color={i % 2 ? '#d7261e' : '#12a5a0'} metalness={0.3} roughness={0.1} emissive={i % 2 ? '#5a0808' : '#063a38'} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0.2, 0]}>
        <sphereGeometry args={[1.05, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#4b2a7b" roughness={0.8} />
      </mesh>
    </group>
  );
};

export const ThreeCrown: React.FC<{size: number; rot: number; tilt?: number}> = ({size, rot, tilt = 0.35}) => (
  <ThreeCanvas width={size} height={size} camera={{position: [0, 0.6, 4.6], fov: 40}} gl={{alpha: true, antialias: true}}>
    <ambientLight intensity={0.6} />
    <directionalLight position={[3, 5, 4]} intensity={2.4} color="#fff3d6" />
    <pointLight position={[-4, 1, 3]} intensity={30} color="#ff9ad5" />
    <pointLight position={[4, -1, 2]} intensity={25} color="#7fe6ff" />
    <CrownMesh rot={rot} tilt={tilt} />
  </ThreeCanvas>
);
