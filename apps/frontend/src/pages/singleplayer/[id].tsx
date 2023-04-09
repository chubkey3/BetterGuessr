import DashboardWrapper from "@/components/DashboardWrapper";
import { useRouter } from "next/router";

export default function Map() {
  const router = useRouter();
  const { id } = router.query;
  return (
    <DashboardWrapper>
      <div>{id}</div>
    </DashboardWrapper>
  );
}
