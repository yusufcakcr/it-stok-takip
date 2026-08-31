export type Role = 'ADMIN' | 'USER'

export type ItemCategory = 'HARDWARE' | 'LICENSE' | 'CONSUMABLE'

export type MovementType = 'IN' | 'OUT'

export interface User {
  id: string
  email: string
  username: string
  name?: string | null
  role: Role
  createdAt: string
  updatedAt?: string
}

export interface HardwareItem {
  id: string
  name: string
  brand?: string | null
  model?: string | null
  serialNumber?: string | null
  quantity: number
  location?: string | null
  notes?: string | null
  lowStockThreshold: number
  createdAt: string
  updatedAt: string
}

export interface LicenseItem {
  id: string
  softwareName: string
  licenseKey?: string | null
  quantity: number
  expiryDate?: string | null
  notes?: string | null
  lowStockThreshold: number
  createdAt: string
  updatedAt: string
}

export interface ConsumableItem {
  id: string
  name: string
  brand?: string | null
  quantity: number
  unit?: string | null
  notes?: string | null
  lowStockThreshold: number
  createdAt: string
  updatedAt: string
}

export interface StockMovement {
  id: string
  itemCategory: ItemCategory
  itemId: string
  itemName: string
  movementType: MovementType
  quantity: number
  description?: string | null
  userId: string
  userName: string
  createdAt: string
}

export interface ActivityLog {
  id: string
  userId: string
  userName: string
  action: string
  details?: string | null
  category?: string | null
  createdAt: string
}

export interface DashboardData {
  counts: {
    hardware: number
    license: number
    consumable: number
  }
  totals: {
    hardware: number
    license: number
    consumable: number
  }
  lowStockItems: Array<{
    id: string
    name?: string
    softwareName?: string
    quantity: number
    lowStockThreshold: number
    category: ItemCategory
    categoryLabel: string
  }>
  expiringLicenses: Array<LicenseItem>
  recentMovements: Array<StockMovement>
}