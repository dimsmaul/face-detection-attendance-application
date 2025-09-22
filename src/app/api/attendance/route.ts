import { NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as Blob | null;
    const success = formData.get("success") === "true";
    const confidence = parseFloat(formData.get("confidence") as string);
    const userId = formData.get("userId") as string;
    const timestamp = formData.get("timestamp") as string;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Save the captured image for records (optional)
    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = `${userId}-${Date.now()}.jpg`;
    const filepath = path.join(process.cwd(), "public", "captures", filename);
    
    try {
      await writeFile(filepath, buffer);
      console.log(`Image saved to ${filepath}`);
    } catch (error) {
      console.error("Error saving image:", error);
      // Continue even if saving fails
    }

    // Here you would typically save the attendance record to your database
    // For example:
    // await db.attendance.create({
    //   data: {
    //     userId,
    //     timestamp: new Date(timestamp),
    //     confidence,
    //     success,
    //     imagePath: filename
    //   }
    // });

    // For demonstration, we'll just log the data
    console.log({
      userId,
      timestamp,
      confidence,
      success,
      filename
    });

    return NextResponse.json({
      success: true,
      message: success ? "Attendance recorded successfully" : "Face not recognized",
      confidence,
      filename
    });
  } catch (error) {
    console.error("Error recording attendance:", error);
    return NextResponse.json({
      error: "Failed to record attendance"
    }, { status: 500 });
  }
}