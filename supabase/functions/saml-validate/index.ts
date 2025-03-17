
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { decode as base64Decode } from "https://deno.land/std@0.177.0/encoding/base64.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.36.0";

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const { samlResponse, redirectUri } = await req.json();
    
    if (!samlResponse) {
      return new Response(
        JSON.stringify({ error: 'Missing SAML response' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Get ADFS configuration from environment variables
    const entityId = Deno.env.get('ADFS_ENTITY_ID');
    
    if (!entityId) {
      console.error('Missing ADFS SAML configuration');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('Processing SAML response');
    
    // Decode the SAML response
    const decodedSamlResponse = new TextDecoder().decode(base64Decode(samlResponse));
    
    // Simple XML parsing to extract user information
    // In a production environment, use a proper XML parser and validate the signature
    const emailMatch = decodedSamlResponse.match(/<saml:Attribute Name="http:\/\/schemas\.xmlsoap\.org\/ws\/2005\/05\/identity\/claims\/emailaddress"[^>]*><saml:AttributeValue[^>]*>([^<]+)<\/saml:AttributeValue>/);
    const nameMatch = decodedSamlResponse.match(/<saml:Attribute Name="http:\/\/schemas\.xmlsoap\.org\/ws\/2005\/05\/identity\/claims\/name"[^>]*><saml:AttributeValue[^>]*>([^<]+)<\/saml:AttributeValue>/);
    
    const email = emailMatch ? emailMatch[1] : null;
    const name = nameMatch ? nameMatch[1] : null;
    
    if (!email) {
      return new Response(
        JSON.stringify({ error: 'No email found in SAML response' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Connect to Supabase database to find the user
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );
    
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error || !user) {
      console.error('User lookup error:', error);
      return new Response(
        JSON.stringify({ error: `User with email ${email} not found` }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Set a secure HTTP-only cookie with the user's session information
    const session = {
      userId: user.id,
      email: user.email,
      role: user.type,
      // Set expiration to 24 hours from now
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
    };
    
    // Sign the session with a secure key
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(Deno.env.get('SESSION_SECRET') || 'default-secret-change-this'),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    
    const signature = await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(JSON.stringify(session))
    );
    
    const sessionToken = btoa(String.fromCharCode(...new Uint8Array(signature)));
    
    // Set HTTP-only, secure cookie with the session token
    const cookieHeader = `session=${encodeURIComponent(JSON.stringify(session))}.${sessionToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${24 * 60 * 60}`;
    
    // Return user data and set the session cookie
    return new Response(
      JSON.stringify({ user }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Set-Cookie': cookieHeader
        }
      }
    );
    
  } catch (error) {
    console.error('SAML validation error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
