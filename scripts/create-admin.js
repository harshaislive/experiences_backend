import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createAdmin() {
  try {
    const { data, error } = await supabase.auth.signUp({
      email: adminEmail,
      password: adminPassword,
    });

    if (error) {
      console.error('Error creating admin:', error.message);
      return;
    }

    console.log('Admin user created successfully:', data);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

createAdmin();
