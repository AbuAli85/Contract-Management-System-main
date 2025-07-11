"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { updateProfileSchema, changePasswordSchema } from "@/lib/auth/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useSupabase } from "@/components/supabase-provider"
import { 
  User,
  Mail,
  Lock,
  Shield,
  Smartphone,
  Key,
  Activity,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Camera,
  Download,
  Copy,
  RefreshCw,
  LogOut,
  Trash2
} from "lucide-react"
import { format } from "date-fns"
import Image from "next/image"

export default function AccountSettingsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { supabase } = useSupabase()
  
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [mfaSettings, setMfaSettings] = useState<any>(null)
  const [sessions, setSessions] = useState<any[]>([])
  const [authLogs, setAuthLogs] = useState<any[]>([])
  
  // MFA setup states
  const [showMFASetup, setShowMFASetup] = useState(false)
  const [mfaSecret, setMfaSecret] = useState("")
  const [mfaQRCode, setMfaQRCode] = useState("")
  const [mfaBackupCodes, setMfaBackupCodes] = useState<string[]>([])
  const [mfaVerificationCode, setMfaVerificationCode] = useState("")
  
  // Form states
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  
  const profileForm = useForm({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      avatarUrl: ""
    }
  })
  
  const passwordForm = useForm({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    }
  })
  
  useEffect(() => {
    fetchUserData()
  }, [])
  
  async function fetchUserData() {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) throw userError
      
      setUser(user)
      
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (profileError) throw profileError
      setProfile(profileData)
      
      // Set form defaults
      profileForm.reset({
        fullName: profileData.full_name || "",
        phone: profileData.phone || "",
        avatarUrl: profileData.avatar_url || ""
      })
      
      // Fetch MFA settings
      const { data: mfaData } = await supabase
        .from('mfa_settings')
        .select('*')
        .eq('user_id', user.id)
        .single()
      
      setMfaSettings(mfaData)
      
      // Fetch active sessions
      const { data: sessionsData } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('last_activity_at', { ascending: false })
      
      setSessions(sessionsData || [])
      
      // Fetch recent auth logs
      const { data: logsData } = await supabase
        .from('auth_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)
      
      setAuthLogs(logsData || [])
    } catch (error: any) {
      toast({
        title: "Error loading account data",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }
  
  async function updateProfile(data: any) {
    setIsUpdatingProfile(true)
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: data.fullName,
          phone: data.phone,
          avatar_url: data.avatarUrl
        })
        .eq('id', user.id)
      
      if (error) throw error
      
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully"
      })
      
      fetchUserData()
    } catch (error: any) {
      toast({
        title: "Error updating profile",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setIsUpdatingProfile(false)
    }
  }
  
  async function changePassword(data: any) {
    setIsChangingPassword(true)
    
    try {
      // Verify current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: data.currentPassword
      })
      
      if (signInError) {
        throw new Error("Current password is incorrect")
      }
      
      // Update password
      const { error } = await supabase.auth.updateUser({
        password: data.newPassword
      })
      
      if (error) throw error
      
      toast({
        title: "Password changed",
        description: "Your password has been changed successfully"
      })
      
      passwordForm.reset()
    } catch (error: any) {
      toast({
        title: "Error changing password",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setIsChangingPassword(false)
    }
  }
  
  async function setupMFA() {
    try {
      const response = await fetch("/api/auth/mfa/setup", {
        method: "POST"
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || "Failed to setup MFA")
      }
      
      setMfaSecret(result.secret)
      setMfaQRCode(result.qrCode)
      setMfaBackupCodes(result.backupCodes)
      setShowMFASetup(true)
    } catch (error: any) {
      toast({
        title: "Error setting up MFA",
        description: error.message,
        variant: "destructive"
      })
    }
  }
  
  async function verifyMFA() {
    try {
      const response = await fetch("/api/auth/mfa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: mfaVerificationCode })
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || "Verification failed")
      }
      
      toast({
        title: "MFA enabled",
        description: "Two-factor authentication has been enabled for your account"
      })
      
      setShowMFASetup(false)
      fetchUserData()
    } catch (error: any) {
      toast({
        title: "Verification failed",
        description: error.message,
        variant: "destructive"
      })
    }
  }
  
  async function disableMFA() {
    try {
      const { error } = await supabase
        .from('mfa_settings')
        .update({ totp_enabled: false })
        .eq('user_id', user.id)
      
      if (error) throw error
      
      toast({
        title: "MFA disabled",
        description: "Two-factor authentication has been disabled"
      })
      
      fetchUserData()
    } catch (error: any) {
      toast({
        title: "Error disabling MFA",
        description: error.message,
        variant: "destructive"
      })
    }
  }
  
  async function revokeSession(sessionId: string) {
    try {
      const { error } = await supabase
        .from('user_sessions')
        .delete()
        .eq('id', sessionId)
      
      if (error) throw error
      
      toast({
        title: "Session revoked",
        description: "The session has been terminated"
      })
      
      fetchUserData()
    } catch (error: any) {
      toast({
        title: "Error revoking session",
        description: error.message,
        variant: "destructive"
      })
    }
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }
  
  return (
    <div className="container max-w-4xl py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Account Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account settings and security preferences
        </p>
      </div>
      
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your personal information and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="relative">
                  {profile?.avatar_url ? (
                    <Image
                      src={profile.avatar_url}
                      alt="Avatar"
                      width={80}
                      height={80}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-10 w-10 text-primary" />
                    </div>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute bottom-0 right-0 rounded-full p-1 h-8 w-8"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
                
                <div>
                  <p className="font-medium">{profile?.full_name || 'No name set'}</p>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                  <Badge variant="outline" className="mt-2">
                    <Shield className="mr-1 h-3 w-3" />
                    {profile?.role || 'user'}
                  </Badge>
                </div>
              </div>
              
              <Separator />
              
              <form onSubmit={profileForm.handleSubmit(updateProfile)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    {...profileForm.register("fullName")}
                    placeholder="John Doe"
                  />
                  {profileForm.formState.errors.fullName && (
                    <p className="text-sm text-destructive">
                      {profileForm.formState.errors.fullName.message}
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    {...profileForm.register("phone")}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                
                <Button type="submit" disabled={isUpdatingProfile}>
                  {isUpdatingProfile ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Profile"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>
                Update your password to keep your account secure
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={passwordForm.handleSubmit(changePassword)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    {...passwordForm.register("currentPassword")}
                    type="password"
                    placeholder="••••••••"
                  />
                  {passwordForm.formState.errors.currentPassword && (
                    <p className="text-sm text-destructive">
                      {passwordForm.formState.errors.currentPassword.message}
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    {...passwordForm.register("newPassword")}
                    type="password"
                    placeholder="••••••••"
                  />
                  {passwordForm.formState.errors.newPassword && (
                    <p className="text-sm text-destructive">
                      {passwordForm.formState.errors.newPassword.message}
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    {...passwordForm.register("confirmPassword")}
                    type="password"
                    placeholder="••••••••"
                  />
                  {passwordForm.formState.errors.confirmPassword && (
                    <p className="text-sm text-destructive">
                      {passwordForm.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>
                
                <Button type="submit" disabled={isChangingPassword}>
                  {isChangingPassword ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Changing...
                    </>
                  ) : (
                    "Change Password"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Two-Factor Authentication</CardTitle>
              <CardDescription>
                Add an extra layer of security to your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              {mfaSettings?.totp_enabled ? (
                <div className="space-y-4">
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      Two-factor authentication is enabled for your account
                    </AlertDescription>
                  </Alert>
                  
                  <Button variant="destructive" onClick={disableMFA}>
                    Disable Two-Factor Authentication
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Two-factor authentication is not enabled. Enable it to add an extra layer of security.
                    </AlertDescription>
                  </Alert>
                  
                  <Button onClick={setupMFA}>
                    <Smartphone className="mr-2 h-4 w-4" />
                    Enable Two-Factor Authentication
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="sessions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Active Sessions</CardTitle>
              <CardDescription>
                Manage your active sessions across different devices
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">
                        {session.user_agent?.includes('Mobile') ? 'Mobile Device' : 'Desktop'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {session.ip_address} • Last active {format(new Date(session.last_activity_at), 'PPp')}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => revokeSession(session.id)}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Revoke
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Your recent account activity and security events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {authLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-4 p-4 border rounded-lg">
                    <div className={`rounded-full p-2 ${
                      log.success ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                    }`}>
                      <Activity className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">
                        {log.event_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(log.created_at), 'PPp')} • {log.ip_address}
                      </p>
                      {log.error_message && (
                        <p className="text-sm text-destructive mt-1">{log.error_message}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* MFA Setup Dialog */}
      {showMFASetup && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50">
          <div className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg sm:rounded-lg">
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold">Setup Two-Factor Authentication</h2>
                <p className="text-sm text-muted-foreground">
                  Scan the QR code with your authenticator app
                </p>
              </div>
              
              <div className="flex justify-center">
                <img src={mfaQRCode} alt="MFA QR Code" className="border rounded" />
              </div>
              
              <div className="space-y-2">
                <Label>Manual Entry Code</Label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-2 bg-muted rounded text-sm">{mfaSecret}</code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(mfaSecret)
                      toast({ title: "Copied to clipboard" })
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <Alert>
                <Key className="h-4 w-4" />
                <AlertDescription>
                  Save these backup codes in a safe place. You can use them to access your account if you lose your device.
                </AlertDescription>
              </Alert>
              
              <div className="grid grid-cols-2 gap-2">
                {mfaBackupCodes.map((code, index) => (
                  <code key={index} className="p-2 bg-muted rounded text-sm text-center">
                    {code}
                  </code>
                ))}
              </div>
              
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  const codes = mfaBackupCodes.join('\n')
                  const blob = new Blob([codes], { type: 'text/plain' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = 'backup-codes.txt'
                  a.click()
                }}
              >
                <Download className="mr-2 h-4 w-4" />
                Download Backup Codes
              </Button>
              
              <Separator />
              
              <div className="space-y-2">
                <Label>Verification Code</Label>
                <Input
                  type="text"
                  placeholder="000000"
                  value={mfaVerificationCode}
                  onChange={(e) => setMfaVerificationCode(e.target.value)}
                  maxLength={6}
                  className="text-center text-2xl tracking-widest"
                />
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowMFASetup(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={verifyMFA}
                  disabled={mfaVerificationCode.length !== 6}
                >
                  Verify & Enable
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}