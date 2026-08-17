import type { CVPreviewModel } from "@/lib/cvPreviewModel";
import { PreviewEducationTable, PreviewSection } from "./PreviewPaper";

export default function ClassicPreview({ vm }: { vm: CVPreviewModel }) {
  const contactLine = [vm.phone, vm.email].filter(Boolean).join("   |   ");

  return (
    <div>
      <div className="relative">
        {vm.photo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={vm.photo}
            alt=""
            className="absolute right-0 top-0 h-[3.2em] w-[3.2em] rounded-full object-cover"
            style={{ border: `2px solid ${vm.themeColor}` }}
          />
        )}
        {vm.fullName && (
          <p className="text-center text-[1.9em] font-bold" style={{ color: vm.themeColor }}>
            {vm.fullName}
          </p>
        )}
        {vm.address && <p className="text-center text-neutral-500">{vm.address}</p>}
        {contactLine && <p className="text-center">{contactLine}</p>}
        {vm.linkItems.length > 0 && (
          <p className="text-center">{vm.linkItems.map((l) => l.text).join("   |   ")}</p>
        )}
      </div>
      <hr className="mt-[0.5em]" style={{ borderColor: vm.themeColor, borderTopWidth: 1.5 }} />

      {vm.summary && (
        <PreviewSection title="Summary" color={vm.themeColor}>
          <p>{vm.summary}</p>
        </PreviewSection>
      )}

      {vm.personalRows.length > 0 && (
        <PreviewSection title="Personal Details" color={vm.themeColor}>
          {vm.personalRows.map(([label, value]) => (
            <p key={label}>
              <span className="font-semibold">{label}: </span>
              {value}
            </p>
          ))}
        </PreviewSection>
      )}

      {vm.passportRows.length > 0 && (
        <PreviewSection title="Passport Details" color={vm.themeColor}>
          {vm.passportRows.map(([label, value]) => (
            <p key={label}>
              <span className="font-semibold">{label}: </span>
              {value}
            </p>
          ))}
        </PreviewSection>
      )}

      {vm.educationRows.length > 0 && (
        <PreviewSection title="Academic Qualification" color={vm.themeColor}>
          <PreviewEducationTable rows={vm.educationRows} color={vm.themeColor} />
        </PreviewSection>
      )}

      {vm.experienceRows.length > 0 && (
        <PreviewSection title="Work Experience" color={vm.themeColor}>
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

      {vm.languagesDisplay && (
        <PreviewSection title="Languages" color={vm.themeColor}>
          <p>{vm.languagesDisplay}</p>
        </PreviewSection>
      )}

      {vm.skills && (
        <PreviewSection title="Skills" color={vm.themeColor}>
          <p className="whitespace-pre-line">{vm.skills}</p>
        </PreviewSection>
      )}

      {vm.referenceRows.length > 0 && (
        <PreviewSection title="References" color={vm.themeColor}>
          {vm.referenceRows.map((r, i) => (
            <p key={i}>{r.name}</p>
          ))}
        </PreviewSection>
      )}
    </div>
  );
}
