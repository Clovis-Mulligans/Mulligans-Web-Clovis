import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPageLayout } from '@/components/LegalPageLayout';

export const metadata: Metadata = {
  title: 'Acceptable Use Policy | Mulligans',
  description: 'Acceptable use rules for the Mulligans golf marketplace. Covers prohibited conduct and enforcement.',
  robots: { index: true, follow: true },
};

export default function AcceptableUsePage() {
  return (
    <LegalPageLayout
      title="Acceptable Use Policy"
      effectiveDate="21 May 2026"
      lastUpdated="21 May 2026"
      currentPath="/acceptable-use"
    >
      <h2>1. Introduction</h2>
      <p>
        This Acceptable Use Policy (&ldquo;Policy&rdquo;) governs the behaviour and conduct of all users on the
        Mulligans platform operated by Mulligans Golf Limited. It applies to all interactions on the platform, including
        buying, selling, messaging, reviews, and any other use of Mulligans services.
      </p>
      <p>
        This Policy covers <strong>user behaviour</strong>. Restrictions relating to the types of items that may be
        listed for sale are set out separately in our{' '}
        <Link href="/prohibited-items">Prohibited Items Policy</Link>.
      </p>
      <p>
        By using the Mulligans platform, you agree to comply with this Policy. It should be read alongside our{' '}
        <Link href="/terms">Terms of Service</Link> and{' '}
        <Link href="/prohibited-items">Prohibited Items Policy</Link>.
      </p>

      <h2>2. Your Responsibilities</h2>
      <p>All users of the Mulligans platform are expected to:</p>
      <ul>
        <li>Act honestly and in good faith in all transactions and interactions</li>
        <li>Treat other users with respect and courtesy</li>
        <li>Provide accurate and truthful information in listings, profiles, messages, and reviews</li>
        <li>Comply with all applicable laws of England and Wales and wider UK legislation</li>
        <li>Cooperate with Mulligans in any investigation or dispute resolution process</li>
      </ul>

      <h2>3. Prohibited Conduct</h2>
      <p>The following conduct is strictly prohibited on the Mulligans platform:</p>

      <h3>3.1 Harassment, Abuse, and Discrimination</h3>
      <p>
        Any form of harassment, abuse, threats, intimidation, hate speech, or discriminatory behaviour directed at other
        users or Mulligans staff. This includes conduct based on (but not limited to) race, ethnicity, religion, gender,
        sexual orientation, disability, or age. Mulligans is committed to maintaining an inclusive and respectful
        community.
      </p>

      <h3>3.2 Fraud and Manipulation</h3>
      <p>Any form of fraudulent or deceptive conduct, including but not limited to:</p>
      <ul>
        <li>
          <strong>Shill bidding</strong> — artificially inflating prices through fake bids or offers
        </li>
        <li>
          <strong>Review manipulation</strong> — posting fake reviews, incentivising positive reviews, or retaliating
          against buyers who leave honest negative feedback
        </li>
        <li>
          <strong>Fake listings</strong> — creating listings for items the seller does not possess, does not intend to
          sell, or that are materially misrepresented
        </li>
        <li>
          <strong>Price manipulation</strong> — any coordinated or deceptive scheme to manipulate market prices on the
          platform
        </li>
      </ul>

      <h3>3.3 Off-Platform Transaction Circumvention</h3>
      <p>
        Directing, encouraging, or facilitating users to complete transactions outside the Mulligans platform in order to
        avoid platform fees, bypass Buyer Protection, or circumvent any other platform mechanism. This includes sharing
        personal contact details, external payment links, or third-party marketplace listings for the purpose of
        diverting a Mulligans transaction.
      </p>

      <h3>3.4 Automated Access and Interference</h3>
      <p>
        Using scrapers, bots, crawlers, or any form of automated access to the Mulligans platform without prior written
        consent from Mulligans Golf Limited. This also includes any action that interferes with, disrupts, or places an
        unreasonable burden on the platform&rsquo;s infrastructure, servers, or networks.
      </p>

      <h3>3.5 Impersonation</h3>
      <p>
        Impersonating or falsely representing yourself as another user, a member of Mulligans staff, a brand
        representative, or any other third party. This includes creating accounts with misleading usernames or profile
        information designed to deceive other users.
      </p>

      <h3>3.6 Spam</h3>
      <p>
        Sending unsolicited or irrelevant messages to other users, posting repetitive or irrelevant content in listings
        or reviews, or using the platform&rsquo;s messaging or review systems for promotional purposes unrelated to
        genuine Mulligans transactions.
      </p>

      <h3>3.7 Malware and Security Threats</h3>
      <p>
        Distributing, uploading, or transmitting malware, viruses, or any other malicious code through the Mulligans
        platform. Attempting to gain unauthorised access to other users&rsquo; accounts, Mulligans systems, or any data
        not intended for you. Attempting to compromise, test, or probe the security of the platform without
        authorisation.
      </p>

      <h3>3.8 Multiple Accounts to Circumvent Restrictions</h3>
      <p>
        Creating or operating multiple accounts for the purpose of circumventing enforcement actions, account
        restrictions, suspensions, or bans imposed under this Policy or any other Mulligans policy. Users may hold only
        one account unless expressly authorised by Mulligans.
      </p>

      <h3>3.9 Misuse of Dispute and Refund Systems</h3>
      <p>
        Filing frivolous, vexatious, or knowingly false disputes or refund claims. Using the Buyer Protection or dispute
        system as a means of obtaining goods without payment. Repeatedly raising unfounded claims to the detriment of
        sellers or the platform. Misuse of the dispute system undermines trust in the marketplace and will be treated
        seriously.
      </p>

      <h3>3.10 Sharing Other Users&rsquo; Personal Information</h3>
      <p>
        Sharing, publishing, or otherwise disclosing another user&rsquo;s personal information (including name, address,
        email, telephone number, or payment details) without that individual&rsquo;s explicit consent, whether on or off
        the platform. This includes sharing information obtained through Mulligans transactions or communications.
      </p>

      <h2>4. Enforcement</h2>
      <p>
        Mulligans takes violations of this Policy seriously and will take appropriate action to maintain the safety and
        integrity of the platform. Enforcement measures are applied at Mulligans&rsquo; sole discretion and are
        proportionate to the nature and severity of the violation.
      </p>

      <h3>4.1 Minor Violations</h3>
      <p>
        For minor or first-time violations, the user will receive a <strong>warning</strong> via email and/or in-app
        notification. The warning will describe the conduct in question and the relevant section of this Policy. The user
        will be asked to cease the prohibited conduct immediately.
      </p>

      <h3>4.2 Repeated Violations</h3>
      <p>
        For repeated violations, or where a user fails to comply following a warning, the user&rsquo;s account may be{' '}
        <strong>temporarily suspended</strong>. During a suspension, the user will be unable to buy, sell, or
        communicate on the platform. The duration of the suspension will depend on the nature and frequency of the
        violations.
      </p>

      <h3>4.3 Serious Violations</h3>
      <p>
        For serious violations — including but not limited to fraud, security threats, and sustained harassment — the
        user&rsquo;s account may be <strong>permanently terminated</strong> without prior warning. All pending
        transactions may be cancelled, and any funds held in escrow may be retained pending investigation.
      </p>

      <h3>4.4 Criminal Conduct</h3>
      <p>
        Where Mulligans has reasonable grounds to believe that a user has engaged in criminal conduct, the matter will be{' '}
        <strong>referred to law enforcement</strong>. Mulligans will cooperate fully with any resulting investigation and
        may disclose user information to law enforcement authorities as required by law or as reasonably necessary.
      </p>

      <h3>4.5 Discretionary Action</h3>
      <p>
        Mulligans Golf Limited reserves the right to take any enforcement action it considers appropriate at its{' '}
        <strong>sole discretion</strong>, including actions not specifically described in this section, where it
        determines that a user&rsquo;s conduct is detrimental to the platform, its users, or its reputation.
      </p>

      <h2>5. Reporting</h2>
      <p>
        If you witness or experience conduct that you believe violates this Policy, we encourage you to report it
        promptly using one of the following methods:
      </p>
      <ul>
        <li>
          <strong>In-app reporting tools:</strong> Use the reporting function available throughout the platform (on user
          profiles, listings, messages, and reviews)
        </li>
        <li>
          <strong>Email:</strong> Contact us at <a href="mailto:info@mulligans.uk.com">info@mulligans.uk.com</a> with
          details of the conduct, including screenshots or other evidence where available
        </li>
      </ul>
      <p>
        All reports are reviewed by the Mulligans team. We aim to acknowledge reports within 2 working days and to
        resolve them as quickly as possible. The identity of the person making the report will be kept confidential to
        the extent permitted by law.
      </p>

      <h2>6. Appeals</h2>
      <p>
        Users who have been subject to an enforcement action under this Policy may appeal the decision by emailing{' '}
        <strong><a href="mailto:info@mulligans.uk.com">info@mulligans.uk.com</a></strong> within{' '}
        <strong>14 calendar days</strong> of receiving notification of the action.
      </p>
      <p>Appeals should include:</p>
      <ul>
        <li>The user&rsquo;s account details</li>
        <li>A description of the enforcement action being appealed</li>
        <li>The grounds on which the user believes the action was unjustified or disproportionate</li>
        <li>Any supporting evidence</li>
      </ul>
      <p>
        Mulligans will review the appeal and respond within a reasonable timeframe. The outcome of the appeal will be
        communicated to the user by email. Mulligans&rsquo; decision on appeal is final within the platform.
      </p>

      <h2>7. Interaction with Other Policies</h2>
      <p>This Policy operates alongside and should be read in conjunction with:</p>
      <ul>
        <li>
          <strong><Link href="/terms">Terms of Service</Link></strong> — the overarching agreement governing use of the
          Mulligans platform
        </li>
        <li>
          <strong><Link href="/prohibited-items">Prohibited Items Policy</Link></strong> — restrictions on the types of
          items that may be listed for sale
        </li>
      </ul>
      <p>
        Where a conflict arises between this Policy and the Terms of Service, the Terms of Service shall prevail.
      </p>

      <h2>8. Changes to This Policy</h2>
      <p>
        Mulligans Golf Limited reserves the right to update or amend this Policy from time to time. Material changes
        will be communicated to users via email or in-app notification. The effective date at the top of this document
        indicates when the current version came into force. Continued use of the platform following any changes
        constitutes acceptance of the updated Policy.
      </p>

      <h2>9. Contact</h2>
      <p>If you have any questions about this Acceptable Use Policy, please contact us at:</p>
      <p>
        <strong>Email:</strong> <a href="mailto:info@mulligans.uk.com">info@mulligans.uk.com</a>
      </p>
      <p>
        <strong>Mulligans Golf Limited</strong>
        <br />
        Flat 1 Sunrise House, 79J Riddlesdown Road, Purley, England, CR8 1DH
        <br />
        Company registration number: 16647100
      </p>

      <p>
        <em>
          This Policy should be read in conjunction with our <Link href="/terms">Terms of Service</Link> and{' '}
          <Link href="/prohibited-items">Prohibited Items Policy</Link>.
        </em>
      </p>
    </LegalPageLayout>
  );
}
