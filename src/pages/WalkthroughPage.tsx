import ProcessWalkthrough from "@/components/staff/ProcessWalkthrough";

export default function WalkthroughPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-3xl rounded-2xl overflow-hidden border border-border shadow-2xl aspect-video">
        <ProcessWalkthrough />
      </div>
    </div>
  );
}
