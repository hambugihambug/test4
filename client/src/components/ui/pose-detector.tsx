import React, { useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import * as tf from '@tensorflow/tfjs';
import * as poseDetection from '@tensorflow-models/pose-detection';
import '@mediapipe/pose';

interface PoseDetectorProps {
  onFallDetected?: (timestamp: Date) => void;
  width?: number;
  height?: number;
}

const PoseDetector: React.FC<PoseDetectorProps> = ({ 
  onFallDetected, 
  width = 640, 
  height = 480 
}) => {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [detector, setDetector] = useState<poseDetection.PoseDetector | null>(null);
  const [fallDetected, setFallDetected] = useState(false);
  
  // 모델 로드
  useEffect(() => {
    const loadModel = async () => {
      await tf.ready();
      const detectorConfig = {
        modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
        enableSmoothing: true,
      };
      
      const model = await poseDetection.createDetector(
        poseDetection.SupportedModels.MoveNet, 
        detectorConfig
      );
      
      setDetector(model);
      setIsModelLoading(false);
      console.log('포즈 감지 모델이 로드되었습니다.');
    };
    
    loadModel();
    
    return () => {
      if (detector) {
        detector.dispose();
      }
    };
  }, []);
  
  // 비디오 프레임 분석
  useEffect(() => {
    let frameId: number;
    let lastFallAlertTime = 0; // 낙상 알람 중복 방지를 위한 시간 추적
    
    const detectFall = async () => {
      if (
        detector && 
        webcamRef.current && 
        webcamRef.current.video && 
        webcamRef.current.video.readyState === 4 &&
        canvasRef.current
      ) {
        const video = webcamRef.current.video;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        
        // 캔버스 크기 설정
        canvas.width = width;
        canvas.height = height;
        
        // 포즈 감지
        const poses = await detector.estimatePoses(video);
        
        if (poses.length > 0) {
          const pose = poses[0];
          
          // 캔버스에 비디오 프레임 그리기
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            // 감지된 키포인트 그리기
            drawKeypoints(pose.keypoints, ctx);
            drawSkeleton(pose.keypoints, ctx);
            
            // 낙상 감지 알고리즘
            const isFall = detectFallFromPose(pose.keypoints);
            
            if (isFall) {
              const now = Date.now();
              // 10초마다 한 번만 알림 (중복 알림 방지)
              if (now - lastFallAlertTime > 10000) {
                setFallDetected(true);
                lastFallAlertTime = now;
                
                if (onFallDetected) {
                  onFallDetected(new Date());
                }
                
                // 3초 후에 경고 상태 초기화
                setTimeout(() => {
                  setFallDetected(false);
                }, 3000);
              }
            }
          }
        }
        
        frameId = requestAnimationFrame(detectFall);
      } else {
        frameId = requestAnimationFrame(detectFall);
      }
    };
    
    detectFall();
    
    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [detector, width, height, onFallDetected]);
  
  // 키포인트를 캔버스에 그리는 함수
  const drawKeypoints = (keypoints: poseDetection.Keypoint[], ctx: CanvasRenderingContext2D) => {
    keypoints.forEach((keypoint) => {
      if (keypoint.score && keypoint.score > 0.3) {
        const { x, y } = keypoint;
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = '#00FF00';
        ctx.fill();
      }
    });
  };
  
  // 스켈레톤을 캔버스에 그리는 함수
  const drawSkeleton = (keypoints: poseDetection.Keypoint[], ctx: CanvasRenderingContext2D) => {
    const connections = [
      ['nose', 'left_eye'], ['nose', 'right_eye'],
      ['left_eye', 'left_ear'], ['right_eye', 'right_ear'],
      ['left_shoulder', 'right_shoulder'], 
      ['left_shoulder', 'left_elbow'], ['right_shoulder', 'right_elbow'],
      ['left_elbow', 'left_wrist'], ['right_elbow', 'right_wrist'],
      ['left_shoulder', 'left_hip'], ['right_shoulder', 'right_hip'],
      ['left_hip', 'right_hip'],
      ['left_hip', 'left_knee'], ['right_hip', 'right_knee'],
      ['left_knee', 'left_ankle'], ['right_knee', 'right_ankle']
    ];
    
    // keypoints 배열에서 이름으로 인덱스를 찾는 함수
    const getKeypointByName = (name: string) => {
      return keypoints.find(kp => kp.name === name);
    };
    
    connections.forEach(([p1Name, p2Name]) => {
      const p1 = getKeypointByName(p1Name as string);
      const p2 = getKeypointByName(p2Name as string);
      
      if (p1 && p2 && p1.score && p2.score && p1.score > 0.3 && p2.score > 0.3) {
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#00FF00';
        ctx.stroke();
      }
    });
  };
  
  // 낙상 감지 알고리즘
  const detectFallFromPose = (keypoints: poseDetection.Keypoint[]): boolean => {
    // 필요한 키포인트 추출
    const nose = keypoints.find(kp => kp.name === 'nose');
    const leftAnkle = keypoints.find(kp => kp.name === 'left_ankle');
    const rightAnkle = keypoints.find(kp => kp.name === 'right_ankle');
    const leftShoulder = keypoints.find(kp => kp.name === 'left_shoulder');
    const rightShoulder = keypoints.find(kp => kp.name === 'right_shoulder');
    
    // 신뢰도 체크
    if (!nose || !leftAnkle || !rightAnkle || !leftShoulder || !rightShoulder || 
        !nose.score || !leftAnkle.score || !rightAnkle.score || 
        !leftShoulder.score || !rightShoulder.score || 
        nose.score < 0.3 || leftAnkle.score < 0.3 || rightAnkle.score < 0.3 || 
        leftShoulder.score < 0.3 || rightShoulder.score < 0.3) {
      return false;
    }
    
    // 수직 거리 계산
    const verticalDistance = Math.min(
      nose.y - leftAnkle.y, 
      nose.y - rightAnkle.y
    );
    
    // 어깨의 중간점
    const shoulderMidY = (leftShoulder.y + rightShoulder.y) / 2;
    
    // 낙상 조건: 코가 발목보다 아래에 있거나, 수직 거리가 매우 작으면 (수평 자세)
    if (verticalDistance <= 0 || Math.abs(verticalDistance) < height * 0.15) {
      return true;
    }
    
    // 어깨가 발목보다 낮은 위치에 있을 때 (누워있는 자세)
    if ((shoulderMidY >= leftAnkle.y) || (shoulderMidY >= rightAnkle.y)) {
      return true;
    }
    
    return false;
  };
  
  return (
    <div className="relative">
      {isModelLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10 text-white">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
            <p>AI 모델 로딩 중...</p>
          </div>
        </div>
      )}
      
      {fallDetected && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-500 bg-opacity-30 z-20">
          <div className="bg-white p-4 rounded-lg shadow-lg">
            <h3 className="text-xl font-bold text-red-600 mb-2">낙상 감지!</h3>
            <p>낙상이 감지되었습니다. 즉시 확인이 필요합니다.</p>
          </div>
        </div>
      )}
      
      <div className="relative">
        <Webcam
          ref={webcamRef}
          width={width}
          height={height}
          style={{ 
            visibility: 'hidden',
            position: 'absolute' 
          }}
          mirrored={true}
        />
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="rounded-lg border border-gray-300"
        />
      </div>
    </div>
  );
};

export default PoseDetector;