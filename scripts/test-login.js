const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

(async () => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'Luxsess2001@gmail.com',
    password: 'AbuAli@@000310785000@@'
  });
  console.log({ data, error });
})();console.log(
  Array.from(process.env.NEXT_PUBLIC_SUPABASE_URL).map(ch => `${ch}(${ch.charCodeAt(0)})`).join(' ')
)// scripts/reset-password.js
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

// Use your service-role key here
const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

;(async () => {
  const userId = '611d9a4a-b202-4112-9869-cff47872ac40'
  const newPassword = 'AbuAli@@000310785000@@'
  const { data, error } = await admin.auth.admin.updateUserById(userId, {
    password: newPassword,
  })
  console.log({ data, error })
})()