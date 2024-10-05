"use client";

import React, { useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

interface DataPoint {
  x: number;
  y: number;
  z: number;
  value: number;
}

interface PointCloudSceneProps {
  thresholdValue: number;
  skewValue: number;
  pointsData: DataPoint[];
  pointSize?: number;
  hideHalfPoints: boolean;
  simulationType: 'beam' | 'fractal';
  fractalType: 'mandelbulb' | 'strangeAttractor';
}

const PointCloudScene: React.FC<PointCloudSceneProps> = React.memo(({ thresholdValue, skewValue, pointsData, pointSize = 2.5, hideHalfPoints, simulationType, fractalType }) => {
  console.log('PointCloudScene rendered', { pointsDataLength: pointsData.length, thresholdValue, skewValue, pointSize, hideHalfPoints });

  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const pointCloudRef = useRef<THREE.Points | null>(null);
  const axesRef = useRef<THREE.AxesHelper | null>(null);
  const gridRef = useRef<THREE.GridHelper | null>(null);

  const initScene = useCallback(() => {
    console.log('initScene called');
    if (!containerRef.current) {
      console.error('Container ref is null');
      return;
    }

    console.log('Initializing scene');

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(75, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.1, 1000);
    camera.position.set(5, 5, 5);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setClearColor(0x222222, 1); // Set a dark gray background
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.screenSpacePanning = false;
    controls.maxPolarAngle = Math.PI / 2;
    controlsRef.current = controls;

    // Add axes
    const axesHelper = new THREE.AxesHelper(5);
    scene.add(axesHelper);
    axesRef.current = axesHelper;
    console.log('Axes helper added to scene');

    // Add grid floor
    const gridHelper = new THREE.GridHelper(10, 10);
    scene.add(gridHelper);
    gridRef.current = gridHelper;
    console.log('Grid helper added to scene');

    // Perform initial render
    renderer.render(scene, camera);
    console.log('Initial render performed');

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();
    console.log('Animation loop started');
  }, []);

  useEffect(() => {
    initScene();
    
    // Copy ref to a variable inside the effect
    const currentContainer = containerRef.current;
    
    return () => {
      if (rendererRef.current && currentContainer) {
        currentContainer.removeChild(rendererRef.current.domElement);
      }
    };
  }, [initScene]);

  const clearScene = useCallback(() => {
    if (sceneRef.current && pointCloudRef.current) {
      sceneRef.current.remove(pointCloudRef.current);
      pointCloudRef.current = null;
    }
  }, []);

  const generateMandelbulb = useCallback((thresholdCutoff = 0.5) => {
    const resolution = 100;
    const size = 2.5;
    const points: THREE.Vector3[] = [];
    const colors: THREE.Color[] = [];

    const mandel = (x: number, y: number, z: number, imax: number): number => {
      const x0 = x, y0 = y, z0 = z;
      const n = 8;

      for (let i = 0; i < imax; i++) {
        if (Math.abs(x - x0) + Math.abs(y - y0) + Math.abs(z - z0) > n) {
          return i / imax;
        }

        const r = Math.sqrt(x*x + y*y + z*z);
        const theta = Math.atan2(Math.sqrt(x*x + y*y), z);
        const phi = Math.atan2(y, x);

        const rn = Math.pow(r, n);
        x = rn * Math.sin(n * theta) * Math.cos(n * phi) + x0;
        y = rn * Math.sin(n * theta) * Math.sin(n * phi) + y0;
        z = rn * Math.cos(n * theta) + z0;
      }
      return 0;
    };

    for (let i = 0; i < resolution; i++) {
      for (let j = 0; j < resolution; j++) {
        for (let k = 0; k < resolution; k++) {
          const x = (i / resolution - 0.5) * size;
          const y = (j / resolution - 0.5) * size;
          const z = (k / resolution - 0.5) * size;

          const value = mandel(x, y, z, 10);
          if (value > thresholdCutoff) {
            points.push(new THREE.Vector3(x, y, z));
            colors.push(new THREE.Color().setHSL(value, 1, 0.5));
          }
        }
      }
    }

    return { points, colors };
  }, []);

  const generateStrangeAttractor = useCallback(() => {
    const points: THREE.Vector3[] = [];
    const colors: THREE.Color[] = [];
    let x = 0.1, y = 0, z = 0;
    const a = 10, b = 28, c = 8/3;
    const numPoints = 10000;

    for (let i = 0; i < numPoints; i++) {
      const dx = a * (y - x);
      const dy = x * (b - z) - y;
      const dz = x * y - c * z;

      x += dx * 0.01;
      y += dy * 0.01;
      z += dz * 0.01;

      points.push(new THREE.Vector3(x, y, z));
      colors.push(new THREE.Color().setHSL(i / numPoints, 1, 0.5));
    }

    return { points, colors };
  }, []);

  const updatePointCloud = useCallback(() => {
    clearScene();

    if (!sceneRef.current) return;

    let positions: Float32Array;
    let colors: Float32Array;

    const randomlyDisplacePoint = (point: THREE.Vector3): void => {
      const displacementScale = pointSize / 800;
      const randomVector = new THREE.Vector3(
        (Math.random() - 0.5) * 2 * displacementScale,
        (Math.random() - 0.5) * 2 * displacementScale,
        (Math.random() - 0.5) * 2 * displacementScale
      );
      point.add(randomVector);
    };

    let maxValue = -Infinity;
    let validPointCount = 0;

    if (simulationType === 'beam') {
      // Use pointsData for beam simulation
      positions = new Float32Array(pointsData.length * 3);
      colors = new Float32Array(pointsData.length * 3);

      // Find max value for color mapping
      maxValue = pointsData[0]?.value ?? 0;
      for (let i = 1; i < pointsData.length; i++) {
        if (pointsData[i].value > maxValue) {
          maxValue = pointsData[i].value;
        }
      }

      // Use a fixed minimum value for color mapping
      const fixedMinValue = 1e-6; // You can adjust this value as needed
      const logMinValue = Math.log(fixedMinValue);
      const logMaxValue = Math.log(maxValue);

      const jetMap = (t: number): [number, number, number] => {
        const r = Math.max(0, Math.min(4 * t - 1.5, -4 * t + 4.5));
        const g = Math.max(0, Math.min(4 * t - 0.5, -4 * t + 3.5));
        const b = Math.max(0, Math.min(4 * t + 0.5, -4 * t + 2.5));
        return [r, g, b];
      };

      const applySkew = (t: number, skew: number): number => {
        return Math.pow(t, skew);
      };

      const getColor = (value: number): [number, number, number] => {
        // Apply log scale
        const logValue = Math.log(Math.max(value, fixedMinValue));
        
        // Normalize the log value
        let t = (logValue - logMinValue) / (logMaxValue - logMinValue);
        
        // Apply skew
        t = applySkew(t, skewValue);

        // Map to JET color
        return jetMap(t);
      };

      pointsData.forEach((point) => {
        if (point.value >= thresholdValue) {
          // Only add points if not hiding half or if the point is in the visible half
          if (!hideHalfPoints || (point.y <= 0 && point.z <= 0)) {
            const i = validPointCount * 3;
            const position = new THREE.Vector3(point.x, point.y, point.z);
            randomlyDisplacePoint(position);

            positions[i] = position.x;
            positions[i + 1] = position.y;
            positions[i + 2] = position.z;

            const [r, g, b] = getColor(point.value);

            colors[i] = r;
            colors[i + 1] = g;
            colors[i + 2] = b;

            validPointCount++;
          }
        }
      });
    } else if (simulationType === 'fractal') {
      let points: THREE.Vector3[];
      let fractalColors: THREE.Color[];

      if (fractalType === 'mandelbulb') {
        ({ points, colors: fractalColors } = generateMandelbulb());
      } else if (fractalType === 'strangeAttractor') {
        ({ points, colors: fractalColors } = generateStrangeAttractor());
      } else {
        console.error('Invalid fractal type');
        return;
      }

      positions = new Float32Array(points.length * 3);
      colors = new Float32Array(points.length * 3);

      points.forEach((point) => {
        randomlyDisplacePoint(point);
        const i = validPointCount * 3;
        positions[i] = point.x;
        positions[i + 1] = point.y;
        positions[i + 2] = point.z;

        colors[i] = fractalColors[validPointCount].r;
        colors[i + 1] = fractalColors[validPointCount].g;
        colors[i + 2] = fractalColors[validPointCount].b;

        validPointCount++;
      });
    } else {
      console.error('Invalid simulation type');
      return;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: pointSize,
      vertexColors: true,
      sizeAttenuation: false
    });

    const pointCloud = new THREE.Points(geometry, material);
    sceneRef.current.add(pointCloud);
    pointCloudRef.current = pointCloud;

    // ... (keep the existing camera positioning logic)

    if (rendererRef.current && cameraRef.current) {
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    }

    console.log(`Max value: ${maxValue}, Valid points: ${validPointCount}`);
  }, [pointsData, thresholdValue, skewValue, clearScene, simulationType, fractalType, generateMandelbulb, generateStrangeAttractor, pointSize]);

  useEffect(() => {
    console.log('PointCloudScene useEffect triggered');
    updatePointCloud();
  }, [updatePointCloud]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
});

PointCloudScene.displayName = 'PointCloudScene';

export default PointCloudScene;