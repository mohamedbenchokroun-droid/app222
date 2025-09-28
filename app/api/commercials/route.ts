import { type NextRequest, NextResponse } from "next/server"
import { createCommercial } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name } = body

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    const commercial = await createCommercial(name.trim())

    if (!commercial) {
      return NextResponse.json({ error: "Failed to create commercial" }, { status: 500 })
    }

    return NextResponse.json(commercial)
  } catch (error) {
    console.error("Error creating commercial:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
