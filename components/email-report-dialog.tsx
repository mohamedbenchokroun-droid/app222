"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Mail, Send } from "lucide-react"
import type { Client, Commercial } from "@/lib/types"
import { formatCurrency, calculateStats, calculateCommercialStats } from "@/lib/utils"

interface EmailReportDialogProps {
  clients: Client[]
  commercials: Commercial[]
}

export function EmailReportDialog({ clients, commercials }: EmailReportDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [emailData, setEmailData] = useState({
    to: "directeur@entreprise.com",
    subject: "Rapport d'activité commerciale",
    body: "",
  })

  const generateReport = () => {
    const stats = calculateStats(clients)
    const commercialStats = calculateCommercialStats(clients, commercials)
    const today = new Date().toLocaleDateString("fr-FR")

    let report = `RAPPORT D'ACTIVITÉ COMMERCIALE\n\n`
    report += `Date du rapport: ${today}\n\n`

    // Résumé global
    report += `RÉSUMÉ GLOBAL:\n`
    report += `───────────────\n`
    report += `Total clients: ${stats.totalClients}\n`
    report += `Clients actifs: ${stats.activeClients}\n`
    report += `Affaires gagnées: ${stats.wonClients}\n`
    report += `Affaires perdues: ${stats.lostClients}\n`
    report += `Valeur totale: ${formatCurrency(stats.totalAmount)}\n\n`

    // Détail par commercial
    report += `DÉTAIL PAR COMMERCIAL:\n`
    report += `─────────────────────\n`

    commercialStats.forEach((commercial) => {
      report += `${commercial.name.toUpperCase()}:\n`
      report += `  • Clients totaux: ${commercial.totalClients}\n`
      report += `  • Clients actifs: ${commercial.activeClients}\n`
      report += `  • Affaires gagnées: ${commercial.wonClients}\n`
      report += `  • CA potentiel: ${formatCurrency(commercial.totalAmount)}\n\n`
    })

    // Opportunités en cours
    const activeClients = clients.filter((client) => client.status !== "won" && client.status !== "lost")

    if (activeClients.length > 0) {
      report += `OPPORTUNITÉS EN COURS:\n`
      report += `─────────────────────\n`

      activeClients.forEach((client) => {
        const commercial = commercials.find((c) => c.id === client.commercial_id)
        const lastComment = client.comments?.[0]

        report += `• ${client.name} (${commercial?.name || "Non assigné"}) - ${formatCurrency(client.amount)}\n`
        report += `  Statut: ${getStatusLabel(client.status)}\n`
        if (lastComment) {
          report += `  Dernier suivi: ${lastComment.text}\n`
        }
        report += `\n`
      })
    }

    // Affaires récemment gagnées
    const recentWins = clients.filter((client) => {
      if (client.status !== "won") return false
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return new Date(client.updated_at) > weekAgo
    })

    if (recentWins.length > 0) {
      report += `AFFAIRES RÉCEMMENT GAGNÉES (7 derniers jours):\n`
      report += `──────────────────────────────────────────\n`

      recentWins.forEach((client) => {
        const commercial = commercials.find((c) => c.id === client.commercial_id)
        report += `• ${client.name} (${commercial?.name || "Non assigné"}) - ${formatCurrency(client.amount)}\n`
      })
      report += `\n`
    }

    return report
  }

  const getStatusLabel = (status: string): string => {
    const labels: { [key: string]: string } = {
      new: "Nouveau",
      contact: "Contacté",
      proposal: "Proposition envoyée",
      negotiation: "En négociation",
      validation: "Validation physique",
      won: "Gagné",
      lost: "Perdu",
    }
    return labels[status] || status
  }

  const handleOpenDialog = () => {
    const report = generateReport()
    setEmailData((prev) => ({ ...prev, body: report }))
    setIsOpen(true)
  }

  const handleSendEmail = async () => {
    setIsLoading(true)

    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(emailData),
      })

      if (response.ok) {
        alert("Rapport envoyé avec succès !")
        setIsOpen(false)
      } else {
        const error = await response.json()
        alert(`Erreur lors de l'envoi: ${error.message}`)
      }
    } catch (error) {
      console.error("Error sending email:", error)
      alert("Erreur lors de l'envoi du rapport")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" onClick={handleOpenDialog}>
          <Mail className="h-4 w-4 mr-2" />
          Rapport Email
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Envoyer un rapport par email</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="email-to">Destinataire</Label>
            <Input
              id="email-to"
              type="email"
              value={emailData.to}
              onChange={(e) => setEmailData((prev) => ({ ...prev, to: e.target.value }))}
              placeholder="destinataire@entreprise.com"
            />
          </div>

          <div>
            <Label htmlFor="email-subject">Sujet</Label>
            <Input
              id="email-subject"
              value={emailData.subject}
              onChange={(e) => setEmailData((prev) => ({ ...prev, subject: e.target.value }))}
              placeholder="Sujet de l'email"
            />
          </div>

          <div>
            <Label htmlFor="email-body">Contenu du rapport</Label>
            <Textarea
              id="email-body"
              value={emailData.body}
              onChange={(e) => setEmailData((prev) => ({ ...prev, body: e.target.value }))}
              rows={15}
              className="font-mono text-sm"
              placeholder="Le rapport sera généré automatiquement..."
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSendEmail} disabled={isLoading}>
              <Send className="h-4 w-4 mr-2" />
              {isLoading ? "Envoi..." : "Envoyer le rapport"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
