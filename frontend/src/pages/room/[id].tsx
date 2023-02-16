import { useRouter } from "next/router";
import { useEffect } from "react";

const Room = () => {
    const router = useRouter();
    //
    const { id } = router.query


    useEffect(() => {
        console.log(id)
    }, [id])

    return id ? <div>Hi</div>
        : <div className="w-full h-full"></div>
}

export default Room;