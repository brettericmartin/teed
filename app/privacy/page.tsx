import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPage, MailLink, type LegalSection } from '@/components/legal/LegalPage';
import { SITE_URL } from '@/lib/siteUrl';

// /privacy (2026-10-20): what Teed stores, which companies touch it, what it is
// for, and how to get it deleted. Plain English, no legal boilerplate. The
// ChatGPT integration has its own page at /legal/gpt-privacy.
//
// TODO(legal entity): the site is run by Brett Martin as "Teed". If Teed is
// formed as an LLC, put the entity name in the "Who runs Teed" section.

const TITLE = 'Privacy: what Teed collects and what it does with it';
const DESCRIPTION =
  'What teed.club stores when you make an account, build a bag, click a link or apply for the beta, which companies handle it (Supabase, Vercel, Resend), what it is used for, and how to delete it.';
const UPDATED = 'October 20, 2026';

export const metadata: Metadata = {
  title: `${TITLE} | Teed.club`,
  description: DESCRIPTION,
  robots: { index: true, follow: true },
  alternates: { canonical: `${SITE_URL}/privacy` },
  openGraph: {
    type: 'website',
    url: `${SITE_URL}/privacy`,
    siteName: 'Teed.club',
    title: TITLE,
    description: DESCRIPTION,
  },
};

const SECTIONS: LegalSection[] = [
  {
    id: 'who',
    heading: 'Who runs Teed',
    paragraphs: [
      <>
        Teed is run by Brett Martin in Tempe, Arizona. Anything on this page, and any request about your data,
        goes to <MailLink />. That is the same address the site sends email from, and a person reads it.
      </>,
    ],
  },
  {
    id: 'collect',
    heading: 'What Teed collects',
    paragraphs: [
      <>
        <strong className="text-[var(--text-primary)]">Your account.</strong> The email address you sign up with,
        a password hash if you use one, and, if you sign in with Google, the email and name Google passes along.
        Your profile: handle, display name, bio, avatar and any links you add to it.
      </>,
      <>
        <strong className="text-[var(--text-primary)]">What you build.</strong> Your bags, the items in them, the
        links, notes, prices and photos you attach, and the history of changes to a bag. A bag you mark public is
        visible to anyone with the link and to search engines. A private bag is visible to you.
      </>,
      <>
        <strong className="text-[var(--text-primary)]">Link clicks.</strong> When someone clicks an outbound link
        on a bag, Teed records which link was clicked, the kind of device, and the page the click came from, so
        the bag&apos;s owner can see which items people look at. The visitor&apos;s IP address is used to limit
        abuse of the API and is not kept with the click.
      </>,
      <>
        <strong className="text-[var(--text-primary)]">Beta applications.</strong> If you apply for the beta:
        your name, email, what you would use Teed for, your audience size and platform if you give them, your
        answers to the short survey, and who referred you if you came through a referral link or invite code.
      </>,
      <>
        <strong className="text-[var(--text-primary)]">Usage.</strong> Which pages and features get used, tied
        to your account when you are signed in, so we know what to keep building. Teed runs no third-party
        advertising or tracking scripts. The only cookies are the ones that keep you signed in.
      </>,
    ],
  },
  {
    id: 'why',
    heading: 'What it is used for',
    paragraphs: [
      'To run your account and show your bags to the people you share them with.',
      'To send you the emails the service needs: sign-in links, beta approval and your invite code, and replies to anything you write in. There is no marketing list and nothing is sent that you did not ask for.',
      'To show bag owners which of their links get clicked, and to decide what to build next.',
      'Nothing is sold, rented or traded to anyone. Teed does not share your email address with retailers, brands or other members.',
    ],
  },
  {
    id: 'where',
    heading: 'Who handles it on our behalf',
    paragraphs: [
      'Supabase stores the database, your sign-in session and uploaded photos, on servers in the United States.',
      'Vercel hosts the site and serves every page.',
      'Resend delivers the emails Teed sends.',
      'When you add an item from a product link or a photo, that link or photo is sent to OpenAI or Anthropic to identify the product. Your account details are not sent with it.',
      'Google provides sign-in if you choose it. Each of these companies processes data only to provide that service, under its own privacy policy.',
    ],
  },
  {
    id: 'keep',
    heading: 'How long it is kept',
    paragraphs: [
      'Your account, profile and bags stay until you delete them or ask us to.',
      'Beta applications are kept while the beta programme runs. Applications that were never approved are deleted within six months of the programme closing.',
      'Click and usage records are kept for twelve months, then deleted or reduced to counts that cannot identify anyone.',
      'When an account is deleted, its data is removed from the live database within a week and from backups within thirty days.',
    ],
  },
  {
    id: 'choices',
    heading: 'Your choices',
    paragraphs: [
      <>
        <strong className="text-[var(--text-primary)]">See what we hold.</strong> Email <MailLink /> from the
        address on your account and we send you a copy within a week.
      </>,
      <>
        <strong className="text-[var(--text-primary)]">Delete your account.</strong> Email <MailLink /> from the
        address on your account with the word &quot;delete&quot; and the account, its bags and its photos are
        removed within a week. Public bags stop resolving at the same time.
      </>,
      <>
        <strong className="text-[var(--text-primary)]">Withdraw a beta application.</strong> Reply to any email
        about your application, or write to <MailLink />, and it is removed the same day.
      </>,
      'You can also edit or delete any bag, item or profile field yourself at any time from your account.',
    ],
  },
  {
    id: 'age',
    heading: 'Age',
    paragraphs: [
      'Teed is for adults. You must be 18 or older to make an account or apply for the beta. We do not knowingly keep information about anyone under 18, and we delete it if we find it.',
    ],
  },
  {
    id: 'changes',
    heading: 'Changes',
    paragraphs: [
      <>
        This page is dated at the top. If the way Teed handles your information changes in a way that matters,
        members hear about it by email before it takes effect. The{' '}
        <Link href="/terms" className="text-[var(--teed-green-9)] font-medium hover:underline">
          terms of use
        </Link>{' '}
        cover everything else. Last updated {UPDATED}.
      </>,
    ],
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      crumb="Privacy"
      kicker="Privacy"
      title="What Teed collects, and what it does with it."
      updated={UPDATED}
      intro={
        <>
          Short version: your email address, your profile, and the bags you build. It is used to run your
          account and show your bags to the people you share them with. Nothing is sold to anyone, and one email
          gets everything deleted.
        </>
      }
      sections={SECTIONS}
    />
  );
}
