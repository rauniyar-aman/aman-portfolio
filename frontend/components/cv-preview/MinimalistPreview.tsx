import type { CVPreviewModel } from "@/lib/cvPreviewModel";
import { PreviewDeclarationSection } from "./PreviewPaper";

export default function MinimalistPreview({ vm }: { vm: CVPreviewModel }) {
  const contactLine = [vm.phone, vm.email, vm.address].filter(Boolean).join("   |   ");

  return (
    <div className="font-light">
      <div className="flex items-center gap-[0.6em]">
        {vm.photo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={vm.photo} alt="" className="h-[2.4em] w-[2.4em] shrink-0 rounded-full object-cover" />
        )}
        <div>
          {vm.fullName && (
            <p className="text-[1.7em] font-light tracking-wide" style={{ color: vm.themeColor }}>
              {vm.fullName}
            </p>
          )}
          {contactLine && <p className="text-neutral-500">{contactLine}</p>}
        </div>
      </div>
      <hr className="mt-[0.6em] border-neutral-200" />

      {vm.summary && (
        <LightSection title="Summary" color={vm.themeColor}>
          <p>{vm.summary}</p>
        </LightSection>
      )}

      {vm.physicalDetailsRows.length > 0 && (
        <LightSection title="Physical Details" color={vm.themeColor}>
          {vm.physicalDetailsRows.map(([label, value]) => (
            <p key={label}>
              <span className="font-semibold">{label}: </span>
              {value}
            </p>
          ))}
        </LightSection>
      )}

      {vm.emergencyContactRows.length > 0 && (
        <LightSection title="Emergency Contact" color={vm.themeColor}>
          {vm.emergencyContactRows.map(([label, value]) => (
            <p key={label}>
              <span className="font-semibold">{label}: </span>
              {value}
            </p>
          ))}
        </LightSection>
      )}

      {vm.preferredPosition && (
        <LightSection title="Preferred Position" color={vm.themeColor}>
          <p>{vm.preferredPosition}</p>
        </LightSection>
      )}

      {vm.medicalFitness && (
        <LightSection title="Medical Fitness Status" color={vm.themeColor}>
          <p>{vm.medicalFitness}</p>
        </LightSection>
      )}

      {vm.experienceRows.length > 0 && (
        <LightSection title="Experience" color={vm.themeColor}>
          {vm.experienceRows.map((exp, i) => (
            <div key={i} className="mb-[0.4em]">
              {exp.company && <p className="font-semibold">{exp.company}</p>}
              {exp.position && <p className="italic text-neutral-600">{exp.position}</p>}
              {exp.responsibilities.slice(0, 3).map((r, j) => (
                <p key={j}>• {r}</p>
              ))}
            </div>
          ))}
        </LightSection>
      )}

      {vm.educationRows.length > 0 && (
        <LightSection title="Education" color={vm.themeColor}>
          {vm.educationRows.map((edu, i) => (
            <div key={i} className="mb-[0.3em]">
              {edu.degree && <p className="font-semibold">{edu.degree}</p>}
              {edu.institute && <p className="italic text-neutral-600">{edu.institute}</p>}
            </div>
          ))}
        </LightSection>
      )}

      {vm.languageLines.length > 0 && (
        <LightSection title="Languages" color={vm.themeColor}>
          {vm.languageLines.map((line, i) => (
            <p key={i}>• {line}</p>
          ))}
        </LightSection>
      )}

      {vm.skills && (
        <LightSection title="Skills" color={vm.themeColor}>
          <p className="whitespace-pre-line">{vm.skills}</p>
        </LightSection>
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

function LightSection({
  title,
  color,
  children,
}: {
  title: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-[1.6em]">
      <p className="text-[0.95em] font-normal uppercase tracking-[0.15em]" style={{ color }}>
        {title}
      </p>
      <div className="mt-[0.5em] space-y-[0.3em]">{children}</div>
    </div>
  );
}
