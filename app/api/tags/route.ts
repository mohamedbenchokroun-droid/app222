import { type NextRequest, NextResponse } from "next/server"
import { createTag } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, status } = body

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    if (!status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 })
    }

    const tag = await createTag(name.trim(), status)

    if (!tag) {
      return NextResponse.json({ error: "Failed to create tag" }, { status: 500 })
    }

    return NextResponse.json(tag)
  } catch (error) {
    console.error("Error creating tag:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
