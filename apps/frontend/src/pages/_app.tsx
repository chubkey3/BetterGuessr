import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import '../styles/styles.css'
import { ChakraProvider } from '@chakra-ui/react'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ChakraProvider>
      <Component {...pageProps} />
    </ChakraProvider>
  )
}
