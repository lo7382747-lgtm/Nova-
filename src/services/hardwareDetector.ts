/**
 * Device Capability Detector for 3D Graphics
 * Detects whether the device can smoothly render 3D avatars via WebGL/Filament
 * or if it should automatically fall back to the lightweight animated Orb.
 */
export interface DeviceCapability {
  isLowEnd: boolean;
  gpuRenderer: string;
  hasWebGL: boolean;
  score: number;
  recommendation: '3d_avatar' | 'orb';
  reason: string;
}

export function detectDeviceCapability(): DeviceCapability {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');

    if (!gl) {
      return {
        isLowEnd: true,
        gpuRenderer: 'Unavailable',
        hasWebGL: false,
        score: 0,
        recommendation: 'orb',
        reason: 'WebGL is not supported on this device',
      };
    }

    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : '';
    const vendor = debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : '';

    const lowerRenderer = (renderer + ' ' + vendor).toLowerCase();

    // Check for software renderers or basic mobile chipsets known for low performance
    const isSoftware =
      lowerRenderer.includes('swiftshader') ||
      lowerRenderer.includes('llvmpipe') ||
      lowerRenderer.includes('software') ||
      lowerRenderer.includes('basic render');

    const hardwareConcurrency = navigator.hardwareConcurrency || 4;
    // @ts-ignore - deviceMemory is non-standard but useful in Chrome
    const deviceMemory = navigator.deviceMemory || 4;

    let score = 70; // Base score
    if (isSoftware) score -= 50;
    if (hardwareConcurrency <= 2) score -= 25;
    if (deviceMemory <= 2) score -= 20;

    const isLowEnd = score < 50 || isSoftware;

    return {
      isLowEnd,
      gpuRenderer: renderer || 'Standard WebGL Accelerator',
      hasWebGL: true,
      score,
      recommendation: isLowEnd ? 'orb' : '3d_avatar',
      reason: isLowEnd
        ? 'Low-power or software rendering detected. Orb recommended for 60fps responsiveness.'
        : 'Dedicated hardware acceleration active. 3D Avatar fully supported.',
    };
  } catch (e) {
    return {
      isLowEnd: false,
      gpuRenderer: 'Standard GPU',
      hasWebGL: true,
      score: 75,
      recommendation: '3d_avatar',
      reason: 'Standard capability',
    };
  }
}
