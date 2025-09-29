import { useAuthSessionTimeoutContext } from "~/components/auth-session-timeout-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { Button } from "~/components/ui/button"

export default function SessionTimeoutTestPage() {
  const {
    remainingTime,
    formattedRemainingTime,
    isActive,
    timeoutHours,
    refreshSession,
    recordActivity
  } = useAuthSessionTimeoutContext()

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Session Timeout Test</CardTitle>
          <CardDescription>
            Test session timeout functionality with login refresh
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p><strong>Active:</strong> {isActive ? 'Yes' : 'No'}</p>
              <p><strong>Timeout Duration:</strong> {timeoutHours < 1 ? `${Math.round(timeoutHours * 60)} minutes` : `${timeoutHours % 1 === 0 ? Math.round(timeoutHours) : timeoutHours} hours`}</p>
            </div>
            <div>
              <p><strong>Time Remaining:</strong> {isActive ? formattedRemainingTime : '--:--:--'}</p>
              <p><strong>Raw Milliseconds:</strong> {isActive ? remainingTime.toLocaleString() : 'N/A'}</p>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button onClick={refreshSession}>
              Refresh Session (Simulate Login)
            </Button>
            <Button variant="outline" onClick={recordActivity}>
              Record Activity
            </Button>
          </div>

          <div className="text-sm text-muted-foreground space-y-1">
            <p><strong>How session timeout works:</strong></p>
            <ul className="list-disc list-inside space-y-1">
              <li>Session timeout is based on Supabase auth's <code>last_sign_in_at</code> column</li>
              <li>System checks if current time exceeds last_sign_in_at + timeout hours</li>
              <li>If expired, user is immediately signed out and redirected to login</li>
              <li>Periodic checks every 2 minutes ensure timely session termination</li>
              <li>No local activity tracking - relies purely on authentication timestamps</li>
            </ul>
          </div>

          <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
            <h4 className="font-semibold text-green-800 dark:text-green-200">Supabase Auth Integration</h4>
            <div className="text-sm text-green-600 dark:text-green-400 mt-1">
              Session expiration is determined by the <code>last_sign_in_at</code> timestamp
              in Supabase auth. If the current time exceeds last_sign_in_at + {timeoutHours} hours,
              the session will be terminated immediately.
            </div>
          </div>

          <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <h4 className="font-semibold text-blue-800 dark:text-blue-200">Testing</h4>
            <div className="text-sm text-blue-600 dark:text-blue-400 mt-1 space-y-1">
              <p>To test session timeout:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Set a short timeout (e.g., 5 minutes) in the session settings</li>
                <li>Wait for the specified time to pass</li>
                <li>The system will automatically detect expiration and sign you out</li>
                <li>Check browser console for detailed timeout logs</li>
                <li>Note: 5-minute option is available for quick testing</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}