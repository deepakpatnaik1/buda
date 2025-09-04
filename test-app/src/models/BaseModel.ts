/**
 * BaseModel - Template for LEGO data models
 * Rule 3: LEGO Bricks - Data structure models
 * 
 * Instructions:
 * 1. Copy this file to create new models
 * 2. Replace BaseModel with your domain model name
 * 3. Define your data structure interfaces
 * 4. Export default instances if needed
 */

export interface BaseModel {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

// Example validation function
export function isValidBaseModel(obj: any): obj is BaseModel {
  return (
    obj &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    obj.createdAt instanceof Date &&
    obj.updatedAt instanceof Date
  );
}

// Example default instance
export const defaultBaseModel: BaseModel = {
  id: 'default',
  name: 'Default Model',
  createdAt: new Date(),
  updatedAt: new Date()
};