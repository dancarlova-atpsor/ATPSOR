import { TransporterProfile } from "@/components/transporters/TransporterProfile";

export default function TransporterDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <TransporterProfile />;
}
