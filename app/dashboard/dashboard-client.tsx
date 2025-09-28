"use client"

import { useState } from "react"
import type { User } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LogOut } from "lucide-react"
import type { Client, Commercial, Tag } from "@/lib/types"
import { calculateStats, calculateCommercialStats, formatCurrency } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface DashboardClientProps {
  initialClients: Client[]
  initialCommercials: Commercial[]
  initialTags: Tag[]
  user?: User | null
}

const STATUS_COLORS: { [key: string]: string } = {
  new: "bg-blue-100 text-blue-800",
  contact: "bg-gray-100 text-gray-800",
  proposal: "bg-yellow-100 text-yellow-800",
  negotiation: "bg-purple-100 text-purple-800",
  validation: "bg-orange-100 text-orange-800",
  won: "bg-green-100 text-green-800",
  lost: "bg-red-100 text-red-800",
}

const STATUS_LABELS: { [key: string]: string } = {
  new: "Nouveau",
  contact: "Contacté",
  proposal: "Proposition",
  negotiation: "Négociation",
  validation: "Validation",
  won: "Gagné",
  lost: "Perdu",
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

export function DashboardClient({ 
  initialClients, 
  initialCommercials, 
  initialTags, 
  user 
}: DashboardClientProps) {
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [commercials, setCommercials] = useState<Commercial[]>(initialCommercials);
  const [tags, setTags] = useState<Tag[]>(initialTags);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [commercialFilter, setCommercialFilter] = useState("all");
  const [currentView, setCurrentView] = useState<"cards" | "table">("cards");
  
  // Form states
  const [showClientForm, setShowClientForm] = useState(false);
  const [showCommercialForm, setShowCommercialForm] = useState(false);
  const [showTagForm, setShowTagForm] = useState(false);
  const [newClient, setNewClient] = useState({ name: "", amount: "", commercial_id: "" });
  const [newCommercial, setNewCommercial] = useState("");
  const [newTag, setNewTag] = useState({ name: "", status: "new" });

  const router = useRouter();
  const supabase = createClient();

  const stats = calculateStats(clients);
  const commercialStats = calculateCommercialStats(clients, commercials);

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.comments?.some(comment => 
        comment.text.toLowerCase().includes(searchTerm.toLowerCase())
      );
    
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "active" && client.status !== 'won' && client.status !== 'lost') ||
      (statusFilter === "won" && client.status === 'won') ||
      (statusFilter === "lost" && client.status === 'lost') ||
      client.status === statusFilter;
    
    const matchesCommercial = commercialFilter === "all" || 
      client.commercial_id === commercialFilter;

    return matchesSearch && matchesStatus && matchesCommercial;
  });

  const handleLogout = async () => {
    // Auth disabled: just reload dashboard
    router.push("/dashboard");
  };

  const handleAddClient = async () => {
    if (!newClient.name || !newClient.amount || !newClient.commercial_id) return;

    try {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newClient.name,
          amount: Number.parseFloat(newClient.amount),
          commercial_id: newClient.commercial_id
        })
      });

      if (response.ok) {
        const client = await response.json();
        setClients(prev => [client, ...prev]);
        setNewClient({ name: "", amount: "", commercial_id: "" });
        setShowClientForm(false);
      }
    } catch (error) {
      console.error('Error adding client:', error);
    }
  };

  const handleAddCommercial = async () => {
    if (!newCommercial.trim()) return;

    try {
      const response = await fetch('/api/commercials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCommercial.trim() })
      });

      if (response.ok) {
        const commercial = await response.json();
        setCommercials(prev => [...prev, commercial]);
        setNewCommercial("");
        setShowCommercialForm(false);
      }
    } catch (error) {
      console.error('Error adding commercial:', error);
    }
  };

  const handleAddTag = async () => {
    if (!newTag.name.trim()) return;

    try {
      const response = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTag)
      });

      if (response.ok) {
        const tag = await response.json();
        setTags(prev => [...prev, tag]);
        setNewTag({ name: "", status: "new" });
        setShowTagForm(false);
      }
    } catch (error) {
      console.error('Error adding tag:', error);
    }
  };

  const handleAddComment = async (clientId: string, text: string) => {
    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: clientId, text })
      });

      if (response.ok) {
        // Refresh clients to get updated comments
        const updatedClients = await fetch('/api/clients').then(res => res.json());
        setClients(updatedClients);
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleUpdateStatus = async (clientId: string, status: string) => {
    try {
      const response = await fetch(`/api/clients/${clientId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        setClients(prev => prev.map(client => 
          client.id === clientId ? { ...client, status: status as any } : client
        ));
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleApplyTag = async (clientId: string, tagId: string, tagName: string) => {
    try {
      const response = await fetch(`/api/clients/${clientId}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tag_id: tagId })
      });

      if (response.ok) {
        // The tag application also updates the client status
        const updatedClients = await fetch('/api/clients').then(res => res.json());
        setClients(updatedClients);
      }
    } catch (error) {
      console.error('Error applying tag:', error);
    }
  };

  const handleUpdateDiscount = async (clientId: string, percentage: number) => {
    try {
      const response = await fetch(`/api/clients/${clientId}/discount`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ discount_percentage: percentage })
      });

      if (response.ok) {
        const updatedClients = await fetch('/api/clients').then(res => res.json());
        setClients(updatedClients);
      }
    } catch (error) {
      console.error('Error updating discount:', error);
    }
  };

  const handleToggleCollapse = async (clientId: string) => {
    setClients(prev => prev.map(client => 
      client.id === clientId ? { ...client, collapsed: !client.collapsed } : client
    ));
  };

  return (
    <div className="min-h-screen bg-muted/50">
      {/* Header */}
      <header className="bg-background border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Suivi Client - Gestion Commerciale</h1>
              <p className="text-muted-foreground">Gérez vos opportunités, étiquettes et équipe commerciale</p>
            </div>
            <div className="flex items-center gap-4">
              {user ? (
                <span className="text-sm text-muted-foreground">Connecté en tant que {user.email}</span>
              ) : (
                <span className="text-sm text-muted-foreground">Mode sans authentification</span>
              )}
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Déconnexion
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Clients Totaux</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalClients}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Valeur Totale</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalAmount)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Clients Actifs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeClients}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Affaires Gagnées</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.wonClients}</div>
            </CardContent>
          </Card>
        </div>

        {/* Commercial Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {commercialStats.map(commercial => (
            <Card key={commercial.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">{commercial.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between text-sm">
                  <div>
                    <div>{commercial.totalClients} clients</div>
                    <div>{commercial.activeClients} actifs</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-600">
                      {formatCurrency(commercial.totalAmount)}
                    </div>
                    <div className="text-blue-600">
                      {commercial.wonClients} affaires gagnées
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-4">
          <div>
            <Tabs value={currentView} onValueChange={(value) => setCurrentView(value as any)}>
              <TabsList>
                <TabsTrigger value="cards">Vue Fiche</TabsTrigger>
                <TabsTrigger value="table">Vue Tableau</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}