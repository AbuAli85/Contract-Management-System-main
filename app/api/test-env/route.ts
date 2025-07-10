import { NextResponse } from "next/server"

export async function GET() {
  try {
    const envVars = {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      serviceRoleKeyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0,
      serviceRoleKeyStart: process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20) || 'N/A',
      nodeEnv: process.env.NODE_ENV,
    }
    
    return NextResponse.json(
      { 
        success: true, 
        message: "Environment variables check",
        envVars 
      },
      { status: 200 }
    )
  } catch (error: any) {
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to check environment variables",
        details: error.message 
      },
      { status: 500 }
    )
  }
}
