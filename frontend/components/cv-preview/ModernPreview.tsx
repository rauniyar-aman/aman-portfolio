import type { CVPreviewModel } from "@/lib/cvPreviewModel";

export default function ModernPreview({ vm }: { vm: CVPreviewModel }) {
  return (
    <div className="-m-4 flex h-full min-h-full">
      <div
        className="w-[32%] shrink-0 p-[0.9em] text-white"
        style={{ backgroundColor: vm.themeColor }}
      >
        {vm.photo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={vm.photo}
            alt=""
            className="mx-auto mb-[0.6em] h-[3.4em] w-[3.4em] rounded-full object-cover"
            style={{ border: "2px solid rgba(255,255,255,0.7)" }}
          />
        )}
        {vm.fullName && <p className="text-center text-[1.3em] font-bold">{vm.fullName}</p>}

        {(vm.phone || vm.email || vm.address || vm.linkItems.length > 0) && (
          <SidebarSection title="Contact">
            {vm.phone && <p>{vm.phone}</p>}
            {vm.email && <p className="break-all">{vm.email}</p>}
            {vm.address && <p>{vm.address}</p>}
            {vm.linkItems.map((l, i) => (
              <p key={i} className="break-all">
                {l.text}
              </p>
            ))}
          </SidebarSection>
        )}

        {vm.educationRows.length > 0 && (
          <SidebarSection title="Education">
            {vm.educationRows.map((edu, i) => (
              <div key={i}>
                {edu.degree && <p className="font-semibold">{edu.degree}</p>}
                {edu.institute && <p>{edu.institute}</p>}
              </div>
            ))}
          </SidebarSection>
        )}

        {vm.skills && (
          <SidebarSection title="Skills">
            <p className="whitespace-pre-line">{vm.skills}</p>
          </SidebarSection>
        )}

        {vm.languageLines.length > 0 && (
          <SidebarSection title="Languages">
            {vm.languageLines.map((line, i) => (
              <p key={i}>• {line}</p>
            ))}
          </SidebarSection>
        )}
      </div>

      <div className="flex-1 space-y-[1em] p-[0.9em]">
        {vm.summary && (
          <div>
            <p
              className="border-b pb-[0.15em] text-[1.1em] font-bold uppercase tracking-wide"
              style={{ color: vm.themeColor, borderColor: vm.themeColor }}
            >
              Summary
            </p>
            <p className="mt-[0.4em]">{vm.summary}</p>
          </div>
        )}

        {vm.experienceRows.length > 0 && (
          <div>
            <p
              className="border-b pb-[0.15em] text-[1.1em] font-bold uppercase tracking-wide"
              style={{ color: vm.themeColor, borderColor: vm.themeColor }}
            >
              Experience
            </p>
            <div className="mt-[0.4em] space-y-[0.5em]">
              {vm.experienceRows.map((exp, i) => (
                <div key={i}>
                  {exp.company && <p className="font-semibold">{exp.company}</p>}
                  {exp.position && <p className="italic">{exp.position}</p>}
                  {exp.responsibilities.slice(0, 3).map((r, j) => (
                    <p key={j}>• {r}</p>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SidebarSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-[1em]">
      <p
        className="border-b pb-[0.1em] text-[0.95em] font-bold uppercase tracking-wide"
        style={{ borderColor: "rgba(255,255,255,0.4)" }}
      >
        {title}
      </p>
      <div className="mt-[0.3em] space-y-[0.2em]">{children}</div>
    </div>
  );
}
