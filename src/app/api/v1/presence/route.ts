import { uploadFile } from "@/lib/minio";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const userId = params.get("userId");

  if (!userId) {
    return NextResponse.json(
      { error: "userId is required" },
      { status: 400 }
    );
  }

  const presence = await prisma.attendance.findMany({
    // only for this user and today
    where: {
      date: new Date().toISOString().split("T")[0],
      user: {
        id: userId,
      },
    },
    orderBy: {
      time: "desc",
    },
  });

  return NextResponse.json({
    message: "Success",
    success: true,
    data: presence,
  });
}

export interface PrepareSaveTypes {
  date: string;
  time: string;
  note: string;
  userId: string;
  type: number;
  status: number;
  permitAttachment?: string;
  permitReason?: string;
}

export async function POST(request: Request) {
  try {
    const formdata = await request.formData();
    const date = formdata.get("date") as string;
    const time = formdata.get("time") as string;
    const note = formdata.get("note") as string;
    const userId = formdata.get("userId") as string;
    const type = formdata.get("type");

    // if permitted
    const permitAttachment = formdata.get("permitAttachment") as File | null;
    const permitReason = formdata.get("permitReason") as string;

    let prepareSave: PrepareSaveTypes = {
      date: new Date().toISOString().split("T")[0],
      time: new Date().toISOString().split("T")[1],
      note,
      userId,
      type: type === "clock-in" ? 0 : 1,
      status: 1,
    };

    console.log({ prepareSave });

    if (permitAttachment) {
      const filename =
        "/permit/" +
        new Date().getTime() +
        "." +
        permitAttachment.name.split(".").pop();
      const saveBuffer = await uploadFile(filename, permitAttachment);

      prepareSave = {
        ...prepareSave,
        status: 2,
        permitAttachment: saveBuffer,
        permitReason: permitReason,
      };
    }

    await prisma.attendance.create({
      data: prepareSave,
    });

    await prisma.log.create({
      data: {
        userId: userId,
        title: permitAttachment ? "Permit Requested" : "Presence",
        action: permitAttachment
          ? "Requested a permit for presence"
          : "User " + (type === "clock-in" ? "clock-in" : "clock-out"),
      },
    });

    return NextResponse.json({
      message: permitAttachment ? "Permit requested" : "Presence recorded",
      success: true,
    });
  } catch (error) {
    console.error("Error in presence POST:", error);
    return NextResponse.json(
      { error: "Failed to record presence" },
      { status: 500 }
    );
  }
}
