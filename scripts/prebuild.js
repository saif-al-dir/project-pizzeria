// scripts/prebuild.js
import { config } from 'dotenv';
import { writeFileSync } from 'fs';

// Load environment variables from .env file
config();

// Get the variables from process.env
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

// Check if the variables are loaded
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env file');
}

// Create the content for the config.js file
const configContent = `
// This file is auto-generated. Do not edit it directly.
export const supabaseConfig = {
  url: '${supabaseUrl}',
  anonKey: '${supabaseAnonKey}'
};
`;

// Write the content to src/js/config.js
writeFileSync('src/js/config.js', configContent);

console.log('✅ src/js/config.js generated successfully.');