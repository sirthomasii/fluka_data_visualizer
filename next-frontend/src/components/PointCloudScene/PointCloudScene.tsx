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
  pointsData: DataPoint[];
  pointSize?: number;
  hideHalfPoints: boolean;
}

const PointCloudScene: React.FC<PointCloudSceneProps> = React.memo(({ thresholdValue, skewValue, geometry, pointsData, pointSize = 2.5, hideHalfPoints }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const pointCloudRef = useRef<THREE.Points | null>(null);
  const axesRef = useRef<THREE.AxesHelper | null>(null);
  const gridRef = useRef<THREE.GridHelper | null>(null);
  const isInitialRender = useRef<boolean>(true);

  const initScene = useCallback(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(75, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.1, 1000);
    // Set up isometric view
    camera.position.set(5, 5, 5);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setClearColor(0x000000, 1);
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

    // Add grid floor
    const gridHelper = new THREE.GridHelper(10, 10);
    scene.add(gridHelper);
    gridRef.current = gridHelper;

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();
  }, []);

  useEffect(() => {
    initScene();
    return () => {
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
    };
  }, [initScene]);

  const clearScene = useCallback(() => {
    if (sceneRef.current && pointCloudRef.current) {
      sceneRef.current.remove(pointCloudRef.current);
      pointCloudRef.current = null;
    }
  }, []);

  const updatePointCloud = useCallback(() => {
    if (!sceneRef.current || pointsData.length === 0) {
      console.log('PointCloudScene: No data or scene', { sceneExists: !!sceneRef.current, dataLength: pointsData.length });
      return;
    }

    clearScene();

    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(pointsData.length * 3);
    const colors = new Float32Array(pointsData.length * 3);

    let minValue = Infinity;
    let maxValue = -Infinity;
    let validPointCount = 0;

    pointsData.forEach((point) => {
      if (point.value >= thresholdValue) {
        minValue = Math.min(minValue, point.value);
        maxValue = Math.max(maxValue, point.value);
      }
    });

    // Ensure minValue is positive for log scale
    minValue = Math.max(minValue, 1e-6);

    const logMinValue = Math.log(minValue);
    const logMaxValue = Math.log(maxValue);

    const jetMap = (t: number): THREE.Color => {
      const r = Math.max(0, Math.min(4 * t - 1.5, -4 * t + 4.5));
      const g = Math.max(0, Math.min(4 * t - 0.5, -4 * t + 3.5));
      const b = Math.max(0, Math.min(4 * t + 0.5, -4 * t + 2.5));
      return new THREE.Color(r, g, b);
    };

    const applySkew = (t: number, skew: number) => {
      return Math.pow(t, skew);
    };

    const getColor = (value: number) => {
      // Apply log scale
      const logValue = Math.log(Math.max(value, minValue));
      
      // Normalize the log value
      let t = (logValue - logMinValue) / (logMaxValue - logMinValue);
      
      // Apply skew
      t = applySkew(t, skewValue);

      // Map to JET color
      return jetMap(t);
    };

    pointsData.forEach((point, i) => {
      if (point.value >= thresholdValue) {
        // Only add points if not hiding half or if the point is in the visible half
        if (!hideHalfPoints || point.x <= 0) {
          const pointVector = new THREE.Vector3(point.x, -point.z, point.y);
          
          // Randomly displace the point
          randomlyDisplacePoint(pointVector);

          positions[validPointCount * 3] = pointVector.x;
          positions[validPointCount * 3 + 1] = pointVector.y;
          positions[validPointCount * 3 + 2] = pointVector.z;

          const color = getColor(point.value);

          colors[validPointCount * 3] = color.r;
          colors[validPointCount * 3 + 1] = color.g;
          colors[validPointCount * 3 + 2] = color.b;

          validPointCount++;
        }
      }
    });

    const trimmedPositions = positions.slice(0, validPointCount * 3);
    const trimmedColors = colors.slice(0, validPointCount * 3);

    geometry.setAttribute('position', new THREE.BufferAttribute(trimmedPositions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(trimmedColors, 3));

    const material = new THREE.PointsMaterial({
      size: pointSize,
      vertexColors: true,
      sizeAttenuation: false
    });

    const pointCloud = new THREE.Points(geometry, material);
    
    // Rotate point cloud 90 degrees around X-axis
    pointCloud.rotation.x = -Math.PI / 2;
    
    sceneRef.current.add(pointCloud);
    pointCloudRef.current = pointCloud;

    if (isInitialRender.current && cameraRef.current && controlsRef.current) {
      const box = new THREE.Box3().setFromObject(pointCloud);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());

      const maxDim = Math.max(size.x, size.y, size.z);
      const fov = cameraRef.current.fov * (Math.PI / 180);
      let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));

      cameraZ *= 1.5; // Zoom out a little so objects don't fill the screen

      const direction = new THREE.Vector3(1, 1, 1).normalize();
      cameraRef.current.position.copy(center).add(direction.multiplyScalar(cameraZ));
      cameraRef.current.lookAt(center);
      cameraRef.current.updateProjectionMatrix();

      controlsRef.current.target.copy(center);
      controlsRef.current.update();

      isInitialRender.current = false;
    }

    if (rendererRef.current && cameraRef.current) {
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    }

    console.log(`Point cloud updated with ${validPointCount} points. Threshold: ${thresholdValue}, Skew: ${skewValue}, Point Size: ${pointSize}`);
  }, [pointsData, thresholdValue, skewValue, pointSize, hideHalfPoints, clearScene]);

  useEffect(() => {
    updatePointCloud();
  }, [updatePointCloud]);

  const randomlyDisplacePoint = (point: THREE.Vector3) => {
    const displacementScale = pointSize / 800;
    const randomVector = new THREE.Vector3(
      (Math.random() - 0.5) * 2 * displacementScale,
      (Math.random() - 0.5) * 2 * displacementScale,
      (Math.random() - 0.5) * 2 * displacementScale
    );
    point.add(randomVector);
  };

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
});

export default PointCloudScene;