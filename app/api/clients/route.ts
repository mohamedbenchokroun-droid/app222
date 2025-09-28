import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from("clients")
      .select(`
        *,
        commercial:commercials(*),
        comments:comments(*, profile:profiles(*)),
        tags:client_tags(tag:tags(*))
      `)
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const clients = data.map((client) => ({
      ...client,
      tags: client.tags?.map((ct: any) => ct.tag) || [],
    }))

    return NextResponse.json(clients)
  } catch (error) {
    console.error("Error fetching clients:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()

    const { name, amount, commercial_id } = await request.json()

    if (!name || !amount || !commercial_id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("clients")
      .insert({
        name,
        amount: Number.parseFloat(amount),
        original_amount: Number.parseFloat(amount),
        commercial_id,
        status: "new",
      })
      .select(`
        *,
        commercial:commercials(*),
        comments:comments(*, profile:profiles(*))
      `)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Add initial comment
    await supabase.from("comments").insert({
      client_id: data.id,
      text: "Prise de contact / devis envoyé",
    })

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error creating client:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
