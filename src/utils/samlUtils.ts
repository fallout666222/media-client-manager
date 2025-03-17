
import { encode as base64Encode } from 'js-base64';

/**
 * Initiates a SAML authentication request
 * This is a client-side implementation that would normally be handled by a server
 * @param redirectUri The URI to redirect to after successful authentication
 */
export const initiateSamlAuth = async (redirectUri: string): Promise<string> => {
  try {
    // In a production environment, this would be done server-side
    // For demo purposes, we'll create a simple SAML request
    
    // Get ADFS configuration from environment
    const adfsUrl = import.meta.env.VITE_ADFS_URL;
    const entityId = import.meta.env.VITE_ADFS_ENTITY_ID;
    
    if (!adfsUrl || !entityId) {
      throw new Error('Missing ADFS configuration in environment variables');
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
    const encodedRequest = base64Encode(samlRequest);
    
    // Construct the URL for redirect
    const redirectUrl = `${adfsUrl}/saml2?SAMLRequest=${encodeURIComponent(encodedRequest)}&RelayState=${encodeURIComponent(redirectUri)}`;
    
    return redirectUrl;
  } catch (error) {
    console.error('SAML initiation error:', error);
    throw error;
  }
};

/**
 * Initiates an ADFS OAuth authentication request
 * @param redirectUri The URI to redirect to after successful authentication
 */
export const initiateAdfsAuth = (redirectUri: string): string => {
  try {
    const adfsUrl = import.meta.env.VITE_ADFS_URL;
    const clientId = import.meta.env.VITE_ADFS_CLIENT_ID;
    
    if (!adfsUrl || !clientId) {
      throw new Error('Missing ADFS configuration in environment variables');
    }
    
    // Generate a random state value for security
    const state = crypto.randomUUID();
    
    // Store the state in session storage to verify later
    sessionStorage.setItem('adfsAuthState', state);
    
    // Construct the authorization URL
    const authUrl = new URL(`${adfsUrl}/oauth2/authorize`);
    authUrl.searchParams.append('client_id', clientId);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('redirect_uri', redirectUri);
    authUrl.searchParams.append('scope', 'openid profile email');
    authUrl.searchParams.append('state', state);
    
    return authUrl.toString();
  } catch (error) {
    console.error('ADFS initiation error:', error);
    throw error;
  }
};
