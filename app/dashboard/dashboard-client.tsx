"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Plus,
  Search,
  Users,
  Target,
  TrendingUp,
  DollarSign,
  ChevronDown,
  ChevronRight,
  Edit2,
  Mail,
  Download,
  Filter,
  X,
  Settings,
  TagIcon,
  Trash2,
  Save,
  AlertTriangle,
} from "lucide-react"
import type { Client, Commercial, Tag } from "@/lib/types"
import { calculateStats, calculateCommercialStats } from "@/lib/utils"

interface DashboardClientProps {
  initialClients: Client[]
  initialCommercials: Commercial[]
  initialTags: Tag[]
}

interface Comment {
  id: string
  text: string
  date: string
}

interface ExtendedClient extends Client {
  comments: Comment[]
  collapsed?: boolean
  discountPercentage?: number
  tags?: Tag[] // Added tags to ExtendedClient
}

const STATUS_COLORS: { [key: string]: string } = {
  new: "bg-blue-100 text-blue-800",
  contact: "bg-gray-100 text-gray-800",
  proposal: "bg-yellow-100 text-yellow-800",
  negotiation: "bg-cyan-100 text-cyan-800",
  validation: "bg-orange-100 text-orange-800",
  won: "bg-green-100 text-green-800",
  lost: "bg-red-100 text-red-800",
}

const EMAIL_COLORS: { [key: string]: string } = {
  new: "#3B82F6", // Blue
  contact: "#6B7280", // Gray
  proposal: "#F59E0B", // Yellow
  negotiation: "#06B6D4", // Cyan/Turquoise
  validation: "#F97316", // Orange
  won: "#10B981", // Green
  lost: "#EF4444", // Red
}

const STATUS_LABELS: { [key: string]: string } = {
  new: "Nouveau",
  contact: "Contacté",
  proposal: "Proposition envoyée",
  negotiation: "En négociation",
  validation: "Validation physique",
  won: "Gagné",
  lost: "Perdu",
}

const QUICK_COMMENTS = [
  { text: "Appelé, en cours", status: "contact" },
  { text: "Ne répond pas", status: "contact" },
  { text: "Demande échantillon / BAT", status: "validation" },
  { text: "Rappel programmé", status: "contact" },
  { text: "Remise accordée", status: "negotiation" },
]

const LOST_REASONS = ["Trop cher", "Produit non conforme", "Qualité médiocre", "Non disponibilité du produit", "Autre"]

const DEFAULT_STATUSES = [
  { id: "new", label: "Nouveau", color: "blue" },
  { id: "contact", label: "Contacté", color: "gray" },
  { id: "proposal", label: "Proposition envoyée", color: "yellow" },
  { id: "negotiation", label: "En négociation", color: "cyan" },
  { id: "validation", label: "Validation physique", color: "orange" },
  { id: "won", label: "Gagné", color: "green" },
  { id: "lost", label: "Perdu", color: "red" },
]

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function DashboardClient({ initialClients, initialCommercials, initialTags }: DashboardClientProps) {
  const [clients, setClients] = useState<ExtendedClient[]>(() =>
    initialClients.map((client) => ({
      ...client,
      comments: client.comments || [
        {
          id: Date.now().toString(),
          text: "Prise de contact / devis envoyé",
          date: new Date().toISOString(),
        },
      ],
      collapsed: false,
      discountPercentage: 0,
      tags: client.tags || [], // Initialize tags
    })),
  )
  const [commercials, setCommercials] = useState(initialCommercials)
  const [tags, setTags] = useState(initialTags)

  const [customStatuses, setCustomStatuses] = useState(DEFAULT_STATUSES)

  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [commercialFilter, setCommercialFilter] = useState("all")

  const [minAmount, setMinAmount] = useState("")
  const [maxAmount, setMaxAmount] = useState("")

  const [tableFilters, setTableFilters] = useState({
    client: "",
    commercial: "",
    amount: "",
    status: "",
    comment: "",
    date: "",
  })

  const [currentView, setCurrentView] = useState<"cards" | "table">("cards")
  const [expandedComments, setExpandedComments] = useState<{ [key: string]: boolean }>({})

  // Form states
  const [showClientForm, setShowClientForm] = useState(false)
  const [showCommercialForm, setShowCommercialForm] = useState(false)
  const [showTagForm, setShowTagForm] = useState(false)

  const [showStatusForm, setShowStatusForm] = useState(false)
  const [showManageModal, setShowManageModal] = useState(false)

  const [showCommentModal, setShowCommentModal] = useState(false)
  const [showLostReasonModal, setShowLostReasonModal] = useState(false)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [showDiscountModal, setShowDiscountModal] = useState(false)

  const [editingClient, setEditingClient] = useState<string | null>(null)
  const [editingComment, setEditingComment] = useState<{ clientId: string; commentId: string } | null>(null)
  const [editValues, setEditValues] = useState<{ [key: string]: any }>({})

  const [newClient, setNewClient] = useState({ name: "", amount: "", commercial_id: "" })
  const [newCommercial, setNewCommercial] = useState("")
  const [newTag, setNewTag] = useState({ name: "", status: "new" })

  const [newStatus, setNewStatus] = useState({ label: "", color: "blue" })

  const [customComment, setCustomComment] = useState("")
  const [currentClientId, setCurrentClientId] = useState<string | null>(null)
  const [lostReason, setLostReason] = useState("")
  const [otherReason, setOtherReason] = useState("")
  const [discountAmount, setDiscountAmount] = useState("")
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage")

  // Email form
  const [emailForm, setEmailForm] = useState({
    to: "directeur@entreprise.com",
    subject: "Rapport d'activité commerciale",
    body: "",
  })

  const stats = calculateStats(clients)
  const commercialStats = calculateCommercialStats(clients, commercials)

  const isTagUsed = (tagId: string) => {
    return clients.some((client) => client.tags?.some((tag) => tag.id === tagId))
  }

  const isStatusUsed = (statusId: string) => {
    return clients.some((client) => client.status === statusId)
  }

  const isCommercialUsed = (commercialId: string) => {
    return clients.some((client) => client.commercial_id === commercialId)
  }

  const handleDeleteTag = (tagId: string) => {
    if (isTagUsed(tagId)) {
      alert("Cette étiquette ne peut pas être supprimée car elle est utilisée dans des fiches clients.")
      return
    }
    setTags((prev) => prev.filter((tag) => tag.id !== tagId))
  }

  const handleDeleteStatus = (statusId: string) => {
    if (isStatusUsed(statusId)) {
      alert("Ce statut ne peut pas être supprimé car il est utilisé dans des fiches clients.")
      return
    }
    setCustomStatuses((prev) => prev.filter((status) => status.id !== statusId))
  }

  const handleDeleteCommercial = (commercialId: string) => {
    if (isCommercialUsed(commercialId)) {
      alert("Ce commercial ne peut pas être supprimé car il est assigné à des fiches clients.")
      return
    }
    setCommercials((prev) => prev.filter((commercial) => commercial.id !== commercialId))
  }

  const startEditingClient = (clientId: string) => {
    const client = clients.find((c) => c.id === clientId)
    if (client) {
      setEditingClient(clientId)
      setEditValues({
        name: client.name,
        amount: client.amount.toString(),
        commercial_id: client.commercial_id,
        status: client.status,
      })
    }
  }

  const saveClientEdit = (clientId: string) => {
    setClients((prev) =>
      prev.map((client) =>
        client.id === clientId
          ? {
              ...client,
              name: editValues.name,
              amount: Number.parseFloat(editValues.amount),
              commercial_id: editValues.commercial_id,
              status: editValues.status,
              updated_at: new Date().toISOString(),
            }
          : client,
      ),
    )
    setEditingClient(null)
    setEditValues({})
  }

  const cancelClientEdit = () => {
    setEditingClient(null)
    setEditValues({})
  }

  const startEditingComment = (clientId: string, commentId: string) => {
    const client = clients.find((c) => c.id === clientId)
    const comment = client?.comments.find((c) => c.id === commentId)
    if (comment) {
      setEditingComment({ clientId, commentId })
      setEditValues({ commentText: comment.text })
    }
  }

  const saveCommentEdit = () => {
    if (!editingComment) return

    setClients((prev) =>
      prev.map((client) =>
        client.id === editingComment.clientId
          ? {
              ...client,
              comments: client.comments.map((comment) =>
                comment.id === editingComment.commentId ? { ...comment, text: editValues.commentText } : comment,
              ),
            }
          : client,
      ),
    )
    setEditingComment(null)
    setEditValues({})
  }

  const cancelCommentEdit = () => {
    setEditingComment(null)
    setEditValues({})
  }

  // Calculate discounted amounts
  const calculateDiscountedAmount = (client: ExtendedClient) => {
    let discountedAmount = client.amount
    const originalAmount = client.original_amount || client.amount
    let totalDiscountPercentage = 0

    client.comments.forEach((comment) => {
      if (comment.text.includes("Remise accordée:")) {
        if (comment.text.includes("%")) {
          const match = comment.text.match(/(\d+(?:\.\d+)?)%/)
          if (match) {
            totalDiscountPercentage += Number.parseFloat(match[1])
          }
        } else if (comment.text.includes("MAD")) {
          const match = comment.text.match(/(\d+(?:\.\d+)?)\s*MAD/)
          if (match) {
            discountedAmount -= Number.parseFloat(match[1])
          }
        }
      }
    })

    if (totalDiscountPercentage > 0) {
      discountedAmount = originalAmount * (1 - totalDiscountPercentage / 100)
    }

    return {
      original: originalAmount,
      discounted: discountedAmount,
      discountPercentage: totalDiscountPercentage,
    }
  }

  const filteredClients = clients.filter((client) => {
    const amounts = calculateDiscountedAmount(client)
    const commercial = commercials.find((c) => c.id === client.commercial_id)
    const lastComment = client.comments.length > 0 ? client.comments[0].text : ""

    const matchesSearch =
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.comments?.some((comment) => comment.text.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && client.status !== "won" && client.status !== "lost") ||
      (statusFilter === "won" && client.status === "won") ||
      (statusFilter === "lost" && client.status === "lost") ||
      client.status === statusFilter

    const matchesCommercial = commercialFilter === "all" || client.commercial_id === commercialFilter

    const matchesAmountRange =
      (!minAmount || amounts.discounted >= Number.parseFloat(minAmount)) &&
      (!maxAmount || amounts.discounted <= Number.parseFloat(maxAmount))

    // Table-specific filters
    const matchesTableFilters =
      currentView === "cards" ||
      (client.name.toLowerCase().includes(tableFilters.client.toLowerCase()) &&
        (commercial?.name || "").toLowerCase().includes(tableFilters.commercial.toLowerCase()) &&
        amounts.discounted.toString().includes(tableFilters.amount) &&
        STATUS_LABELS[client.status].toLowerCase().includes(tableFilters.status.toLowerCase()) &&
        lastComment.toLowerCase().includes(tableFilters.comment.toLowerCase()) &&
        formatDate(client.created_at).toLowerCase().includes(tableFilters.date.toLowerCase()))

    return matchesSearch && matchesStatus && matchesCommercial && matchesAmountRange && matchesTableFilters
  })

  const handleAddTag = () => {
    if (newTag.name.trim()) {
      const newTagObj: Tag = {
        id: Date.now().toString(),
        name: newTag.name.trim(),
        status: newTag.status as any,
        created_at: new Date().toISOString(),
      }
      setTags((prev) => [...prev, newTagObj])
      setNewTag({ name: "", status: "new" })
      setShowTagForm(false)
    }
  }

  const handleAddStatus = () => {
    if (newStatus.label.trim()) {
      const statusId = newStatus.label.toLowerCase().replace(/\s+/g, "_")
      const newStatusObj = {
        id: statusId,
        label: newStatus.label.trim(),
        color: newStatus.color,
      }
      setCustomStatuses((prev) => [...prev, newStatusObj])

      // Update STATUS_COLORS and STATUS_LABELS
      STATUS_COLORS[statusId] = `bg-${newStatus.color}-100 text-${newStatus.color}-800`
      STATUS_LABELS[statusId] = newStatus.label.trim()
      EMAIL_COLORS[statusId] = getColorHex(newStatus.color)

      setNewStatus({ label: "", color: "blue" })
      setShowStatusForm(false)
    }
  }

  const getColorHex = (color: string): string => {
    const colorMap: { [key: string]: string } = {
      blue: "#3B82F6",
      gray: "#6B7280",
      yellow: "#F59E0B",
      cyan: "#06B6D4",
      orange: "#F97316",
      green: "#10B981",
      red: "#EF4444",
      purple: "#8B5CF6",
      pink: "#EC4899",
      indigo: "#6366F1",
    }
    return colorMap[color] || "#3B82F6"
  }

  const handleAddComment = (clientId: string, commentText: string, newStatus?: string) => {
    setClients((prev) =>
      prev.map((client) => {
        if (client.id === clientId) {
          const updatedClient = {
            ...client,
            comments: [
              { id: Date.now().toString(), text: commentText, date: new Date().toISOString() },
              ...client.comments,
            ],
          }
          if (newStatus) {
            updatedClient.status = newStatus as any
          }
          return updatedClient
        }
        return client
      }),
    )
  }

  const handleStatusChange = (clientId: string, newStatus: string, reason?: string) => {
    setClients((prev) =>
      prev.map((client) => {
        if (client.id === clientId) {
          const updatedClient = { ...client, status: newStatus as any }
          if (reason) {
            updatedClient.comments = [
              { id: Date.now().toString(), text: `Affaire perdue: ${reason}`, date: new Date().toISOString() },
              ...client.comments,
            ]
          }
          return updatedClient
        }
        return client
      }),
    )
  }

  const handleAddDiscount = () => {
    if (!currentClientId || !discountAmount) return

    const discountText =
      discountType === "percentage" ? `Remise accordée: ${discountAmount}%` : `Remise accordée: ${discountAmount} MAD`

    handleAddComment(currentClientId, discountText, "negotiation")
    setShowDiscountModal(false)
    setDiscountAmount("")
    setCurrentClientId(null)
  }

  const toggleClientCard = (clientId: string) => {
    setClients((prev) =>
      prev.map((client) => (client.id === clientId ? { ...client, collapsed: !client.collapsed } : client)),
    )
  }

  const expandAllCards = () => {
    setClients((prev) => prev.map((client) => ({ ...client, collapsed: false })))
  }

  const collapseAllCards = () => {
    setClients((prev) => prev.map((client) => ({ ...client, collapsed: true })))
  }

  const addTagToClient = (clientId: string, tagId: string) => {
    const tag = tags.find((t) => t.id === tagId)
    if (!tag) return

    setClients((prev) =>
      prev.map((client) => {
        if (client.id === clientId) {
          const existingTags = client.tags || []
          const tagExists = existingTags.some((t) => t.id === tagId)
          if (!tagExists) {
            return { ...client, tags: [...existingTags, tag] }
          }
        }
        return client
      }),
    )
  }

  const exportToExcel = () => {
    let csvContent = "Client,Commercial,Montant HT (MAD),Statut,Dernier commentaire,Date création\\n"

    clients.forEach((client) => {
      const commercial = commercials.find((c) => c.id === client.commercial_id)
      const amounts = calculateDiscountedAmount(client)
      const lastComment = client.comments.length > 0 ? client.comments[0].text : ""

      csvContent += `"${client.name}","${commercial?.name || "Inconnu"}",${amounts.discounted},"${STATUS_LABELS[client.status]}","${lastComment}","${formatDate(client.created_at)}"\\n`
    })

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", "rapport_clients.csv")
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const generateEmailReport = () => {
    let report = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .section { margin-bottom: 25px; }
        .section h2 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 5px; }
        .stats { display: flex; gap: 20px; margin: 15px 0; }
        .stat-item { background: #f8f9fa; padding: 15px; border-radius: 5px; flex: 1; }
        .commercial-section { background: #f8f9fa; padding: 15px; margin: 10px 0; border-radius: 5px; }
        .opportunity { background: white; border-left: 4px solid #3498db; padding: 10px; margin: 8px 0; }
        .status-won { color: ${EMAIL_COLORS.won}; font-weight: bold; }
        .status-lost { color: ${EMAIL_COLORS.lost}; font-weight: bold; }
        .status-negotiation { color: ${EMAIL_COLORS.negotiation}; font-weight: bold; }
        .status-new { color: ${EMAIL_COLORS.new}; font-weight: bold; }
        .status-contact { color: ${EMAIL_COLORS.contact}; font-weight: bold; }
        .status-proposal { color: ${EMAIL_COLORS.proposal}; font-weight: bold; }
        .status-validation { color: ${EMAIL_COLORS.validation}; font-weight: bold; }
        .amount { color: #27ae60; font-weight: bold; }
    </style>
</head>
<body>
    <div class="header">
        <h1>📊 RAPPORT D'ACTIVITÉ COMMERCIALE</h1>
        <p><strong>Date du rapport:</strong> ${new Date().toLocaleDateString("fr-FR")}</p>
    </div>

    <div class="section">
        <h2>📈 RÉSUMÉ GLOBAL</h2>
        <div class="stats">
            <div class="stat-item">
                <strong>Total clients:</strong> ${clients.length}
            </div>
            <div class="stat-item">
                <strong>Clients actifs:</strong> ${clients.filter((c) => c.status !== "won" && c.status !== "lost").length}
            </div>
            <div class="stat-item">
                <strong><span class="status-won">Affaires gagnées:</span></strong> ${clients.filter((c) => c.status === "won").length}
            </div>
            <div class="stat-item">
                <strong><span class="status-lost">Affaires perdues:</span></strong> ${clients.filter((c) => c.status === "lost").length}
            </div>
        </div>
    </div>

    <div class="section">
        <h2>👥 DÉTAIL PAR COMMERCIAL</h2>`

    commercials.forEach((commercial) => {
      const commercialClients = clients.filter((client) => client.commercial_id === commercial.id)
      const activeClients = commercialClients.filter((client) => client.status !== "won" && client.status !== "lost")
      const wonClients = commercialClients.filter((client) => client.status === "won")
      const lostClients = commercialClients.filter((client) => client.status === "lost")

      const totalAmount = commercialClients.reduce((sum, client) => {
        const amounts = calculateDiscountedAmount(client)
        return sum + amounts.discounted
      }, 0)

      report += `
        <div class="commercial-section">
            <h3>🎯 ${commercial.name.toUpperCase()}</h3>
            <ul>
                <li><strong>Clients totaux:</strong> ${commercialClients.length}</li>
                <li><strong>Clients actifs:</strong> ${activeClients.length}</li>
                <li><strong><span class="status-won">Affaires gagnées:</span></strong> ${wonClients.length}</li>
                <li><strong><span class="status-lost">Affaires perdues:</span></strong> ${lostClients.length}</li>
                <li><strong>CA potentiel:</strong> <span class="amount">${totalAmount.toLocaleString("fr-FR")} MAD HT</span></li>
            </ul>
        </div>`
    })

    report += `
    </div>

    <div class="section">
        <h2>🎯 OPPORTUNITÉS EN COURS</h2>`

    const activeClients = clients.filter((client) => client.status !== "won" && client.status !== "lost")
    activeClients.forEach((client) => {
      const commercial = commercials.find((c) => c.id === client.commercial_id)
      const amounts = calculateDiscountedAmount(client)
      const lastComment = client.comments.length > 0 ? client.comments[0].text : ""
      const statusClass = `status-${client.status}`

      report += `
        <div class="opportunity">
            <h4>🏢 ${client.name} (${commercial?.name || "Inconnu"})</h4>
            <p><strong>Montant:</strong> <span class="amount">${amounts.discounted.toLocaleString("fr-FR")} MAD HT</span></p>
            <p><strong>Statut:</strong> <span class="${statusClass}">${STATUS_LABELS[client.status]}</span></p>
            <p><strong>Dernier suivi:</strong> ${lastComment}</p>
        </div>`
    })

    report += `
    </div>
</body>
</html>`

    return report
  }

  const handleSendEmail = () => {
    const mailtoLink = `mailto:${emailForm.to}?subject=${encodeURIComponent(emailForm.subject)}&body=${encodeURIComponent(emailForm.body)}`
    window.location.href = mailtoLink
    setShowEmailModal(false)
    alert("Rapport préparé pour envoi par email!")
  }

  const clearTableFilters = () => {
    setTableFilters({
      client: "",
      commercial: "",
      amount: "",
      status: "",
      comment: "",
      date: "",
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Suivi Client - Gestion Commerciale</h1>
            <p className="text-muted-foreground">Gérez vos opportunités, étiquettes et équipe commerciale</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowManageModal(true)} variant="outline">
              <Settings className="w-4 h-4 mr-2" />
              Gérer
            </Button>
            <Button onClick={exportToExcel} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export Excel
            </Button>
            <Button
              onClick={() => {
                setEmailForm((prev) => ({ ...prev, body: generateEmailReport() }))
                setShowEmailModal(true)
              }}
              variant="outline"
            >
              <Mail className="w-4 h-4 mr-2" />
              Rapport Email
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">{stats.active} actifs</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valeur Totale</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {clients
                  .reduce((sum, client) => {
                    const amounts = calculateDiscountedAmount(client)
                    return sum + amounts.discounted
                  }, 0)
                  .toLocaleString("fr-FR")}{" "}
                MAD HT
              </div>
              <p className="text-xs text-muted-foreground">Avec remises appliquées</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clients Actifs</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active}</div>
              <p className="text-xs text-muted-foreground">En cours de traitement</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Affaires Gagnées</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.won}</div>
              <p className="text-xs text-muted-foreground">
                {stats.total > 0 ? Math.round((stats.won / stats.total) * 100) : 0}% de taux de réussite
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Commercial Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {commercials.map((commercial) => {
            const commercialClients = clients.filter((client) => client.commercial_id === commercial.id)
            const activeClients = commercialClients.filter(
              (client) => client.status !== "won" && client.status !== "lost",
            )
            const wonClients = commercialClients.filter((client) => client.status === "won")
            const totalAmount = commercialClients.reduce((sum, client) => {
              const amounts = calculateDiscountedAmount(client)
              return sum + amounts.discounted
            }, 0)

            return (
              <Card key={commercial.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{commercial.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between text-sm">
                    <div>
                      <div>{commercialClients.length} clients</div>
                      <div>{activeClients.length} actifs</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600">{totalAmount.toLocaleString("fr-FR")} MAD HT</div>
                      <div className="text-blue-600">{wonClients.length} affaires gagnées</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-4 mb-6">
          <Tabs value={currentView} onValueChange={(value) => setCurrentView(value as "cards" | "table")}>
            <TabsList>
              <TabsTrigger value="cards">Vue Fiche</TabsTrigger>
              <TabsTrigger value="table">Vue Tableau</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Rechercher un client..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex gap-2 flex-wrap">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="active">Clients actifs</SelectItem>
                  <SelectItem value="won">Affaires gagnées</SelectItem>
                  <SelectItem value="lost">Affaires perdues</SelectItem>
                  {customStatuses.map((status) => (
                    <SelectItem key={status.id} value={status.id}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={commercialFilter} onValueChange={setCommercialFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les commerciaux</SelectItem>
                  {commercials.map((commercial) => (
                    <SelectItem key={commercial.id} value={commercial.id}>
                      {commercial.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex gap-2">
                <Input
                  placeholder="Montant min"
                  type="number"
                  value={minAmount}
                  onChange={(e) => setMinAmount(e.target.value)}
                  className="w-32"
                />
                <Input
                  placeholder="Montant max"
                  type="number"
                  value={maxAmount}
                  onChange={(e) => setMaxAmount(e.target.value)}
                  className="w-32"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Add Client Button */}
        <div className="mb-6">
          <Dialog open={showClientForm} onOpenChange={setShowClientForm}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Ajouter un nouveau client
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ajouter un Client</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="client-name">Nom du client / Opportunité</Label>
                  <Input
                    id="client-name"
                    value={newClient.name}
                    onChange={(e) => setNewClient((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Nom de l'entreprise"
                  />
                </div>
                <div>
                  <Label htmlFor="client-amount">Montant HT (MAD)</Label>
                  <Input
                    id="client-amount"
                    type="number"
                    value={newClient.amount}
                    onChange={(e) => setNewClient((prev) => ({ ...prev, amount: e.target.value }))}
                    placeholder="15000"
                  />
                </div>
                <div>
                  <Label htmlFor="client-commercial">Commercial en charge</Label>
                  <Select
                    value={newClient.commercial_id}
                    onValueChange={(value) => setNewClient((prev) => ({ ...prev, commercial_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un commercial" />
                    </SelectTrigger>
                    <SelectContent>
                      {commercials.map((commercial) => (
                        <SelectItem key={commercial.id} value={commercial.id}>
                          {commercial.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2 bg-transparent"
                    onClick={() => setShowCommercialForm(true)}
                  >
                    + Ajouter un commercial
                  </Button>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowClientForm(false)}>
                    Annuler
                  </Button>
                  <Button
                    onClick={() => {
                      if (newClient.name && newClient.amount && newClient.commercial_id) {
                        const newClientObj: ExtendedClient = {
                          id: Date.now().toString(),
                          name: newClient.name,
                          amount: Number.parseFloat(newClient.amount),
                          original_amount: Number.parseFloat(newClient.amount),
                          status: "new",
                          commercial_id: newClient.commercial_id,
                          created_at: new Date().toISOString(),
                          updated_at: new Date().toISOString(),
                          comments: [
                            {
                              id: Date.now().toString(),
                              text: "Prise de contact / devis envoyé",
                              date: new Date().toISOString(),
                            },
                          ],
                          tags: [],
                          commercial: commercials.find((c) => c.id === newClient.commercial_id),
                          collapsed: false,
                        }
                        setClients((prev) => [newClientObj, ...prev])
                        setNewClient({ name: "", amount: "", commercial_id: "" })
                        setShowClientForm(false)
                      }
                    }}
                  >
                    Ajouter le client
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Client Views */}
        <Tabs value={currentView} onValueChange={(value) => setCurrentView(value as "cards" | "table")}>
          <TabsContent value="cards">
            <div className="flex justify-end gap-2 mb-4">
              <Button variant="outline" size="sm" onClick={expandAllCards}>
                <ChevronDown className="w-4 h-4 mr-1" />
                Tout ouvrir
              </Button>
              <Button variant="outline" size="sm" onClick={collapseAllCards}>
                <ChevronRight className="w-4 h-4 mr-1" />
                Tout fermer
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredClients.map((client) => {
                const amounts = calculateDiscountedAmount(client)
                const hasDiscount = amounts.discounted !== amounts.original
                const commercial = commercials.find((c) => c.id === client.commercial_id)
                const isEditing = editingClient === client.id

                return (
                  <Card
                    key={client.id}
                    className={`hover:shadow-md transition-shadow ${client.status === "lost" ? "opacity-70" : ""}`}
                  >
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleClientCard(client.id)}
                            className="p-0 h-auto"
                          >
                            {client.collapsed ? (
                              <ChevronRight className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                          <div className="flex-1">
                            {isEditing ? (
                              <div className="space-y-2">
                                <Input
                                  value={editValues.name}
                                  onChange={(e) => setEditValues((prev) => ({ ...prev, name: e.target.value }))}
                                  className="text-lg font-semibold"
                                />
                                <Select
                                  value={editValues.commercial_id}
                                  onValueChange={(value) =>
                                    setEditValues((prev) => ({ ...prev, commercial_id: value }))
                                  }
                                >
                                  <SelectTrigger className="text-sm">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {commercials.map((commercial) => (
                                      <SelectItem key={commercial.id} value={commercial.id}>
                                        {commercial.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <div className="flex gap-2">
                                  <Button size="sm" onClick={() => saveClientEdit(client.id)}>
                                    <Save className="w-3 h-3 mr-1" />
                                    Sauver
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={cancelClientEdit}>
                                    <X className="w-3 h-3 mr-1" />
                                    Annuler
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div>
                                <div className="flex items-center gap-2">
                                  <CardTitle className="text-lg">{client.name}</CardTitle>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => startEditingClient(client.id)}
                                    className="p-1 h-auto"
                                  >
                                    <Edit2 className="h-3 w-3" />
                                  </Button>
                                </div>
                                <div className="text-sm text-muted-foreground">Commercial: {commercial?.name}</div>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          {isEditing ? (
                            <Input
                              type="number"
                              value={editValues.amount}
                              onChange={(e) => setEditValues((prev) => ({ ...prev, amount: e.target.value }))}
                              className="w-32 text-right"
                            />
                          ) : (
                            <>
                              <div className="text-xl font-bold text-green-600">
                                {amounts.discounted.toLocaleString("fr-FR")} MAD HT
                              </div>
                              {hasDiscount && (
                                <>
                                  <div className="text-sm text-muted-foreground line-through">
                                    {amounts.original.toLocaleString("fr-FR")} MAD HT
                                  </div>
                                  <div className="text-sm text-red-600">-{amounts.discountPercentage}%</div>
                                </>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                      {isEditing ? (
                        <Select
                          value={editValues.status}
                          onValueChange={(value) => setEditValues((prev) => ({ ...prev, status: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {customStatuses.map((status) => (
                              <SelectItem key={status.id} value={status.id}>
                                {status.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge className={STATUS_COLORS[client.status]}>{STATUS_LABELS[client.status]}</Badge>
                      )}
                    </CardHeader>

                    {!client.collapsed && (
                      <CardContent>
                        {/* Comments Section with editing */}
                        <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
                          {client.comments.map((comment, index) => {
                            const isEditingThisComment =
                              editingComment?.clientId === client.id && editingComment?.commentId === comment.id

                            return (
                              <div
                                key={comment.id}
                                className={`p-3 rounded border-l-3 ${index === 0 ? "border-l-green-500 bg-green-50" : "border-l-blue-500 bg-blue-50"} relative`}
                              >
                                <div className="text-xs text-muted-foreground mb-1">{formatDate(comment.date)}</div>
                                {isEditingThisComment ? (
                                  <div className="space-y-2">
                                    <Textarea
                                      value={editValues.commentText}
                                      onChange={(e) =>
                                        setEditValues((prev) => ({ ...prev, commentText: e.target.value }))
                                      }
                                      className="text-sm"
                                    />
                                    <div className="flex gap-2">
                                      <Button size="sm" onClick={saveCommentEdit}>
                                        <Save className="w-3 h-3 mr-1" />
                                        Sauver
                                      </Button>
                                      <Button size="sm" variant="outline" onClick={cancelCommentEdit}>
                                        <X className="w-3 h-3 mr-1" />
                                        Annuler
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <p className="text-sm">{comment.text}</p>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="absolute top-1 right-1 p-1 h-auto"
                                      onClick={() => startEditingComment(client.id, comment.id)}
                                    >
                                      <Edit2 className="h-3 w-3" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            )
                          })}
                        </div>

                        {/* Quick Comments */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          {QUICK_COMMENTS.map((quickComment, index) => (
                            <Button
                              key={index}
                              variant="outline"
                              size="sm"
                              onClick={() => handleAddComment(client.id, quickComment.text, quickComment.status)}
                              className="text-xs"
                            >
                              {quickComment.text}
                            </Button>
                          ))}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setCurrentClientId(client.id)
                              setShowCommentModal(true)
                            }}
                            className="text-xs"
                          >
                            Commentaire personnalisé
                          </Button>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-between gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setCurrentClientId(client.id)
                              setShowDiscountModal(true)
                            }}
                          >
                            Remise
                          </Button>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleStatusChange(client.id, "won")}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Validé
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                setCurrentClientId(client.id)
                                setShowLostReasonModal(true)
                              }}
                            >
                              Perdu
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                )
              })}
            </div>
          </TabsContent>

          <TabsContent value="table">
            {currentView === "table" && (
              <div className="mb-4 p-4 bg-muted rounded-lg">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-medium flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    Filtres par colonne
                  </h3>
                  <Button variant="ghost" size="sm" onClick={clearTableFilters}>
                    <X className="w-4 h-4 mr-1" />
                    Effacer
                  </Button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                  <Input
                    placeholder="Filtrer client..."
                    value={tableFilters.client}
                    onChange={(e) => setTableFilters((prev) => ({ ...prev, client: e.target.value }))}
                    className="text-xs"
                  />
                  <Input
                    placeholder="Filtrer commercial..."
                    value={tableFilters.commercial}
                    onChange={(e) => setTableFilters((prev) => ({ ...prev, commercial: e.target.value }))}
                    className="text-xs"
                  />
                  <Input
                    placeholder="Filtrer montant..."
                    value={tableFilters.amount}
                    onChange={(e) => setTableFilters((prev) => ({ ...prev, amount: e.target.value }))}
                    className="text-xs"
                  />
                  <Input
                    placeholder="Filtrer statut..."
                    value={tableFilters.status}
                    onChange={(e) => setTableFilters((prev) => ({ ...prev, status: e.target.value }))}
                    className="text-xs"
                  />
                  <Input
                    placeholder="Filtrer commentaire..."
                    value={tableFilters.comment}
                    onChange={(e) => setTableFilters((prev) => ({ ...prev, comment: e.target.value }))}
                    className="text-xs"
                  />
                  <Input
                    placeholder="Filtrer date..."
                    value={tableFilters.date}
                    onChange={(e) => setTableFilters((prev) => ({ ...prev, date: e.target.value }))}
                    className="text-xs"
                  />
                </div>
              </div>
            )}

            {currentView === "table" && (
              <div className="mb-4 p-4 bg-muted rounded-lg">
                <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <TagIcon className="w-4 h-4" />
                  Étiquettes disponibles (cliquez pour ajouter à un client)
                </h3>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Badge
                      key={tag.id}
                      variant="outline"
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                      onClick={() => {
                        // Show which clients can receive this tag
                        const availableClients = filteredClients.filter(
                          (client) => !client.tags?.some((t) => t.id === tag.id),
                        )
                        if (availableClients.length > 0) {
                          const clientNames = availableClients.map((c) => c.name).join(", ")
                          const selectedClient = prompt(
                            `Ajouter l'étiquette "${tag.name}" à quel client ?\n\nClients disponibles: ${clientNames}\n\nTapez le nom exact du client:`,
                          )
                          if (selectedClient) {
                            const client = availableClients.find(
                              (c) => c.name.toLowerCase() === selectedClient.toLowerCase(),
                            )
                            if (client) {
                              addTagToClient(client.id, tag.id)
                            } else {
                              alert("Client non trouvé. Vérifiez l'orthographe.")
                            }
                          }
                        } else {
                          alert(`Tous les clients ont déjà l'étiquette "${tag.name}"`)
                        }
                      }}
                    >
                      <TagIcon className="w-3 h-3 mr-1" />
                      {tag.name}
                    </Badge>
                  ))}
                  {tags.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      Aucune étiquette disponible. Créez-en une dans "Gérer".
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Commercial</TableHead>
                    <TableHead>Montant (MAD HT)</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Étiquettes</TableHead>
                    <TableHead>Dernier commentaire</TableHead>
                    <TableHead>Date création</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client) => {
                    const amounts = calculateDiscountedAmount(client)
                    const hasDiscount = amounts.discounted !== amounts.original
                    const commercial = commercials.find((c) => c.id === client.commercial_id)
                    const lastComment = client.comments.length > 0 ? client.comments[0] : null
                    const showAllComments = expandedComments[client.id] || false
                    const commentsToShow = showAllComments ? client.comments : client.comments.slice(0, 1)

                    return (
                      <TableRow key={client.id} className={client.status === "lost" ? "opacity-70" : ""}>
                        <TableCell className="font-medium">{client.name}</TableCell>
                        <TableCell>{commercial?.name}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-bold text-green-600">
                              {amounts.discounted.toLocaleString("fr-FR")} MAD HT
                            </div>
                            {hasDiscount && (
                              <>
                                <div className="text-xs text-muted-foreground line-through">
                                  {amounts.original.toLocaleString("fr-FR")} MAD HT
                                </div>
                                <div className="text-xs text-red-600">-{amounts.discountPercentage}%</div>
                              </>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={STATUS_COLORS[client.status]}>{STATUS_LABELS[client.status]}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {client.tags?.map((tag) => (
                              <Badge key={tag.id} variant="secondary" className="text-xs">
                                <TagIcon className="w-2 h-2 mr-1" />
                                {tag.name}
                              </Badge>
                            ))}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-xs"
                              onClick={() => {
                                const availableTags = tags.filter((tag) => !client.tags?.some((t) => t.id === tag.id))
                                if (availableTags.length > 0) {
                                  const tagNames = availableTags.map((t) => t.name).join(", ")
                                  const selectedTag = prompt(
                                    `Ajouter quelle étiquette à "${client.name}" ?\n\nÉtiquettes disponibles: ${tagNames}\n\nTapez le nom exact de l'étiquette:`,
                                  )
                                  if (selectedTag) {
                                    const tag = availableTags.find(
                                      (t) => t.name.toLowerCase() === selectedTag.toLowerCase(),
                                    )
                                    if (tag) {
                                      addTagToClient(client.id, tag.id)
                                    } else {
                                      alert("Étiquette non trouvée. Vérifiez l'orthographe.")
                                    }
                                  }
                                } else {
                                  alert("Toutes les étiquettes sont déjà ajoutées à ce client")
                                }
                              }}
                            >
                              + Tag
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          {commentsToShow.map((comment, i) => (
                            <div
                              key={comment.id}
                              className={`p-2 mb-2 rounded border-l-2 ${i === 0 ? "border-l-green-500 bg-green-50" : "border-l-blue-500 bg-blue-50"}`}
                            >
                              <div className="text-xs text-muted-foreground">{formatDate(comment.date)}</div>
                              <div className="text-sm">{comment.text}</div>
                            </div>
                          ))}
                          {client.comments.length > 1 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setExpandedComments((prev) => ({
                                  ...prev,
                                  [client.id]: !prev[client.id],
                                }))
                              }
                              className="text-xs"
                            >
                              {showAllComments ? "▲ Masquer" : `▼ Voir tous (${client.comments.length - 1})`}
                            </Button>
                          )}
                          <div className="flex flex-wrap gap-1 mt-2">
                            {QUICK_COMMENTS.slice(0, 3).map((quickComment, index) => (
                              <Button
                                key={index}
                                variant="outline"
                                size="sm"
                                onClick={() => handleAddComment(client.id, quickComment.text, quickComment.status)}
                                className="text-xs px-2 py-1"
                              >
                                {quickComment.text}
                              </Button>
                            ))}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setCurrentClientId(client.id)
                                setShowCommentModal(true)
                              }}
                              className="text-xs px-2 py-1"
                            >
                              + Personnalisé
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(client.created_at)}</TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <Button
                              size="sm"
                              onClick={() => handleStatusChange(client.id, "won")}
                              className="bg-green-600 hover:bg-green-700 text-xs px-2 py-1"
                            >
                              Validé
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                setCurrentClientId(client.id)
                                setShowLostReasonModal(true)
                              }}
                              className="text-xs px-2 py-1"
                            >
                              Perdu
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>

        {filteredClients.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Aucun client trouvé avec ces critères.</p>
          </div>
        )}

        {/* Modals */}

        <Dialog open={showManageModal} onOpenChange={setShowManageModal}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Gestion des Étiquettes, Statuts et Commerciaux</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* Tags Section */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-medium">Étiquettes</h3>
                  <Button onClick={() => setShowTagForm(true)} size="sm">
                    <Plus className="w-4 h-4 mr-1" />
                    Nouvelle étiquette
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {tags.map((tag) => (
                    <div key={tag.id} className="flex items-center justify-between p-2 border rounded">
                      <Badge variant="outline" className="flex items-center gap-1">
                        <TagIcon className="w-3 h-3" />
                        {tag.name}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTag(tag.id)}
                        className="p-1 h-auto text-red-500 hover:text-red-700"
                        disabled={isTagUsed(tag.id)}
                      >
                        {isTagUsed(tag.id) ? (
                          <AlertTriangle className="w-4 h-4" title="Utilisé dans des fiches" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status Section */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-medium">Statuts</h3>
                  <Button onClick={() => setShowStatusForm(true)} size="sm">
                    <Plus className="w-4 h-4 mr-1" />
                    Nouveau statut
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {customStatuses.map((status) => (
                    <div key={status.id} className="flex items-center justify-between p-2 border rounded">
                      <Badge className={`bg-${status.color}-100 text-${status.color}-800`}>{status.label}</Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteStatus(status.id)}
                        className="p-1 h-auto text-red-500 hover:text-red-700"
                        disabled={isStatusUsed(status.id)}
                      >
                        {isStatusUsed(status.id) ? (
                          <AlertTriangle className="w-4 h-4" title="Utilisé dans des fiches" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Commercials Section */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-medium">Commerciaux</h3>
                  <Button onClick={() => setShowCommercialForm(true)} size="sm">
                    <Plus className="w-4 h-4 mr-1" />
                    Nouveau commercial
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {commercials.map((commercial) => (
                    <div key={commercial.id} className="flex items-center justify-between p-2 border rounded">
                      <Badge variant="outline">{commercial.name}</Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteCommercial(commercial.id)}
                        className="p-1 h-auto text-red-500 hover:text-red-700"
                        disabled={isCommercialUsed(commercial.id)}
                      >
                        {isCommercialUsed(commercial.id) ? (
                          <AlertTriangle className="w-4 h-4" title="Assigné à des fiches" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Commercial Modal */}
        <Dialog open={showCommercialForm} onOpenChange={setShowCommercialForm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter un Commercial</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="commercial-name">Nom du commercial</Label>
                <Input
                  id="commercial-name"
                  value={newCommercial}
                  onChange={(e) => setNewCommercial(e.target.value)}
                  placeholder="Nom complet"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCommercialForm(false)}>
                  Annuler
                </Button>
                <Button
                  onClick={() => {
                    if (newCommercial.trim()) {
                      const newCommercialObj = {
                        id: Date.now().toString(),
                        name: newCommercial.trim(),
                        created_at: new Date().toISOString(),
                      }
                      setCommercials((prev) => [...prev, newCommercialObj])
                      setNewCommercial("")
                      setShowCommercialForm(false)
                    }
                  }}
                >
                  Ajouter
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showStatusForm} onOpenChange={setShowStatusForm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter un Nouveau Statut</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="status-label">Nom du statut</Label>
                <Input
                  id="status-label"
                  value={newStatus.label}
                  onChange={(e) => setNewStatus((prev) => ({ ...prev, label: e.target.value }))}
                  placeholder="Ex: En attente validation"
                />
              </div>
              <div>
                <Label htmlFor="status-color">Couleur</Label>
                <Select
                  value={newStatus.color}
                  onValueChange={(value) => setNewStatus((prev) => ({ ...prev, color: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="blue">Bleu</SelectItem>
                    <SelectItem value="green">Vert</SelectItem>
                    <SelectItem value="yellow">Jaune</SelectItem>
                    <SelectItem value="red">Rouge</SelectItem>
                    <SelectItem value="purple">Violet</SelectItem>
                    <SelectItem value="pink">Rose</SelectItem>
                    <SelectItem value="cyan">Cyan</SelectItem>
                    <SelectItem value="orange">Orange</SelectItem>
                    <SelectItem value="gray">Gris</SelectItem>
                    <SelectItem value="indigo">Indigo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowStatusForm(false)}>
                  Annuler
                </Button>
                <Button onClick={handleAddStatus}>Ajouter le statut</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Tag Modal */}
        <Dialog open={showTagForm} onOpenChange={setShowTagForm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter une Étiquette</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="tag-name">Nom de l'étiquette</Label>
                <Input
                  id="tag-name"
                  value={newTag.name}
                  onChange={(e) => setNewTag((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Client VIP, Urgent, etc."
                />
              </div>
              <div>
                <Label htmlFor="tag-status">Statut associé</Label>
                <Select
                  value={newTag.status}
                  onValueChange={(value) => setNewTag((prev) => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {customStatuses.map((status) => (
                      <SelectItem key={status.id} value={status.id}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowTagForm(false)}>
                  Annuler
                </Button>
                <Button onClick={handleAddTag}>Ajouter l'étiquette</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Custom Comment Modal */}
        <Dialog open={showCommentModal} onOpenChange={setShowCommentModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter un commentaire</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="custom-comment">Commentaire</Label>
                <Textarea
                  id="custom-comment"
                  value={customComment}
                  onChange={(e) => setCustomComment(e.target.value)}
                  placeholder="Votre commentaire..."
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCommentModal(false)
                    setCustomComment("")
                  }}
                >
                  Annuler
                </Button>
                <Button
                  onClick={() => {
                    if (customComment.trim() && currentClientId) {
                      handleAddComment(currentClientId, customComment.trim())
                      setShowCommentModal(false)
                      setCustomComment("")
                      setCurrentClientId(null)
                    }
                  }}
                >
                  Ajouter
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Lost Reason Modal */}
        <Dialog open={showLostReasonModal} onOpenChange={setShowLostReasonModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cause de la perte</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="lost-reason">Sélectionnez la raison</Label>
                <Select value={lostReason} onValueChange={setLostReason}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir une raison" />
                  </SelectTrigger>
                  <SelectContent>
                    {LOST_REASONS.map((reason) => (
                      <SelectItem key={reason} value={reason}>
                        {reason}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {lostReason === "Autre" && (
                <div>
                  <Label htmlFor="other-reason">Précisez la raison</Label>
                  <Input
                    id="other-reason"
                    value={otherReason}
                    onChange={(e) => setOtherReason(e.target.value)}
                    placeholder="Précisez..."
                  />
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowLostReasonModal(false)
                    setLostReason("")
                    setOtherReason("")
                  }}
                >
                  Annuler
                </Button>
                <Button
                  onClick={() => {
                    const reason = lostReason === "Autre" ? otherReason : lostReason
                    if (reason && currentClientId) {
                      handleStatusChange(currentClientId, "lost", reason)
                      setShowLostReasonModal(false)
                      setLostReason("")
                      setOtherReason("")
                      setCurrentClientId(null)
                    }
                  }}
                >
                  Confirmer
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Discount Modal */}
        <Dialog open={showDiscountModal} onOpenChange={setShowDiscountModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter une remise</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Type de remise</Label>
                <Select
                  value={discountType}
                  onValueChange={(value) => setDiscountType(value as "percentage" | "fixed")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Pourcentage (%)</SelectItem>
                    <SelectItem value="fixed">Montant fixe (MAD)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="discount-amount">
                  {discountType === "percentage" ? "Pourcentage de remise" : "Montant de la remise (MAD)"}
                </Label>
                <Input
                  id="discount-amount"
                  type="number"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(e.target.value)}
                  placeholder={discountType === "percentage" ? "10" : "1000"}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDiscountModal(false)
                    setDiscountAmount("")
                  }}
                >
                  Annuler
                </Button>
                <Button onClick={handleAddDiscount}>Appliquer la remise</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Enhanced Email Modal */}
        <Dialog open={showEmailModal} onOpenChange={setShowEmailModal}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Rapport par email (avec couleurs)</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email-to">Destinataire</Label>
                <Input
                  id="email-to"
                  type="email"
                  value={emailForm.to}
                  onChange={(e) => setEmailForm((prev) => ({ ...prev, to: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="email-subject">Sujet</Label>
                <Input
                  id="email-subject"
                  value={emailForm.subject}
                  onChange={(e) => setEmailForm((prev) => ({ ...prev, subject: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="email-body">Contenu du rapport (HTML avec couleurs)</Label>
                <div className="border rounded p-4 max-h-96 overflow-y-auto bg-white">
                  <div dangerouslySetInnerHTML={{ __html: emailForm.body }} />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowEmailModal(false)}>
                  Annuler
                </Button>
                <Button onClick={handleSendEmail}>Envoyer le rapport</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
