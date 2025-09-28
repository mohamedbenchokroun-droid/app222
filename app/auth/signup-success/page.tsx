import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle } from "lucide-react"

export default function SignupSuccessPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-muted/50">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle className="text-2xl">Compte créé avec succès !</CardTitle>
              <CardDescription>Vérifiez votre email pour confirmer votre compte</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center">
                Un email de confirmation a été envoyé à votre adresse. Cliquez sur le lien dans l'email pour activer
                votre compte et accéder à l'application.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
