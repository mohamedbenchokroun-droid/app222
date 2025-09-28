import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = createAdminClient()

    const { tag_id } = await request.json()

    if (!tag_id) {
      return NextResponse.json({ error: "Tag ID is required" }, { status: 400 })
    }

    // Get the tag to know its associated status
    const { data: tag } = await supabase.from("tags").select("status").eq("id", tag_id).single()

    if (!tag) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 })
    }

    // Add the tag to the client
    const { error: tagError } = await supabase.from("client_tags").insert({ client_id: id, tag_id: tag_id })

    if (tagError && tagError.code !== "23505") {
      // Ignore duplicate key error
      return NextResponse.json({ error: tagError.message }, { status: 500 })
    }

    // Update client status based on tag
    const { error: statusError } = await supabase
      .from("clients")
      .update({
        status: tag.status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)

    if (statusError) {
      return NextResponse.json({ error: statusError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error applying tag to client:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
