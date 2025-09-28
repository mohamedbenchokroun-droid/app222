export interface Client {
  id: string
  name: string
  amount: number
  original_amount: number
  status: "new" | "contact" | "proposal" | "negotiation" | "validation" | "won" | "lost"
  commercial_id: string
  created_at: string
  updated_at: string
  comments?: Comment[]
  tags?: Tag[]
  commercial?: Commercial
  discount_percentage?: number
}

export interface Commercial {
  id: string
  name: string
  created_at: string
}

export interface Tag {
  id: string
  name: string
  status: "new" | "contact" | "proposal" | "negotiation" | "validation" | "won" | "lost"
  created_at: string
  updated_at: string
}

export interface Comment {
  id: string
  client_id?: string
  text: string
  date: string // Changed from created_at to date for consistency with HTML version
  created_at?: string
  updated_at?: string
  created_by?: string
  profile?: {
    full_name: string
  }
}

export interface QuickComment {
  text: string
  status: string
}

export interface EmailForm {
  to: string
  subject: string
  body: string
}

export interface DiscountInfo {
  original: number
  discounted: number
  discountPercentage: number
}
