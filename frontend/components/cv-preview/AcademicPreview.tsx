import type { CVPreviewModel } from "@/lib/cvPreviewModel";
import { PreviewDeclarationSection, PreviewEducationTable, PreviewSection } from "./PreviewPaper";

export default function AcademicPreview({ vm }: { vm: CVPreviewModel }) {
  const contactLine = [vm.phone, vm.email, vm.address].filter(Boolean).join("   |   ");

  return (
    <div className="font-serif">
      {vm.fullName && (
        <p className="text-center text-[1.9em] font-bold" style={{ color: vm.themeColor }}>
          {vm.fullName}
        </p>
      )}
      {contactLine && <p className="text-center">{contactLine}</p>}
      {vm.linkItems.length > 0 && (
        <p className="text-center">{vm.linkItems.map((l) => l.text).join("   |   ")}</p>
      )}
      <hr className="mt-[0.5em]" style={{ borderColor: vm.themeColor, borderTopWidth: 1 }} />

      {vm.physicalDetailsRows.length > 0 && (
        <PreviewSection title="Physical Details" color={vm.themeColor}>
          {vm.physicalDetailsRows.map(([label, value]) => (
            <p key={label}>
              <span className="font-semibold">{label}: </span>
              {value}
            </p>
          ))}
        </PreviewSection>
      )}

      {vm.emergencyContactRows.length > 0 && (
        <PreviewSection title="Emergency Contact" color={vm.themeColor}>
          {vm.emergencyContactRows.map(([label, value]) => (
            <p key={label}>
              <span className="font-semibold">{label}: </span>
              {value}
            </p>
          ))}
        </PreviewSection>
      )}

      {vm.preferredPosition && (
        <PreviewSection title="Preferred Position" color={vm.themeColor}>
          <p>{vm.preferredPosition}</p>
        </PreviewSection>
      )}

      {vm.medicalFitness && (
        <PreviewSection title="Medical Fitness Status" color={vm.themeColor}>
          <p>{vm.medicalFitness}</p>
        </PreviewSection>
      )}

      {vm.educationRows.length > 0 && (
        <PreviewSection title="Education" color={vm.themeColor}>
          <PreviewEducationTable rows={vm.educationRows} color={vm.themeColor} />
        </PreviewSection>
      )}

      {vm.publicationRows.length > 0 && (
        <PreviewSection title="Publications" color={vm.themeColor}>
          {vm.publicationRows.map((pub, i) => (
            <p key={i}>
              <span className="italic">{pub.title}</span>
              {[pub.venue, pub.year].filter(Boolean).length > 0 &&
                ` — ${[pub.venue, pub.year].filter(Boolean).join(", ")}`}
            </p>
          ))}
        </PreviewSection>
      )}

      {vm.experienceRows.length > 0 && (
        <PreviewSection title="Research / Professional Experience" color={vm.themeColor}>
          {vm.experienceRows.map((exp, i) => (
            <div key={i}>
              {exp.company && <p className="font-semibold">{exp.company}</p>}
              {exp.position && <p className="italic">{exp.position}</p>}
              {exp.responsibilities.slice(0, 3).map((r, j) => (
                <p key={j}>• {r}</p>
              ))}
            </div>
          ))}
        </PreviewSection>
      )}

      {vm.languageLines.length > 0 && (
        <PreviewSection title="Languages" color={vm.themeColor}>
          {vm.languageLines.map((line, i) => (
            <p key={i}>• {line}</p>
          ))}
        </PreviewSection>
      )}

      {vm.skills && (
        <PreviewSection title="Skills" color={vm.themeColor}>
          <p className="whitespace-pre-line">{vm.skills}</p>
        </PreviewSection>
      )}

      {vm.includeDeclaration && vm.declarationText && (
        <PreviewDeclarationSection
          text={vm.declarationText}
          date={vm.declarationDate}
          color={vm.themeColor}
        />
      )}
    </div>
  );
}
