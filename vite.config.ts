import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base relativo: no atamos el build a un host concreto (deploy se decide después).
export default defineConfig({
  base: './',
  plugins: [react()],
})
