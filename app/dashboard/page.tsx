import { DashboardClient } from "./dashboard-client"
import { getClients, getCommercials, getTags } from "@/lib/database"

export default async function DashboardPage() {
  // Fetch all data server-side
  const [clients, commercials, tags] = await Promise.all([getClients(), getCommercials(), getTags()])

  return <DashboardClient initialClients={clients} initialCommercials={commercials} initialTags={tags} user={null as any} />
}
