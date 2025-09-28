import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = createAdminClient()

    const { discount_percentage } = await request.json()

    if (discount_percentage === undefined) {
      return NextResponse.json({ error: "Discount percentage is required" }, { status: 400 })
    }

    // Get current client data
    const { data: client } = await supabase.from("clients").select("original_amount").eq("id", id).single()

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    const newAmount = client.original_amount * (1 - discount_percentage / 100)

    const { error } = await supabase
      .from("clients")
      .update({
        amount: newAmount,
        discount_percentage: discount_percentage,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating client discount:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
