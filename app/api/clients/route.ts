import { type NextRequest, NextResponse } from "next/server"
import { createClientFn } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, amount, commercial_id } = body

    if (!name || !amount || !commercial_id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const client = await createClientFn({
      name,
      amount: Number(amount),
      commercial_id,
    })

    if (!client) {
      return NextResponse.json({ error: "Failed to create client" }, { status: 500 })
    }

    return NextResponse.json(client)
  } catch (error) {
    console.error("Error creating client:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
