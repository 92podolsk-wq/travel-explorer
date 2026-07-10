import { notFound } from "next/navigation";
import { getItineraryByShareToken } from "@/shared/server/itineraries-repository";
import { TripView } from "@/views/trip";

type PageProps = { params: Promise<{ token: string }>; searchParams: Promise<{ print?: string }> };

export default async function TripPage({ params, searchParams }: PageProps) {
  const { token } = await params;
  const { print } = await searchParams;
  const itinerary = await getItineraryByShareToken(token);

  if (!itinerary) {
    notFound();
  }

  return <TripView itinerary={itinerary} autoPrint={print === "1"} />;
}
