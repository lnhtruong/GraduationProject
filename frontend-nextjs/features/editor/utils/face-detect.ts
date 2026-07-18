import {
  FaceDetector as MediaPipeFaceDetector,
  FilesetResolver,
} from "@mediapipe/tasks-vision";

export type MascotAnimationMode = "human" | "animal";

let faceDetectorInstance: MediaPipeFaceDetector | null = null;

const TENSORFLOW_LITE_INFO_MESSAGE =
  "Created TensorFlow Lite XNNPACK delegate for CPU";

function isTensorFlowLiteInfoLog(args: unknown[]) {
  return args.some((arg) => String(arg).includes(TENSORFLOW_LITE_INFO_MESSAGE));
}

async function suppressTensorFlowLiteInfo<T>(
  callback: () => T | Promise<T>,
): Promise<T> {
  const originalError = console.error;

  console.error = (...args: Parameters<typeof console.error>) => {
    if (isTensorFlowLiteInfoLog(args)) return;
    originalError(...args);
  };

  try {
    return await callback();
  } finally {
    console.error = originalError;
  }
}

async function getFaceDetector() {
  if (faceDetectorInstance) return faceDetectorInstance;

  const vision = await suppressTensorFlowLiteInfo(() =>
    FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm",
    ),
  );

  faceDetectorInstance = await suppressTensorFlowLiteInfo(() =>
    MediaPipeFaceDetector.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite",
        delegate: "CPU",
      },
      runningMode: "IMAGE",
    }),
  );

  return faceDetectorInstance;
}

async function loadImage(imageUrl: string) {
  const image = new Image();
  if (!imageUrl.startsWith("blob:") && !imageUrl.startsWith("data:")) {
    image.crossOrigin = "anonymous";
  }
  image.src = imageUrl;
  await image.decode();
  return image;
}

function drawImageToCanvas(image: HTMLImageElement) {
  const maxDimension = 1024;
  const scale = Math.min(
    1,
    maxDimension / Math.max(image.naturalWidth, image.naturalHeight),
  );
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas 2D context is not available");
  }

  context.drawImage(image, 0, 0, width, height);
  return canvas;
}

export async function inferMascotAnimationMode(
  imageUrl: string,
): Promise<MascotAnimationMode> {
  try {
    const detector = await getFaceDetector();
    const image = await loadImage(imageUrl);
    const result = await suppressTensorFlowLiteInfo(() =>
      detector.detect(drawImageToCanvas(image)),
    );

    return result.detections.length > 0 ? "human" : "animal";
  } catch (error) {
    console.warn("[inferMascotAnimationMode] fallback to animal:", error);
    return "animal";
  }
}
