export interface Chat {
  id: number
  name: string
  creatorId: number
  senderId: number
  members: {
    userId: number
    isAdmin: boolean
  }[]
  createdAt: string
  updatedAt: string
} 