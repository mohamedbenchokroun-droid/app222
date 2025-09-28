import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function formatCurrency(amount: number): string {
  return `${amount.toLocaleString("fr-FR")} MAD HT`
}

export function calculateStats(clients: any[]) {
  const totalClients = clients.length
  const totalAmount = clients.reduce((sum, client) => sum + client.amount, 0)
  const activeClients = clients.filter((client) => client.status !== "won" && client.status !== "lost").length
  const wonClients = clients.filter((client) => client.status === "won").length
  const lostClients = clients.filter((client) => client.status === "lost").length

  return {
    totalClients,
    totalAmount,
    activeClients,
    wonClients,
    lostClients,
  }
}

export function calculateCommercialStats(clients: any[], commercials: any[]) {
  return commercials.map((commercial) => {
    const commercialClients = clients.filter((client) => client.commercial_id === commercial.id)
    const activeClients = commercialClients.filter((client) => client.status !== "won" && client.status !== "lost")
    const wonClients = commercialClients.filter((client) => client.status === "won")
    const totalAmount = commercialClients.reduce((sum, client) => sum + client.amount, 0)

    return {
      ...commercial,
      totalClients: commercialClients.length,
      activeClients: activeClients.length,
      wonClients: wonClients.length,
      totalAmount,
    }
  })
}
