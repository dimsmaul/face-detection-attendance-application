"use client";

import { callAlert, confirmAPIForm } from "@/components/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import auth from "@/config/auth";
import { useAuthStore } from "@/store/useAuthStore";
import { useMutation, useQuery } from "@tanstack/react-query";
import React from "react";

export default function Profile() {
  const { users, setUsers } = useAuthStore();
  const photoRef = React.useRef<HTMLInputElement>(null);
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["profile", users?.user?.id],
    queryFn: () => getProfile(users?.user?.id),
    enabled: !!users?.user?.id,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const mutationPhoto = useMutation({
    mutationFn: (file: File) => uploadPhotoProfile(users?.user?.id || "", file),
    onSuccess: (data) => {
      console.log("Photo uploaded successfully:", data.data.profile);
      setUsers({
        ...users,
        user: {
          ...users.user,
          profile: data.data.profile,
        },
      });
      callAlert({
        type: "success",
        title: "Success",
        message: "Photo uploaded successfully",
        onConfirm() {
          refetch();
          photoRef.current!.value = "";
        },
      });
    },
  });

  const handleUpdatePhotoProfile = (photo: File) => {
    confirmAPIForm({
      callAPI: () => mutationPhoto.mutate(photo as File),
      title: "Update Photo Profile",
      message: "Are you sure want to update your photo profile?",
      onAlertSuccess: () => {},
    });
  };

  return (
    <div>
      <Card>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 items-center">
            <div className="col-span-2 flex justify-center items-center">
              <img
                onClick={() => photoRef.current?.click()}
                src={data?.data?.profile || ""}
                alt=""
                className="size-32 rounded-full object-cover hover:opacity-90 transition-all duration-300"
              />
            </div>
            <h1 className="col-span-2 text-center">Personal Data</h1>
          </div>
        </CardContent>
      </Card>
      <input
        type="file"
        className="hidden"
        ref={photoRef}
        accept="image/*"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            // setPhoto(e.target.files[0]);
            handleUpdatePhotoProfile(e.target.files[0]);
          }
        }}
      />
    </div>
  );
}

const getProfile = async (id: string) => {
  const response = await auth.get("/profile", {
    params: { id: id },
  });
  return response.data;
};

const uploadPhotoProfile = async (id: string, file: File) => {
  const formData = new FormData();
  formData.append("id", id);
  formData.append("file", file);

  const response = await auth.post("/profile/photo", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};
