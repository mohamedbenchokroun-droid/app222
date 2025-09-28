// Mock database functions without Supabase authentication
import type { Client, Commercial, Tag, Comment } from "@/lib/types"

// Mock data storage (in a real app, this would be a database)
const mockClients: Client[] = [
  {
    id: "1",
    name: "Entreprise ABC",
    amount: 15000,
    original_amount: 15000,
    status: "proposal",
    commercial_id: "1",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    comments: [
      {
        id: "1",
        client_id: "1",
        text: "Premier contact établi, devis envoyé",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: "user1",
        profile: { full_name: "Commercial" },
      },
    ],
    tags: [],
  },
  {
    id: "2",
    name: "Société XYZ",
    amount: 25000,
    original_amount: 25000,
    status: "negotiation",
    commercial_id: "2",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    comments: [],
    tags: [],
  },
]

const mockCommercials: Commercial[] = [
  {
    id: "1",
    name: "Jean Dupont",
    created_at: new Date().toISOString(),
  },
  {
    id: "2",
    name: "Marie Martin",
    created_at: new Date().toISOString(),
  },
]

const mockTags: Tag[] = [
  {
    id: "1",
    name: "Priorité haute",
    status: "proposal",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "2",
    name: "Client fidèle",
    status: "won",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

export async function getClients(): Promise<Client[]> {
  // Add commercial data to clients
  return mockClients.map((client) => ({
    ...client,
    commercial: mockCommercials.find((c) => c.id === client.commercial_id),
  }))
}

export async function getCommercials(): Promise<Commercial[]> {
  return mockCommercials
}

export async function getTags(): Promise<Tag[]> {
  return mockTags
}

export async function createClientFn(clientData: {
  name: string
  amount: number
  commercial_id: string
}): Promise<Client | null> {
  const newClient: Client = {
    id: Date.now().toString(),
    ...clientData,
    original_amount: clientData.amount,
    status: "new",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    comments: [
      {
        id: Date.now().toString(),
        client_id: Date.now().toString(),
        text: "Prise de contact / devis envoyé",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: "user1",
        profile: { full_name: "Commercial" },
      },
    ],
    tags: [],
  }

  mockClients.unshift(newClient)
  return {
    ...newClient,
    commercial: mockCommercials.find((c) => c.id === newClient.commercial_id),
  }
}

export async function updateClientStatus(clientId: string, status: string): Promise<boolean> {
  const clientIndex = mockClients.findIndex((c) => c.id === clientId)
  if (clientIndex === -1) return false

  mockClients[clientIndex] = {
    ...mockClients[clientIndex],
    status: status as Client["status"],
    updated_at: new Date().toISOString(),
  }
  return true
}

export async function addComment(clientId: string, text: string): Promise<Comment | null> {
  const newComment: Comment = {
    id: Date.now().toString(),
    client_id: clientId,
    text,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: "user1",
    profile: { full_name: "Commercial" },
  }

  const clientIndex = mockClients.findIndex((c) => c.id === clientId)
  if (clientIndex !== -1) {
    if (!mockClients[clientIndex].comments) {
      mockClients[clientIndex].comments = []
    }
    mockClients[clientIndex].comments!.push(newComment)
  }

  return newComment
}

export async function updateComment(commentId: string, text: string): Promise<boolean> {
  for (const client of mockClients) {
    if (client.comments) {
      const commentIndex = client.comments.findIndex((c) => c.id === commentId)
      if (commentIndex !== -1) {
        client.comments[commentIndex] = {
          ...client.comments[commentIndex],
          text,
          updated_at: new Date().toISOString(),
        }
        return true
      }
    }
  }
  return false
}

export async function createCommercial(name: string): Promise<Commercial | null> {
  const newCommercial: Commercial = {
    id: Date.now().toString(),
    name,
    created_at: new Date().toISOString(),
  }

  mockCommercials.push(newCommercial)
  return newCommercial
}

export async function createTag(name: string, status: string): Promise<Tag | null> {
  const newTag: Tag = {
    id: Date.now().toString(),
    name,
    status: status as Tag["status"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  mockTags.push(newTag)
  return newTag
}

export async function updateTag(tagId: string, name: string, status: string): Promise<boolean> {
  const tagIndex = mockTags.findIndex((t) => t.id === tagId)
  if (tagIndex === -1) return false

  mockTags[tagIndex] = {
    ...mockTags[tagIndex],
    name,
    status: status as Tag["status"],
    updated_at: new Date().toISOString(),
  }
  return true
}

export async function applyTagToClient(clientId: string, tagId: string): Promise<boolean> {
  const clientIndex = mockClients.findIndex((c) => c.id === clientId)
  const tag = mockTags.find((t) => t.id === tagId)

  if (clientIndex === -1 || !tag) return false

  // Add tag to client if not already present
  if (!mockClients[clientIndex].tags) {
    mockClients[clientIndex].tags = []
  }

  const hasTag = mockClients[clientIndex].tags!.some((t) => t.id === tagId)
  if (!hasTag) {
    mockClients[clientIndex].tags!.push(tag)
  }

  // Update client status based on tag
  mockClients[clientIndex].status = tag.status
  mockClients[clientIndex].updated_at = new Date().toISOString()

  return true
}

export async function updateClientDiscount(clientId: string, discountPercentage: number): Promise<boolean> {
  const clientIndex = mockClients.findIndex((c) => c.id === clientId)
  if (clientIndex === -1) return false

  const client = mockClients[clientIndex]
  const discountedAmount = client.original_amount * (1 - discountPercentage / 100)

  mockClients[clientIndex] = {
    ...client,
    amount: discountedAmount,
    discount_percentage: discountPercentage,
    updated_at: new Date().toISOString(),
  }

  return true
}
