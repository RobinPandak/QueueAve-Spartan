import { PublicNav } from '@/components/public-nav'
import { SiteFooter } from '@/components/site-footer'

export const metadata = {
  title: 'Privacy Policy | Spartan by QueueAve',
  description: 'How QueueAve collects, uses, stores, shares, and protects your personal information.',
}

type Block =
  | { type: 'p'; text: string }
  | { type: 'h3'; text: string }
  | { type: 'ul'; items: string[] }

type Section = { n: string; title: string; blocks: Block[] }

const sections: Section[] = [
  {
    n: '1',
    title: 'Who We Are',
    blocks: [
      { type: 'p', text: 'QueueAve Information Technology Services is a sports session management platform based in Cainta, Rizal, Philippines. We operate the QueueAve sports session management platform accessible at queueave.com and its subdomains, providing the following management systems:' },
      { type: 'ul', items: [
        'Badminton: court queue management, player matchmaking, and ELO ratings (badminton.queueave.com)',
        'Spartan Racing / Obstacle Races: heat and wave management, participant registration, and timing (spartan.queueave.com)',
        'Future sports: as the platform continues to grow, additional sports and activities will be supported under the same platform',
      ] },
      { type: 'p', text: 'For privacy-related concerns, contact us at: contact@queueave.com' },
    ],
  },
  {
    n: '2',
    title: 'What Data We Collect',
    blocks: [
      { type: 'p', text: 'When you use QueueAve, we collect the following data depending on the sport, activity, or feature you use:' },
      { type: 'h3', text: '2.1 All Sports: General Data' },
      { type: 'ul', items: [
        'Your name and contact information (mobile number or email)',
        'Check-in records at partner venues and event locations',
        'Device and app usage information',
      ] },
      { type: 'h3', text: '2.2 Badminton: Court-Based Sports (Currently Active)' },
      { type: 'ul', items: [
        'Game history, scores, and ELO ratings',
        'Court queue position and rotation records',
        'Win/loss records and match history',
        'Player ranking and leaderboard data',
      ] },
      { type: 'h3', text: '2.3 Spartan Racing / Obstacle Races' },
      { type: 'ul', items: [
        'Race registration and participant details',
        'Heat and wave assignment records',
        'Start time, finish time, and race performance data',
        'Participant queue and staging area records',
      ] },
      { type: 'h3', text: '2.4 Future Sports and Activities' },
      { type: 'p', text: 'As QueueAve expands to support additional sports and recreational activities, new categories of data relevant to those sports may be collected. Players will be notified of any new data collection practices through an updated Privacy Policy prior to the launch of each new sport or feature.' },
      { type: 'h3', text: '2.5 QueueAve Credit System (Future Feature)' },
      { type: 'p', text: 'When the QueueAve Credit System is launched, the following additional data will be collected:' },
      { type: 'ul', items: [
        'Credit balance, purchase history, and usage records',
        'Preferred payment method (e.g., GCash, Maya, credit/debit card)',
        'Transaction history including credit purchases, game redemptions, and refunds',
        'Bank account details and bank name (only when bank transfer or bank-linked payment is used)',
        'Payment reference numbers and transaction confirmation details',
      ] },
      { type: 'p', text: 'Financial and bank-related data is classified as Sensitive Personal Information under the Data Privacy Act of 2012 and will be subject to a higher level of protection. QueueAve will obtain explicit consent from users before collecting any financial or bank-related data.' },
      { type: 'p', text: 'Prior to the launch of the credit system, this Privacy Policy will be updated with a full financial data section, and users will be notified accordingly.' },
    ],
  },
  {
    n: '3',
    title: 'How We Use Your Data',
    blocks: [
      { type: 'p', text: 'We use your data to:' },
      { type: 'ul', items: [
        'Manage all sports sessions including court queues (badminton) and heats and waves (spartan racing)',
        'Match players and participants based on skill level, ELO ratings, or heat assignments depending on the sport',
        'Track performance, ratings, race results, and event participation history across all supported sports',
        'Verify your check-in at partner venues and race venues',
        'Administer the referral program and credit free games or sessions',
        'Display public leaderboards, player rankings, and race finish times where applicable',
        'Send you updates and notifications about court sessions and race schedules',
        'Process credit purchases, game redemptions, and refunds (future feature, when credit system is active)',
        'Comply with financial regulations and bank partner requirements (future feature)',
        'Improve our platform and services across all sports and features',
      ] },
    ],
  },
  {
    n: '4',
    title: 'Publicly Shared Data',
    blocks: [
      { type: 'p', text: 'The following information may be publicly visible on QueueAve depending on the sport:' },
      { type: 'ul', items: [
        'Badminton: username, ELO rating, ranking, game statistics, and win/loss records',
        'Spartan Racing: participant name, wave assignment, and race finish times',
      ] },
      { type: 'p', text: 'Financial data, bank details, credit balance, and transaction history will NEVER be publicly shared. These are strictly private and accessible only by the account holder and authorized QueueAve personnel.' },
      { type: 'p', text: 'By registering and using QueueAve, you consent to the public display of sports performance data. You may request to have your profile made private by contacting us at contact@queueave.com.' },
    ],
  },
  {
    n: '5',
    title: 'Data Sharing',
    blocks: [
      { type: 'h3', text: '5.1 Current Data Sharing' },
      { type: 'ul', items: [
        'Venue and event partners (e.g., badminton courts, spartan race organizers) for session management and check-in verification',
        'Supabase, our cloud database provider, for secure data storage',
      ] },
      { type: 'h3', text: '5.2 Future Data Sharing: Credit System' },
      { type: 'ul', items: [
        'Payment processors (e.g., GCash, Maya) for processing credit purchases',
        'Bank partners for bank-linked payment processing and verification',
        'Financial compliance authorities as required by law',
      ] },
      { type: 'p', text: 'All third-party financial partners will be required to comply with applicable data privacy and financial regulations in the Philippines. QueueAve will not share financial data with any party beyond what is necessary for payment processing.' },
      { type: 'p', text: 'We do NOT sell, rent, or trade your personal or financial data to any third party for commercial purposes.' },
    ],
  },
  {
    n: '6',
    title: 'Data Storage and Security',
    blocks: [
      { type: 'p', text: 'Your data is securely stored on Supabase cloud infrastructure with encryption at rest and in transit. We implement access controls to ensure only authorized personnel can access your data.' },
      { type: 'p', text: 'When the credit system is launched, financial and bank-related data will be subject to additional security measures including:' },
      { type: 'ul', items: [
        'PCI-DSS compliant payment processing',
        'End-to-end encryption for all financial transactions',
        'Multi-factor authentication for account access involving financial data',
        'Strict access controls, with financial data accessible only by authorized QueueAve personnel',
      ] },
    ],
  },
  {
    n: '7',
    title: 'Your Rights',
    blocks: [
      { type: 'p', text: 'Under the Data Privacy Act of 2012, you have the right to:' },
      { type: 'ul', items: [
        'Access a copy of your personal data',
        'Correct inaccurate information',
        'Request deletion of your data',
        'Object to processing of your data',
        'Withdraw your consent at any time',
        'Lodge a complaint with the National Privacy Commission at privacy.gov.ph',
      ] },
      { type: 'p', text: 'To exercise any of these rights, email us at contact@queueave.com. We will respond within 15 working days.' },
    ],
  },
  {
    n: '8',
    title: 'Data Retention',
    blocks: [
      { type: 'p', text: 'We retain your personal data only for as long as necessary:' },
      { type: 'ul', items: [
        'Badminton game history and ELO ratings: up to 3 years',
        'Spartan race records and timing data: up to 3 years',
        'Account data: until account deletion plus 1 year',
        'Credit and financial transaction records (future): up to 5 years as required by Philippine financial regulations',
        'Bank-related data (future): retained only as long as necessary for transaction completion and legal compliance',
      ] },
    ],
  },
  {
    n: '9',
    title: 'Consent',
    blocks: [
      { type: 'p', text: 'QueueAve obtains your consent through:' },
      { type: 'ul', items: [
        'In-app or web consent form during registration',
        'Privacy Notice presented before first check-in',
        'Explicit opt-in for publicly shared data such as ELO ratings and leaderboards',
        'Separate explicit consent for financial and bank data collection when the credit system is launched',
      ] },
      { type: 'p', text: 'You may withdraw your consent at any time by contacting contact@queueave.com. Withdrawal of consent may affect your ability to use certain features of the platform.' },
    ],
  },
  {
    n: '10',
    title: 'Changes to This Policy',
    blocks: [
      { type: 'p', text: 'We may update this Privacy Policy from time to time as:' },
      { type: 'ul', items: [
        'New sports and activities are added to the QueueAve platform',
        'New features such as the credit system are launched',
        'Applicable laws and regulations change',
        'New bank or payment partners are integrated',
      ] },
      { type: 'p', text: 'We will notify you of significant changes through the app or via email at least 30 days before the changes take effect. The latest version is always available at queueave.com/privacy.' },
    ],
  },
  {
    n: '11',
    title: 'Financial Data and Credit System (Future Feature)',
    blocks: [
      { type: 'p', text: 'QueueAve is developing a credit-based payment system that will allow players to purchase credits and use them for game sessions, court fees, and other sports activities on the platform.' },
      { type: 'h3', text: '11.1 How the Credit System Will Work' },
      { type: 'ul', items: [
        'Players will purchase credits through the QueueAve platform using various payment methods',
        'Credits can be used to pay for game sessions, entrance fees, and other QueueAve services',
        'Credit balances and transaction history will be visible only to the account holder',
        'Referral rewards may be issued as credits',
      ] },
      { type: 'h3', text: '11.2 Payment Methods (Planned)' },
      { type: 'ul', items: [
        'E-wallets: GCash, Maya (PayMaya)',
        'Bank transfer and bank-linked payments',
        'Credit and debit cards',
        'Other payment channels as approved and integrated',
      ] },
      { type: 'h3', text: '11.3 Data Protection for Financial Information' },
      { type: 'ul', items: [
        'Bank account details will be encrypted and never stored in plain text',
        'QueueAve will comply with BSP (Bangko Sentral ng Pilipinas) regulations for e-money and payment services',
        'All financial transactions will be processed through BSP-regulated payment partners',
        'Users will be required to provide explicit consent before any bank or financial data is collected',
      ] },
      { type: 'h3', text: '11.4 Your Rights Over Financial Data' },
      { type: 'p', text: 'When the credit system is active, you will have the right to:' },
      { type: 'ul', items: [
        'View your complete credit and transaction history',
        'Request deletion of your financial data subject to legal retention requirements',
        'Dispute any unauthorized transactions',
        'Withdraw consent for financial data processing',
      ] },
    ],
  },
  {
    n: '12',
    title: 'Contact Us',
    blocks: [
      { type: 'p', text: 'For any privacy-related questions or concerns:' },
      { type: 'ul', items: [
        'Email: contact@queueave.com',
        'Website: queueave.com',
        'Address: Cainta, Rizal, Philippines',
      ] },
      { type: 'p', text: 'You may also contact the National Privacy Commission at privacy.gov.ph for complaints or concerns.' },
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

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg)' }}>
      <PublicNav />
      <main className="flex-1 max-w-3xl w-full mx-auto px-6 py-12">
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight" style={{ color: 'var(--fg)' }}>
          Privacy Policy
        </h1>
        <p className="mt-3 font-semibold" style={{ color: 'var(--fg)' }}>QueueAve Information Technology Services</p>
        <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>
          Effective Date: April 1, 2026 · Version 1.0 · queueave.com · contact@queueave.com
        </p>
        <p className="mt-6 leading-relaxed" style={{ color: 'var(--muted)' }}>
          Welcome to QueueAve. We are committed to protecting your personal data in accordance with the Data Privacy Act of 2012 (Republic Act No. 10173) of the Philippines. This Privacy Policy explains how we collect, use, store, share, and protect your personal information when you use our platform across all supported sports, activities, and future features.
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
