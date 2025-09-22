import { getFileUrl } from "@/lib/minio";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return new Response("Missing id", { status: 400 });
    }
    let data = await prisma.user.findFirstOrThrow({
      where: { id },
    });

    // let { password, deletedAt, ...rest } = data;

    if (!data) {
      return NextResponse.json("Profile not found", { status: 404 });
    }

    if (data.profile != null) {
      const profile = await getFileUrl(data.profile);
      data = {
        ...data,
        profile: profile,
      };
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, deletedAt, ...rest } = data;

    return NextResponse.json(
      {
        message: "Profile fetched successfully",
        data: rest,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { message: "Error fetching profile", error: error },
      { status: 500 }
    );
  }
}
