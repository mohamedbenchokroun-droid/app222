import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

import type { Client, Commercial } from "@/lib/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function calculateStats(clients: Client[]) {
  const total = clients.length
  const won = clients.filter((c) => c.status === "won").length
  const lost = clients.filter((c) => c.status === "lost").length
  const active = clients.filter((c) => c.status !== "won" && c.status !== "lost").length

  const totalAmount = clients.reduce((sum, client) => sum + client.amount, 0)
  const wonAmount = clients.filter((c) => c.status === "won").reduce((sum, client) => sum + client.amount, 0)

  return {
    total,
    won,
    lost,
    active,
    totalAmount,
    wonAmount,
    conversionRate: total > 0 ? Math.round((won / total) * 100) : 0,
  }
}

export function calculateCommercialStats(clients: Client[], commercials: Commercial[]) {
  return commercials.map((commercial) => {
    const commercialClients = clients.filter((c) => c.commercial_id === commercial.id)
    const won = commercialClients.filter((c) => c.status === "won").length
    const total = commercialClients.length
    const amount = commercialClients.reduce((sum, client) => sum + client.amount, 0)

    return {
      ...commercial,
      clientsCount: total,
      wonCount: won,
      totalAmount: amount,
      conversionRate: total > 0 ? Math.round((won / total) * 100) : 0,
    }
  })
}

export function formatCurrency(amount: number): string {
  return `${amount.toLocaleString("fr-FR")} MAD HT`
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function calculateDiscountedAmount(client: any) {
  let discountedAmount = client.amount
  const originalAmount = client.original_amount || client.amount
  let totalDiscountPercentage = 0

  if (client.comments) {
    client.comments.forEach((comment: any) => {
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
  }

  if (totalDiscountPercentage > 0) {
    discountedAmount = originalAmount * (1 - totalDiscountPercentage / 100)
  }

  return {
    original: originalAmount,
    discounted: discountedAmount,
    discountPercentage: totalDiscountPercentage,
  }
}

export function exportToCSV(clients: Client[], commercials: Commercial[]) {
  let csvContent = "Client,Commercial,Montant HT (MAD),Statut,Dernier commentaire,Date création\n"

  clients.forEach((client) => {
    const commercial = commercials.find((c) => c.id === client.commercial_id)
    const amounts = calculateDiscountedAmount(client)
    const lastComment = client.comments && client.comments.length > 0 ? client.comments[0].text : ""

    csvContent += `"${client.name}","${commercial?.name || "Inconnu"}",${amounts.discounted},"${getStatusLabel(client.status)}","${lastComment}","${formatDate(client.created_at)}"\n`
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

export function getStatusLabel(status: string): string {
  const statusMap: { [key: string]: string } = {
    new: "Nouveau",
    contact: "Contacté",
    proposal: "Proposition envoyée",
    negotiation: "En négociation",
    validation: "Validation physique",
    won: "Gagné",
    lost: "Perdu",
  }
  return statusMap[status] || status
}
