import { describe, it, expect, beforeEach } from 'vitest';

// Mock constants
const SERVICE_TYPE_TAX = 1;
const SERVICE_TYPE_HEALTHCARE = 2;

// Mock functions to simulate blockchain interactions
const mockTxSender = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
const mockCitizenId = "CITIZEN123456789";

// Mock state
let mockServicePermissions = new Map();
let mockAdmin = mockTxSender;
let mockBlockHeight = 100;

// Mock contract functions
function grantServiceAccess(sender: string, citizenId: string, serviceType: number, accessLevel: number, expiry: number) {
  if (sender !== mockAdmin) {
    return { error: 100 };
  }
  
  const key = `${citizenId}-${serviceType}`;
  mockServicePermissions.set(key, {
    hasAccess: true,
    accessLevel: accessLevel,
    grantedAt: mockBlockHeight,
    expiry: expiry
  });
  
  return { ok: true };
}

function hasServiceAccess(citizenId: string, serviceType: number, requiredAccessLevel: number) {
  const key = `${citizenId}-${serviceType}`;
  const permission = mockServicePermissions.get(key);
  
  if (!permission) return false;
  
  return permission.hasAccess &&
      permission.accessLevel >= requiredAccessLevel &&
      mockBlockHeight < permission.expiry;
}

function revokeServiceAccess(sender: string, citizenId: string, serviceType: number) {
  if (sender !== mockAdmin) {
    return { error: 100 };
  }
  
  const key = `${citizenId}-${serviceType}`;
  const permission = mockServicePermissions.get(key);
  
  if (permission) {
    mockServicePermissions.set(key, {
      ...permission,
      hasAccess: false,
      expiry: mockBlockHeight
    });
  }
  
  return { ok: true };
}

// Tests
describe('Service Access Contract', () => {
  beforeEach(() => {
    mockServicePermissions = new Map();
    mockAdmin = mockTxSender;
    mockBlockHeight = 100;
  });
  
  it('should grant service access when called by admin', () => {
    const accessLevel = 5;
    const expiry = mockBlockHeight + 1000;
    const result = grantServiceAccess(
        mockAdmin, mockCitizenId, SERVICE_TYPE_TAX, accessLevel, expiry
    );
    
    expect(result).toEqual({ ok: true });
    expect(hasServiceAccess(mockCitizenId, SERVICE_TYPE_TAX, accessLevel)).toBe(true);
  });
  
  it('should not grant service access when called by non-admin', () => {
    const nonAdmin = "ST2PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    const accessLevel = 5;
    const expiry = mockBlockHeight + 1000;
    
    const result = grantServiceAccess(
        nonAdmin, mockCitizenId, SERVICE_TYPE_TAX, accessLevel, expiry
    );
    
    expect(result).toEqual({ error: 100 });
    expect(hasServiceAccess(mockCitizenId, SERVICE_TYPE_TAX, accessLevel)).toBe(false);
  });
  
  it('should check access level requirements correctly', () => {
    const accessLevel = 5;
    const expiry = mockBlockHeight + 1000;
    
    grantServiceAccess(mockAdmin, mockCitizenId, SERVICE_TYPE_TAX, accessLevel, expiry);
    
    // Access level equal to granted
    expect(hasServiceAccess(mockCitizenId, SERVICE_TYPE_TAX, accessLevel)).toBe(true);
    
    // Access level lower than granted
    expect(hasServiceAccess(mockCitizenId, SERVICE_TYPE_TAX, accessLevel - 1)).toBe(true);
    
    // Access level higher than granted
    expect(hasServiceAccess(mockCitizenId, SERVICE_TYPE_TAX, accessLevel + 1)).toBe(false);
  });
  
  it('should recognize expired access as invalid', () => {
    const accessLevel = 5;
    const expiry = mockBlockHeight + 1000;
    
    grantServiceAccess(mockAdmin, mockCitizenId, SERVICE_TYPE_TAX, accessLevel, expiry);
    expect(hasServiceAccess(mockCitizenId, SERVICE_TYPE_TAX, accessLevel)).toBe(true);
    
    mockBlockHeight = expiry + 1; // Advance beyond expiry
    expect(hasServiceAccess(mockCitizenId, SERVICE_TYPE_TAX, accessLevel)).toBe(false);
  });
  
  it('should revoke service access correctly', () => {
    const accessLevel = 5;
    const expiry = mockBlockHeight + 1000;
    
    grantServiceAccess(mockAdmin, mockCitizenId, SERVICE_TYPE_TAX, accessLevel, expiry);
    expect(hasServiceAccess(mockCitizenId, SERVICE_TYPE_TAX, accessLevel)).toBe(true);
    
    const revokeResult = revokeServiceAccess(mockAdmin, mockCitizenId, SERVICE_TYPE_TAX);
    expect(revokeResult).toEqual({ ok: true });
    expect(hasServiceAccess(mockCitizenId, SERVICE_TYPE_TAX, accessLevel)).toBe(false);
  });
});
