
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

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
    const { code, redirectUri } = await req.json();
    
    if (!code) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization code' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Get ADFS configuration from environment variables
    const adfsUrl = Deno.env.get('ADFS_URL');
    const clientId = Deno.env.get('ADFS_CLIENT_ID');
    const clientSecret = Deno.env.get('ADFS_CLIENT_SECRET');
    
    if (!adfsUrl || !clientId || !clientSecret) {
      console.error('Missing ADFS configuration');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`Exchanging code for tokens with ADFS at ${adfsUrl}`);
    
    // Exchange the code for tokens securely on the server
    const tokenResponse = await fetch(`${adfsUrl}/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        redirect_uri: redirectUri,
      }),
    });
    
    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json().catch(() => ({}));
      console.error('ADFS token exchange error:', errorData);
      
      let errorMessage = 'Failed to exchange authorization code for tokens';
      if (errorData && errorData.error) {
        switch(errorData.error) {
          case 'invalid_grant':
            errorMessage = 'Invalid or expired authorization code';
            break;
          case 'invalid_client':
            errorMessage = 'Invalid client ID or client secret';
            break;
          case 'invalid_request':
            errorMessage = 'Invalid token exchange request';
            break;
          default:
            errorMessage = `Token exchange error: ${errorData.error}`;
        }
      }
      
      return new Response(
        JSON.stringify({ error: errorMessage }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const tokenData = await tokenResponse.json();
    
    // Parse the ID token to get user information
    const idToken = tokenData.id_token;
    const idTokenPayload = JSON.parse(atob(idToken.split('.')[1]));
    
    // Find the user in the system based on the claims in the ID token
    const userEmail = idTokenPayload.email || idTokenPayload.upn;
    
    if (!userEmail) {
      return new Response(
        JSON.stringify({ error: 'No email or UPN found in ID token' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Connect to Supabase database to find the user
    const { createClient } = await import 'https://esm.sh/@supabase/supabase-js@2.36.0';
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );
    
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', userEmail)
      .single();
    
    if (error || !user) {
      console.error('User lookup error:', error);
      return new Response(
        JSON.stringify({ error: `User with email ${userEmail} not found` }),
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
    console.error('ADFS token exchange error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
