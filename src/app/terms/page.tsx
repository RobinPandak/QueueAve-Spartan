import { PublicNav } from '@/components/public-nav'
import { SiteFooter } from '@/components/site-footer'

export const metadata = {
  title: 'Terms of Service | Spartan by QueueAve',
  description: 'The terms that govern your use of the QueueAve sports session management platform.',
}

type Block =
  | { type: 'p'; text: string }
  | { type: 'h3'; text: string }
  | { type: 'ul'; items: string[] }

type Section = { n: string; title: string; blocks: Block[] }

const sections: Section[] = [
  {
    n: '1',
    title: 'Acceptance of Terms',
    blocks: [
      { type: 'p', text: 'By accessing or using QueueAve, whether as an organizer, a player, or a visitor, you accept these Terms. If you do not agree, do not use the Platform. If you use QueueAve on behalf of a club, venue, or organization, you confirm you are authorized to accept these Terms for it.' },
    ],
  },
  {
    n: '2',
    title: 'About QueueAve',
    blocks: [
      { type: 'p', text: 'QueueAve Information Technology Services is based in Cainta, Rizal, Philippines. The Platform provides software for managing sports sessions: court queues, player matchmaking, ELO ratings, check-ins, heats and waves, and related features. QueueAve is a software tool. We do not own or operate sports venues, organize sessions, or supervise play.' },
    ],
  },
  {
    n: '3',
    title: 'Accounts and Identity',
    blocks: [
      { type: 'ul', items: [
        'Organizers sign in with a Google account. You are responsible for activity under your account and for keeping access to it secure.',
        'Players do not create accounts. Players are identified by a personal QR code and the name details they provide at registration.',
        'You agree to provide accurate information. Impersonating another person, or registering players who have not agreed to be registered, is not allowed.',
      ] },
    ],
  },
  {
    n: '4',
    title: 'Fees and Payments',
    blocks: [
      { type: 'p', text: 'The Platform is currently free to use. Entrance fees, court fees, and per-game fees shown on the Platform are set and collected by organizers and venues, not by QueueAve. Payment tracking features (such as paid or unpaid markers) are bookkeeping tools for organizers; QueueAve does not process, hold, or transfer money and is not a party to payment arrangements between players, organizers, and venues. Disputes about fees are between the player and the organizer or venue.' },
    ],
  },
  {
    n: '5',
    title: 'Fair Play and Conduct',
    blocks: [
      { type: 'p', text: 'You agree not to:' },
      { type: 'ul', items: [
        'Manipulate scores, match results, ELO ratings, or queue positions',
        'Misrepresent your skill level to gain unfair matchups',
        'Register, check in, or enter results for a person without their consent',
        'Harass or abuse other players, organizers, or venue staff',
        "Interfere with the Platform's operation, attempt to access data you are not authorized to access, or probe or circumvent security measures",
      ] },
      { type: 'p', text: 'Organizers run their sessions: they may decide check-ins, matchups, score corrections, and removal of players from a session at their discretion.' },
    ],
  },
  {
    n: '6',
    title: 'Organizer Responsibilities',
    blocks: [
      { type: 'p', text: 'Organizers agree to:' },
      { type: 'ul', items: [
        'Have the right to use the venues where they host sessions',
        'Record scores and results accurately and correct errors promptly',
        'Handle any fees they collect lawfully and transparently',
        'Use player information visible to them (names, contact details, payment status) only for running their sessions, consistent with our Privacy Policy and the Data Privacy Act of 2012',
      ] },
    ],
  },
  {
    n: '7',
    title: 'Public Performance Data',
    blocks: [
      { type: 'p', text: 'Sports performance data, such as usernames, ELO ratings, rankings, game statistics, win/loss records, and race finish times, may be publicly displayed, as described in Section 4 of our Privacy Policy. You may request a private profile by emailing contact@queueave.com.' },
    ],
  },
  {
    n: '8',
    title: 'Assumption of Risk and Venue Responsibility',
    blocks: [
      { type: 'p', text: 'Sports involve inherent risks, including physical injury. QueueAve provides queue, matchmaking, and session management software only. We do not control venue conditions, equipment, supervision, or how sessions are run.' },
      { type: 'p', text: 'To the maximum extent permitted by Philippine law:' },
      { type: 'ul', items: [
        'You participate in sessions and events at your own risk.',
        'Responsibility for venue safety, equipment, first aid, and the conduct of sessions lies with the venue and the organizer, not with QueueAve.',
        'QueueAve is not liable for injuries, accidents, lost or damaged property, or disputes arising at venues or events, including sessions discovered or joined through the Platform.',
      ] },
      { type: 'p', text: 'Nothing in this section limits rights that cannot be waived under Philippine law.' },
    ],
  },
  {
    n: '9',
    title: 'Service Availability',
    blocks: [
      { type: 'p', text: 'The Platform is provided "as is" and "as available". We do not guarantee uninterrupted availability, error-free operation, or that ratings and statistics will always be free of mistakes. We may add, change, or remove features, and may suspend the Platform for maintenance. Where reasonably possible, we will give notice of significant changes.' },
    ],
  },
  {
    n: '10',
    title: 'Intellectual Property',
    blocks: [
      { type: 'p', text: 'The Platform, including its software, design, branding, and content we create, belongs to QueueAve Information Technology Services. You keep ownership of content you provide (such as names, photos, and logos) and grant QueueAve a license to display it on the Platform for its intended purpose, such as showing avatars on session pages and recaps.' },
    ],
  },
  {
    n: '11',
    title: 'Suspension and Termination',
    blocks: [
      { type: 'p', text: 'We may suspend or remove accounts, players, or sessions that violate these Terms, manipulate ratings, abuse other users, or use the Platform unlawfully. Organizers may likewise remove players from their own sessions. You may stop using the Platform at any time and may request deletion of your data as described in the Privacy Policy.' },
    ],
  },
  {
    n: '12',
    title: 'Future Credit System',
    blocks: [
      { type: 'p', text: 'QueueAve plans to introduce a credit-based payment system. It is not yet active, and no money is currently processed through the Platform. Before launch, these Terms and the Privacy Policy will be updated with full provisions for purchases, refunds, and financial data, and continued use of credit features will require acceptance of the updated Terms.' },
    ],
  },
  {
    n: '13',
    title: 'Limitation of Liability',
    blocks: [
      { type: 'p', text: 'To the maximum extent permitted by Philippine law, QueueAve and its owner and personnel are not liable for indirect, incidental, special, or consequential damages, or for loss of data, opportunities, or goodwill, arising from use of the Platform. For any claim that cannot be excluded, our total liability is limited to the amount you paid QueueAve for the Platform in the twelve months before the claim, which is zero while the Platform is free. These limitations do not apply to liability arising from fraud, willful misconduct, or gross negligence, or to consumer rights that cannot be waived under Philippine law.' },
    ],
  },
  {
    n: '14',
    title: 'Changes to These Terms',
    blocks: [
      { type: 'p', text: 'We may update these Terms as the Platform evolves, including when new sports, features, or the credit system launch. We will announce significant changes through the Platform or by email at least 30 days before they take effect. Continued use after the effective date means you accept the updated Terms. The latest version will always be available at queueave.com/terms.' },
    ],
  },
  {
    n: '15',
    title: 'Governing Law and Disputes',
    blocks: [
      { type: 'p', text: 'These Terms are governed by the laws of the Republic of the Philippines. Before going to court, you agree to first contact us at contact@queueave.com so we can try to resolve the issue informally within 30 days. Any unresolved dispute shall be brought before the proper courts of Rizal Province, Philippines, without prejudice to rights under applicable consumer protection laws.' },
    ],
  },
  {
    n: '16',
    title: 'Contact Us',
    blocks: [
      { type: 'ul', items: [
        'Email: contact@queueave.com',
        'Website: queueave.com',
        'Address: Cainta, Rizal, Philippines',
      ] },
    ],
  },
]

function renderBlock(block: Block, i: number) {
  if (block.type === 'h3') {
    return (
      <h3 key={i} className="font-display text-lg font-bold tracking-tight mt-6 mb-2" style={{ color: 'var(--fg)' }}>
        {block.text}
      </h3>
    )
  }
  if (block.type === 'ul') {
    return (
      <ul key={i} className="list-disc pl-5 space-y-1.5 my-3" style={{ color: 'var(--muted)' }}>
        {block.items.map((item, j) => <li key={j} className="leading-relaxed">{item}</li>)}
      </ul>
    )
  }
  return (
    <p key={i} className="my-3 leading-relaxed" style={{ color: 'var(--muted)' }}>
      {block.text}
    </p>
  )
}

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg)' }}>
      <PublicNav />
      <main className="flex-1 max-w-3xl w-full mx-auto px-6 py-12">
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight" style={{ color: 'var(--fg)' }}>
          Terms of Service
        </h1>
        <p className="mt-3 font-semibold" style={{ color: 'var(--fg)' }}>QueueAve Information Technology Services</p>
        <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>
          Effective Date: April 1, 2026 · Version 1.0 · queueave.com · contact@queueave.com
        </p>
        <p className="mt-6 leading-relaxed" style={{ color: 'var(--muted)' }}>
          Welcome to QueueAve. These Terms of Service (&quot;Terms&quot;) govern your use of the QueueAve sports session management platform at queueave.com and its subdomains, including badminton.queueave.com and spartan.queueave.com (together, the &quot;Platform&quot;). By using the Platform, you agree to these Terms and to our Privacy Policy.
        </p>

        {sections.map(section => (
          <section key={section.n} className="mt-10">
            <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight" style={{ color: 'var(--fg)' }}>
              {section.n}. {section.title}
            </h2>
            {section.blocks.map(renderBlock)}
          </section>
        ))}
      </main>
      <SiteFooter />
    </div>
  )
}
