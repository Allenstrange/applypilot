import type { Profile } from '@/lib/types'

interface ColorScheme {
  accent: string
  page: string
  text: string
  muted: string
  light: string
  border: string
}

interface TemplateProps {
  profile: Profile
  s: ColorScheme
  style: React.CSSProperties
}

interface Props {
  profile: Profile
  template: 'classic' | 'modern' | 'compact'
  accentColor: string
  scale?: number
}

export default function ResumePreview({ profile, template, accentColor, scale = 1 }: Props) {
  const s: ColorScheme = {
    accent: accentColor,
    page: '#ffffff',
    text: '#1a1a1a',
    muted: '#555555',
    light: '#888888',
    border: '#dddddd',
  }

  const pageStyle: React.CSSProperties = {
    width: 794,
    minHeight: 1123,
    background: s.page,
    fontFamily: 'Georgia, serif',
    color: s.text,
    fontSize: 13,
    lineHeight: 1.5,
    transform: `scale(${scale})`,
    transformOrigin: 'top left',
  }

  if (template === 'modern') return <ModernTemplate profile={profile} s={s} style={pageStyle} />
  if (template === 'compact') return <CompactTemplate profile={profile} s={s} style={pageStyle} />
  return <ClassicTemplate profile={profile} s={s} style={pageStyle} />
}

function ClassicTemplate({ profile, s, style }: TemplateProps) {
  return (
    <div style={style} id="resume-preview">
      <div style={{ background: s.accent, padding: '32px 48px 24px', color: '#fff' }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0, letterSpacing: '-0.3px' }}>{profile.name || 'Your Name'}</h1>
        <div style={{ marginTop: 8, fontSize: 12, opacity: 0.9, display: 'flex', flexWrap: 'wrap', gap: '0 16px' }}>
          {profile.email && <span>{profile.email}</span>}
          {profile.phone && <span>{profile.phone}</span>}
          {profile.location && <span>{profile.location}</span>}
          {profile.linkedin && <span>{profile.linkedin}</span>}
        </div>
      </div>

      <div style={{ padding: '28px 48px' }}>
        {profile.summary && (
          <section style={{ marginBottom: 22 }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.2, color: s.accent, borderBottom: `2px solid ${s.accent}`, paddingBottom: 4, marginBottom: 10 }}>Summary</h2>
            <p style={{ color: s.muted, fontSize: 12.5 }}>{profile.summary}</p>
          </section>
        )}

        {(profile.experience?.length ?? 0) > 0 && (
          <section style={{ marginBottom: 22 }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.2, color: s.accent, borderBottom: `2px solid ${s.accent}`, paddingBottom: 4, marginBottom: 12 }}>Experience</h2>
            {profile.experience.map(exp => (
              <div key={exp.id} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: 13 }}>{exp.title}</span>
                    <span style={{ color: s.muted, fontSize: 12 }}> — {exp.company}</span>
                  </div>
                  <span style={{ fontSize: 11, color: s.light, whiteSpace: 'nowrap' }}>
                    {exp.startDate}{exp.startDate && ' – '}{exp.current ? 'Present' : exp.endDate}
                  </span>
                </div>
                {exp.location && <div style={{ fontSize: 11, color: s.light, marginTop: 1 }}>{exp.location}</div>}
                <ul style={{ margin: '6px 0 0 16px', padding: 0 }}>
                  {exp.bullets.filter(Boolean).map((b, i) => (
                    <li key={i} style={{ fontSize: 12, color: s.muted, marginBottom: 3 }}>{b}</li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        )}

        {(profile.education?.length ?? 0) > 0 && (
          <section style={{ marginBottom: 22 }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.2, color: s.accent, borderBottom: `2px solid ${s.accent}`, paddingBottom: 4, marginBottom: 12 }}>Education</h2>
            {profile.education.map(edu => (
              <div key={edu.id} style={{ marginBottom: 10, display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: 13 }}>{edu.degree}{edu.field && ` in ${edu.field}`}</span>
                  <div style={{ fontSize: 12, color: s.muted }}>{edu.school}</div>
                </div>
                <span style={{ fontSize: 11, color: s.light, whiteSpace: 'nowrap' }}>{edu.startDate}{edu.startDate && ' – '}{edu.endDate}</span>
              </div>
            ))}
          </section>
        )}

        {(profile.skills?.length ?? 0) > 0 && (
          <section style={{ marginBottom: 22 }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.2, color: s.accent, borderBottom: `2px solid ${s.accent}`, paddingBottom: 4, marginBottom: 10 }}>Skills</h2>
            <p style={{ fontSize: 12, color: s.muted }}>{profile.skills.join(' · ')}</p>
          </section>
        )}
      </div>
    </div>
  )
}

function ModernTemplate({ profile, s, style }: TemplateProps) {
  return (
    <div style={{ ...style, display: 'flex' }} id="resume-preview">
      <div style={{ width: 240, background: s.accent, padding: '32px 20px', color: '#fff', flexShrink: 0 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 4px', lineHeight: 1.2 }}>{profile.name || 'Your Name'}</h1>
        <div style={{ fontSize: 11, opacity: 0.85, marginBottom: 24, lineHeight: 1.8 }}>
          {profile.email && <div>{profile.email}</div>}
          {profile.phone && <div>{profile.phone}</div>}
          {profile.location && <div>{profile.location}</div>}
          {profile.linkedin && <div>{profile.linkedin}</div>}
        </div>
        {(profile.skills?.length ?? 0) > 0 && (
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, opacity: 0.7, marginBottom: 8 }}>Skills</div>
            {profile.skills.map(sk => (
              <div key={sk} style={{ fontSize: 11, background: 'rgba(255,255,255,0.15)', borderRadius: 4, padding: '3px 8px', marginBottom: 4, display: 'inline-block', marginRight: 4 }}>{sk}</div>
            ))}
          </div>
        )}
        {(profile.certifications?.length ?? 0) > 0 && (
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, opacity: 0.7, marginBottom: 8 }}>Certifications</div>
            {profile.certifications.map(c => <div key={c} style={{ fontSize: 11, opacity: 0.9, marginBottom: 4 }}>{c}</div>)}
          </div>
        )}
      </div>
      <div style={{ flex: 1, padding: '32px 28px', overflow: 'hidden' }}>
        {profile.summary && <p style={{ fontSize: 12.5, color: s.muted, marginBottom: 24, lineHeight: 1.6 }}>{profile.summary}</p>}
        {(profile.experience?.length ?? 0) > 0 && (
          <section style={{ marginBottom: 22 }}>
            <h2 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.2, color: s.accent, marginBottom: 12 }}>Experience</h2>
            {profile.experience.map(exp => (
              <div key={exp.id} style={{ marginBottom: 14 }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{exp.title}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: s.light, marginBottom: 5 }}>
                  <span>{exp.company}{exp.location && ` · ${exp.location}`}</span>
                  <span>{exp.startDate}{exp.startDate && ' – '}{exp.current ? 'Present' : exp.endDate}</span>
                </div>
                <ul style={{ margin: '0 0 0 14px', padding: 0 }}>
                  {exp.bullets.filter(Boolean).map((b, i) => <li key={i} style={{ fontSize: 12, color: s.muted, marginBottom: 2 }}>{b}</li>)}
                </ul>
              </div>
            ))}
          </section>
        )}
        {(profile.education?.length ?? 0) > 0 && (
          <section>
            <h2 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.2, color: s.accent, marginBottom: 10 }}>Education</h2>
            {profile.education.map(edu => (
              <div key={edu.id} style={{ marginBottom: 8 }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{edu.degree}{edu.field && ` in ${edu.field}`}</div>
                <div style={{ fontSize: 12, color: s.muted }}>{edu.school} · {edu.startDate}{edu.startDate && '–'}{edu.endDate}</div>
              </div>
            ))}
          </section>
        )}
      </div>
    </div>
  )
}

function CompactTemplate({ profile, s, style }: TemplateProps) {
  return (
    <div style={{ ...style, fontFamily: 'Arial, sans-serif', fontSize: 12 }} id="resume-preview">
      <div style={{ borderBottom: `3px solid ${s.accent}`, padding: '20px 40px 14px' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>{profile.name || 'Your Name'}</h1>
        <div style={{ fontSize: 11, color: s.muted, marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: '2px 12px' }}>
          {[profile.email, profile.phone, profile.location, profile.linkedin].filter(Boolean).map((v, i) => <span key={i}>{v}</span>)}
        </div>
      </div>
      <div style={{ padding: '16px 40px' }}>
        {profile.summary && <p style={{ fontSize: 12, color: s.muted, marginBottom: 14, lineHeight: 1.5 }}>{profile.summary}</p>}
        {(profile.skills?.length ?? 0) > 0 && (
          <div style={{ marginBottom: 14 }}>
            <strong style={{ fontSize: 12, color: s.accent }}>Skills: </strong>
            <span style={{ color: s.muted }}>{profile.skills.join(', ')}</span>
          </div>
        )}
        {(profile.experience?.length ?? 0) > 0 && (
          <section style={{ marginBottom: 14 }}>
            <h2 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: s.accent, borderBottom: `1px solid ${s.border}`, paddingBottom: 3, marginBottom: 8 }}>Experience</h2>
            {profile.experience.map(exp => (
              <div key={exp.id} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 700 }}>{exp.title}, {exp.company}</span>
                  <span style={{ fontSize: 11, color: s.light }}>{exp.startDate} – {exp.current ? 'Present' : exp.endDate}</span>
                </div>
                <ul style={{ margin: '4px 0 0 14px', padding: 0 }}>
                  {exp.bullets.filter(Boolean).map((b, i) => <li key={i} style={{ color: s.muted, marginBottom: 2 }}>{b}</li>)}
                </ul>
              </div>
            ))}
          </section>
        )}
        {(profile.education?.length ?? 0) > 0 && (
          <section>
            <h2 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: s.accent, borderBottom: `1px solid ${s.border}`, paddingBottom: 3, marginBottom: 8 }}>Education</h2>
            {profile.education.map(edu => (
              <div key={edu.id} style={{ marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}>
                <span><strong>{edu.degree}{edu.field && ` in ${edu.field}`}</strong>, {edu.school}</span>
                <span style={{ fontSize: 11, color: s.light }}>{edu.endDate}</span>
              </div>
            ))}
          </section>
        )}
      </div>
    </div>
  )
}
