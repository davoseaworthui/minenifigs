import Navigation from "@/components/Navigation";
import PartsViewer from "@/components/PartsBuilder/PartsViewer";

interface BuilderPageProps {
  params: Promise<{
    minifig_id: string;
  }>;
}

export default async function BuilderPage({ params }: BuilderPageProps) {
  const { minifig_id } = await params;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <PartsViewer minifigId={minifig_id} />
    </div>
  );
}
