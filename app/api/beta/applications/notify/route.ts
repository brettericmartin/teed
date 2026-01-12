import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendScorecardResultEmail } from '@/lib/email';
import { getPersonaById } from '@/lib/scorecard';
import type { ScorecardPersonaId, ScorecardMode, CategoryScores } from '@/lib/types/beta';

export const dynamic = 'force-dynamic';

/**
 * POST /api/beta/applications/notify
 *
 * Sends the scorecard result email after a successful application submission.
 * Called from the client after redirect to success page to ensure
 * the application was successfully created.
 *
 * Body: { applicationId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { applicationId } = await request.json();

    if (!applicationId) {
      return NextResponse.json(
        { error: 'Application ID required' },
        { status: 400 }
      );
    }

    // Use service role to read application data
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Fetch application data (email_sent_at may not exist yet)
    const { data: application, error } = await supabase
      .from('beta_applications')
      .select(`
        id,
        email,
        name,
        full_name,
        custom_referral_code,
        scorecard_score,
        scorecard_persona,
        scorecard_mode,
        scorecard_category_scores
      `)
      .eq('id', applicationId)
      .single();

    if (error || !application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    // Check if email was already sent (column may not exist yet)
    const { data: emailCheck } = await supabase
      .from('beta_applications')
      .select('email_sent_at')
      .eq('id', applicationId)
      .single();

    if (emailCheck?.email_sent_at) {
      return NextResponse.json({
        success: true,
        message: 'Email already sent',
        alreadySent: true,
      });
    }

    const name = application.name || application.full_name || 'there';
    const firstName = name.split(' ')[0];
    const personaId = application.scorecard_persona as ScorecardPersonaId;
    const mode = (application.scorecard_mode as ScorecardMode) || 'monetization';
    const categoryScores = application.scorecard_category_scores as CategoryScores;
    const persona = getPersonaById(personaId);

    // Determine top opportunity (lowest scoring category)
    const categories = [
      { key: 'organization', name: 'Organization', score: categoryScores?.organization ?? 50 },
      { key: 'sharing', name: 'Sharing', score: categoryScores?.sharing ?? 50 },
      {
        key: mode === 'monetization' ? 'monetization' : 'impact',
        name: mode === 'monetization' ? 'Monetization' : 'Impact',
        score: mode === 'monetization'
          ? (categoryScores?.monetization ?? 50)
          : (categoryScores?.impact ?? 50),
      },
      { key: 'documentation', name: 'Documentation', score: categoryScores?.documentation ?? 50 },
    ];

    const lowestCategory = categories.reduce((min, cat) =>
      cat.score < min.score ? cat : min
    );

    const opportunityDescriptions: Record<string, string> = {
      organization: 'Building a system to organize your gear will help you share recommendations faster and more consistently.',
      sharing: 'Expanding your reach across platforms will help more people discover your curations.',
      monetization: 'Setting up affiliate links and tracking will help you earn from the recommendations you already make.',
      impact: 'Engaging more with your audience will increase the value you provide through your recommendations.',
      documentation: 'Keeping notes on why you chose each product makes your recommendations more valuable and trustworthy.',
    };

    // Build referral link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://teed.club';
    const referralCode = application.custom_referral_code || applicationId;
    const referralLink = `${baseUrl}/apply?ref=${referralCode}`;

    // Send the email
    const result = await sendScorecardResultEmail(application.email, {
      name: firstName,
      applicationId,
      overallScore: application.scorecard_score ?? 50,
      personaName: persona.name,
      personaEmoji: persona.emoji,
      personaFrame: persona.frame,
      mode,
      topOpportunity: {
        title: `Improve Your ${lowestCategory.name}`,
        description: opportunityDescriptions[lowestCategory.key],
      },
      referralLink,
    });

    if (result.success) {
      // Mark email as sent (ignore if column doesn't exist)
      try {
        await supabase
          .from('beta_applications')
          .update({ email_sent_at: new Date().toISOString() })
          .eq('id', applicationId);
      } catch {
        // Column may not exist yet - that's OK
      }

      return NextResponse.json({
        success: true,
        message: 'Email sent successfully',
        emailId: result.id,
      });
    } else {
      return NextResponse.json(
        { error: result.error || 'Failed to send email' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error sending application notification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
