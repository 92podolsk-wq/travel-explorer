import { SharedTripView } from "@/views/shared-trip";

type PageProps = { params: Promise<{ itineraryId: string }> };

export default async function SharedTripPage({ params }: PageProps) {
  const { itineraryId } = await params;
  return <SharedTripView itineraryId={itineraryId} />;
}
