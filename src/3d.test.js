import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { init3D } from './3d.js';
import * as THREE from 'three';

// Create mock classes for THREE.js objects
class MockScene {
  add = vi.fn();
  background = null;
}

class MockCamera {
  position = { set: vi.fn() };
  aspect = 1;
  updateProjectionMatrix = vi.fn();
}

class MockRenderer {
  setSize = vi.fn();
  render = vi.fn();
  domElement = document.createElement('canvas');
}

// Mock THREE.js functionality for testing
vi.mock('three', async () => {
  const actualThree = await vi.importActual('three');
  return {
    ...actualThree,
    Scene: vi.fn(() => new MockScene()),
    PerspectiveCamera: vi.fn(() => new MockCamera()),
    WebGLRenderer: vi.fn(() => new MockRenderer()),
    Color: vi.fn(),
    GridHelper: vi.fn(),
    Group: vi.fn(() => ({
      add: vi.fn(),
      position: { set: vi.fn() }
    })),
    BoxGeometry: vi.fn(),
    MeshStandardMaterial: vi.fn(),
    Mesh: vi.fn(() => ({
      position: { set: vi.fn() },
      userData: {}
    })),
    AmbientLight: vi.fn(),
    DirectionalLight: vi.fn(() => ({
      position: { set: vi.fn() }
    }))
  };
});

// Mock OrbitControls with updated path
vi.mock('three/addons/controls/OrbitControls.js', () => ({
  OrbitControls: vi.fn(() => ({
    enableDamping: false,
    dampingFactor: 0,
    update: vi.fn()
  }))
}));

describe('3D Visualization Module', () => {
  // Store original requestAnimationFrame
  const originalRAF = global.requestAnimationFrame;
  
  // Mock DOM elements
  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
    
    // Replace requestAnimationFrame with a mock that doesn't execute the callback
    // This prevents infinite recursion
    global.requestAnimationFrame = vi.fn(cb => {
      return 1; // Just return an ID without executing the callback
    });
  });
  
  // Restore original requestAnimationFrame after tests
  afterEach(() => {
    global.requestAnimationFrame = originalRAF;
    
    // Remove event listeners to prevent memory leaks
    window.removeEventListener('resize', window.onresize);
  });
  
  it('should initialize 3D scene with valid contribution data', () => {
    // Sample contribution data
    const mockContributions = [
      { date: '2024-01-01', count: 5, level: 2 },
      { date: '2024-01-02', count: 3, level: 1 },
      { date: '2024-01-03', count: 0, level: 0 },
      { date: '2024-01-04', count: 10, level: 4 },
      { date: '2024-01-05', count: 2, level: 1 },
      { date: '2024-01-06', count: 1, level: 1 },
      { date: '2024-01-07', count: 0, level: 0 }
    ];
    
    // Initialize 3D
    const result = init3D(mockContributions);
    
    // Verify 3D scene was initialized
    expect(result).toBeDefined();
    expect(result.scene).toBeDefined();
    expect(result.scene.add).toBeDefined();  // Check for scene methods instead of instanceof
    expect(result.camera).toBeDefined();
    expect(result.renderer).toBeDefined();
    
    // Check if canvas was appended to DOM
    const canvas = document.querySelector('canvas');
    expect(canvas).toBeTruthy();
  });
  
  it('should handle empty contribution data', () => {
    // Initialize with empty data
    const result = init3D([]);
    
    // Verify 3D scene was still initialized
    expect(result).toBeDefined();
    expect(result.scene).toBeDefined();
    expect(result.scene.add).toBeDefined();
    
    // Check if canvas was appended to DOM
    const canvas = document.querySelector('canvas');
    expect(canvas).toBeTruthy();
  });
  
  it('should handle null or undefined contribution data', () => {
    // Initialize with null data
    const result = init3D(null);
    
    // Verify 3D scene was still initialized
    expect(result).toBeDefined();
    expect(result.scene).toBeDefined();
    expect(result.scene.add).toBeDefined();
    
    // Check if canvas was appended to DOM
    const canvas = document.querySelector('canvas');
    expect(canvas).toBeTruthy();
  });
});