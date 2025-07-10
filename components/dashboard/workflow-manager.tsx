"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { 
  CheckCircle, 
  Clock, 
  XCircle, 
  ArrowRight, 
  User, 
  MessageSquare, 
  History,
  AlertCircle,
  FileText,
  Users,
  Calendar,
  Eye,
  Edit3,
  Send,
  Pause,
  Play,
  RotateCcw
} from "lucide-react"
// import { useTranslations } from "next-intl"

interface WorkflowStep {
  id: string
  name: string
  description: string
  order: number
  required: boolean
  assignee: {
    id: string
    name: string
    email: string
    avatar?: string
  }
  status: "pending" | "in_progress" | "completed" | "rejected" | "skipped"
  started_at?: string
  completed_at?: string
  notes?: string
  estimated_duration: number // in hours
  actual_duration?: number
}

interface ContractWorkflow {
  id: string
  contract_id: string
  contract_name: string
  workflow_template_id: string
  workflow_template_name: string
  status: "active" | "completed" | "cancelled" | "paused"
  started_at: string
  completed_at?: string
  current_step: number
  total_steps: number
  steps: WorkflowStep[]
  priority: "low" | "medium" | "high" | "urgent"
  deadline?: string
  created_by: {
    id: string
    name: string
    email: string
  }
  comments: Array<{
    id: string
    user: {
      id: string
      name: string
      avatar?: string
    }
    message: string
    created_at: string
  }>
}

interface WorkflowManagerProps {
  workflows: ContractWorkflow[]
  onApproveStep: (workflowId: string, stepId: string, notes?: string) => void
  onRejectStep: (workflowId: string, stepId: string, notes: string) => void
  onSkipStep: (workflowId: string, stepId: string, notes: string) => void
  onAddComment: (workflowId: string, message: string) => void
  onPauseWorkflow: (workflowId: string) => void
  onResumeWorkflow: (workflowId: string) => void
  onCancelWorkflow: (workflowId: string) => void
}

export function WorkflowManager({ 
  workflows, 
  onApproveStep, 
  onRejectStep, 
  onSkipStep,
  onAddComment,
  onPauseWorkflow,
  onResumeWorkflow,
  onCancelWorkflow
}: WorkflowManagerProps) {
  // const t = useTranslations("WorkflowManager")
  const [selectedWorkflow, setSelectedWorkflow] = useState<ContractWorkflow | null>(null)
  const [actionNotes, setActionNotes] = useState("")
  const [commentText, setCommentText] = useState("")
  const [activeTab, setActiveTab] = useState("active")

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800"
      case "in_progress": return "bg-blue-100 text-blue-800"
      case "rejected": return "bg-red-100 text-red-800"
      case "pending": return "bg-yellow-100 text-yellow-800"
      case "skipped": return "bg-gray-100 text-gray-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-500"
      case "high": return "bg-orange-500"
      case "medium": return "bg-yellow-500"
      case "low": return "bg-green-500"
      default: return "bg-gray-500"
    }
  }

  const getProgressPercentage = (workflow: ContractWorkflow) => {
    const completedSteps = workflow.steps.filter(step => step.status === "completed").length
    return (completedSteps / workflow.total_steps) * 100
  }

  const getCurrentStep = (workflow: ContractWorkflow) => {
    return workflow.steps.find(step => step.order === workflow.current_step)
  }

  const filteredWorkflows = workflows.filter(workflow => {
    switch (activeTab) {
      case "active":
        return workflow.status === "active"
      case "completed":
        return workflow.status === "completed"
      case "paused":
        return workflow.status === "paused"
      default:
        return true
    }
  })

  const WorkflowCard = ({ workflow }: { workflow: ContractWorkflow }) => {
    const currentStep = getCurrentStep(workflow)
    const progress = getProgressPercentage(workflow)
    const isOverdue = workflow.deadline && new Date(workflow.deadline) < new Date()

    return (
      <Card className={`hover:shadow-md transition-shadow ${isOverdue ? 'border-red-200' : ''}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <CardTitle className="text-lg">{workflow.contract_name}</CardTitle>
                <div className={`w-2 h-2 rounded-full ${getPriorityColor(workflow.priority)}`} />
                {isOverdue && <AlertCircle className="h-4 w-4 text-red-500" />}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {workflow.workflow_template_name}
              </p>
            </div>
            <Badge variant="secondary" className={getStatusColor(workflow.status)}>
              {workflow.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Progress */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Progress</span>
                <span className="text-sm text-muted-foreground">
                  {workflow.current_step}/{workflow.total_steps}
                </span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Current Step */}
            {currentStep && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm">Current Step</div>
                    <div className="text-sm text-muted-foreground">{currentStep.name}</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={currentStep.assignee.avatar} />
                      <AvatarFallback className="text-xs">
                        {currentStep.assignee.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <Badge variant="outline" className={getStatusColor(currentStep.status)}>
                      {currentStep.status}
                    </Badge>
                  </div>
                </div>
              </div>
            )}

            {/* Timeline */}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center space-x-1">
                <Calendar className="h-3 w-3" />
                <span>{new Date(workflow.started_at).toLocaleDateString()}</span>
              </div>
              {workflow.deadline && (
                <div className={`flex items-center space-x-1 ${isOverdue ? 'text-red-500' : ''}`}>
                  <Clock className="h-3 w-3" />
                  <span>{new Date(workflow.deadline).toLocaleDateString()}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedWorkflow(workflow)}
              >
                <Eye className="h-4 w-4 mr-1" />
                View Details
              </Button>
              <div className="flex items-center space-x-2">
                {workflow.status === "active" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onPauseWorkflow(workflow.id)}
                  >
                    <Pause className="h-4 w-4" />
                  </Button>
                )}
                {workflow.status === "paused" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onResumeWorkflow(workflow.id)}
                  >
                    <Play className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onCancelWorkflow(workflow.id)}
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const WorkflowDetails = ({ workflow }: { workflow: ContractWorkflow }) => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-xl font-semibold">{workflow.contract_name}</h3>
          <p className="text-muted-foreground">{workflow.workflow_template_name}</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className={getStatusColor(workflow.status)}>
            {workflow.status}
          </Badge>
          <div className={`w-3 h-3 rounded-full ${getPriorityColor(workflow.priority)}`} />
        </div>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Workflow Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span>Overall Progress</span>
              <span className="font-medium">{workflow.current_step}/{workflow.total_steps}</span>
            </div>
            <Progress value={getProgressPercentage(workflow)} className="h-2" />
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Started: {new Date(workflow.started_at).toLocaleString()}</span>
              {workflow.deadline && (
                <span>Deadline: {new Date(workflow.deadline).toLocaleString()}</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Steps Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Workflow Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {workflow.steps.map((step, index) => (
              <div key={step.id} className="flex items-start space-x-4">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step.status === "completed" ? "bg-green-500 text-white" :
                    step.status === "in_progress" ? "bg-blue-500 text-white" :
                    step.status === "rejected" ? "bg-red-500 text-white" :
                    "bg-gray-200 text-gray-600"
                  }`}>
                    {step.status === "completed" ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : step.status === "rejected" ? (
                      <XCircle className="h-4 w-4" />
                    ) : (
                      <span className="text-sm">{index + 1}</span>
                    )}
                  </div>
                  {index < workflow.steps.length - 1 && (
                    <div className="w-0.5 h-12 bg-gray-200 mt-2" />
                  )}
                </div>
                
                <div className="flex-1 pb-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{step.name}</h4>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={step.assignee.avatar} />
                        <AvatarFallback className="text-xs">
                          {step.assignee.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <Badge variant="outline" className={getStatusColor(step.status)}>
                        {step.status}
                      </Badge>
                    </div>
                  </div>
                  
                  {step.notes && (
                    <div className="mt-2 p-2 bg-muted rounded text-sm">
                      <strong>Notes:</strong> {step.notes}
                    </div>
                  )}
                  
                  {step.status === "in_progress" && (
                    <div className="mt-3 flex items-center space-x-2">
                      <Button
                        size="sm"
                        onClick={() => onApproveStep(workflow.id, step.id, actionNotes)}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onRejectStep(workflow.id, step.id, actionNotes)}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onSkipStep(workflow.id, step.id, actionNotes)}
                      >
                        <ArrowRight className="h-4 w-4 mr-1" />
                        Skip
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Comments */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Comments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {workflow.comments.map((comment) => (
              <div key={comment.id} className="flex items-start space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={comment.user.avatar} />
                  <AvatarFallback className="text-xs">
                    {comment.user.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-sm">{comment.user.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(comment.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm mt-1">{comment.message}</p>
                </div>
              </div>
            ))}
            
            <div className="flex items-start space-x-3 pt-4 border-t">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">U</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <Textarea
                  placeholder="Add your comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  rows={3}
                />
                <Button
                  size="sm"
                  onClick={() => {
                    onAddComment(workflow.id, commentText)
                    setCommentText("")
                  }}
                  disabled={!commentText.trim()}
                >
                  <Send className="h-4 w-4 mr-1" />
                  Send Comment
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Contract Workflows</h2>
          <p className="text-muted-foreground">Manage contract approval workflows</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <History className="h-4 w-4 mr-1" />
            View History
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Workflows</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workflows.filter(w => w.status === "active").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workflows.filter(w => w.steps.some(s => s.status === "in_progress")).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workflows.filter(w => 
                w.status === "completed" && 
                w.completed_at && 
                new Date(w.completed_at).toDateString() === new Date().toDateString()
              ).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {workflows.filter(w => 
                w.deadline && 
                new Date(w.deadline) < new Date() && 
                w.status === "active"
              ).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Workflows */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="paused">Paused</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {filteredWorkflows.map(workflow => (
              <WorkflowCard key={workflow.id} workflow={workflow} />
            ))}
          </div>
          
          {filteredWorkflows.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No workflows found</h3>
              <p className="text-muted-foreground">Create your first workflow to get started</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Workflow Details Dialog */}
      <Dialog open={!!selectedWorkflow} onOpenChange={() => setSelectedWorkflow(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Workflow Details</DialogTitle>
          </DialogHeader>
          {selectedWorkflow && <WorkflowDetails workflow={selectedWorkflow} />}
        </DialogContent>
      </Dialog>
    </div>
  )
}
