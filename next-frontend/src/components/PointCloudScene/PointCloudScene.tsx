"use client";

import React, { useRef, useEffect, useCallback, useState } from 'react';
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
  showBoundingBox: boolean;
  showGrid: boolean;
  fractalParams: {
    A: number;
    B: number;
    C: number;
    n: number;
  };
}

const PointCloudScene: React.FC<PointCloudSceneProps> = React.memo(({ thresholdValue, skewValue, pointsData, pointSize = 2.5, hideHalfPoints, simulationType, fractalType, showBoundingBox, showGrid, fractalParams }) => {
  // console.log('PointCloudScene rendered', { pointsDataLength: pointsData.length, thresholdValue, skewValue, pointSize, hideHalfPoints });

  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const pointCloudRef = useRef<THREE.Points | null>(null);
  // const axesRef = useRef<THREE.AxesHelper | null>(null);
  const gridRef = useRef<THREE.GridHelper | null>(null);
  const boxRef = useRef<THREE.LineSegments | null>(null);

  const [frame, setFrame] = useState(0);
  const [shouldFitCamera, setShouldFitCamera] = useState(true);
  const [isNewSimulation, setIsNewSimulation] = useState(true);
  const [isGeometryLoaded, setIsGeometryLoaded] = useState(false);
  const isMountedRef = useRef(true);

  // Instead, if you need to keep track of these values, use refs
  const boundingBoxRef = useRef<THREE.Box3Helper | null>(null);
  // pointCloudRef is already defined earlier in your component

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // New function to update grid visibility
  const updateGridVisibility = useCallback(() => {
    if (gridRef.current) {
      gridRef.current.visible = showGrid && simulationType === 'beam';
      console.log('Grid visibility set to:', gridRef.current.visible);
    }
  }, [showGrid, simulationType]);

  // New function to update bounding box visibility
  const updateBoundingBoxVisibility = useCallback(() => {
    if (boxRef.current) {
      boxRef.current.visible = showBoundingBox;
      console.log('Box visibility set to:', boxRef.current.visible);
    }
  }, [showBoundingBox, simulationType]);

  // Effect to initialize the scene once
  useEffect(() => {
    initScene();
    return () => {
      // Cleanup function
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
      if (sceneRef.current) {
        while(sceneRef.current.children.length > 0){ 
          sceneRef.current.remove(sceneRef.current.children[0]); 
        }
      }
      // Dispose of other resources
      if (controlsRef.current) controlsRef.current.dispose();
      if (rendererRef.current) rendererRef.current.dispose();
    };
  }, []); // Empty dependency array ensures this runs only once

  // Update this effect to handle grid and box visibility without reinitializing the scene
  useEffect(() => {
    console.log('Visibility effect triggered', { showGrid, showBoundingBox, simulationType });
    updateGridVisibility();
    updateBoundingBoxVisibility();
    
    // Ensure the scene is re-rendered
    if (rendererRef.current && sceneRef.current && cameraRef.current) {
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    }
  }, [showGrid, showBoundingBox, simulationType, updateGridVisibility, updateBoundingBoxVisibility]);

  const initScene = useCallback(() => {
    console.log('initScene called');
    if (!containerRef.current) {
      console.log('Container ref is null');
      return;
    }

    // Clear existing scene
    if (sceneRef.current) {
      while(sceneRef.current.children.length > 0){ 
        sceneRef.current.remove(sceneRef.current.children[0]); 
      }
    } else {
      sceneRef.current = new THREE.Scene();
    }

    console.log('Initializing scene');

    const camera = new THREE.PerspectiveCamera(75, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.1, 1000);
    
    if (simulationType === 'fractal' && fractalType === 'mandelbulb') {
      camera.position.set(1.5, 1.5, 1.5); // Zoomed out for mandelbulb
    } else {
      camera.position.set(1.5, 1.5, 1.5); // Default position for beam simulation
    }
    
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

    // Add grid floor
    const gridHelper = new THREE.GridHelper(10, 10);
    gridHelper.visible = showGrid && simulationType === 'beam';
    sceneRef.current.add(gridHelper);
    gridRef.current = gridHelper;
    console.log('Grid helper added to scene');

    // Add box with white edges
    const boxGeometry = new THREE.BoxGeometry(2, 2, 2);
    const edges = new THREE.EdgesGeometry(boxGeometry);
    const lineMaterial = new THREE.LineBasicMaterial({ 
      color: 0xffffff,
      transparent: true,
      opacity: 0.5
    });
    const box = new THREE.LineSegments(edges, lineMaterial);
    box.visible = showBoundingBox && simulationType === 'beam';
    sceneRef.current.add(box);
    boxRef.current = box;
  
    console.log('Transparent white box added to scene');
  
    // Perform initial render
    renderer.render(sceneRef.current, camera);
    console.log('Initial render performed');

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      if (sceneRef.current) {
        renderer.render(sceneRef.current, camera);
      }
    };
    animate();
    console.log('Animation loop started');
  }, [simulationType]);

  const generateMandelbulb = useCallback((thresholdCutoff = 0.35) => {
    // console.log('Generating Mandelbulb with params:', fractalParams);
    const resolution = 60;
    const size = 2;
    const points: THREE.Vector3[] = [];
    const colors: THREE.Color[] = [];

    // Calculate sinusoidal coefficients
    const A = (Math.cos(frame * .017) * fractalParams.A/2)+fractalParams.A/2 + 1;
    const B = (Math.sin(frame * .013) * fractalParams.B/2)+fractalParams.B/2 + 1;
    const C = (Math.sin(frame * .018) * fractalParams.C/2)+fractalParams.C/2 + 1;
    const n = (Math.sin(frame * .010) * fractalParams.n/2)+fractalParams.n/2 + 1;

    const mandel = (x: number, y: number, z: number): [number, number] => {
      const x0 = x, y0 = y, z0 = z;
      const max = 3;
      let value = 0;
      for (let i = 0; i < max; i++) {
        value = A*Math.abs(x - x0) + B*Math.abs(y - y0) + C*Math.abs(z - z0)
        if (value > n) {
          return [i / max, (.25+0.1*(value / (n))) ];
        }

        const r = Math.sqrt(x*x + y*y + z*z);
        const theta = Math.atan2(Math.sqrt(x*x + y*y), z);
        const phi = Math.atan2(y, x);

        const rn = Math.pow(r, n);
        x = rn * Math.sin(n * theta) * Math.cos(n * phi) + x0;
        y = rn * Math.sin(n * theta) * Math.sin(n * phi) + y0;
        z = rn * Math.cos(n * theta) + z0;
      }
      return [0, 0];
    };
    let Offset_x = 0.01;
    let Offset_y = 0.01;
    let Offset_z = 0.01;

    for (let i = 0; i < resolution; i++) {
      if (i % 2 == 0){
        Offset_x += Offset_x;
        Offset_y -= Offset_y;
        Offset_z -= Offset_z;
     }else{
      Offset_x += Offset_x;
      Offset_y += Offset_y;
      Offset_z -= Offset_z;
      }
      for (let j = 0; j < resolution; j++) {

        if (j % 2 == 0){
           Offset_x += Offset_x;
           Offset_y -= Offset_y;
           Offset_z += Offset_z;
        }
        else{
            Offset_x -= Offset_x;
            Offset_y -= Offset_y;
            Offset_z += Offset_z;
        }

        for (let k = 0; k < resolution; k++) {
          
          const x = (i / resolution - 0.5) * size + Offset_x;
          const y = (j / resolution - 0.5) * size + Offset_y;
          const z = (k / resolution - 0.5) * size + Offset_z;


          const [value, color] = mandel(x, y, z);
          if (value > thresholdCutoff) {
            points.push(new THREE.Vector3(x, y, z));
            colors.push(new THREE.Color().setHSL(color, 1, color));
          }
      }
      }
    }

    return { points, colors };
  }, [frame, hideHalfPoints, fractalParams]);

  const generateStrangeAttractor = useCallback(() => {
    const points: THREE.Vector3[] = [];
    const colors: THREE.Color[] = [];
    let x = 0.1, y = 0, z = 0;
    const numPoints = 20000;
    const dt = 0.0005;

    // Calculate sinusoidal coefficients
    const a = (Math.cos(frame * .0001) * fractalParams.A/2)+fractalParams.A/2 + 1;
    const b = (Math.sin(frame * .0002) * fractalParams.B/2)+fractalParams.B/2 + 1;
    const c = (Math.sin(frame * .0002) * fractalParams.C/2)+fractalParams.C/2 + 1;
    const d = (Math.sin(frame * .0001) * fractalParams.n/2)+fractalParams.n/2 + 1;

    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
    let minX = Infinity, minY = Infinity, minZ = Infinity;

    for (let i = 0; i < numPoints; i++) {
      const dx = a * (y - x);
      const dy = b * x - c * x * z;
      const dz = Math.exp(x * y) - d * z;

      x += dx * dt;
      y += dy * dt;
      z += dz * dt;

      // Update min and max values
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
      if (z > maxZ) maxZ = z;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (z < minZ) minZ = z;

      points.push(new THREE.Vector3(x, y, z));
      colors.push(new THREE.Color().setHSL(i / numPoints, 1, i / numPoints));
  }

    // Normalize points
    const normalizeValue = (value: number, min: number, max: number) => 
      (value - min) / (max - min);

    const normalizedPoints = points.map(point => new THREE.Vector3(
      normalizeValue(point.x, minX, maxX),
      normalizeValue(point.y, minY, maxY),
      normalizeValue(point.z, minZ, maxZ)
    ));

    return { points: normalizedPoints, colors };
  }, [frame, hideHalfPoints, fractalParams]);

  const fitCameraToGeometry = useCallback((geometry: THREE.BufferGeometry) => {
    if (!cameraRef.current || !rendererRef.current) return;

    geometry.computeBoundingBox();
    const boundingBox = geometry.boundingBox;
    if (!boundingBox) return;

    const center = new THREE.Vector3();
    boundingBox.getCenter(center);

    const size = new THREE.Vector3();
    boundingBox.getSize(size);

    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = cameraRef.current.fov * (Math.PI / 180);
    let cameraDistance = Math.abs(maxDim / Math.tan(fov / 2));

    if (simulationType === 'fractal' && fractalType === 'mandelbulb') {
      cameraDistance *= 1.1; // Increase distance by 50% for mandelbulb
    }else{
      cameraDistance *= .75; // Increase distance by 50% for mandelbulb

    }


    const isometricAngle = Math.PI / 4;
    const cameraX = center.x + cameraDistance * Math.cos(isometricAngle);
    const cameraY = center.y + cameraDistance * Math.sin(isometricAngle);
    const cameraZ = center.z + cameraDistance * Math.sin(isometricAngle);

    cameraRef.current.position.set(cameraX, cameraY, cameraZ);
    cameraRef.current.lookAt(center);
    cameraRef.current.near = cameraDistance / 100;
    cameraRef.current.far = cameraDistance * 100;
    cameraRef.current.updateProjectionMatrix();

    if (controlsRef.current) {
      controlsRef.current.target.copy(center);
      controlsRef.current.update();
    }

    rendererRef.current.render(sceneRef.current!, cameraRef.current);
  }, [simulationType, fractalType]);

  const updatePointCloud = useCallback(() => {
    console.log('updatePointCloud called', { simulationType, fractalType });
    if (!sceneRef.current) return;

    // Remove existing point cloud
    if (pointCloudRef.current) {
      sceneRef.current.remove(pointCloudRef.current);
      pointCloudRef.current = null;
    }

    let positions: Float32Array;
    let colors: Float32Array;
    let currentPointSize = pointSize;

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
          if (!hideHalfPoints || (point.x <= 0)) {
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
        currentPointSize = pointSize * 1; // Increase point size for mandelbulb
      } else if (fractalType === 'strangeAttractor') {
        ({ points, colors: fractalColors } = generateStrangeAttractor())
        currentPointSize = pointSize * 1; // Increase point size for mandelbulb

      } else {
        console.error('Invalid fractal type');
        return;
      }

      positions = new Float32Array(points.length * 3);
      colors = new Float32Array(points.length * 3);

      // Use fractalColors to populate the colors array
      for (let i = 0; i < points.length; i++) {
        const point = points[i];
        const color = fractalColors[i];

        positions[i * 3] = point.x;
        positions[i * 3 + 1] = point.y;
        positions[i * 3 + 2] = point.z;

        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
      }
    } else {
      console.error('Invalid simulation type');
      return;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: currentPointSize,
      vertexColors: true,
      sizeAttenuation: false
    });

    const pointCloud = new THREE.Points(geometry, material);
    sceneRef.current.add(pointCloud);
    pointCloudRef.current = pointCloud;

    // Always set the point cloud to visible
    if (pointCloudRef.current) {
      pointCloudRef.current.visible = true;
      console.log('New point cloud created and set to visible');
    }

    if (simulationType === 'fractal') {
      setFrame(prevFrame => prevFrame + 1);
    }

    console.log(`Point cloud updated: ${validPointCount} points added`);
    setIsGeometryLoaded(true);
  }, [pointsData, thresholdValue, skewValue, simulationType, fractalType, generateMandelbulb, generateStrangeAttractor, pointSize, hideHalfPoints, fractalParams]);

  // Effect for updating point cloud
  useEffect(() => {
    console.log('Effect triggered, updating point cloud');
    updatePointCloud();
  }, [updatePointCloud, fractalParams]);

  // Effect for handling simulation changes
  useEffect(() => {
    console.log('Simulation type or fractal type changed', { simulationType, fractalType });
    setIsNewSimulation(true);
    setShouldFitCamera(true);
    setIsGeometryLoaded(false);
  }, [simulationType, fractalType]);

  // Effect for fitting camera when needed
  useEffect(() => {
    if (shouldFitCamera && isNewSimulation && isGeometryLoaded && pointCloudRef.current) {
      console.log('Fitting camera to geometry');
      fitCameraToGeometry(pointCloudRef.current.geometry);
      setShouldFitCamera(false);
      setIsNewSimulation(false);
    }
  }, [shouldFitCamera, isNewSimulation, isGeometryLoaded, fitCameraToGeometry]);

  useEffect(() => {
    if (boundingBoxRef.current) {
      boundingBoxRef.current.visible = showBoundingBox;
    }
  }, [showBoundingBox]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
});

PointCloudScene.displayName = 'PointCloudScene';

export default PointCloudScene;