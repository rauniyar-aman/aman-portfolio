import CVForm from "@/components/CVForm";

export default function NewCVPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <CVForm mode="create" />
    </div>
  );
}
