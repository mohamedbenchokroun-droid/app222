"use client"

import { Button } from "@/components/ui/button"
import { FileSpreadsheet } from "lucide-react"
import type { Client, Commercial } from "@/lib/types"

interface ExportExcelButtonProps {
  clients: Client[]
  commercials: Commercial[]
}

export function ExportExcelButton({ clients, commercials }: ExportExcelButtonProps) {
  const exportToExcel = () => {
    // Create CSV content
    let csvContent =
      "Client,Commercial,Montant HT (MAD),Montant Original,Remise (%),Statut,Dernier commentaire,Date création\n"

    clients.forEach((client) => {
      const commercial = commercials.find((c) => c.id === client.commercial_id)
      const lastComment = client.comments?.[0]?.text || ""
      const statusLabels: { [key: string]: string } = {
        new: "Nouveau",
        contact: "Contacté",
        proposal: "Proposition envoyée",
        negotiation: "En négociation",
        validation: "Validation physique",
        won: "Gagné",
        lost: "Perdu",
      }

      // Escape quotes in text fields
      const escapeCsv = (text: string) => `"${text.replace(/"/g, '""')}"`

      csvContent +=
        [
          escapeCsv(client.name),
          escapeCsv(commercial?.name || "Non assigné"),
          client.amount.toString(),
          client.original_amount.toString(),
          client.discount_percentage.toString(),
          escapeCsv(statusLabels[client.status] || client.status),
          escapeCsv(lastComment),
          escapeCsv(new Date(client.created_at).toLocaleDateString("fr-FR")),
        ].join(",") + "\n"
    })

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `rapport_clients_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Button variant="outline" onClick={exportToExcel}>
      <FileSpreadsheet className="h-4 w-4 mr-2" />
      Export Excel
    </Button>
  )
}
