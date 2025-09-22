import { deleteFile, getFileUrl, uploadFile } from "@/lib/minio";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const id = formData.get("id") as string;
    const file = formData.get("file") as File;

    if (!id) {
      return NextResponse.json("Missing id", { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    if (!file || file.size === 0) {
      return NextResponse.json(
        { message: "No file uploaded" },
        { status: 400 }
      );
    }

    if (user.profile != null) {
      await deleteFile(user.profile);
    }

    const filename =
      "/profile/" + new Date().getTime() + "." + file.name.split(".").pop();

    const upload = await uploadFile(filename, file, file.type);

    if (!upload) {
      return NextResponse.json(
        { message: "Error uploading file" },
        { status: 500 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { profile: filename },
    });

    let { profile } = updatedUser;

    if (profile) {
      profile = await getFileUrl(profile);
    }

    return NextResponse.json(
      {
        message: "Profile photo updated successfully",
        data: { profile },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating profile photo:", error);
    return NextResponse.json(
      { message: "Error updating profile photo", error: error },
      { status: 500 }
    );
  }
}
