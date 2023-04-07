import { Box } from "@chakra-ui/react";

export default function TextBox(props: any){

    return (
        <Box mx={'1vw'} color={'white'} fontWeight={'bold'} fontSize={{base: '26px', sm: '30px', md: '33px'}} bgColor={'rgba(0, 0, 0, 0.6)'} backdropFilter={'blur(3px)'} px={{base: '10px', sm: '10px', md: '20px', lg: '30px'}} py={{base: '5px', md: '10px'}} borderRadius={'10px'}>
            {props.children}
        </Box>
    )
}