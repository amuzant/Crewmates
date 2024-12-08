export interface User {
  id: number
  username: string
  displayName: string
  role: {
    name: string
    displayName: string
  }
} 