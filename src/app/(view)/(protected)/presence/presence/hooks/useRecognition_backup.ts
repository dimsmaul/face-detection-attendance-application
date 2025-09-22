import { useAuthStore } from "@/store/useAuthStore";
import { useRef, useState, useEffect } from "react";
import * as faceapi from 'face-api.js'

export const useRecognition_backup = () => {
  const { users } = useAuthStore();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [status, setStatus] = useState("Loading models...");
  const [isProcessing, setIsProcessing] = useState(false);
  const [referenceDescriptor, setReferenceDescriptor] =
    useState<Float32Array | null>(null);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  // Add debug message
  const addDebugInfo = (message: string) => {
    console.log(`DEBUG: ${message}`);
    setDebugInfo((prev) => [...prev, message]);
  };

  // Load face-api.js models
  useEffect(() => {
    const loadModels = async () => {
      try {
        addDebugInfo("Starting model loading process");
        setStatus("Loading models...");

        const MODEL_URL = "/models";
        addDebugInfo(`Loading models from: ${MODEL_URL}`);

        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        addDebugInfo("TinyFaceDetector model loaded");

        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        addDebugInfo("FaceLandmark68Net model loaded");

        await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
        addDebugInfo("FaceRecognitionNet model loaded");

        // Check if user profile exists
        if (!users.user?.profile) {
          const errorMsg = "Error: No reference image found in user profile";
          addDebugInfo(errorMsg);
          setStatus(errorMsg);
          return;
        }

        addDebugInfo(`User profile image URL: ${users.user.profile}`);

        // Load reference image and compute descriptor
        setStatus("Loading reference image...");
        addDebugInfo("Starting reference image loading process");

        try {
          const referenceImg = await loadReferenceImage(users.user.profile);
          addDebugInfo("Reference image loaded successfully");

          addDebugInfo("Starting face detection on reference image");
          const referenceDetection = await faceapi
            .detectSingleFace(
              referenceImg,
              new faceapi.TinyFaceDetectorOptions()
            )
            .withFaceLandmarks()
            .withFaceDescriptor();

          if (referenceDetection) {
            addDebugInfo("Face detected in reference image");
            setReferenceDescriptor(referenceDetection.descriptor);
            setIsModelLoaded(true);
            setStatus("Models loaded. Ready to start camera.");
          } else {
            const errorMsg = "Error: No face detected in reference image";
            addDebugInfo(errorMsg);
            setStatus(errorMsg);
          }
        } catch (imgError) {
          const errorMsg = `Error processing reference image: ${imgError}`;
          addDebugInfo(errorMsg);
          console.error("Error processing reference image:", imgError);
          setStatus(errorMsg);
        }
      } catch (error) {
        const errorMsg = `Error loading models: ${error}`;
        addDebugInfo(errorMsg);
        console.error("Error loading models:", error);
        setStatus(errorMsg);
      }
    };

    loadModels();
  }, [users.user?.profile]);

  const loadReferenceImage = async (url: string): Promise<HTMLImageElement> => {
    addDebugInfo(`Attempting to load image from URL: ${url}`);

    return new Promise<HTMLImageElement>((resolve, reject) => {
      // Method 1: Direct image loading
      const img = new Image();
      img.crossOrigin = "anonymous";

      img.onload = () => {
        addDebugInfo("Image loaded successfully via direct method");
        resolve(img);
      };

      img.onerror = (err) => {
        addDebugInfo(`Direct image loading failed: ${err}`);
        // Try Method 2: Fetch approach
        tryFetchMethod(url, resolve, reject);
      };

      // Set a timeout to check if image is taking too long
      const timeoutId = setTimeout(() => {
        if (!img.complete) {
          addDebugInfo("Image loading timed out, trying fetch method");
          tryFetchMethod(url, resolve, reject);
        }
      }, 5000); // 5 seconds timeout

      img.src = url;

      // Clear timeout if image loads successfully
      img.onload = () => {
        clearTimeout(timeoutId);
        addDebugInfo("Image loaded successfully via direct method");
        resolve(img);
      };
    });
  };

  const tryFetchMethod = async (
    url: string,
    resolve: (img: HTMLImageElement) => void,
    reject: (err: Error) => void
  ) => {
    try {
      addDebugInfo("Attempting to load image via fetch method");

      // Try with different fetch options
      const fetchOptions = [
        { mode: "cors" },
        { mode: "no-cors" },
        { headers: { "Cache-Control": "no-cache" } },
      ] as const;

      for (const options of fetchOptions) {
        try {
          addDebugInfo(`Trying fetch with options: ${JSON.stringify(options)}`);
          const res = await fetch(url, options);

          if (!res.ok) {
            addDebugInfo(`Fetch failed with status: ${res.status}`);
            continue; // Try next option
          }

          const blob = await res.blob();
          addDebugInfo(`Fetch successful, blob size: ${blob.size}`);

          const blobUrl = URL.createObjectURL(blob);
          const img = new Image();

          img.onload = () => {
            addDebugInfo("Image loaded successfully via fetch method");
            URL.revokeObjectURL(blobUrl); // Clean up
            resolve(img);
          };

          img.onerror = (err) => {
            addDebugInfo(`Image loading from blob failed: ${err}`);
            URL.revokeObjectURL(blobUrl); // Clean up
            // Continue to next option
          };

          img.src = blobUrl;
          return; // Exit if we get here
        } catch (fetchErr) {
          addDebugInfo(`Fetch attempt failed: ${fetchErr}`);
          // Continue to next option
        }
      }

      // If all fetch attempts failed
      reject(new Error("All image loading methods failed"));
    } catch (error) {
      addDebugInfo(`Fetch method error: ${error}`);
      reject(error instanceof Error ? error : new Error(String(error)));
    }
  };

  const startCamera = async () => {
    if (!isModelLoaded) return;

    try {
      addDebugInfo("Starting camera");
      setStatus("Starting camera...");
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setStatus("Camera started. Ready to capture.");
        addDebugInfo("Camera started successfully");
      }
    } catch (error) {
      const errorMsg = `Error accessing camera: ${error}`;
      addDebugInfo(errorMsg);
      console.error("Error accessing camera:", error);
      setStatus(errorMsg);
    }
  };

  const captureAndSend = async () => {
    if (!videoRef.current || !referenceDescriptor || isProcessing) return;

    setIsProcessing(true);
    addDebugInfo("Starting capture and send process");
    setStatus("Processing image...");

    try {
      const canvas = document.createElement("canvas");
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      addDebugInfo("Image captured to canvas");

      // Detect face in the captured image
      addDebugInfo("Starting face detection on captured image");
      const detection = await faceapi
        .detectSingleFace(canvas, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        const errorMsg = "No face detected in captured image";
        addDebugInfo(errorMsg);
        setStatus(errorMsg);
        setIsProcessing(false);
        return;
      }

      addDebugInfo("Face detected in captured image");

      // Compare with reference face
      const distance = faceapi.euclideanDistance(
        detection.descriptor,
        referenceDescriptor
      );
      addDebugInfo(`Face distance calculated: ${distance}`);

      const threshold = 0.6;
      const isMatch = distance < threshold;
      const confidence = 1 - distance;
      addDebugInfo(`Face match result: ${isMatch}, confidence: ${confidence}`);

      setStatus(
        isMatch
          ? "Face recognized! Recording attendance..."
          : "Face not recognized"
      );

      // Create image blob for the captured face
      canvas.toBlob(async (blob) => {
        if (!blob) {
          const errorMsg = "Failed to create blob from canvas";
          addDebugInfo(errorMsg);
          setStatus(errorMsg);
          setIsProcessing(false);
          return;
        }

        addDebugInfo(`Blob created successfully, size: ${blob.size}`);

        const formData = new FormData();
        formData.append("file", blob, "capture.jpg");
        formData.append("userId", users.user?.id || "123");
        formData.append("success", isMatch.toString());
        formData.append("confidence", confidence.toString());
        formData.append("timestamp", new Date().toISOString());

        try {
          addDebugInfo("Sending data to server");
          const res = await fetch("/api/attendance", {
            method: "POST",
            body: formData,
          });

          const result = await res.json();
          addDebugInfo(`Server response: ${JSON.stringify(result)}`);

          if (result.success) {
            setStatus(
              `Attendance recorded! Confidence: ${(confidence * 100).toFixed(
                1
              )}%`
            );
          } else {
            setStatus(
              `Failed to record attendance: ${
                result.message || "Unknown error"
              }`
            );
          }
        } catch (error) {
          const errorMsg = `Error sending data to server: ${error}`;
          addDebugInfo(errorMsg);
          console.error("Error sending data to server:", error);
          setStatus(errorMsg);
        } finally {
          setIsProcessing(false);
        }
      }, "image/jpeg");
    } catch (error) {
      const errorMsg = `Error during face recognition: ${error}`;
      addDebugInfo(errorMsg);
      console.error("Error during face recognition:", error);
      setStatus(errorMsg);
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (isModelLoaded) startCamera();
  }, [isModelLoaded]);

  return {
    videoRef,
    captureAndSend,
    isModelLoaded,
    isProcessing,
    status,
    debugInfo
  }
};
