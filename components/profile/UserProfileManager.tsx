"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { useEnhancedAuth, UserAvatar, UserRoleBadge } from "@/components/auth/EnhancedAuth"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  User,
  Mail,
  Phone,
  MapPin,
  Globe,
  Bell,
  Shield,
  Key,
  Camera,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Activity,
  Settings,
  Trash2,
  Download,
  Upload
} from "lucide-react"
import { format, formatDistanceToNow } from "date-fns"
import { LoadingSpinner } from "@/components/ui/skeletons"

interface ProfileFormData {
  full_name: string
  phone: string
  department: string
  timezone: string
  language: string
  bio: string
}

interface NotificationSettings {
  email_notifications: boolean
  push_notifications: boolean
  contract_updates: boolean
  payment_reminders: boolean
  deadline_alerts: boolean
  system_updates: boolean
}

interface SecuritySettings {
  two_factor_enabled: boolean
  session_timeout: number
  login_alerts: boolean
}

export function UserProfileManager() {
  const { user, profile, updateProfile, updatePassword, signOut, refreshProfile, loading: authLoading } = useEnhancedAuth()
  const { toast } = useToast()
  
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("profile")
  
  // Profile form state
  const [profileForm, setProfileForm] = useState<ProfileFormData>({
    full_name: '',
    phone: '',
    department: '',
    timezone: '',
    language: '',
    bio: ''
  })
  
  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  
  // Notification settings state
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    email_notifications: true,
    push_notifications: true,
    contract_updates: true,
    payment_reminders: true,
    deadline_alerts: true,
    system_updates: false
  })
  
  // Security settings state
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    two_factor_enabled: false,
    session_timeout: 30,
    login_alerts: true
  })

  // Initialize form data from profile
  useEffect(() => {
    if (profile) {
      setProfileForm({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        department: profile.department || '',
        timezone: profile.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: profile.language || 'en',
        bio: (profile as any).bio || ''
      })
      
      setNotificationSettings({
        email_notifications: profile.email_notifications ?? true,
        push_notifications: profile.push_notifications ?? true,
        contract_updates: (profile as any).contract_updates ?? true,
        payment_reminders: (profile as any).payment_reminders ?? true,
        deadline_alerts: (profile as any).deadline_alerts ?? true,
        system_updates: (profile as any).system_updates ?? false
      })
      
      setSecuritySettings({
        two_factor_enabled: profile.two_factor_enabled ?? false,
        session_timeout: (profile as any).session_timeout ?? 30,
        login_alerts: (profile as any).login_alerts ?? true
      })
    }
  }, [profile])

  // Handle profile update
  const handleProfileUpdate = async () => {
    setLoading(true)
    try {
      const { error } = await updateProfile({
        ...profileForm,
        updated_at: new Date().toISOString()
      })

      if (error) {
        toast({
          title: "Error",
          description: error,
          variant: "destructive"
        })
      } else {
        toast({
          title: "Success",
          description: "Profile updated successfully",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Handle password update
  const handlePasswordUpdate = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive"
      })
      return
    }

    if (passwordForm.newPassword.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters long",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      const { error } = await updatePassword(passwordForm.newPassword)

      if (error) {
        toast({
          title: "Error",
          description: error,
          variant: "destructive"
        })
      } else {
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
        toast({
          title: "Success",
          description: "Password updated successfully",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update password",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Handle notification settings update
  const handleNotificationUpdate = async () => {
    setLoading(true)
    try {
      const { error } = await updateProfile({
        ...notificationSettings,
        updated_at: new Date().toISOString()
      })

      if (error) {
        toast({
          title: "Error",
          description: error,
          variant: "destructive"
        })
      } else {
        toast({
          title: "Success",
          description: "Notification settings updated successfully",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update notification settings",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Handle security settings update
  const handleSecurityUpdate = async () => {
    setLoading(true)
    try {
      const { error } = await updateProfile({
        ...securitySettings,
        updated_at: new Date().toISOString()
      })

      if (error) {
        toast({
          title: "Error",
          description: error,
          variant: "destructive"
        })
      } else {
        toast({
          title: "Success",
          description: "Security settings updated successfully",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update security settings",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Handle account deletion
  const handleAccountDeletion = async () => {
    // This would typically involve calling an API endpoint to handle account deletion
    toast({
      title: "Account Deletion",
      description: "Account deletion is not implemented in this demo",
      variant: "destructive"
    })
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
        <span className="ml-2">Loading profile...</span>
      </div>
    )
  }

  if (!user || !profile) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <AlertTriangle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Profile Not Found</h3>
          <p className="text-gray-600 mb-6">Unable to load your profile information.</p>
          <Button onClick={refreshProfile}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={refreshProfile}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" onClick={() => window.print()}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Profile Overview Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <UserAvatar user={profile} size="lg" />
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{profile.full_name || 'No name set'}</h2>
              <p className="text-muted-foreground">{profile.email}</p>
              <div className="flex items-center space-x-2 mt-2">
                <UserRoleBadge role={profile.role} />
                {profile.department && (
                  <Badge variant="outline">{profile.department}</Badge>
                )}
                {profile.last_login && (
                  <Badge variant="secondary">
                    <Clock className="mr-1 h-3 w-3" />
                    Last login {formatDistanceToNow(new Date(profile.last_login), { addSuffix: true })}
                  </Badge>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Member since</p>
              <p className="font-medium">
                {profile.created_at ? format(new Date(profile.created_at), 'MMM dd, yyyy') : 'Unknown'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-1">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="danger">Danger Zone</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="profile" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    value={profileForm.full_name}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, full_name: e.target.value }))}
                    placeholder="Enter your full name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    value={profile.email}
                    disabled
                    className="bg-gray-50"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Email cannot be changed. Contact support if needed.
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Enter your phone number"
                  />
                </div>
                
                <div>
                  <Label htmlFor="department">Department</Label>
                  <Select
                    value={profileForm.department}
                    onValueChange={(value) => setProfileForm(prev => ({ ...prev, department: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hr">Human Resources</SelectItem>
                      <SelectItem value="legal">Legal</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                      <SelectItem value="operations">Operations</SelectItem>
                      <SelectItem value="it">Information Technology</SelectItem>
                      <SelectItem value="management">Management</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Preferences */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select
                    value={profileForm.timezone}
                    onValueChange={(value) => setProfileForm(prev => ({ ...prev, timezone: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/New_York">Eastern Time</SelectItem>
                      <SelectItem value="America/Chicago">Central Time</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                      <SelectItem value="Europe/London">London</SelectItem>
                      <SelectItem value="Europe/Paris">Paris</SelectItem>
                      <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                      <SelectItem value="Asia/Dubai">Dubai</SelectItem>
                      <SelectItem value="Asia/Riyadh">Riyadh</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="language">Language</Label>
                  <Select
                    value={profileForm.language}
                    onValueChange={(value) => setProfileForm(prev => ({ ...prev, language: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="ar">العربية</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="de">Deutsch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={profileForm.bio}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder="Tell us about yourself..."
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="flex justify-end">
            <Button onClick={handleProfileUpdate} disabled={loading}>
              {loading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Password */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Change Password
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                    placeholder="Enter new password"
                  />
                </div>
                
                <div>
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="Confirm new password"
                  />
                </div>
                
                <Button onClick={handlePasswordUpdate} disabled={loading} className="w-full">
                  {loading ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Key className="mr-2 h-4 w-4" />
                      Update Password
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Security Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">
                      Add an extra layer of security
                    </p>
                  </div>
                  <Switch
                    checked={securitySettings.two_factor_enabled}
                    onCheckedChange={(checked) => 
                      setSecuritySettings(prev => ({ ...prev, two_factor_enabled: checked }))
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Login Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified of new logins
                    </p>
                  </div>
                  <Switch
                    checked={securitySettings.login_alerts}
                    onCheckedChange={(checked) => 
                      setSecuritySettings(prev => ({ ...prev, login_alerts: checked }))
                    }
                  />
                </div>
                
                <div>
                  <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                  <Select
                    value={securitySettings.session_timeout.toString()}
                    onValueChange={(value) => 
                      setSecuritySettings(prev => ({ ...prev, session_timeout: parseInt(value) }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="120">2 hours</SelectItem>
                      <SelectItem value="480">8 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button onClick={handleSecurityUpdate} disabled={loading} className="w-full">
                  {loading ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Shield className="mr-2 h-4 w-4" />
                      Update Security
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications via email
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.email_notifications}
                    onCheckedChange={(checked) => 
                      setNotificationSettings(prev => ({ ...prev, email_notifications: checked }))
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive push notifications in browser
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.push_notifications}
                    onCheckedChange={(checked) => 
                      setNotificationSettings(prev => ({ ...prev, push_notifications: checked }))
                    }
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Contract Updates</Label>
                    <p className="text-sm text-muted-foreground">
                      Notifications about contract changes
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.contract_updates}
                    onCheckedChange={(checked) => 
                      setNotificationSettings(prev => ({ ...prev, contract_updates: checked }))
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Payment Reminders</Label>
                    <p className="text-sm text-muted-foreground">
                      Reminders for upcoming payments
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.payment_reminders}
                    onCheckedChange={(checked) => 
                      setNotificationSettings(prev => ({ ...prev, payment_reminders: checked }))
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Deadline Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Alerts for approaching deadlines
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.deadline_alerts}
                    onCheckedChange={(checked) => 
                      setNotificationSettings(prev => ({ ...prev, deadline_alerts: checked }))
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>System Updates</Label>
                    <p className="text-sm text-muted-foreground">
                      Notifications about system maintenance
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.system_updates}
                    onCheckedChange={(checked) => 
                      setNotificationSettings(prev => ({ ...prev, system_updates: checked }))
                    }
                  />
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button onClick={handleNotificationUpdate} disabled={loading}>
                  {loading ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Preferences
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Account Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">Profile Updated</p>
                      <p className="text-sm text-muted-foreground">
                        {profile.updated_at ? formatDistanceToNow(new Date(profile.updated_at), { addSuffix: true }) : 'Never'}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">Last Login</p>
                      <p className="text-sm text-muted-foreground">
                        {profile.last_login ? formatDistanceToNow(new Date(profile.last_login), { addSuffix: true }) : 'Never'}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium">Account Created</p>
                      <p className="text-sm text-muted-foreground">
                        {profile.created_at ? format(new Date(profile.created_at), 'PPP') : 'Unknown'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="danger" className="space-y-6">
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="h-5 w-5" />
                Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <h3 className="font-medium text-red-800 mb-2">Delete Account</h3>
                <p className="text-sm text-red-700 mb-4">
                  Once you delete your account, there is no going back. Please be certain.
                </p>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Account
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your account
                        and remove your data from our servers.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleAccountDeletion} className="bg-red-600 hover:bg-red-700">
                        Delete Account
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
              
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <h3 className="font-medium text-orange-800 mb-2">Sign Out All Devices</h3>
                <p className="text-sm text-orange-700 mb-4">
                  This will sign you out of all devices and sessions.
                </p>
                <Button variant="outline" onClick={signOut}>
                  Sign Out Everywhere
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}