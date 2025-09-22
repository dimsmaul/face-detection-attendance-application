"use client";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import React from "react";
import { useRecognition } from "./hooks/useRecognition";
import { Camera, Send, SwitchCamera } from "lucide-react";
import { cn } from "@/lib/utils";
import { z } from "zod";
import auth from "@/config/auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/useAuthStore";
import { callAlert, confirmAPIForm } from "@/components/alert";
import { presenceFormSchema } from "../validation";

export interface PresenceForm {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: z.infer<typeof presenceFormSchema> | null;
  resetForm?: () => void;
}

const PresenceForm: React.FC<PresenceForm> = (props) => {
  const { users } = useAuthStore();
  const queryClient = useQueryClient();
  const {
    videoRef,
    isModelLoaded,
    captureAndSend,
    isProcessing,
    captured,
    setCaptured,
    startCamera,
    confidence,
    setConfidence,
    stopCamera,
    status,
  } = useRecognition(props.open);

  const mutation = useMutation({
    mutationFn: (data: z.infer<typeof presenceFormSchema>) =>
      SubmitPresence(data, users.user.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["presence-condition"] });
      callAlert({
        type: "success",
        title: "Success",
        message: "Presence recorded successfully",
        onConfirm: () => {
          props.onOpenChange(false);
          props.resetForm && props.resetForm();
        },
      });
    },
  });

  const handleSend = () => {
    props.onOpenChange(false);
    confirmAPIForm({
      callAPI: () => mutation.mutate(props.data!),
      title: "Are you sure?",
      message: "You are about to submit your presence.",
      onAlertSuccess: () => {},
    });
  };

  return (
    <Dialog
      open={props.open}
      onOpenChange={(val) => {
        stopCamera();
        setConfidence(0);
        setCaptured(undefined);
        props.onOpenChange(val);
      }}
    >
      <DialogContent className="max-w-4xl">
        <DialogTitle>Presence</DialogTitle>

        <div className="flex flex-col items-center justify-centerp-4">
          {/* FIXME: this for check when error again */}
          {/* <div className="mb-4 p-4 bg-white rounded shadow-md w-full max-w-md">
            <p
              className={`text-center ${
                status.includes("Error")
                  ? "text-red-500"
                  : status.includes("recognized")
                  ? "text-green-500"
                  : "text-gray-700"
              }`}
            >
              {status}
            </p>
          </div> */}

          <div className="mb-4 p-4 bg-white rounded shadow-md w-full max-w-md">
            <p
              // className={`text-center ${
              //   status.includes("Error")
              //     ? "text-red-500"
              //     : status.includes("recognized")
              //     ? "text-green-500"
              //     : "text-gray-700"
              // }`}
              className={cn(
                "text-center font-semibold ",
                confidence * 100 < 50 ? "text-red-500" : "text-green-500"
              )}
            >
              Face Recognition Validation : {(confidence * 100).toFixed(0)}%
            </p>
          </div>

          <div
            className={cn(
              "relative mb-4 border-1 border-gray-300 rounded-lg overflow-hidden",
              confidence * 100 < 50 ? "border-red-500" : "border-green-500"
            )}
          >
            {captured ? (
              <>
                <img src={URL.createObjectURL(captured)} alt="Captured" />
              </>
            ) : (
              <video
                ref={videoRef}
                autoPlay
                controls={false}
                width={640}
                height={480}
                className="bg-gray-200"
              />
            )}
            {!isModelLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                <p className="text-white font-semibold">Loading models...</p>
              </div>
            )}
          </div>

          <div className="flex space-x-4">
            {captured ? (
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setConfidence(0);
                    setCaptured(undefined);
                    startCamera();
                  }}
                  className={cn(
                    "px-4 py-4 font-semibold flex items-center gap-2 rounded-full",
                    "bg-blue-500 hover:bg-blue-600 text-white"
                  )}
                >
                  <SwitchCamera />
                </button>

                <button
                  onClick={() => {
                    // TODO: Submit Form
                    handleSend();
                  }}
                  className={cn(
                    "px-4 py-4 font-semibold flex items-center gap-2 rounded-full justify-center",
                    "bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50"
                  )}
                  // NOTE: user cant send presence if confidence < 50%
                  disabled={confidence * 100 < 50}
                >
                  <Send />
                </button>
              </div>
            ) : (
              <button
                onClick={captureAndSend}
                disabled={!isModelLoaded || isProcessing}
                className={cn(
                  "px-4 py-4 font-semibold flex items-center gap-2 rounded-full",
                  !isModelLoaded || isProcessing
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-green-500 hover:bg-green-600 text-white"
                )}
              >
                <Camera />
                {/* {isProcessing ? "Processing..." : "Capture & Send"} */}
              </button>
            )}
          </div>
          {/* <DebugInfo /> */}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PresenceForm;

const SubmitPresence = async (
  data: z.infer<typeof presenceFormSchema>,
  userId: string
) => {
  const formData = new FormData();
  formData.append("date", data.date);
  formData.append("time", data.time);
  formData.append("note", data.note || "");
  formData.append("type", data.type);
  formData.append("userId", userId);

  const response = await auth.post("/presence", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};
