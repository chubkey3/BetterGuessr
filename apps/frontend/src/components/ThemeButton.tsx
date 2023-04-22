import { Button, keyframes } from "@chakra-ui/react";

const animation = keyframes`
    from { transform: translateY(0%); }
    to { transform: translateY(-20%); }
`

export default function ThemeButton(props: any){
    return (
        <Button onClick={props.callback} _hover={{bgColor: props.disabled ? 'gray' : '#6cb928', animation: props.disabled ? 'none' : `${animation} 0.2s ease-out forwards`}} w={{base: '100px', sm: '100px', md: '150px', lg: '200px'}} backgroundColor={props.disabled ? 'gray' : '#6cb928'} fontSize={{base: '13px', sm: '13px', md: '16px', lg: '18px'}} fontWeight={'bold'} borderRadius={'30px'} color={'white'} fontStyle={'italic'} cursor={props.disabled ? 'auto' : 'pointer'} padding={'15px'} px={'30px'} textTransform={'uppercase'} border={'none'} my={'2rem'} transition={'transform 0.2s ease-out'}>
            {props.children}
        </Button>
    )
}