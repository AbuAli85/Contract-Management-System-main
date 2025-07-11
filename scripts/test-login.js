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
)