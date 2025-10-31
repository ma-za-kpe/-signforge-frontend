/**
 * MediaPipe Holistic Handler for Browser-Side Landmark Extraction
 *
 * This utility wraps MediaPipe Holistic for extracting pose, hand, and face landmarks
 * from webcam video in the browser (privacy-preserving, no video upload needed).
 *
 * Usage:
 *   const handler = new MediaPipeHandler(videoElement, (results) => {
 *     console.log('Landmarks detected:', results);
 *   });
 *   handler.start();
 */

export interface Landmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export interface LandmarkResult {
  poseLandmarks: Landmark[] | null;
  leftHandLandmarks: Landmark[] | null;
  rightHandLandmarks: Landmark[] | null;
  faceLandmarks: Landmark[] | null;
}

export class MediaPipeHandler {
  private holistic: any;
  private camera: any;
  private videoElement: HTMLVideoElement;
  private onResults: (results: LandmarkResult) => void;
  private isInitialized: boolean = false;
  private isRunning: boolean = false;

  constructor(videoElement: HTMLVideoElement, onResults: (results: LandmarkResult) => void) {
    this.videoElement = videoElement;
    this.onResults = onResults;
  }

  /**
   * Initialize MediaPipe Holistic from CDN
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    // Load MediaPipe scripts from CDN
    await this.loadMediaPipeScripts();

    // @ts-ignore - MediaPipe loaded from CDN
    const { Holistic, FACEMESH_TESSELATION, HAND_CONNECTIONS, POSE_CONNECTIONS } = window;

    // Initialize Holistic model
    this.holistic = new Holistic({
      locateFile: (file: string) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`;
      }
    });

    // Configure model options
    this.holistic.setOptions({
      modelComplexity: 1,           // 0=lite, 1=full, 2=heavy
      smoothLandmarks: true,         // Smooth landmark positions over time
      enableSegmentation: false,     // We don't need segmentation masks
      smoothSegmentation: false,
      refineFaceLandmarks: false,    // Skip detailed face mesh (faster)
      minDetectionConfidence: 0.5,   // Minimum confidence to detect pose
      minTrackingConfidence: 0.5     // Minimum confidence to track landmarks
    });

    // Set up results callback
    this.holistic.onResults((results: any) => {
      this.handleResults(results);
    });

    this.isInitialized = true;
    console.log('✓ MediaPipe Holistic initialized');
  }

  /**
   * Load MediaPipe scripts from CDN dynamically
   */
  private async loadMediaPipeScripts(): Promise<void> {
    // Check if already loaded
    // @ts-ignore
    if (window.Holistic) {
      return;
    }

    return new Promise((resolve, reject) => {
      // Load camera_utils
      const cameraScript = document.createElement('script');
      cameraScript.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js';
      cameraScript.crossOrigin = 'anonymous';

      // Load holistic
      const holisticScript = document.createElement('script');
      holisticScript.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/holistic/holistic.js';
      holisticScript.crossOrigin = 'anonymous';

      // Load drawing_utils
      const drawingScript = document.createElement('script');
      drawingScript.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js';
      drawingScript.crossOrigin = 'anonymous';

      let scriptsLoaded = 0;
      const totalScripts = 3;

      const onLoad = () => {
        scriptsLoaded++;
        if (scriptsLoaded === totalScripts) {
          console.log('✓ MediaPipe scripts loaded');
          resolve();
        }
      };

      const onError = (error: any) => {
        console.error('✗ Failed to load MediaPipe scripts:', error);
        reject(error);
      };

      cameraScript.onload = onLoad;
      cameraScript.onerror = onError;
      holisticScript.onload = onLoad;
      holisticScript.onerror = onError;
      drawingScript.onload = onLoad;
      drawingScript.onerror = onError;

      document.head.appendChild(cameraScript);
      document.head.appendChild(holisticScript);
      document.head.appendChild(drawingScript);
    });
  }

  /**
   * Start processing video stream
   */
  async start(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (this.isRunning) {
      return;
    }

    // @ts-ignore - MediaPipe Camera from CDN
    const { Camera } = window;

    this.camera = new Camera(this.videoElement, {
      onFrame: async () => {
        if (this.holistic) {
          await this.holistic.send({ image: this.videoElement });
        }
      },
      width: 1280,
      height: 720
    });

    await this.camera.start();
    this.isRunning = true;
    console.log('✓ MediaPipe camera started');
  }

  /**
   * Stop processing video stream
   */
  stop(): void {
    if (this.camera) {
      this.camera.stop();
      this.isRunning = false;
      console.log('✓ MediaPipe camera stopped');
    }
  }

  /**
   * Handle MediaPipe results and convert to our format
   */
  private handleResults(results: any): void {
    const landmarkResult: LandmarkResult = {
      poseLandmarks: this.convertLandmarks(results.poseLandmarks),
      leftHandLandmarks: this.convertLandmarks(results.leftHandLandmarks),
      rightHandLandmarks: this.convertLandmarks(results.rightHandLandmarks),
      faceLandmarks: this.convertLandmarks(results.faceLandmarks)
    };

    this.onResults(landmarkResult);
  }

  /**
   * Convert MediaPipe landmarks to our format
   */
  private convertLandmarks(landmarks: any[] | undefined): Landmark[] | null {
    if (!landmarks || landmarks.length === 0) {
      return null;
    }

    return landmarks.map((lm: any) => ({
      x: lm.x,
      y: lm.y,
      z: lm.z,
      visibility: lm.visibility !== undefined ? lm.visibility : 1.0
    }));
  }

  /**
   * Get current status
   */
  getStatus(): { initialized: boolean; running: boolean } {
    return {
      initialized: this.isInitialized,
      running: this.isRunning
    };
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.stop();
    this.holistic = null;
    this.camera = null;
    console.log('✓ MediaPipe handler disposed');
  }
}

/**
 * Helper function to draw skeleton overlay on canvas
 */
export function drawSkeletonOverlay(
  canvas: HTMLCanvasElement,
  results: LandmarkResult,
  width: number,
  height: number
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  // Draw pose connections
  if (results.poseLandmarks) {
    drawConnections(ctx, results.poseLandmarks, POSE_CONNECTIONS, '#00FF00', 2);
    drawLandmarks(ctx, results.poseLandmarks, '#00FF00', 3);
  }

  // Draw left hand connections
  if (results.leftHandLandmarks) {
    drawConnections(ctx, results.leftHandLandmarks, HAND_CONNECTIONS, '#FF0000', 2);
    drawLandmarks(ctx, results.leftHandLandmarks, '#FF0000', 3);
  }

  // Draw right hand connections
  if (results.rightHandLandmarks) {
    drawConnections(ctx, results.rightHandLandmarks, HAND_CONNECTIONS, '#0000FF', 2);
    drawLandmarks(ctx, results.rightHandLandmarks, '#0000FF', 3);
  }
}

// MediaPipe connection definitions
const POSE_CONNECTIONS = [
  [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
  [11, 23], [12, 24], [23, 24],
  [23, 25], [25, 27], [24, 26], [26, 28]
];

const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [0, 9], [9, 10], [10, 11], [11, 12],
  [0, 13], [13, 14], [14, 15], [15, 16],
  [0, 17], [17, 18], [18, 19], [19, 20],
  [5, 9], [9, 13], [13, 17]
];

function drawConnections(
  ctx: CanvasRenderingContext2D,
  landmarks: Landmark[],
  connections: number[][],
  color: string,
  lineWidth: number
): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;

  for (const [start, end] of connections) {
    if (start < landmarks.length && end < landmarks.length) {
      const startLm = landmarks[start];
      const endLm = landmarks[end];

      ctx.beginPath();
      ctx.moveTo(startLm.x * ctx.canvas.width, startLm.y * ctx.canvas.height);
      ctx.lineTo(endLm.x * ctx.canvas.width, endLm.y * ctx.canvas.height);
      ctx.stroke();
    }
  }
}

function drawLandmarks(
  ctx: CanvasRenderingContext2D,
  landmarks: Landmark[],
  color: string,
  radius: number
): void {
  ctx.fillStyle = color;

  for (const lm of landmarks) {
    ctx.beginPath();
    ctx.arc(lm.x * ctx.canvas.width, lm.y * ctx.canvas.height, radius, 0, 2 * Math.PI);
    ctx.fill();
  }
}
