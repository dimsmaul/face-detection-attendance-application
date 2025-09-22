import { useAuthStore } from "@/store/useAuthStore";
import { useRef, useState, useEffect } from "react";
import * as faceapi from "face-api.js";

export const useRecognition = (open: boolean) => {
  const { users } = useAuthStore();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [status, setStatus] = useState("Loading models...");
  const [isProcessing, setIsProcessing] = useState(false);
  const [referenceDescriptor, setReferenceDescriptor] =
    useState<Float32Array | null>(null);

  // when captured, camera stop and show image capture
  const [captured, setCaptured] = useState<File>();

  // confidence
  const [confidence, setConfidence] = useState<number>(0);

  // Load face-api.js models
  useEffect(() => {
    const loadModels = async () => {
      try {
        setStatus("Loading models...");
        const MODEL_URL = "/models";
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);

        // Check if user profile exists
        if (!users.user?.profile) {
          const errorMsg = "Error: No reference image found in user profile";
          setStatus(errorMsg);
          return;
        }

        // Load reference image and compute descriptor
        setStatus("Loading reference image...");

        try {
          const referenceImg = await loadReferenceImage(users.user.profile);
          const referenceDetection = await faceapi
            .detectSingleFace(
              referenceImg,
              new faceapi.TinyFaceDetectorOptions()
            )
            .withFaceLandmarks()
            .withFaceDescriptor();

          if (referenceDetection) {
            setReferenceDescriptor(referenceDetection.descriptor);
            setIsModelLoaded(true);
            setStatus("Models loaded. Ready to start camera.");
          } else {
            const errorMsg = "Error: No face detected in reference image";
            setStatus(errorMsg);
          }
        } catch (imgError) {
          const errorMsg = `Error processing reference image: ${imgError}`;
          console.error("Error processing reference image:", imgError);
          setStatus(errorMsg);
        }
      } catch (error) {
        const errorMsg = `Error loading models: ${error}`;
        console.error("Error loading models:", error);
        setStatus(errorMsg);
      }
    };

    loadModels();
  }, [users.user?.profile]);

  const loadReferenceImage = async (url: string): Promise<HTMLImageElement> => {
    return new Promise<HTMLImageElement>((resolve, reject) => {
      // Method 1: Direct image loading
      const img = new Image();
      img.crossOrigin = "anonymous";

      img.onload = () => {
        resolve(img);
      };

      img.onerror = (err) => {
        // Try Method 2: Fetch approach
        tryFetchMethod(url, resolve, reject);
      };

      // Set a timeout to check if image is taking too long
      const timeoutId = setTimeout(() => {
        if (!img.complete) {
          tryFetchMethod(url, resolve, reject);
        }
      }, 5000); // 5 seconds timeout

      img.src = url;

      // Clear timeout if image loads successfully
      img.onload = () => {
        clearTimeout(timeoutId);
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
      // Try with different fetch options
      // TODO: Need to be test
      // const fetchOptions = [
      //   { mode: "cors" },
      //   { mode: "no-cors" },
      //   { headers: { "Cache-Control": "no-cache" } },
      // ];

      // for (const options of fetchOptions) {
      try {
        const res = await fetch(url, {
          mode: "no-cors",
          headers: { "Cache-Control": "no-cache" },
        });

        if (!res.ok) {
          // continue; // Try next option
        }

        const blob = await res.blob();

        const blobUrl = URL.createObjectURL(blob);
        const img = new Image();

        img.onload = () => {
          URL.revokeObjectURL(blobUrl); // Clean up
          resolve(img);
        };

        img.onerror = (err) => {
          URL.revokeObjectURL(blobUrl); // Clean up
          // Continue to next option
        };

        img.src = blobUrl;
        return; // Exit if we get here
      } catch (fetchErr) {
        // Continue to next option
      }
      // }

      // If all fetch attempts failed
      reject(new Error("All image loading methods failed"));
    } catch (error) {
      reject(error instanceof Error ? error : new Error(String(error)));
    }
  };

  const startCamera = async () => {
    if (!isModelLoaded) return;

    try {
      setStatus("Starting camera...");
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setStatus("Camera started. Ready to capture.");
      }
    } catch (error) {
      const errorMsg = `Error accessing camera: ${error}`;
      console.error("Error accessing camera:", error);
      setStatus(errorMsg);
    }
  };

  const captureAndSend = async () => {
    if (!videoRef.current || !referenceDescriptor || isProcessing) return;

    setIsProcessing(true);
    setStatus("Processing image...");

    try {
      const canvas = document.createElement("canvas");
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

      // Convert canvas to blob and save in captured state
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `capture_${Date.now()}.jpg`, {
            type: "image/jpeg",
          });
          setCaptured(file);
        }
      }, "image/jpeg");

      stopCamera();

      setStatus("Detecting face...");
      // ===

      // Detect face in the captured image
      const detection = await faceapi
        .detectSingleFace(canvas, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        const errorMsg = "No face detected in captured image";
        setStatus(errorMsg);
        setIsProcessing(false);
        return;
      }

      // Compare with reference face
      const distance = faceapi.euclideanDistance(
        detection.descriptor,
        referenceDescriptor
      );

      const threshold = 0.6;
      const isMatch = distance < threshold;
      const confidence = 1 - distance;

      setStatus(
        isMatch
          ? "Face recognized! Recording attendance..."
          : "Face not recognized"
      );

      // Create image blob for the captured face
      canvas.toBlob(async (blob) => {
        if (!blob) {
          const errorMsg = "Failed to create blob from canvas";
          setStatus(errorMsg);
          setIsProcessing(false);
          return;
        }

        setConfidence(confidence);
        setIsProcessing(false);

        // const formData = new FormData();
        // formData.append("file", blob, "capture.jpg");
        // formData.append("userId", users.user?.id || "123");
        // formData.append("success", isMatch.toString());
        // formData.append("confidence", confidence.toString());
        // formData.append("timestamp", new Date().toISOString());

        // try {
        //   const res = await fetch("/api/attendance", {
        //     method: "POST",
        //     body: formData,
        //   });

        //   const result = await res.json();

        //   if (result.success) {
        //     setStatus(
        //       `Attendance recorded! Confidence: ${(confidence * 100).toFixed(
        //         1
        //       )}%`
        //     );
        //   } else {
        //     setStatus(
        //       `Failed to record attendance: ${
        //         result.message || "Unknown error"
        //       }`
        //     );
        //   }
        // } catch (error) {
        //   const errorMsg = `Error sending data to server: ${error}`;
        //   console.error("Error sending data to server:", error);
        //   setStatus(errorMsg);
        // } finally {
        //   setIsProcessing(false);
        // }
      }, "image/jpeg");
    } catch (error) {
      const errorMsg = `Error during face recognition: ${error}`;
      console.error("Error during face recognition:", error);
      setStatus(errorMsg);
      setIsProcessing(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      (videoRef.current.srcObject as MediaStream)
        .getTracks()
        .forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      setStatus("Camera stopped.");
      setIsProcessing(false);
      setCaptured(undefined);
    }
  };

  useEffect(() => {
    if (isModelLoaded && open) startCamera();
  }, [isModelLoaded, open]);

  return {
    videoRef,
    captureAndSend,
    isModelLoaded,
    isProcessing,
    status,
    captured,
    setCaptured,
    startCamera,
    stopCamera,
    confidence,
    setConfidence,
  };
};
