import { extendTheme, ThemeConfig } from "@chakra-ui/react";

const config: ThemeConfig = {
    initialColorMode: 'dark',
    useSystemColorMode: false
}

const theme = extendTheme( { config: config } );

export default theme;