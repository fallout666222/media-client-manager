
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { encode as base64Encode } from "https://deno.land/std@0.177.0/encoding/base64.ts";

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
    const { redirectUri } = await req.json();
    
    if (!redirectUri) {
      return new Response(
        JSON.stringify({ error: 'Missing redirect URI' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Get ADFS configuration from environment variables
    const adfsUrl = Deno.env.get('ADFS_URL');
    const entityId = Deno.env.get('ADFS_ENTITY_ID');
    
    if (!adfsUrl || !entityId) {
      console.error('Missing ADFS SAML configuration');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`Initiating SAML authentication with ADFS at ${adfsUrl}`);
    
    // Generate a unique request ID
    const requestId = crypto.randomUUID();
    
    // Get current timestamp and expiration (5 minutes from now)
    const now = new Date();
    const expires = new Date(now.getTime() + 5 * 60 * 1000);
    
    const nowStr = now.toISOString();
    const expiresStr = expires.toISOString();
    
    // Construct SAML AuthnRequest
    const samlRequest = `
      <samlp:AuthnRequest 
        xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
        xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
        ID="${requestId}"
        Version="2.0"
        IssueInstant="${nowStr}"
        Destination="${adfsUrl}/saml2"
        AssertionConsumerServiceURL="${redirectUri}"
        ProtocolBinding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST">
        <saml:Issuer>${entityId}</saml:Issuer>
        <samlp:NameIDPolicy
          Format="urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress"
          AllowCreate="true" />
      </samlp:AuthnRequest>
    `;
    
    // Base64 encode the request
    const encodedRequest = base64Encode(new TextEncoder().encode(samlRequest));
    
    // Construct the URL for redirect
    const redirectUrl = `${adfsUrl}/saml2?SAMLRequest=${encodeURIComponent(encodedRequest)}&RelayState=${encodeURIComponent(redirectUri)}`;
    
    return new Response(
      JSON.stringify({ redirectUrl }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('SAML initiation error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
