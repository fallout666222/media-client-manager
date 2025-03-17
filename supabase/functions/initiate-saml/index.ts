
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { encode as base64Encode } from "https://deno.land/std@0.177.0/encoding/base64.ts";
import { deflate } from "https://deno.land/x/compress@v0.4.5/mod.ts";

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
      console.error('Missing ADFS configuration');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`Creating SAML request for ADFS at ${adfsUrl}`);
    
    // Generate a request ID
    const requestId = crypto.randomUUID();
    
    // Current timestamp and expiration (5 minutes from now)
    const now = new Date();
    const issueInstant = now.toISOString();
    
    // Create the SAML request
    const samlRequest = `
      <samlp:AuthnRequest xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
                          xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
                          ID="${requestId}"
                          Version="2.0"
                          IssueInstant="${issueInstant}"
                          Destination="${adfsUrl}/saml/sso"
                          AssertionConsumerServiceURL="${redirectUri}"
                          ProtocolBinding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST">
        <saml:Issuer>${entityId}</saml:Issuer>
        <samlp:NameIDPolicy Format="urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress" AllowCreate="true"/>
      </samlp:AuthnRequest>
    `.trim();
    
    // Deflate and Base64 encode the request
    const deflated = await deflate(new TextEncoder().encode(samlRequest));
    const encoded = base64Encode(deflated);
    
    return new Response(
      JSON.stringify({ 
        samlRequest: encoded,
        relayState: redirectUri 
      }),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
    
  } catch (error) {
    console.error('SAML request generation error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
