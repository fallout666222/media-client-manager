
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { decode as base64Decode } from "https://deno.land/std@0.177.0/encoding/base64.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.36.0";
import * as xmlparser from "https://deno.land/x/xml@2.1.1/mod.ts";

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
    
    // Decode the SAML response
    const decodedResponse = new TextDecoder().decode(base64Decode(samlResponse));
    
    // Parse the XML
    const parsedResponse = xmlparser.parse(decodedResponse);
    
    // Extract user information from the SAML response
    // The exact path to user data depends on the ADFS configuration and claims
    const assertion = parsedResponse.Response.Assertion;
    
    if (!assertion) {
      return new Response(
        JSON.stringify({ error: 'Invalid SAML response format - no assertion found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Extract the name ID (typically the user's email)
    const nameID = assertion.Subject?.NameID?._text;
    
    // Extract attributes (depends on ADFS configuration)
    const attributes = assertion.AttributeStatement?.Attribute || [];
    
    // Create a map of attribute values
    const attributeMap = {};
    if (Array.isArray(attributes)) {
      attributes.forEach(attr => {
        const name = attr._attributes?.Name;
        const value = attr.AttributeValue?._text;
        if (name && value) {
          attributeMap[name] = value;
        }
      });
    }
    
    // Get the user's email from the nameID or from the attributes
    const userEmail = nameID || attributeMap['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'];
    
    if (!userEmail) {
      return new Response(
        JSON.stringify({ error: 'No email or identity found in SAML response' }),
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
    console.error('SAML assertion validation error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
