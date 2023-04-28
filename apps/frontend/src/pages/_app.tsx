import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import '../styles/styles.css'
import { ChakraProvider } from '@chakra-ui/react'
import theme from '../theme/theme'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ChakraProvider theme={theme}>
      <Component {...pageProps} />
    </ChakraProvider>
  )
}
