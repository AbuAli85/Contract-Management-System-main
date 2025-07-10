import React from "react"
import { UserManagement } from "@/components/director/user-management"
import { RolesPermissions } from "@/components/director/roles-permissions"
import { WorkflowDirector } from "@/components/director/workflow-director"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

export default function DirectorPage() {
  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold mb-4">Director: Admin & Workflow Center</h1>
      <Tabs defaultValue="users" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
        </TabsList>
        <TabsContent value="users">
          <UserManagement />
        </TabsContent>
        <TabsContent value="roles">
          <RolesPermissions />
        </TabsContent>
        <TabsContent value="workflows">
          <WorkflowDirector />
        </TabsContent>
      </Tabs>
    </div>
  )
}
