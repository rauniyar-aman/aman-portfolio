import CVForm from "@/components/CVForm";

export default function NewCVPage() {
  return (
    <div className="min-h-screen bg-background">
      <CVForm mode="create" />
    </div>
  );
}
