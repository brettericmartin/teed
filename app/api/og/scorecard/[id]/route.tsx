import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { createServerSupabase } from '@/lib/serverSupabase';
import { getPersonaById } from '@/lib/scorecard';
import type { CategoryScores, ScorecardMode, ScorecardPersonaId } from '@/lib/types/beta';

export const runtime = 'edge';

// Color mapping for scores
function getScoreColor(score: number): string {
  if (score >= 85) return '#10B981'; // emerald-500
  if (score >= 70) return '#3B82F6'; // blue-500
  if (score >= 50) return '#F59E0B'; // amber-500
  if (score >= 30) return '#F97316'; // orange-500
  return '#64748B'; // slate-500
}

// Persona color mapping
function getPersonaColorHex(color: string): string {
  const colors: Record<string, string> = {
    emerald: '#10B981',
    blue: '#3B82F6',
    amber: '#F59E0B',
    orange: '#F97316',
    slate: '#64748B',
  };
  return colors[color] || colors.slate;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const supabase = await createServerSupabase();

    // Fetch the application with scorecard data
    const { data: application } = await supabase
      .from('beta_applications')
      .select(`
        id,
        name,
        full_name,
        scorecard_score,
        scorecard_category_scores,
        scorecard_persona,
        scorecard_mode
      `)
      .eq('id', id)
      .single();

    // If no scorecard data, return fallback
    if (!application?.scorecard_score) {
      return new ImageResponse(
        (
          <div
            style={{
              height: '100%',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#F9F5EE',
            }}
          >
            <h1
              style={{
                fontSize: '56px',
                fontWeight: 700,
                color: '#1A1A1A',
              }}
            >
              Creator Scorecard
            </h1>
            <p
              style={{
                fontSize: '24px',
                color: '#666666',
              }}
            >
              Discover your gear curation strengths
            </p>
          </div>
        ),
        { width: 1200, height: 630 }
      );
    }

    const score = application.scorecard_score;
    const categoryScores = application.scorecard_category_scores as CategoryScores;
    const personaId = application.scorecard_persona as ScorecardPersonaId;
    const mode = (application.scorecard_mode as ScorecardMode) || 'monetization';
    const persona = getPersonaById(personaId);
    const firstName = (application.name || application.full_name || 'Creator').split(' ')[0];

    const scoreColor = getScoreColor(score);
    const personaColor = getPersonaColorHex(persona.color);

    // Build category list based on mode
    const thirdCategory = mode === 'monetization' ? 'Monetization' : 'Impact';
    const thirdScore = mode === 'monetization'
      ? categoryScores.monetization ?? 50
      : categoryScores.impact ?? 50;

    const categories = [
      { name: 'Organization', score: categoryScores.organization },
      { name: 'Sharing', score: categoryScores.sharing },
      { name: thirdCategory, score: thirdScore },
      { name: 'Documentation', score: categoryScores.documentation },
    ];

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#F9F5EE',
            backgroundImage: 'linear-gradient(135deg, #F9F5EE 0%, #E8F5E9 50%, #E0F2F1 100%)',
            padding: '40px 60px',
          }}
        >
          {/* Top section with score and persona */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              marginBottom: '32px',
            }}
          >
            {/* Left: Score Circle */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '40px',
              }}
            >
              {/* Score circle */}
              <div
                style={{
                  position: 'relative',
                  width: '180px',
                  height: '180px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {/* Background ring */}
                <svg
                  width="180"
                  height="180"
                  style={{
                    position: 'absolute',
                    transform: 'rotate(-90deg)',
                  }}
                >
                  <circle
                    cx="90"
                    cy="90"
                    r="75"
                    fill="none"
                    stroke="#E5E7EB"
                    strokeWidth="14"
                  />
                  <circle
                    cx="90"
                    cy="90"
                    r="75"
                    fill="none"
                    stroke={scoreColor}
                    strokeWidth="14"
                    strokeLinecap="round"
                    strokeDasharray={`${(score / 100) * 471} 471`}
                  />
                </svg>
                {/* Score text */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                  }}
                >
                  <span
                    style={{
                      fontSize: '56px',
                      fontWeight: 700,
                      color: '#1A1A1A',
                    }}
                  >
                    {score}
                  </span>
                  <span
                    style={{
                      fontSize: '18px',
                      color: '#666666',
                    }}
                  >
                    / 100
                  </span>
                </div>
              </div>

              {/* Persona info */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                  }}
                >
                  <span style={{ fontSize: '42px' }}>{persona.emoji}</span>
                  <div
                    style={{
                      backgroundColor: `${personaColor}20`,
                      color: personaColor,
                      padding: '8px 16px',
                      borderRadius: '9999px',
                      fontSize: '20px',
                      fontWeight: 600,
                    }}
                  >
                    {persona.name}
                  </div>
                </div>
                <p
                  style={{
                    fontSize: '18px',
                    color: '#666666',
                    maxWidth: '400px',
                    margin: '0',
                    lineHeight: 1.4,
                  }}
                >
                  {persona.frame}
                </p>
              </div>
            </div>

            {/* Right: Teed branding */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
              }}
            >
              <span
                style={{
                  fontSize: '32px',
                  fontWeight: 700,
                  color: '#7A9770',
                }}
              >
                Teed
              </span>
              <span style={{ fontSize: '14px', color: '#999999' }}>teed.club</span>
            </div>
          </div>

          {/* Category bars */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              flex: 1,
              justifyContent: 'center',
            }}
          >
            {categories.map((cat, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                }}
              >
                <span
                  style={{
                    fontSize: '18px',
                    color: '#374151',
                    width: '140px',
                    fontWeight: 500,
                  }}
                >
                  {cat.name}
                </span>
                <div
                  style={{
                    flex: 1,
                    height: '24px',
                    backgroundColor: '#E5E7EB',
                    borderRadius: '9999px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${cat.score}%`,
                      height: '100%',
                      backgroundColor: getScoreColor(cat.score),
                      borderRadius: '9999px',
                    }}
                  />
                </div>
                <span
                  style={{
                    fontSize: '18px',
                    fontWeight: 600,
                    color: getScoreColor(cat.score),
                    width: '40px',
                    textAlign: 'right',
                  }}
                >
                  {cat.score}
                </span>
              </div>
            ))}
          </div>

          {/* Bottom text */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '24px',
            }}
          >
            <p
              style={{
                fontSize: '18px',
                color: '#666666',
                margin: '0',
              }}
            >
              {firstName}'s Creator Scorecard
            </p>
            <p
              style={{
                fontSize: '16px',
                color: '#999999',
                margin: '0',
              }}
            >
              Discover your gear curation strengths at teed.club/apply
            </p>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error('Error generating scorecard OG image:', error);

    // Fallback image
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#F9F5EE',
          }}
        >
          <h1
            style={{
              fontSize: '56px',
              fontWeight: 700,
              color: '#1A1A1A',
            }}
          >
            Creator Scorecard
          </h1>
          <p
            style={{
              fontSize: '24px',
              color: '#666666',
            }}
          >
            Discover your gear curation strengths
          </p>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  }
}
