import { describe, it, expect, beforeEach } from 'vitest';

// Mock constants
const CREDENTIAL_TYPE_ID = 1;
const CREDENTIAL_TYPE_DRIVER_LICENSE = 2;

// Mock functions to simulate blockchain interactions
const mockTxSender = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
const mockCitizenId = "CITIZEN123456789";

// Mock state
let mockCredentials = new Map();
let mockAdmin = mockTxSender;
let mockBlockHeight = 100;

// Mock contract functions
function issueCredential(sender: string, citizenId: string, credentialType: number, expiryDate: number) {
  if (sender !== mockAdmin) {
    return { error: 100 };
  }
  
  const key = `${citizenId}-${credentialType}`;
  mockCredentials.set(key, {
    issued: true,
    issueDate: mockBlockHeight,
    expiryDate: expiryDate,
    issuer: sender
  });
  
  return { ok: true };
}

function isCredentialValid(citizenId: string, credentialType: number) {
  const key = `${citizenId}-${credentialType}`;
  const credential = mockCredentials.get(key);
  
  if (!credential) return false;
  
  return credential.issued && mockBlockHeight <= credential.expiryDate;
}

function revokeCredential(sender: string, citizenId: string, credentialType: number) {
  if (sender !== mockAdmin) {
    return { error: 100 };
  }
  
  const key = `${citizenId}-${credentialType}`;
  const credential = mockCredentials.get(key);
  
  if (credential) {
    mockCredentials.set(key, {
      ...credential,
      issued: false,
      expiryDate: mockBlockHeight
    });
  }
  
  return { ok: true };
}

// Tests
describe('Credential Issuance Contract', () => {
  beforeEach(() => {
    mockCredentials = new Map();
    mockAdmin = mockTxSender;
    mockBlockHeight = 100;
  });
  
  it('should issue a credential when called by admin', () => {
    const expiryDate = mockBlockHeight + 1000; // Valid for 1000 blocks
    const result = issueCredential(mockAdmin, mockCitizenId, CREDENTIAL_TYPE_ID, expiryDate);
    
    expect(result).toEqual({ ok: true });
    expect(isCredentialValid(mockCitizenId, CREDENTIAL_TYPE_ID)).toBe(true);
  });
  
  it('should not issue a credential when called by non-admin', () => {
    const nonAdmin = "ST2PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    const expiryDate = mockBlockHeight + 1000;
    
    const result = issueCredential(nonAdmin, mockCitizenId, CREDENTIAL_TYPE_ID, expiryDate);
    expect(result).toEqual({ error: 100 });
    expect(isCredentialValid(mockCitizenId, CREDENTIAL_TYPE_ID)).toBe(false);
  });
  
  it('should recognize expired credentials as invalid', () => {
    const expiryDate = mockBlockHeight + 1000;
    issueCredential(mockAdmin, mockCitizenId, CREDENTIAL_TYPE_ID, expiryDate);
    expect(isCredentialValid(mockCitizenId, CREDENTIAL_TYPE_ID)).toBe(true);
    
    mockBlockHeight = expiryDate + 1; // Advance beyond expiry
    expect(isCredentialValid(mockCitizenId, CREDENTIAL_TYPE_ID)).toBe(false);
  });
  
  it('should revoke credentials correctly', () => {
    const expiryDate = mockBlockHeight + 1000;
    issueCredential(mockAdmin, mockCitizenId, CREDENTIAL_TYPE_ID, expiryDate);
    expect(isCredentialValid(mockCitizenId, CREDENTIAL_TYPE_ID)).toBe(true);
    
    const revokeResult = revokeCredential(mockAdmin, mockCitizenId, CREDENTIAL_TYPE_ID);
    expect(revokeResult).toEqual({ ok: true });
    expect(isCredentialValid(mockCitizenId, CREDENTIAL_TYPE_ID)).toBe(false);
  });
  
  it('should not revoke credentials when called by non-admin', () => {
    const nonAdmin = "ST2PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    const expiryDate = mockBlockHeight + 1000;
    
    issueCredential(mockAdmin, mockCitizenId, CREDENTIAL_TYPE_ID, expiryDate);
    const revokeResult = revokeCredential(nonAdmin, mockCitizenId, CREDENTIAL_TYPE_ID);
    
    expect(revokeResult).toEqual({ error: 100 });
    expect(isCredentialValid(mockCitizenId, CREDENTIAL_TYPE_ID)).toBe(true);
  });
});
