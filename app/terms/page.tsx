import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPage, MailLink, type LegalSection } from '@/components/legal/LegalPage';
import { SITE_URL } from '@/lib/siteUrl';

// /terms (2026-10-20): the deal between Teed and the people who use it, in
// plain English. Free service, you own what you put in, affiliate links are
// disclosed, no warranty, Arizona law.
//
// TODO(legal entity): "Teed" here means the service run by Brett Martin. If an
// LLC is formed, name it in the first section and in the governing-law section.

const TITLE = 'Terms of use for Teed';
const DESCRIPTION =
  'The terms for using teed.club: a free service, you own what you put in it, how public bags and affiliate links work, what Teed does not promise, and Arizona law.';
const UPDATED = 'October 20, 2026';

export const metadata: Metadata = {
  title: `${TITLE} | Teed.club`,
  description: DESCRIPTION,
  robots: { index: true, follow: true },
  alternates: { canonical: `${SITE_URL}/terms` },
  openGraph: {
    type: 'website',
    url: `${SITE_URL}/terms`,
    siteName: 'Teed.club',
    title: TITLE,
    description: DESCRIPTION,
  },
};

const SECTIONS: LegalSection[] = [
  {
    id: 'deal',
    heading: 'The deal',
    paragraphs: [
      <>
        Teed is a place to organize the gear you use into bags and share them. It is run by Brett Martin in
        Tempe, Arizona. By making an account, applying for the beta, or using the site, you agree to these
        terms and to the{' '}
        <Link href="/privacy" className="text-[var(--teed-green-9)] font-medium hover:underline">
          privacy page
        </Link>
        . If you do not agree, do not use Teed.
      </>,
      'You must be 18 or older to make an account.',
    ],
  },
  {
    id: 'free',
    heading: 'A free service, in beta',
    paragraphs: [
      'Teed is free to use. Parts of it are in beta, which means features change, break and sometimes go away. If a paid tier is ever added, nothing you already have will be taken away without notice and a way to keep your data.',
      'Teed may limit, pause or shut down accounts that abuse the service, and may shut down the service itself. If that happens, members get notice and a way to export their bags first.',
    ],
  },
  {
    id: 'content',
    heading: 'What you put in is yours',
    paragraphs: [
      'You own the bags, items, notes and photos you add. Teed claims no ownership of any of it.',
      'So that Teed can work, you give Teed permission to store your content, show it to the people you share it with, and, for bags you mark public, to display it on the site, in previews, embeds and search results, and in summaries such as the Discover page. That permission ends for a bag when you delete it or make it private, except for copies already cached by other people or search engines.',
      'You are responsible for what you post. Only add photos and text you have the right to use, and do not post anything unlawful, hateful, deceptive or that invades another person’s privacy. Teed can remove content that breaks these rules and close the account that posted it.',
    ],
  },
  {
    id: 'links',
    heading: 'Links, prices and affiliate disclosure',
    paragraphs: [
      'Bags link out to retailers. Some of those links are affiliate links: when you buy through one, the owner of the bag or Teed may earn a commission from the retailer. It costs you nothing extra. Where a bag owner uses their own affiliate links, that income is theirs and Teed takes no cut.',
      'Teed takes part in affiliate programmes, including Amazon Associates, and earns from qualifying purchases made through its links.',
      'Brett Martin, who runs Teed, also builds StowGolf, a golf simulator enclosure. Items from that brand carry a disclosure line wherever they appear.',
      'Prices, availability and specs shown on Teed come from the retailer or from the member who added the item, at the time it was added. Check them on the retailer’s own page before you buy. Teed is not the seller and is not party to any purchase you make.',
    ],
  },
  {
    id: 'account',
    heading: 'Your account',
    paragraphs: [
      'Keep your sign-in to yourself. You are responsible for what happens under your account. Tell us straight away if you think someone else has used it.',
      'Handles are first come, first served, but Teed can reclaim a handle that impersonates someone, infringes a trademark, or sits unused on an empty account.',
      <>
        You can delete your account at any time by emailing <MailLink /> from the address on the account.
      </>,
    ],
  },
  {
    id: 'warranty',
    heading: 'No warranty',
    paragraphs: [
      'Teed is provided as it is, with no warranty of any kind, express or implied, including that it will be available, accurate, free of errors, or fit for a particular purpose. Gear recommendations on Teed are the opinions of the members who post them, not professional advice.',
      'To the fullest extent the law allows, Teed and the person who runs it are not liable for any indirect, incidental or consequential loss arising from your use of the service, and total liability for any claim is limited to one hundred US dollars. Some places do not allow these limits, in which case they apply as far as the law permits.',
    ],
  },
  {
    id: 'law',
    heading: 'Arizona law',
    paragraphs: [
      'These terms are governed by the laws of the State of Arizona, without regard to its conflict-of-law rules. Any dispute that cannot be settled by talking it through goes to the state or federal courts in Maricopa County, Arizona, and you agree to that venue.',
      'If any part of these terms turns out to be unenforceable, the rest still stands.',
    ],
  },
  {
    id: 'changes',
    heading: 'Changes and contact',
    paragraphs: [
      <>
        These terms are dated at the top. Changes that matter are announced to members by email before they
        take effect. Keep using Teed after that and the new terms apply. Questions go to <MailLink />. Last
        updated {UPDATED}.
      </>,
    ],
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      crumb="Terms"
      kicker="Terms of use"
      title="The terms, in plain English."
      updated={UPDATED}
      intro={
        <>
          Teed is free. What you put in it is yours. Public bags are public. Some links earn a commission and
          say so. Teed promises to try, not to be perfect. Arizona law applies.
        </>
      }
      sections={SECTIONS}
    />
  );
}
