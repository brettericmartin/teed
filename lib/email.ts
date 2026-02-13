import { Resend } from 'resend';

// Lazy-initialize Resend client to avoid build-time errors
let resendClient: Resend | null = null;

function getResendClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) {
    return null;
  }
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

const FROM_EMAIL = process.env.EMAIL_FROM || 'Teed <hello@teed.club>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://teed.club';

interface SendEmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

/**
 * Send beta approval email with invite code
 */
export async function sendApprovalEmail(
  to: string,
  data: {
    name: string;
    inviteCode: string;
    tier?: string;
  }
): Promise<SendEmailResult> {
  const resend = getResendClient();
  if (!resend) {
    console.warn('RESEND_API_KEY not configured, skipping email');
    return { success: false, error: 'Email not configured' };
  }

  try {
    const { data: result, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: "You're in! Welcome to the Teed founding cohort",
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #16a34a; margin: 0;">Welcome to Teed!</h1>
  </div>

  <p>Hey ${data.name},</p>

  <p style="font-size: 18px; color: #16a34a; font-weight: bold;">
    Congratulations! You've been approved as a founding member.
  </p>

  <p>You're now part of an exclusive group of ${data.tier === 'founder' ? 'founding' : 'beta'} creators building the future of product sharing.</p>

  <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 12px; padding: 20px; margin: 30px 0; text-align: center;">
    <p style="margin: 0 0 10px 0; color: #166534; font-size: 14px;">Your invite code</p>
    <p style="margin: 0; font-size: 24px; font-weight: bold; font-family: monospace; color: #15803d; letter-spacing: 2px;">
      ${data.inviteCode}
    </p>
  </div>

  <p style="text-align: center;">
    <a href="${APP_URL}/signup?code=${data.inviteCode}" style="display: inline-block; background: #16a34a; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">
      Create Your Account
    </a>
  </p>

  <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 30px 0;">

  <p style="font-size: 14px; color: #666;">
    <strong>What's next?</strong>
  </p>
  <ul style="font-size: 14px; color: #666;">
    <li>Create your account using the button above</li>
    <li>Set up your profile and first bag</li>
    <li>Start curating your favorite products</li>
  </ul>

  <p style="font-size: 14px; color: #666;">
    Questions? Just reply to this email.
  </p>

  <p style="font-size: 12px; color: #999; margin-top: 30px;">
    — The Teed Team
  </p>
</body>
</html>
      `,
    });

    if (error) {
      console.error('Error sending approval email:', error);
      return { success: false, error: error.message };
    }

    return { success: true, id: result?.id };
  } catch (err) {
    console.error('Error sending approval email:', err);
    return { success: false, error: String(err) };
  }
}

/**
 * Send beta rejection email
 */
export async function sendRejectionEmail(
  to: string,
  data: {
    name: string;
    reason?: string;
  }
): Promise<SendEmailResult> {
  const resend = getResendClient();
  if (!resend) {
    console.warn('RESEND_API_KEY not configured, skipping email');
    return { success: false, error: 'Email not configured' };
  }

  try {
    const { data: result, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: 'Update on your Teed application',
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px;">
  <p>Hey ${data.name},</p>

  <p>Thank you for your interest in joining Teed.club's founding cohort.</p>

  <p>After careful review, we've decided not to move forward with your application at this time. ${data.reason ? `Reason: ${data.reason}` : ''}</p>

  <p>This doesn't mean the door is closed! We're continually expanding, and we encourage you to:</p>

  <ul>
    <li>Reapply in a few months with an updated profile</li>
    <li>Follow us on social for updates on future openings</li>
    <li>Build your creator presence in the meantime</li>
  </ul>

  <p>We appreciate your interest and wish you the best in your creator journey.</p>

  <p style="font-size: 12px; color: #999; margin-top: 30px;">
    — The Teed Team
  </p>
</body>
</html>
      `,
    });

    if (error) {
      console.error('Error sending rejection email:', error);
      return { success: false, error: error.message };
    }

    return { success: true, id: result?.id };
  } catch (err) {
    console.error('Error sending rejection email:', err);
    return { success: false, error: String(err) };
  }
}

/**
 * Send welcome email after application submission
 */
export async function sendWelcomeEmail(
  to: string,
  data: {
    name: string;
    referralLink: string;
    position: number;
    approvalOdds?: number;
  }
): Promise<SendEmailResult> {
  const resend = getResendClient();
  if (!resend) {
    console.warn('RESEND_API_KEY not configured, skipping email');
    return { success: false, error: 'Email not configured' };
  }

  try {
    const { data: result, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: 'Application received - here\'s how to improve your odds',
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #16a34a; margin: 0;">Application Received!</h1>
  </div>

  <p>Hey ${data.name},</p>

  <p>Thanks for applying to join Teed.club's founding cohort! We're excited you want to be part of what we're building.</p>

  ${data.approvalOdds ? `
  <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center;">
    <p style="margin: 0 0 5px 0; color: #166534; font-size: 14px;">Your current approval odds</p>
    <p style="margin: 0; font-size: 32px; font-weight: bold; color: #15803d;">
      ${data.approvalOdds}%
    </p>
  </div>
  ` : ''}

  <p style="font-weight: bold; color: #16a34a;">Want guaranteed approval?</p>

  <p>Refer 5 friends who apply, and you'll get instant approval — no waiting for review!</p>

  <div style="background: #fafafa; border: 1px solid #e5e5e5; border-radius: 12px; padding: 20px; margin: 20px 0;">
    <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">Your referral link:</p>
    <p style="margin: 0; font-family: monospace; font-size: 14px; word-break: break-all; color: #16a34a;">
      ${data.referralLink}
    </p>
  </div>

  <p style="text-align: center;">
    <a href="${data.referralLink}" style="display: inline-block; background: #16a34a; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-right: 10px;">
      Copy Link
    </a>
    <a href="https://twitter.com/intent/tweet?text=${encodeURIComponent(`I just applied to @teedclub! Use my link to skip the line: ${data.referralLink}`)}" style="display: inline-block; background: #000; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
      Share on X
    </a>
  </p>

  <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 30px 0;">

  <p style="font-size: 14px; color: #666;">
    We review applications weekly. Keep an eye on your inbox!
  </p>

  <p style="font-size: 12px; color: #999; margin-top: 30px;">
    — The Teed Team
  </p>
</body>
</html>
      `,
    });

    if (error) {
      console.error('Error sending welcome email:', error);
      return { success: false, error: error.message };
    }

    return { success: true, id: result?.id };
  } catch (err) {
    console.error('Error sending welcome email:', err);
    return { success: false, error: String(err) };
  }
}

/**
 * Send position update email (for weekly digest)
 */
export async function sendPositionUpdateEmail(
  to: string,
  data: {
    name: string;
    referralLink: string;
    successfulReferrals: number;
    referralsUntilApproval: number;
  }
): Promise<SendEmailResult> {
  const resend = getResendClient();
  if (!resend) {
    console.warn('RESEND_API_KEY not configured, skipping email');
    return { success: false, error: 'Email not configured' };
  }

  try {
    const { data: result, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Waitlist update: ${data.referralsUntilApproval} referrals away from instant approval`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px;">
  <p>Hey ${data.name},</p>

  <p>Here's your weekly Teed waitlist update:</p>

  <div style="background: #fafafa; border: 1px solid #e5e5e5; border-radius: 12px; padding: 20px; margin: 20px 0;">
    <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
      <div>
        <p style="margin: 0; color: #666; font-size: 14px;">Successful referrals</p>
        <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: bold; color: #16a34a;">${data.successfulReferrals}</p>
      </div>
      <div>
        <p style="margin: 0; color: #666; font-size: 14px;">Until instant approval</p>
        <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: bold; color: #f59e0b;">${data.referralsUntilApproval}</p>
      </div>
    </div>
  </div>

  ${data.referralsUntilApproval <= 2 ? `
  <p style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; color: #92400e;">
    <strong>You're so close!</strong> Just ${data.referralsUntilApproval} more referral${data.referralsUntilApproval === 1 ? '' : 's'} and you'll be automatically approved!
  </p>
  ` : ''}

  <p style="text-align: center; margin-top: 30px;">
    <a href="${data.referralLink}" style="display: inline-block; background: #16a34a; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">
      Share Your Link
    </a>
  </p>

  <p style="font-size: 12px; color: #999; margin-top: 30px; text-align: center;">
    — The Teed Team
  </p>
</body>
</html>
      `,
    });

    if (error) {
      console.error('Error sending position update email:', error);
      return { success: false, error: error.message };
    }

    return { success: true, id: result?.id };
  } catch (err) {
    console.error('Error sending position update email:', err);
    return { success: false, error: String(err) };
  }
}

/**
 * Send scorecard result email after application submission
 */
export async function sendScorecardResultEmail(
  to: string,
  data: {
    name: string;
    applicationId: string;
    overallScore: number;
    personaName: string;
    personaEmoji: string;
    personaFrame: string;
    mode: 'monetization' | 'impact' | 'personal';
    topOpportunity?: {
      title: string;
      description: string;
    };
    referralLink: string;
  }
): Promise<SendEmailResult> {
  const resend = getResendClient();
  if (!resend) {
    console.warn('RESEND_API_KEY not configured, skipping email');
    return { success: false, error: 'Email not configured' };
  }

  // Get score color for the email
  const getScoreColor = (score: number): string => {
    if (score >= 85) return '#10B981'; // emerald
    if (score >= 70) return '#3B82F6'; // blue
    if (score >= 50) return '#F59E0B'; // amber
    if (score >= 30) return '#F97316'; // orange
    return '#64748B'; // slate
  };

  const scoreColor = getScoreColor(data.overallScore);
  const shareUrl = `${APP_URL}/apply/success?id=${data.applicationId}`;
  const ogImageUrl = `${APP_URL}/api/og/scorecard/${data.applicationId}`;

  try {
    const { data: result, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Your Creator Scorecard: ${data.overallScore}/100 - ${data.personaName}`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #16a34a; margin: 0;">Your Creator Scorecard</h1>
    <p style="color: #666; margin: 10px 0 0 0;">Thanks for applying to Teed!</p>
  </div>

  <!-- Score Display -->
  <div style="background: linear-gradient(135deg, #F9F5EE 0%, #E8F5E9 100%); border-radius: 16px; padding: 30px; margin: 20px 0; text-align: center;">
    <div style="display: inline-block; width: 120px; height: 120px; border-radius: 50%; background: white; box-shadow: 0 4px 20px rgba(0,0,0,0.1); position: relative;">
      <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);">
        <span style="font-size: 48px; font-weight: bold; color: ${scoreColor};">${data.overallScore}</span>
        <span style="display: block; font-size: 14px; color: #666;">/100</span>
      </div>
    </div>

    <div style="margin-top: 20px;">
      <span style="font-size: 32px;">${data.personaEmoji}</span>
      <p style="font-size: 20px; font-weight: bold; color: #1a1a1a; margin: 10px 0 5px 0;">
        ${data.personaName}
      </p>
      <p style="font-size: 14px; color: #666; margin: 0; font-style: italic;">
        "${data.personaFrame}"
      </p>
    </div>
  </div>

  <p>Hey ${data.name},</p>

  <p>Based on your responses, we've created your personalized Creator Scorecard. ${data.mode === 'monetization' ? 'Your score reflects your readiness to monetize your gear recommendations.' : data.mode === 'personal' ? 'We love that you\'re here for yourself. Teed is perfect for personal gear organization.' : 'Your score reflects your potential impact in helping your audience.'}</p>

  ${data.topOpportunity ? `
  <!-- Top Opportunity -->
  <div style="background: #fafafa; border: 1px solid #e5e5e5; border-radius: 12px; padding: 20px; margin: 20px 0;">
    <p style="margin: 0 0 10px 0; color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Your Biggest Opportunity</p>
    <p style="margin: 0 0 8px 0; font-size: 18px; font-weight: bold; color: #1a1a1a;">
      ${data.topOpportunity.title}
    </p>
    <p style="margin: 0; font-size: 14px; color: #666;">
      ${data.topOpportunity.description}
    </p>
  </div>
  ` : ''}

  <p style="font-weight: bold; color: #16a34a;">Want guaranteed approval?</p>

  <p>Refer 5 friends who apply, and you'll get instant approval — no waiting for review!</p>

  <div style="background: #fafafa; border: 1px solid #e5e5e5; border-radius: 12px; padding: 20px; margin: 20px 0;">
    <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">Your referral link:</p>
    <p style="margin: 0; font-family: monospace; font-size: 14px; word-break: break-all; color: #16a34a;">
      ${data.referralLink}
    </p>
  </div>

  <p style="text-align: center;">
    <a href="${shareUrl}" style="display: inline-block; background: #16a34a; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">
      View Full Scorecard
    </a>
  </p>

  <p style="text-align: center; margin-top: 20px;">
    <a href="https://twitter.com/intent/tweet?text=${encodeURIComponent(`I just got my Creator Scorecard from @teedclub! I'm a ${data.personaName} with a score of ${data.overallScore}/100. What's yours?`)}&url=${encodeURIComponent(shareUrl)}" style="display: inline-block; background: #000; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
      Share on X
    </a>
  </p>

  <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 30px 0;">

  <p style="font-size: 14px; color: #666;">
    We review applications weekly. Keep an eye on your inbox!
  </p>

  <p style="font-size: 12px; color: #999; margin-top: 30px;">
    — The Teed Team
  </p>
</body>
</html>
      `,
    });

    if (error) {
      console.error('Error sending scorecard email:', error);
      return { success: false, error: error.message };
    }

    return { success: true, id: result?.id };
  } catch (err) {
    console.error('Error sending scorecard email:', err);
    return { success: false, error: String(err) };
  }
}
