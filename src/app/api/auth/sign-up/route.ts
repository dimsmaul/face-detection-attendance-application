import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const { email, password, name } = await request.json();

    const salt = bcrypt.genSaltSync(10);
    const hash = await bcrypt.hash(password, salt);

    await prisma.user.create({
      data: {
        email,
        password: hash,
        name,
      },
    });

    return NextResponse.json({
      message: "User created successfully",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
