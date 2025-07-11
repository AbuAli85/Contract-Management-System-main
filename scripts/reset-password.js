// scripts/reset-password.js
// This script uses Supabase Admin API to reset a user's password by ID.

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client with service role key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  try {
    const userId = '611d9a4a-b202-4112-9869-cff47872ac40'; // Replace with actual user ID
    const newPassword = 'AbuAli@@000310785000@@'; // New desired password

    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: newPassword,
    });

    if (error) {
      console.error('Error resetting password:', error);
      process.exit(1);
    }

    console.log('Password reset successful for user ID:', userId);
    console.log('Response:', data);
  } catch (err) {
    console.error('Unexpected error:', err);
    process.exit(1);
  }
})();
