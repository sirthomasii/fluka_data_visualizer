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
  pointsData: DataPoint[];
}

const PointCloudScene: React.FC<PointCloudSceneProps> = React.memo(({ thresholdValue, skewValue, pointsData }) => {
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

  const clearScene = useCallback(() => {
    if (sceneRef.current && pointCloudRef.current) {
      sceneRef.current.remove(pointCloudRef.current);
      pointCloudRef.current.geometry.dispose();
      (pointCloudRef.current.material as THREE.Material).dispose();
      pointCloudRef.current = null;
    }
  }, []);

  const updatePointCloud = useCallback(() => {
    if (!sceneRef.current || data.length === 0) {
      console.log('PointCloudScene: No data or scene', { sceneExists: !!sceneRef.current, dataLength: data.length });
      return;
    }

    clearScene();

    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(data.length * 3);
    const colors = new Float32Array(data.length * 3);

    let minValue = Infinity;
    let maxValue = -Infinity;

    data.forEach((point, i) => {
      positions[i * 3] = point.x;
      positions[i * 3 + 1] = point.y;
      positions[i * 3 + 2] = point.z;

      minValue = Math.min(minValue, point.value);
      maxValue = Math.max(maxValue, point.value);

      // Temporary: set all points to red for visibility
      colors[i * 3] = 1;
      colors[i * 3 + 1] = 0;
      colors[i * 3 + 2] = 0;
    });

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.01,  // Increased point size
      vertexColors: true,
      sizeAttenuation: false  // Makes points same size regardless of distance
    });

    const pointCloud = new THREE.Points(geometry, material);
    sceneRef.current.add(pointCloud);
    pointCloudRef.current = pointCloud;

    // Compute bounding box instead of sphere
    geometry.computeBoundingBox();
    const boundingBox = geometry.boundingBox;
    
    if (boundingBox) {
      const center = new THREE.Vector3();
      boundingBox.getCenter(center);
      const size = new THREE.Vector3();
      boundingBox.getSize(size);

      const maxDim = Math.max(size.x, size.y, size.z);
      const fov = cameraRef.current!.fov * (Math.PI / 180);
      let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));

      cameraZ *= 1.5;  // Zoom out a bit

      cameraRef.current!.position.set(center.x, center.y, center.z + cameraZ);
      cameraRef.current!.updateProjectionMatrix();

      controlsRef.current!.target.set(center.x, center.y, center.z);
      controlsRef.current!.update();

      console.log('Camera position:', cameraRef.current!.position);
      console.log('Controls target:', controlsRef.current!.target);
    }

    console.log('Point cloud updated with', data.length, 'points');
  }, [data, clearScene]);

  useEffect(() => {
    console.log('PointCloudScene received new props:', { thresholdValue, skewValue, dataLength: pointsData.length });
    if (pointsData.length > 0) {
      updatePointCloud();
    }
  }, [pointsData, thresholdValue, skewValue, updatePointCloud]);

  useEffect(() => {
    console.log('pointsData changed:', pointsData.length);
    if (pointsData.length > 0) {
      const validData = pointsData.filter(point => 
        isFinite(point.x) && isFinite(point.y) && isFinite(point.z) && isFinite(point.value)
      );
      
      if (validData.length === 0) {
        console.error('No valid points in the new data');
        return;
      }

      setData(validData);
      
      let newMinValue = Infinity;
      let newMaxValue = -Infinity;
      validData.forEach((point) => {
        newMinValue = Math.min(newMinValue, point.value);
        newMaxValue = Math.max(newMaxValue, point.value);
      });
      setMinValue(newMinValue);
      setMaxValue(newMaxValue);

      isInitialRender.current = true;

      console.log(`Set ${validData.length} valid points out of ${pointsData.length} total points`);
    }
  }, [pointsData]);

  useEffect(() => {
    if (data.length > 0) {
      console.log('Updating point cloud with', data.length, 'points');
      updatePointCloud();

      if (isInitialRender.current && cameraRef.current && controlsRef.current) {
        cameraRef.current.position.set(0, 0, 2);
        controlsRef.current.target.set(0, 0, 0);
        controlsRef.current.update();
        isInitialRender.current = false;
      }
    }
  }, [data, updatePointCloud]);

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

  useEffect(() => {
    const cleanup = initScene();
    return cleanup;
  }, [initScene]);

  useEffect(() => {
    updatePointCloud();
  }, [updatePointCloud]);

  return (
    <div>
      <div ref={mountRef} style={{ width: '100%', height: '100vh' }} />
      {data.length === 0 && <div>Loading point cloud data...</div>}
    </div>
  );
});

export default React.memo(PointCloudScene);