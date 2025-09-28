import { createAdminClient } from "@/lib/supabase/server"
import type { Client, Commercial, Tag, Comment } from "@/lib/types"

export async function getClients(): Promise<Client[]> {
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
    console.error("Error fetching clients:", error)
    return []
  }

  return data.map((client) => ({
    ...client,
    tags: client.tags?.map((ct: any) => ct.tag) || [],
  }))
}

export async function getCommercials(): Promise<Commercial[]> {
  const supabase = createAdminClient()

  const { data, error } = await supabase.from("commercials").select("*").order("name")

  if (error) {
    console.error("Error fetching commercials:", error)
    return []
  }

  return data
}

export async function getTags(): Promise<Tag[]> {
  const supabase = createAdminClient()

  const { data, error } = await supabase.from("tags").select("*").order("name")

  if (error) {
    console.error("Error fetching tags:", error)
    return []
  }

  return data
}

export async function createClientFn(clientData: {
  name: string
  amount: number
  commercial_id: string
}): Promise<Client | null> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("clients")
    .insert({
      ...clientData,
      original_amount: clientData.amount,
      status: "new",
    })
    .select(`
      *,
      commercial:commercials(*),
      comments:comments(*, profile:profiles(*))
    `)
    .single()

  if (error) {
    console.error("Error creating client:", error)
    return null
  }

  // Add initial comment
  await supabase.from("comments").insert({
    client_id: data.id,
    text: "Prise de contact / devis envoyé",
  })

  return data
}

export async function updateClientStatus(clientId: string, status: string): Promise<boolean> {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from("clients")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", clientId)

  if (error) {
    console.error("Error updating client status:", error)
    return false
  }

  return true
}

export async function addComment(clientId: string, text: string): Promise<Comment | null> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("comments")
    .insert({
      client_id: clientId,
      text,
      created_by: null,
    })
    .select("*, profile:profiles(*)")
    .single()

  if (error) {
    console.error("Error adding comment:", error)
    return null
  }

  return data
}

export async function updateComment(commentId: string, text: string): Promise<boolean> {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from("comments")
    .update({ text, updated_at: new Date().toISOString() })
    .eq("id", commentId)

  if (error) {
    console.error("Error updating comment:", error)
    return false
  }

  return true
}

export async function createCommercial(name: string): Promise<Commercial | null> {
  const supabase = createAdminClient()

  const { data, error } = await supabase.from("commercials").insert({ name }).select().single()

  if (error) {
    console.error("Error creating commercial:", error)
    return null
  }

  return data
}

export async function createTag(name: string, status: string): Promise<Tag | null> {
  const supabase = createAdminClient()

  const { data, error } = await supabase.from("tags").insert({ name, status }).select().single()

  if (error) {
    console.error("Error creating tag:", error)
    return null
  }

  return data
}

export async function updateTag(tagId: string, name: string, status: string): Promise<boolean> {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from("tags")
    .update({ name, status, updated_at: new Date().toISOString() })
    .eq("id", tagId)

  if (error) {
    console.error("Error updating tag:", error)
    return false
  }

  return true
}

export async function applyTagToClient(clientId: string, tagId: string): Promise<boolean> {
  const supabase = createAdminClient()

  // First, get the tag to know its associated status
  const { data: tag } = await supabase.from("tags").select("status").eq("id", tagId).single()

  if (!tag) return false

  // Add the tag to the client
  const { error: tagError } = await supabase.from("client_tags").insert({ client_id: clientId, tag_id: tagId })

  if (tagError && tagError.code !== "23505") {
    // Ignore duplicate key error
    console.error("Error applying tag to client:", tagError)
    return false
  }

  // Update client status based on tag
  const { error: statusError } = await supabase
    .from("clients")
    .update({ status: tag.status, updated_at: new Date().toISOString() })
    .eq("id", clientId)

  if (statusError) {
    console.error("Error updating client status:", statusError)
    return false
  }

  return true
}

export async function updateClientDiscount(clientId: string, discountPercentage: number): Promise<boolean> {
  const supabase = createAdminClient()

  // Get current client data
  const { data: client } = await supabase.from("clients").select("original_amount").eq("id", clientId).single()

  if (!client) return false

  const newAmount = client.original_amount * (1 - discountPercentage / 100)

  const { error } = await supabase
    .from("clients")
    .update({
      amount: newAmount,
      discount_percentage: discountPercentage,
      updated_at: new Date().toISOString(),
    })
    .eq("id", clientId)

  if (error) {
    console.error("Error updating client discount:", error)
    return false
  }

  return true
}
