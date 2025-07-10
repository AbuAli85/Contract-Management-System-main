"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import DashboardLayout from "@/components/dashboard/dashboard-layout"
import GenerateContractForm from "@/components/generate-contract-form"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { 
  Sparkles, FileText, CheckCircle, TrendingUp, Users, Shield, 
  Zap, Globe, Star, Award, Info, AlertTriangle, Settings 
} from "lucide-react"
import "../../../../styles/contract-enhancements.css"

export default function DashboardGenerateContractPage() {
  const [progress, setProgress] = useState(65)
  const [activeFeature, setActiveFeature] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const [insights, setInsights] = useState({
    totalRequiredFields: 25,
    completedFields: 16,
    completionPercentage: 64,
    validationScore: 87,
    complianceStatus: 'Excellent' as 'Excellent' | 'Good' | 'Fair' | 'Poor'
  })

  useEffect(() => {
    const featureTimer = setInterval(() => {
      setActiveFeature(prev => (prev + 1) % 4)
    }, 3000)

    return () => clearInterval(featureTimer)
  }, [])

  const features = [
    { icon: Sparkles, title: "AI-Powered", description: "Smart contract generation", color: "from-blue-500 to-cyan-500" },
    { icon: Shield, title: "100% Compliant", description: "Oman labor law validated", color: "from-green-500 to-emerald-500" },
    { icon: Globe, title: "Bilingual", description: "Arabic & English support", color: "from-purple-500 to-pink-500" },
    { icon: Zap, title: "Lightning Fast", description: "Generate in seconds", color: "from-orange-500 to-red-500" }
  ]

  const stats = [
    { icon: TrendingUp, label: "Success Rate", value: "99.8%", color: "from-green-500 to-emerald-600" },
    { icon: Users, label: "Contracts Generated", value: "10,000+", color: "from-blue-500 to-cyan-600" },
    { icon: Shield, label: "Compliance Score", value: "100%", color: "from-purple-500 to-pink-600" },
    { icon: Star, label: "User Rating", value: "4.9/5", color: "from-orange-500 to-red-600" }
  ]

  if (showForm) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-6xl mx-auto space-y-8"
          >
            {/* Back Button */}
            <Button
              onClick={() => setShowForm(false)}
              variant="outline"
              className="mb-6 bg-white/80 backdrop-blur-sm hover:bg-white/90 border-white/30 shadow-lg"
            >
              ← Back to Overview
            </Button>

            {/* Form Section */}
            <Card className="bg-white/80 backdrop-blur-xl border-white/30 shadow-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-b border-white/20">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-lg">
                    <FileText className="h-10 w-10 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                      Contract Details
                    </CardTitle>
                    <CardDescription className="text-xl mt-2 text-gray-600">
                      Create your professional contract with intelligent assistance
                    </CardDescription>
                  </div>
                </div>
                
                {/* Progress Bar for Form */}
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Form Progress</span>
                    <span className="text-sm font-bold text-blue-600">{insights.completionPercentage}%</span>
                  </div>
                  <Progress value={insights.completionPercentage} className="h-3 bg-gray-200 rounded-full overflow-hidden" />
                </div>
              </CardHeader>
              <CardContent className="p-8 bg-gradient-to-br from-white via-blue-50/20 to-purple-50/20">
                <GenerateContractForm />
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{
              x: [0, 100, 0],
              y: [0, -100, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              x: [0, -120, 0],
              y: [0, 80, 0],
              scale: [1, 0.8, 1],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 5
            }}
            className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-r from-pink-400/20 to-blue-400/20 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              x: [0, 60, 0],
              y: [0, -60, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 10
            }}
            className="absolute top-1/2 left-1/2 w-64 h-64 bg-gradient-to-r from-green-400/15 to-cyan-400/15 rounded-full blur-2xl transform -translate-x-1/2 -translate-y-1/2"
          />
        </div>

        {/* Main Content */}
        <div className="relative z-10 p-8 space-y-12">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center space-y-8"
          >
            <div className="space-y-6">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="flex justify-center"
              >
                <div className="p-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl shadow-2xl">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  >
                    <FileText className="h-16 w-16 text-white" />
                  </motion.div>
                </div>
              </motion.div>

              <div>
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                  className="text-7xl md:text-8xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent leading-tight"
                >
                  Generate Contract
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.6 }}
                  className="text-2xl md:text-3xl text-gray-700 mt-4 font-medium max-w-4xl mx-auto"
                >
                  Create professional bilingual contracts with AI-powered validation and real-time compliance checking
                </motion.p>
              </div>
            </div>

            {/* Feature Badges */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="flex flex-wrap justify-center gap-4"
            >
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className={`flex items-center gap-3 px-6 py-4 rounded-2xl bg-gradient-to-r ${feature.color} text-white shadow-xl backdrop-blur-sm border border-white/20 ${
                    activeFeature === index ? 'ring-4 ring-white/30' : ''
                  }`}
                >
                  <feature.icon className="h-6 w-6" />
                  <div>
                    <div className="font-bold text-lg">{feature.title}</div>
                    <div className="text-sm opacity-90">{feature.description}</div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Progress Showcase */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0, duration: 0.6 }}
            className="max-w-4xl mx-auto"
          >
            <Card className="bg-white/80 backdrop-blur-xl border-white/30 shadow-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 pb-8">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                      Current Progress
                    </CardTitle>
                    <CardDescription className="text-lg mt-2">
                      Your contract generation workflow status
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-4xl font-black text-blue-600">{insights.completionPercentage}%</div>
                    <div className="text-sm text-gray-500">Complete</div>
                  </div>
                </div>
                
                <div className="mt-6">
                  <Progress value={insights.completionPercentage} className="h-4 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-300 ease-out rounded-full"
                      style={{ width: `${insights.completionPercentage}%` }}
                    />
                  </Progress>
                </div>

                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="text-gray-600">{insights.completedFields} of {insights.totalRequiredFields} fields completed</span>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    {insights.complianceStatus} Compliance
                  </Badge>
                </div>
              </CardHeader>
            </Card>
          </motion.div>

          {/* Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.05, y: -10 }}
                className="relative group"
              >
                <Card className="bg-white/80 backdrop-blur-xl border-white/30 shadow-xl overflow-hidden transition-all duration-300 group-hover:shadow-2xl">
                  <CardContent className="p-6 text-center">
                    <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r ${stat.color} flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110`}>
                      <stat.icon className="h-8 w-8 text-white" />
                    </div>
                    <div className="text-3xl font-black text-gray-800 mb-2">{stat.value}</div>
                    <div className="text-sm text-gray-600 font-medium">{stat.label}</div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* Additional Features Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4, duration: 0.6 }}
            className="max-w-6xl mx-auto"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Contract Insights */}
              <Card className="bg-white/80 backdrop-blur-xl border-white/30 shadow-xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg">
                      <Info className="h-5 w-5 text-white" />
                    </div>
                    <CardTitle className="text-lg">Smart Insights</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Validation Score</span>
                      <span className="font-bold text-green-600">{insights.validationScore}/100</span>
                    </div>
                    <Progress value={insights.validationScore} className="h-2" />
                    <div className="text-xs text-gray-500">
                      All contracts are validated against Oman labor law requirements
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contract Types */}
              <Card className="bg-white/80 backdrop-blur-xl border-white/30 shadow-xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-purple-500/10 to-pink-500/10">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                      <FileText className="h-5 w-5 text-white" />
                    </div>
                    <CardTitle className="text-lg">Contract Types</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="font-bold text-blue-600">8</div>
                      <div className="text-gray-600">Available Types</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="font-bold text-green-600">100%</div>
                      <div className="text-gray-600">Compliant</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="bg-white/80 backdrop-blur-xl border-white/30 shadow-xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-green-500/10 to-emerald-500/10">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg">
                      <Zap className="h-5 w-5 text-white" />
                    </div>
                    <CardTitle className="text-lg">Quick Start</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start bg-white/60 hover:bg-white/80 border-gray-200"
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Import Parties
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start bg-white/60 hover:bg-white/80 border-gray-200"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Use Template
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.6, duration: 0.6 }}
            className="text-center space-y-8"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                onClick={() => setShowForm(true)}
                className="px-12 py-6 text-xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-2xl shadow-2xl border-none transform transition-all duration-300"
              >
                <Sparkles className="h-6 w-6 mr-3" />
                Start Creating Your Contract
              </Button>
            </motion.div>

            <div className="flex items-center justify-center gap-8 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span>Free to start</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                <span>Secure & compliant</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-purple-600" />
                <span>Professional quality</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  )
}
