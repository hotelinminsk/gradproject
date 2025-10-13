import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText } from "lucide-react"

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-balance">Reports</h1>
        <p className="text-muted-foreground mt-2">Generate and view attendance reports</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Reports Coming Soon</CardTitle>
          </div>
          <CardDescription>
            This section will allow you to generate detailed attendance reports for your courses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Features in development: Export attendance data, Generate PDF reports, View analytics
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
