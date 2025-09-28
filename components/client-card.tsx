"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ChevronDown, ChevronRight, Edit2, MessageSquare, CheckCircle, XCircle } from "lucide-react"
import { type Client, STATUS_LABELS, STATUS_COLORS, type Tag } from "@/lib/types"
import { formatDate, formatCurrency } from "@/lib/utils"

interface ClientCardProps {
  client: Client
  tags: Tag[]
  onAddComment: (clientId: string, text: string) => void
  onUpdateStatus: (clientId: string, status: string) => void
  onApplyTag: (clientId: string, tagId: string, tagName: string) => void
  onUpdateDiscount: (clientId: string, percentage: number) => void
  onToggleCollapse: (clientId: string) => void
}

export function ClientCard({
  client,
  tags,
  onAddComment,
  onUpdateStatus,
  onApplyTag,
  onUpdateDiscount,
  onToggleCollapse,
}: ClientCardProps) {
  const [showCommentForm, setShowCommentForm] = useState(false)
  const [newComment, setNewComment] = useState("")
  const [showDiscountForm, setShowDiscountForm] = useState(false)
  const [discountPercentage, setDiscountPercentage] = useState(client.discount_percentage || 0)
  const [editingComment, setEditingComment] = useState<string | null>(null)

  const handleAddComment = async () => {
    if (newComment.trim()) {
      await onAddComment(client.id, newComment.trim())
      setNewComment("")
      setShowCommentForm(false)
    }
  }

  const handleApplyTag = async (tagId: string, tagName: string) => {
    await onApplyTag(client.id, tagId, tagName)
    await onAddComment(client.id, tagName)
  }

  const handleUpdateDiscount = async () => {
    await onUpdateDiscount(client.id, discountPercentage)
    await onAddComment(client.id, `Remise accordée: ${discountPercentage}%`)
    setShowDiscountForm(false)
  }

  const isArchived = client.status === "lost"
  const hasDiscount = client.discount_percentage > 0

  return (
    <Card
      className={`transition-all duration-200 ${isArchived ? "opacity-70 bg-muted/50" : ""} ${client.collapsed ? "max-h-32 overflow-hidden" : ""}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => onToggleCollapse(client.id)} className="p-1 h-6 w-6">
              {client.collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            <div>
              <h3 className="font-semibold text-lg">{client.name}</h3>
              <p className="text-sm text-muted-foreground">Commercial: {client.commercial?.name || "Non assigné"}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="font-bold text-lg text-green-600">{formatCurrency(client.amount)}</div>
            {hasDiscount && (
              <>
                <div className="text-sm text-muted-foreground line-through">
                  {formatCurrency(client.original_amount)}
                </div>
                <div className="text-sm text-red-600">-{client.discount_percentage}%</div>
              </>
            )}
          </div>
        </div>
        <Badge className={STATUS_COLORS[client.status]}>{STATUS_LABELS[client.status]}</Badge>
      </CardHeader>

      {!client.collapsed && (
        <CardContent className="space-y-4">
          {/* Comments Section */}
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {client.comments?.map((comment, index) => (
              <div
                key={comment.id}
                className={`p-3 rounded-lg border-l-4 ${
                  index === 0 ? "border-l-green-500 bg-green-50" : "border-l-blue-500 bg-blue-50"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="text-xs text-muted-foreground mb-1">{formatDate(comment.created_at)}</div>
                    {editingComment === comment.id ? (
                      <div className="space-y-2">
                        <Textarea
                          value={comment.text}
                          onChange={(e) => {
                            // Update comment text locally for editing
                          }}
                          className="min-h-16"
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => setEditingComment(null)}>
                            Enregistrer
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingComment(null)}>
                            Annuler
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm">{comment.text}</p>
                    )}
                  </div>
                  {index === 0 && editingComment !== comment.id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingComment(comment.id)}
                      className="p-1 h-6 w-6"
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Quick Tags */}
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {tags.slice(0, 6).map((tag) => (
                <Button
                  key={tag.id}
                  variant="outline"
                  size="sm"
                  onClick={() => handleApplyTag(tag.id, tag.name)}
                  className="text-xs"
                >
                  {tag.name}
                </Button>
              ))}
              <Button variant="outline" size="sm" onClick={() => setShowCommentForm(true)} className="text-xs">
                <MessageSquare className="h-3 w-3 mr-1" />
                Commentaire personnalisé
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowDiscountForm(true)} className="text-xs">
                Remise
              </Button>
            </div>
          </div>

          {/* Comment Form */}
          {showCommentForm && (
            <div className="space-y-2 p-3 bg-muted rounded-lg">
              <Label htmlFor="comment">Nouveau commentaire</Label>
              <Textarea
                id="comment"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Saisissez votre commentaire..."
                className="min-h-16"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleAddComment}>
                  Ajouter
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowCommentForm(false)}>
                  Annuler
                </Button>
              </div>
            </div>
          )}

          {/* Discount Form */}
          {showDiscountForm && (
            <div className="space-y-2 p-3 bg-muted rounded-lg">
              <Label htmlFor="discount">Pourcentage de remise</Label>
              <Input
                id="discount"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={discountPercentage}
                onChange={(e) => setDiscountPercentage(Number.parseFloat(e.target.value) || 0)}
                placeholder="0"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleUpdateDiscount}>
                  Appliquer
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowDiscountForm(false)}>
                  Annuler
                </Button>
              </div>
            </div>
          )}

          {/* Status Actions */}
          <div className="flex gap-2 pt-2 border-t">
            <Button
              size="sm"
              onClick={() => onUpdateStatus(client.id, "won")}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Validé
            </Button>
            <Button size="sm" variant="destructive" onClick={() => onUpdateStatus(client.id, "lost")}>
              <XCircle className="h-4 w-4 mr-1" />
              Perdu
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
