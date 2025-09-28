import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()

    const { name, status } = await request.json()

    if (!name || !status) {
      return NextResponse.json({ error: "Name and status are required" }, { status: 400 })
    }

    const { data, error } = await supabase.from("tags").insert({ name, status }).select().single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error creating tag:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
