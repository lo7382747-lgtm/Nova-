/**
 * Nova 3D Avatar Configuration (Phase 3)
 *
 * To swap the 3D female avatar model, update `modelUrl` below to any .glb / .gltf asset path.
 * Per project instructions: User will be consulted before selecting a specific commercial/copyrighted
 * 3D model. When modelUrl is empty, Nova uses the built-in high-performance stylized 3D female
 * assistant avatar with procedural mesh, expressive eyes, blinking loops, listening head-tilt,
 * and amplitude-driven talking mouth animation.
 */
export interface AvatarConfig {
  modelUrl: string; // One-line swappable model reference
  enableBlinking: boolean;
  enableBreathing: boolean;
  enableTalkingAnimation: boolean;
  enableListeningTilt: boolean;
  fallbackToOrbOnLowEnd: boolean;
  accentColor: string;
}

export const AVATAR_CONFIG: AvatarConfig = {
  // SWAP MODEL HERE (Single-line change):
  // e.g. modelUrl: '/models/nova_female_avatar.glb'
  modelUrl: '',
  enableBlinking: true,
  enableBreathing: true,
  enableTalkingAnimation: true,
  enableListeningTilt: true,
  fallbackToOrbOnLowEnd: true,
  accentColor: '#2dd4bf', // Teal 400
};
