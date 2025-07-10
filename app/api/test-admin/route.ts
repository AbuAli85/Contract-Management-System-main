import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"

export async function GET() {
  try {
    console.log("Testing Supabase admin client...")
    
    const supabaseAdmin = getSupabaseAdmin()
    console.log("✓ Supabase admin client created successfully")
    
    // Test a simple query
    const { data, error } = await supabaseAdmin
      .from("contracts")
      .select("count")
      .limit(1)
    
    if (error) {
      console.error("✗ Supabase admin query error:", error)
      return NextResponse.json(
        { 
          success: false, 
          error: "Admin client query failed",
          details: error.message 
        },
        { status: 500 }
      )
    }
    
    console.log("✓ Supabase admin query successful")
    return NextResponse.json(
      { 
        success: true, 
        message: "Supabase admin client is working correctly",
        data 
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("✗ Supabase admin client test failed:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to initialize Supabase admin client",
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
