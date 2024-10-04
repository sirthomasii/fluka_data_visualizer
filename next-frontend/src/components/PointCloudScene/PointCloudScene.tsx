"use client";

import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

interface DataPoint {
  x: number;
  y: number;
  z: number;
  value: number;
}

interface PointCloudSceneProps {
  thresholdValue: number;
  skewValue: number;
  geometry: string;
  onDataLoaded: (data: DataPoint[]) => void;
}

const PointCloudScene: React.FC<PointCloudSceneProps> = React.memo(({ thresholdValue, skewValue, geometry, onDataLoaded }) => {
  // console.log('PointCloudScene rendered with:', { thresholdValue, skewValue });

  const mountRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<DataPoint[]>([]);
  const [minValue, setMinValue] = useState<number>(Infinity);
  const [maxValue, setMaxValue] = useState<number>(-Infinity);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const pointCloudRef = useRef<THREE.Points | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const isInitialRender = useRef(true);

  useEffect(() => {
    // console.log('PointCloudScene: Fetching data');
    // Existing setup code...

    // Fetch data
    fetch('/fluka_data/test.txt_parsed')
      .then(response => response.text())
      .then(csvString => {
        // console.log('CSV data fetched, length:', csvString.length);
        const worker = new Worker(new URL('../../csvParserWorker.ts', import.meta.url));
        worker.postMessage({ csvString });
        worker.onmessage = (event) => {
          if (event.data.error) {
            console.error('Error in worker:', event.data.error);
          } else {
            // console.log('Data parsed successfully:', event.data);
            // console.log('Number of points:', event.data.points.length);
            setData(event.data.points);
            setMinValue(event.data.minValue);
            setMaxValue(event.data.maxValue);
            onDataLoaded(event.data.points); // Call the callback with the loaded data
          }
          worker.terminate();
        };
      })
      .catch(error => console.error('Error fetching CSV:', error));
  }, [onDataLoaded]);

  const initScene = useCallback(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer();

    renderer.setSize(window.innerWidth, window.innerHeight);
    mountRef.current.appendChild(renderer.domElement);

    sceneRef.current = scene;
    rendererRef.current = renderer;
    cameraRef.current = camera;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.enableZoom = true;
    controls.minDistance = 1; // Set minimum zoom distance
    controls.maxDistance = 10; // Set maximum zoom distance
    controlsRef.current = controls;

    // Set initial camera position closer to the scene
    camera.position.set(0, 0, 2);

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      const width = mountRef.current!.clientWidth;
      const height = mountRef.current!.clientHeight;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', handleResize);
    handleResize();

    const axesHelper = new THREE.AxesHelper(5);
    sceneRef.current.add(axesHelper);

    const gridHelper = new THREE.GridHelper(10, 10);
    sceneRef.current.add(gridHelper);

    return () => {
      console.log('Cleanup function called');
      window.removeEventListener('resize', handleResize);
      
      if (mountRef.current) {
        console.log('mountRef.current exists');
        if (renderer && renderer.domElement) {
          console.log('renderer and domElement exist');
          if (mountRef.current.contains(renderer.domElement)) {
            console.log('Attempting to remove renderer.domElement');
            try {
              mountRef.current.removeChild(renderer.domElement);
              console.log('Successfully removed renderer.domElement');
            } catch (error) {
              console.error('Error removing renderer.domElement:', error);
            }
          } else {
            console.log('renderer.domElement is not a child of mountRef.current');
          }
        } else {
          console.log('renderer or domElement is undefined');
        }
      } else {
        console.log('mountRef.current is null');
      }
    };
  }, []);

  const updatePointCloud = useCallback(() => {
    // console.log('PointCloudScene: Updating point cloud with:', { thresholdValue, skewValue });
    if (!sceneRef.current || data.length === 0) {
      console.log('PointCloudScene: No data or scene', { sceneExists: !!sceneRef.current, dataLength: data.length });
      return;
    }

    // console.log('Updating point cloud with', data.length, 'points');

    if (pointCloudRef.current) {
      sceneRef.current.remove(pointCloudRef.current);
      pointCloudRef.current.geometry.dispose();
      (pointCloudRef.current.material as THREE.Material).dispose();
    }

    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(data.length * 3);
    const colors = new Float32Array(data.length * 3);

    let minValue = Infinity;
    let maxValue = -Infinity;

    data.forEach((point) => {
      minValue = Math.min(minValue, point.value);
      maxValue = Math.max(maxValue, point.value);
    });

    // console.log('Data range:', { minValue, maxValue });
    // console.log('Current thresholdValue:', thresholdValue);

    // Provide a default threshold if thresholdValue is not set or is NaN
    const effectiveThreshold = isNaN(thresholdValue) ? 0 : thresholdValue;

    const normalizedThreshold = Math.max(
      minValue,
      (effectiveThreshold / 100) * (maxValue*.05 - minValue) + minValue
    );

    // console.log('Effective threshold:', effectiveThreshold);
    // console.log('Normalized threshold:', normalizedThreshold);

    const jetColorMap = (value: number): THREE.Color => {
      const v = Math.pow(value, 1 - skewValue);
      let r, g, b;

      if (v < 0.125) {
        r = 0;
        g = 0;
        b = 0.5 + 4 * v;
      } else if (v < 0.375) {
        r = 0;
        g = 4 * (v - 0.125);
        b = 1;
      } else if (v < 0.625) {
        r = 4 * (v - 0.375);
        g = 1;
        b = 1 - 4 * (v - 0.375);
      } else if (v < 0.875) {
        r = 1;
        g = 1 - 4 * (v - 0.625);
        b = 0;
      } else {
        r = 1 - 4 * (v - 0.875);
        g = 0;
        b = 0;
      }

      return new THREE.Color(r, g, b);
    };

    let visiblePointCount = 0;
    data.forEach((point, i) => {
      if (point.value >= normalizedThreshold) {
        positions[visiblePointCount * 3] = point.x;
        positions[visiblePointCount * 3 + 1] = point.y;
        positions[visiblePointCount * 3 + 2] = point.z;

        const normalizedValue = (point.value - normalizedThreshold) / (maxValue - normalizedThreshold);
        const color = jetColorMap(normalizedValue);
        colors[visiblePointCount * 3] = color.r;
        colors[visiblePointCount * 3 + 1] = color.g;
        colors[visiblePointCount * 3 + 2] = color.b;

        visiblePointCount++;
      }
    });

    // console.log('Visible point count:', visiblePointCount);

    geometry.setAttribute('position', new THREE.BufferAttribute(positions.slice(0, visiblePointCount * 3), 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors.slice(0, visiblePointCount * 3), 3));

    const material = new THREE.PointsMaterial({ size: 0.005, vertexColors: true });
    const pointCloud = new THREE.Points(geometry, material);
    sceneRef.current.add(pointCloud);
    pointCloudRef.current = pointCloud;

    geometry.computeBoundingSphere();
    if (geometry.boundingSphere) {
      const center = geometry.boundingSphere.center;
      const radius = geometry.boundingSphere.radius;

      pointCloud.position.sub(center);
      pointCloud.scale.multiplyScalar(1 / radius);

      // Only adjust camera and controls on initial render
      if (isInitialRender.current && cameraRef.current && controlsRef.current) {
        const zoomFactor = 1.5; // Adjust this value to change the initial zoom level
        cameraRef.current.position.set(0, 0, radius * zoomFactor);
        controlsRef.current.target.copy(center);
        controlsRef.current.update();
        isInitialRender.current = false;
      }
    } else {
      console.error('Failed to compute bounding sphere');
    }

    // console.log('Point cloud updated');
  }, [data, thresholdValue, skewValue]);

  useEffect(() => {
    const cleanup = initScene();
    return cleanup;
  }, [initScene]);

  useEffect(() => {
    updatePointCloud();
  }, [updatePointCloud]);

  useEffect(() => {
    // console.log('PointCloudScene: Effect triggered for data or props change');
    if (data.length > 0) {
      updatePointCloud();
    }
  }, [data, thresholdValue, skewValue, updatePointCloud]);

  return (
    <div>
      <div ref={mountRef} style={{ width: '100%', height: '100vh' }} />
      {data.length === 0 && <div>Loading point cloud data...</div>}
    </div>
  );
});

export default React.memo(PointCloudScene);