export interface Profile {
  id: string
  email: string
  full_name: string
  role: "admin" | "commercial"
  created_at: string
  updated_at: string
}

export interface Commercial {
  id: string
  name: string
  user_id?: string
  created_at: string
  updated_at: string
}

export interface Tag {
  id: string
  name: string
  status: "new" | "contact" | "proposal" | "negotiation" | "validation" | "won" | "lost"
  created_at: string
  updated_at: string
}

export interface Client {
  id: string
  name: string
  amount: number
  original_amount: number
  discount_percentage: number
  status: "new" | "contact" | "proposal" | "negotiation" | "validation" | "won" | "lost"
  commercial_id: string
  created_by: string
  collapsed: boolean
  created_at: string
  updated_at: string
  commercial?: Commercial
  comments?: Comment[]
  tags?: Tag[]
}

export interface Comment {
  id: string
  client_id: string
  text: string
  created_by: string
  created_at: string
  updated_at: string
  profile?: Profile
}

export type ClientStatus = "new" | "contact" | "proposal" | "negotiation" | "validation" | "won" | "lost"

export const STATUS_LABELS: Record<ClientStatus, string> = {
  new: "Nouveau",
  contact: "Contacté",
  proposal: "Proposition envoyée",
  negotiation: "En négociation",
  validation: "Validation physique",
  won: "Gagné",
  lost: "Perdu",
}

export const STATUS_COLORS: Record<ClientStatus, string> = {
  new: "bg-green-100 text-green-800",
  contact: "bg-blue-100 text-blue-800",
  proposal: "bg-yellow-100 text-yellow-800",
  negotiation: "bg-red-100 text-red-800",
  validation: "bg-cyan-100 text-cyan-800",
  won: "bg-green-600 text-white",
  lost: "bg-gray-600 text-white",
}
