import { notFound } from "next/navigation";
import { getItineraryByShareToken } from "@/shared/server/itineraries-repository";
import { TripView } from "@/views/trip";

type PageProps = { params: Promise<{ token: string }> };

export default async function TripPage({ params }: PageProps) {
  const { token } = await params;
  const itinerary = await getItineraryByShareToken(token);

  if (!itinerary) {
    notFound();
  }

  return <TripView itinerary={itinerary} />;
}
