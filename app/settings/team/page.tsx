/**
 * Team Management Page
 * 
 * Allows organization admins and managers to view team members,
 * invite new users, manage roles, and remove members.
 * 
 * @route /settings/team
 * @protected Requires authentication and manager/admin role
 */
'use client'

import { useState, useEffect } from 'react'
import { useOrganization } from '@/hooks/use-organization'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  UserPlus,
  Users,
  MoreVertical,
  Mail,
  Loader2,
  AlertCircle,
  Crown,
  Shield,
  User,
  Trash2,
  Edit
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import PageLayout from '@/components/page-layout'
import { Database } from '@/types/database.types'

type UserRole = Database['public']['Enums']['user_role']

interface TeamMember {
  id: string
  userId: string
  role: UserRole
  joinedAt: string | null
  invitedAt: string
  isActive: boolean
  user: {
    email: string
    firstName: string | null
    lastName: string | null
  }
}

export default function TeamManagementPage() {
  const { activeOrganization, userRole } = useOrganization()
  const { toast } = useToast()

  // Team state
  const [members, setMembers] = useState<TeamMember[]>([])
  const [isLoadingMembers, setIsLoadingMembers] = useState(true)

  // Invite dialog state
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<UserRole>('operator')
  const [isInviting, setIsInviting] = useState(false)
  const [inviteError, setInviteError] = useState('')

  /**
   * Check if user can manage team
   */
  const canManageTeam = userRole === 'admin' || userRole === 'manager'

  /**
   * Load team members
   */
  const loadMembers = async () => {
    if (!activeOrganization) return

    try {
      setIsLoadingMembers(true)
      const response = await fetch(`/api/organizations/${activeOrganization.id}/members`)

      if (!response.ok) {
        throw new Error('Failed to load team members')
      }

      const data = await response.json()
      setMembers(data.members || [])
    } catch (error) {
      console.error('Error loading members:', error)
      toast({
        title: 'Error',
        description: 'Failed to load team members',
        variant: 'destructive',
      })
    } finally {
      setIsLoadingMembers(false)
    }
  }

  useEffect(() => {
    loadMembers()
  }, [activeOrganization])

  /**
   * Handle inviting a new user
   */
  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setInviteError('')

    if (!inviteEmail.trim()) {
      setInviteError('Email is required')
      return
    }

    if (!activeOrganization) {
      setInviteError('No active organization')
      return
    }

    try {
      setIsInviting(true)

      const response = await fetch(`/api/organizations/${activeOrganization.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send invitation')
      }

      toast({
        title: 'Invitation sent!',
        description: `An invitation has been sent to ${inviteEmail}`,
      })

      setIsInviteOpen(false)
      setInviteEmail('')
      setInviteRole('operator')
      loadMembers() // Refresh members list
    } catch (error) {
      console.error('Invite error:', error)
      setInviteError(error instanceof Error ? error.message : 'Failed to send invitation')
    } finally {
      setIsInviting(false)
    }
  }

  /**
   * Handle changing a member's role
   */
  const handleChangeRole = async (memberId: string, newRole: UserRole) => {
    if (!activeOrganization) return

    try {
      const response = await fetch(
        `/api/organizations/${activeOrganization.id}/members/${memberId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: newRole }),
        }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update role')
      }

      toast({
        title: 'Role updated',
        description: 'Member role has been updated successfully',
      })

      loadMembers() // Refresh members list
    } catch (error) {
      console.error('Update role error:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update role',
        variant: 'destructive',
      })
    }
  }

  /**
   * Handle removing a member
   */
  const handleRemoveMember = async (memberId: string, email: string) => {
    if (!activeOrganization) return

    if (!confirm(`Are you sure you want to remove ${email} from the organization?`)) {
      return
    }

    try {
      const response = await fetch(
        `/api/organizations/${activeOrganization.id}/members/${memberId}`,
        {
          method: 'DELETE',
        }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to remove member')
      }

      toast({
        title: 'Member removed',
        description: `${email} has been removed from the organization`,
      })

      loadMembers() // Refresh members list
    } catch (error) {
      console.error('Remove member error:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to remove member',
        variant: 'destructive',
      })
    }
  }

  /**
   * Get role icon
   */
  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return <Crown className="h-4 w-4 text-purple-600" />
      case 'manager':
        return <Shield className="h-4 w-4 text-blue-600" />
      case 'operator':
        return <User className="h-4 w-4 text-green-600" />
    }
  }

  /**
   * Get role badge variant
   */
  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return <Badge variant="default">{role}</Badge>
      case 'manager':
        return <Badge variant="secondary">{role}</Badge>
      case 'operator':
        return <Badge variant="outline">{role}</Badge>
    }
  }

  if (!activeOrganization) {
    return (
      <PageLayout title="Team Management">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>No active organization found</AlertDescription>
        </Alert>
      </PageLayout>
    )
  }

  if (!canManageTeam) {
    return (
      <PageLayout title="Team Management">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You do not have permission to manage team members
          </AlertDescription>
        </Alert>
      </PageLayout>
    )
  }

  return (
    <PageLayout title="Team Management">
      <div className="max-w-6xl space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle>Team Members</CardTitle>
                  <CardDescription>
                    Manage your organization's team and permissions
                  </CardDescription>
                </div>
              </div>

              <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Invite Member
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Invite Team Member</DialogTitle>
                    <DialogDescription>
                      Send an invitation to join your organization
                    </DialogDescription>
                  </DialogHeader>

                  <form onSubmit={handleInvite} className="space-y-4">
                    {inviteError && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{inviteError}</AlertDescription>
                      </Alert>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="colleague@example.com"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        disabled={isInviting}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="role">Role *</Label>
                      <Select
                        value={inviteRole}
                        onValueChange={(value) => setInviteRole(value as UserRole)}
                        disabled={isInviting}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="operator">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              Operator
                            </div>
                          </SelectItem>
                          <SelectItem value="manager">
                            <div className="flex items-center gap-2">
                              <Shield className="h-4 w-4" />
                              Manager
                            </div>
                          </SelectItem>
                          {userRole === 'admin' && (
                            <SelectItem value="admin">
                              <div className="flex items-center gap-2">
                                <Crown className="h-4 w-4" />
                                Admin
                              </div>
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500">
                        Operators can view and create. Managers can also update and delete.
                        Admins have full access.
                      </p>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsInviteOpen(false)}
                        disabled={isInviting}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isInviting}>
                        {isInviting ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Mail className="h-4 w-4 mr-2" />
                            Send Invitation
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>

          <CardContent>
            {isLoadingMembers ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : members.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No team members yet</p>
                <p className="text-sm text-gray-500 mt-2">
                  Start by inviting your first team member
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                            {getRoleIcon(member.role)}
                          </div>
                          <div>
                            <div className="font-medium">
                              {member.user.firstName && member.user.lastName
                                ? `${member.user.firstName} ${member.user.lastName}`
                                : 'Pending'}
                            </div>
                            <div className="text-sm text-gray-500">{member.user.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getRoleBadge(member.role)}</TableCell>
                      <TableCell>
                        {member.joinedAt ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                            Pending
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {member.joinedAt
                          ? new Date(member.joinedAt).toLocaleDateString()
                          : 'Not yet'}
                      </TableCell>
                      <TableCell className="text-right">
                        {userRole === 'admin' && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleChangeRole(member.id, 'operator')}
                                disabled={member.role === 'operator'}
                              >
                                <User className="h-4 w-4 mr-2" />
                                Set as Operator
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleChangeRole(member.id, 'manager')}
                                disabled={member.role === 'manager'}
                              >
                                <Shield className="h-4 w-4 mr-2" />
                                Set as Manager
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleChangeRole(member.id, 'admin')}
                                disabled={member.role === 'admin'}
                              >
                                <Crown className="h-4 w-4 mr-2" />
                                Set as Admin
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleRemoveMember(member.id, member.user.email)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Remove Member
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Role Permissions Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Role Permissions</CardTitle>
            <CardDescription>Understanding team member roles</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Crown className="h-5 w-5 text-purple-600 mt-0.5" />
                <div>
                  <h4 className="font-medium">Admin</h4>
                  <p className="text-sm text-gray-600">
                    Full access to all features, including organization settings, team management,
                    and billing.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium">Manager</h4>
                  <p className="text-sm text-gray-600">
                    Can manage inventory, production, and suppliers. Can also invite team members.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium">Operator</h4>
                  <p className="text-sm text-gray-600">
                    Can view and create records, but cannot delete or manage settings.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  )
}
