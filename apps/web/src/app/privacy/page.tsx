import { Metadata } from 'next';
import Link from 'next/link';
import { LegalPageLayout } from '@/components/LegalPageLayout';

export const metadata: Metadata = {
  title: 'Privacy Policy | Mulligans',
  description: 'Privacy Policy for the Mulligans golf equipment marketplace. How we collect, use, and protect your personal data under UK GDPR.',
  robots: { index: true, follow: true },
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPageLayout
      title="Privacy Policy"
      effectiveDate="21 May 2026"
      lastUpdated="21 May 2026"
      currentPath="/privacy"
    >
      <p>
        <strong>Mulligans Golf Limited</strong>
        <br />
        <strong>Effective date: 21 May 2026</strong>
      </p>

      {/* ------------------------------------------------------------------ */}
      {/* 1. Introduction                                                     */}
      {/* ------------------------------------------------------------------ */}
      <h2>1. Introduction</h2>

      <p>
        This Privacy Policy explains how Mulligans Golf Limited (&ldquo;we&rdquo;, &ldquo;us&rdquo;,
        &ldquo;our&rdquo;) collects, uses, stores, shares and protects your personal data when you
        use the Mulligans marketplace platform, including our mobile application, website and admin
        services (together, the &ldquo;Platform&rdquo;).
      </p>

      <p>
        We are committed to protecting your privacy in accordance with the UK General Data Protection
        Regulation (UK GDPR) and the Data Protection Act 2018. This policy is provided pursuant to
        Articles 13 and 14 of the UK GDPR.
      </p>

      <p>
        Please read this policy carefully. By using the Platform you acknowledge that you have read
        and understood how we process your personal data as described below.
      </p>

      <p><strong>Cross-references:</strong></p>
      <ul>
        <li><Link href="/terms">Terms of Service</Link></li>
        <li><Link href="/buyer-protection">Buyer Protection Policy</Link></li>
      </ul>

      {/* ------------------------------------------------------------------ */}
      {/* 2. Data Controller                                                  */}
      {/* ------------------------------------------------------------------ */}
      <h2>2. Data Controller</h2>

      <p>The data controller responsible for your personal data is:</p>

      <p>
        <strong>Mulligans Golf Limited</strong>
        <br />
        Company registration number: 16647100
        <br />
        Registered office: Flat 1 Sunrise House, 79J Riddlesdown Road, Purley, England, CR8 1DH
        <br />
        Email: <a href="mailto:info@mulligans.uk.com">info@mulligans.uk.com</a>
        <br />
        ICO Registration: ZC061655
        <br />
        Jurisdiction: England &amp; Wales
      </p>

      {/* ------------------------------------------------------------------ */}
      {/* 3. Personal Data We Collect                                         */}
      {/* ------------------------------------------------------------------ */}
      <h2>3. Personal Data We Collect</h2>

      <p>
        We collect the following categories of personal data, set out by purpose and origin.
      </p>

      <h3>3.1 Account Data</h3>
      <p>Data you provide when creating an account:</p>
      <ul>
        <li>Email address</li>
        <li>Cognito ID (system-generated unique identifier)</li>
        <li>
          Password (hashed and managed by AWS Cognito — we never store or have access to plaintext
          passwords)
        </li>
      </ul>

      <h3>3.2 Profile Data</h3>
      <p>Data you provide to personalise your account and improve buyer/seller matching:</p>
      <ul>
        <li>Display name</li>
        <li>Phone number</li>
        <li>Location</li>
        <li>Bio (free-text description)</li>
        <li>Avatar URL (profile picture)</li>
        <li>Postcode area</li>
        <li>Handicap</li>
        <li>Clothing size(s)</li>
        <li>Glove size(s)</li>
        <li>Shoe size(s)</li>
        <li>Sizing preference</li>
      </ul>

      <h3>3.3 Listing Data</h3>
      <p>Data you provide when creating a product listing:</p>
      <ul>
        <li>Title, description, category, brand and model</li>
        <li>Price, original price and currency</li>
        <li>Condition grades (head, shaft, grip, overall)</li>
        <li>Ball condition type</li>
        <li>Specifications (structured data in JSON format, e.g. loft, flex, length)</li>
        <li>Parcel size, shipping cost</li>
        <li>Quantity</li>
        <li>Images: image URL, S3 storage key and alt text for each uploaded photograph</li>
      </ul>

      <h3>3.4 Transaction Data</h3>
      <p>Data generated when you buy or sell on the Platform:</p>
      <ul>
        <li>Order amounts</li>
        <li>Payment intent IDs and payment method IDs (processed by Stripe)</li>
        <li>Shipping addresses (structured JSON)</li>
        <li>Tracking numbers and carriers</li>
        <li>Seller payout amounts</li>
        <li>Shipping label costs</li>
        <li>Insurance premiums</li>
        <li>Dispute data and refund data</li>
      </ul>

      <h3>3.5 Offer and Negotiation Data</h3>
      <p>Data generated through the make-an-offer feature:</p>
      <ul>
        <li>Offer amounts</li>
        <li>Counter-offer amounts</li>
        <li>Offer statuses</li>
        <li>Timestamps for each offer event</li>
      </ul>

      <h3>3.6 Shipping Data</h3>
      <p>Data required to fulfil deliveries:</p>
      <ul>
        <li>Delivery addresses</li>
        <li>Tracking numbers</li>
        <li>Carrier names (e.g. Royal Mail, Evri, DPD)</li>
        <li>Shipping label URLs</li>
        <li>Shippo shipment IDs and transaction IDs</li>
      </ul>

      <h3>3.7 Communication Data</h3>
      <p>Data you generate through Platform messaging and support:</p>
      <ul>
        <li>
          Messages between users (content, message type, offer amounts referenced in messages)
        </li>
        <li>Support tickets</li>
        <li>Feedback submissions</li>
        <li>User reports (e.g. reporting a listing or another user)</li>
      </ul>

      <h3>3.8 Device and Technical Data</h3>
      <p>Data collected automatically from your device:</p>
      <ul>
        <li>Push notification token</li>
        <li>Push notification token platform (e.g. iOS, Android)</li>
        <li>Server logs: IP address, request paths, timestamps</li>
      </ul>

      <h3>3.9 Usage Data</h3>
      <p>Data about how you interact with the Platform:</p>
      <ul>
        <li>Favourited listings</li>
        <li>Cart items</li>
        <li>Listing views (aggregated counts)</li>
        <li>Notification read statuses</li>
        <li>
          Preference settings: email notifications, marketing emails, order notifications
        </li>
      </ul>

      <h3>3.10 Review Data</h3>
      <p>Data you provide when leaving a review:</p>
      <ul>
        <li>Rating (numerical score)</li>
        <li>Review text</li>
        <li>Review type (e.g. buyer review, seller review)</li>
      </ul>

      <h3>3.11 Seller Verification Data</h3>
      <p>Data related to verified seller status:</p>
      <ul>
        <li>Stripe Connect ID</li>
        <li>Stripe Connect onboarding status</li>
        <li>Verified seller flag and verification date</li>
        <li>Shipping strikes count</li>
        <li>Cancellation counts</li>
      </ul>

      <h3>3.12 Dispute and Return Data</h3>
      <p>Data generated during dispute or return processes:</p>
      <ul>
        <li>Dispute reasons</li>
        <li>Evidence images</li>
        <li>Resolution details</li>
        <li>Return tracking information</li>
      </ul>

      <h3>3.13 Email Suppression Data</h3>
      <p>Data maintained to ensure email deliverability:</p>
      <ul>
        <li>Email address</li>
        <li>Suppression reason</li>
        <li>Bounce type (e.g. hard bounce, soft bounce)</li>
        <li>Suppression source</li>
      </ul>

      {/* ------------------------------------------------------------------ */}
      {/* 4. How We Use Your Data and Lawful Bases                            */}
      {/* ------------------------------------------------------------------ */}
      <h2>4. How We Use Your Data and Lawful Bases</h2>

      <p>
        We process your personal data only where we have a lawful basis under Article 6(1) of the UK
        GDPR. The table below summarises each data category, its purpose and the lawful basis relied
        upon.
      </p>

      <table>
        <thead>
          <tr>
            <th>Data Category</th>
            <th>Purpose</th>
            <th>Lawful Basis</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Account data</td>
            <td>Account creation, authentication, platform access</td>
            <td>Contract 6(1)(b)</td>
          </tr>
          <tr>
            <td>Profile data</td>
            <td>Personalisation, buyer/seller matching, sizing recommendations</td>
            <td>Contract 6(1)(b)</td>
          </tr>
          <tr>
            <td>Listing data</td>
            <td>Publishing and managing product listings</td>
            <td>Contract 6(1)(b)</td>
          </tr>
          <tr>
            <td>Transaction data</td>
            <td>Processing purchases, payments, refunds and payouts</td>
            <td>Contract 6(1)(b)</td>
          </tr>
          <tr>
            <td>Offer and negotiation data</td>
            <td>Facilitating price negotiations between buyers and sellers</td>
            <td>Contract 6(1)(b)</td>
          </tr>
          <tr>
            <td>Shipping data</td>
            <td>Generating shipping labels, tracking deliveries, fulfilling orders</td>
            <td>Contract 6(1)(b)</td>
          </tr>
          <tr>
            <td>Communication data</td>
            <td>
              Enabling buyer-seller messaging, handling support requests and user reports
            </td>
            <td>Contract 6(1)(b)</td>
          </tr>
          <tr>
            <td>Device and technical data (push tokens)</td>
            <td>Delivering push notifications</td>
            <td>Consent 6(1)(a)</td>
          </tr>
          <tr>
            <td>Device and technical data (server logs)</td>
            <td>Platform security, debugging, abuse prevention</td>
            <td>Legitimate interest 6(1)(f)</td>
          </tr>
          <tr>
            <td>Usage data (favourites, cart, views, notification reads)</td>
            <td>Platform functionality and user experience</td>
            <td>Contract 6(1)(b)</td>
          </tr>
          <tr>
            <td>Usage data (marketing email preference)</td>
            <td>Sending marketing communications</td>
            <td>Consent 6(1)(a)</td>
          </tr>
          <tr>
            <td>Usage data (order/email notification preferences)</td>
            <td>Delivering transactional notifications</td>
            <td>Contract 6(1)(b)</td>
          </tr>
          <tr>
            <td>Review data</td>
            <td>Enabling trust and transparency between buyers and sellers</td>
            <td>Contract 6(1)(b) and Legitimate interest 6(1)(f)</td>
          </tr>
          <tr>
            <td>Seller verification data</td>
            <td>Verifying seller identity, maintaining marketplace trust and safety</td>
            <td>Contract 6(1)(b) and Legitimate interest 6(1)(f)</td>
          </tr>
          <tr>
            <td>Dispute and return data</td>
            <td>Resolving disputes, processing returns, enforcing buyer protection</td>
            <td>Contract 6(1)(b) and Legal obligation 6(1)(c)</td>
          </tr>
          <tr>
            <td>Email suppression data</td>
            <td>
              Preventing emails to invalid/bounced addresses, maintaining sender reputation
            </td>
            <td>Legitimate interest 6(1)(f)</td>
          </tr>
          <tr>
            <td>Crash reports (via Crashlytics)</td>
            <td>Identifying and fixing application errors</td>
            <td>Legitimate interest 6(1)(f)</td>
          </tr>
          <tr>
            <td>Chip AI Caddy interactions</td>
            <td>
              Providing personalised golf equipment recommendations and fitting advice
            </td>
            <td>Contract 6(1)(b)</td>
          </tr>
        </tbody>
      </table>

      <p>
        <strong>Legitimate interest assessments:</strong> Where we rely on legitimate interest, we
        have conducted balancing tests to ensure our interests do not override your fundamental
        rights and freedoms. You may request details of these assessments by contacting us at{' '}
        <a href="mailto:info@mulligans.uk.com">info@mulligans.uk.com</a>.
      </p>

      {/* ------------------------------------------------------------------ */}
      {/* 5. Third-Party Processors                                           */}
      {/* ------------------------------------------------------------------ */}
      <h2>5. Third-Party Processors</h2>

      <p>
        We share personal data with the following third-party processors, each of whom processes data
        on our behalf under a written data processing agreement.
      </p>

      <h3>5.1 Stripe, Inc.</h3>
      <ul>
        <li>
          <strong>Purpose:</strong> Payment processing, seller identity verification (KYC) via
          Stripe Connect, payout management.
        </li>
        <li>
          <strong>Data shared:</strong> Name, email address, bank account details (entered directly
          into Stripe-hosted forms — we do not see or store these), transaction amounts, identity
          documents (submitted via Stripe&apos;s hosted onboarding).
        </li>
        <li>
          <strong>Jurisdiction:</strong> United States. Transfers are protected by the UK-US Data
          Bridge under the EU-US Data Privacy Framework (DPF).
        </li>
        <li>
          <strong>Lawful basis:</strong> Contract 6(1)(b).
        </li>
      </ul>

      <h3>5.2 Shippo, Inc. (including XCover insurance)</h3>
      <ul>
        <li>
          <strong>Purpose:</strong> Shipping label generation, carrier rate comparison, shipment
          tracking, shipment insurance.
        </li>
        <li>
          <strong>Data shared:</strong> Buyer name, delivery address, phone number, parcel
          dimensions, item value.
        </li>
        <li>
          <strong>Carriers used:</strong> Royal Mail, Evri, DPD.
        </li>
        <li>
          <strong>Jurisdiction:</strong> United States. Transfers are protected by Standard
          Contractual Clauses (SCCs).
        </li>
        <li>
          <strong>Lawful basis:</strong> Contract 6(1)(b).
        </li>
      </ul>

      <h3>5.3 Resend, Inc.</h3>
      <ul>
        <li>
          <strong>Purpose:</strong> Transactional email delivery (e.g. order confirmations, shipping
          updates, account notifications).
        </li>
        <li>
          <strong>Data shared:</strong> Email addresses, email content.
        </li>
        <li>
          <strong>Jurisdiction:</strong> United States. Transfers are protected by Standard
          Contractual Clauses (SCCs).
        </li>
        <li>
          <strong>Lawful basis:</strong> Contract 6(1)(b).
        </li>
      </ul>

      <h3>5.4 Amazon Web Services (AWS)</h3>
      <ul>
        <li>
          <strong>Purpose:</strong> Core infrastructure — authentication (Cognito), image storage and
          delivery (S3 + CloudFront CDN), database hosting (RDS PostgreSQL), application hosting
          (EC2), email bounce handling (SES).
        </li>
        <li>
          <strong>Data shared:</strong> All platform data (encrypted in transit via TLS and at rest
          via AWS encryption).
        </li>
        <li>
          <strong>Jurisdiction:</strong> EU-West-2 (London, United Kingdom). Data remains within the
          UK.
        </li>
        <li>
          <strong>Lawful basis:</strong> Contract 6(1)(b), Legitimate interest 6(1)(f).
        </li>
      </ul>

      <h3>5.5 Expo / Software Mansion S.A.</h3>
      <ul>
        <li>
          <strong>Purpose:</strong> Push notification delivery to mobile devices.
        </li>
        <li>
          <strong>Data shared:</strong> Device push tokens, notification content.
        </li>
        <li>
          <strong>Jurisdiction:</strong> United States / European Union. Transfers are protected by
          Standard Contractual Clauses (SCCs).
        </li>
        <li>
          <strong>Lawful basis:</strong> Consent 6(1)(a).
        </li>
      </ul>

      <h3>5.6 Firebase / Google LLC (Crashlytics)</h3>
      <ul>
        <li>
          <strong>Purpose:</strong> Mobile application crash reporting and stability monitoring.
        </li>
        <li>
          <strong>Data shared:</strong> Crash reports, device information, application state at time
          of crash. Auto-collection is enabled.
        </li>
        <li>
          <strong>Jurisdiction:</strong> United States. Transfers are protected by the UK-US Data
          Bridge under the EU-US Data Privacy Framework (DPF).
        </li>
        <li>
          <strong>Lawful basis:</strong> Legitimate interest 6(1)(f).
        </li>
      </ul>

      <h3>5.7 Anthropic PBC</h3>
      <ul>
        <li>
          <strong>Purpose:</strong> Chip AI Caddy — an AI-powered golf equipment assistant that
          provides personalised recommendations and fitting advice.
        </li>
        <li>
          <strong>Data shared:</strong> User messages (sanitised to remove unnecessary personal
          identifiers), fitting profile data, bag contents, listing data for equipment
          recommendations. All processing is performed server-side via API; the API key is secured on
          our backend.
        </li>
        <li>
          <strong>Jurisdiction:</strong> United States. Transfers are protected by Standard
          Contractual Clauses (SCCs).
        </li>
        <li>
          <strong>Lawful basis:</strong> Contract 6(1)(b).
        </li>
      </ul>

      {/* ------------------------------------------------------------------ */}
      {/* 6. International Data Transfers                                     */}
      {/* ------------------------------------------------------------------ */}
      <h2>6. International Data Transfers</h2>

      <p>
        Your personal data is primarily stored in the United Kingdom (AWS EU-West-2, London).
        However, certain third-party processors operate in the United States. We ensure that all
        international transfers of personal data are protected by appropriate safeguards as required
        by Chapter V of the UK GDPR:
      </p>

      <table>
        <thead>
          <tr>
            <th>Processor</th>
            <th>Jurisdiction</th>
            <th>Transfer Mechanism</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Stripe, Inc.</td>
            <td>USA</td>
            <td>UK-US Data Bridge / Data Privacy Framework</td>
          </tr>
          <tr>
            <td>Shippo, Inc.</td>
            <td>USA</td>
            <td>Standard Contractual Clauses (SCCs)</td>
          </tr>
          <tr>
            <td>Resend, Inc.</td>
            <td>USA</td>
            <td>Standard Contractual Clauses (SCCs)</td>
          </tr>
          <tr>
            <td>Amazon Web Services</td>
            <td>UK (London)</td>
            <td>No transfer — data remains in UK</td>
          </tr>
          <tr>
            <td>Expo / Software Mansion S.A.</td>
            <td>USA / EU</td>
            <td>Standard Contractual Clauses (SCCs)</td>
          </tr>
          <tr>
            <td>Firebase / Google LLC</td>
            <td>USA</td>
            <td>UK-US Data Bridge / Data Privacy Framework</td>
          </tr>
          <tr>
            <td>Anthropic PBC</td>
            <td>USA</td>
            <td>Standard Contractual Clauses (SCCs)</td>
          </tr>
        </tbody>
      </table>

      <p>
        You may request a copy of the relevant transfer safeguards by contacting us at{' '}
        <a href="mailto:info@mulligans.uk.com">info@mulligans.uk.com</a>.
      </p>

      {/* ------------------------------------------------------------------ */}
      {/* 7. Data Retention                                                   */}
      {/* ------------------------------------------------------------------ */}
      <h2>7. Data Retention</h2>

      <p>
        We retain your personal data only for as long as necessary to fulfil the purposes for which
        it was collected, or as required by law. The specific retention periods are:
      </p>

      <table>
        <thead>
          <tr>
            <th>Data Category</th>
            <th>Retention Period</th>
            <th>Reason</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Account data</td>
            <td>Duration of active account + 6 years after closure</td>
            <td>UK tax and accounting obligations</td>
          </tr>
          <tr>
            <td>Transaction and order data</td>
            <td>6 years from transaction date</td>
            <td>UK tax requirement, Companies Act 2006</td>
          </tr>
          <tr>
            <td>Identity verification (Stripe Connect KYC)</td>
            <td>Retained per Stripe&apos;s own retention policy + 5 years</td>
            <td>Anti-fraud obligations</td>
          </tr>
          <tr>
            <td>Messages between users</td>
            <td>Duration of active account (deleted upon account deletion)</td>
            <td>Subject to legal retention requirements where applicable</td>
          </tr>
          <tr>
            <td>Marketing preferences</td>
            <td>Until consent is withdrawn or 3 years of inactivity</td>
            <td>Consent management</td>
          </tr>
          <tr>
            <td>Crash reports (Crashlytics)</td>
            <td>90 days</td>
            <td>Debugging and stability monitoring</td>
          </tr>
          <tr>
            <td>Push notification tokens</td>
            <td>Until revoked by the user or account deleted</td>
            <td>Notification delivery</td>
          </tr>
          <tr>
            <td>Server logs</td>
            <td>90 days</td>
            <td>Security and debugging</td>
          </tr>
          <tr>
            <td>Email suppression records</td>
            <td>Indefinite</td>
            <td>To prevent re-sending to bounced or invalid addresses</td>
          </tr>
          <tr>
            <td>Dispute and return data</td>
            <td>6 years from resolution date</td>
            <td>Legal claims limitation window</td>
          </tr>
          <tr>
            <td>Reviews</td>
            <td>Duration of reviewed user&apos;s active account + 2 years</td>
            <td>Marketplace trust and transparency</td>
          </tr>
          <tr>
            <td>Support tickets</td>
            <td>3 years from resolution date</td>
            <td>Service quality and legal compliance</td>
          </tr>
        </tbody>
      </table>

      <p>
        When data reaches the end of its retention period, it is securely deleted or anonymised.
      </p>

      {/* ------------------------------------------------------------------ */}
      {/* 8. Your Rights                                                      */}
      {/* ------------------------------------------------------------------ */}
      <h2>8. Your Rights</h2>

      <p>
        Under the UK GDPR, you have the following rights in relation to your personal data:
      </p>

      <h3>8.1 Right of Access (Article 15)</h3>
      <p>
        You have the right to obtain confirmation as to whether we process your personal data and, if
        so, to request a copy of that data together with supplementary information about how it is
        processed.
      </p>

      <h3>8.2 Right to Rectification (Article 16)</h3>
      <p>
        You have the right to have inaccurate personal data corrected and incomplete data completed.
        You can update most of your profile data directly within the Platform.
      </p>

      <h3>8.3 Right to Erasure (Article 17)</h3>
      <p>
        You have the right to request deletion of your personal data where it is no longer necessary
        for the purpose for which it was collected, where you withdraw consent, or where there is no
        overriding legitimate ground for processing. Certain data may be retained where we have a
        legal obligation to do so (e.g. transaction records for tax purposes).
      </p>

      <h3>8.4 Right to Restriction of Processing (Article 18)</h3>
      <p>
        You have the right to request that we restrict the processing of your personal data in
        certain circumstances, for example while we verify the accuracy of data you have contested.
      </p>

      <h3>8.5 Right to Data Portability (Article 20)</h3>
      <p>
        You have the right to receive the personal data you provided to us in a structured, commonly
        used and machine-readable format, and to transmit that data to another controller without
        hindrance.
      </p>

      <h3>8.6 Right to Object (Article 21)</h3>
      <p>
        You have the right to object to processing based on legitimate interest. We will cease
        processing unless we can demonstrate compelling legitimate grounds that override your
        interests, rights and freedoms.
      </p>

      <h3>8.7 Right to Withdraw Consent (Article 7(3))</h3>
      <p>
        Where processing is based on consent (e.g. push notifications, marketing emails), you have
        the right to withdraw consent at any time. Withdrawal does not affect the lawfulness of
        processing carried out before withdrawal. You can manage your notification and marketing
        preferences within the Platform settings.
      </p>

      <h3>8.8 Right to Lodge a Complaint</h3>
      <p>
        You have the right to lodge a complaint with the Information Commissioner&apos;s Office (ICO)
        if you believe your data protection rights have been infringed:
      </p>
      <p>
        <strong>Information Commissioner&apos;s Office</strong>
        <br />
        Website:{' '}
        <a
          href="https://ico.org.uk/make-a-complaint/"
          target="_blank"
          rel="noopener noreferrer"
        >
          https://ico.org.uk/make-a-complaint/
        </a>
        <br />
        Telephone: 0303 123 1113
      </p>

      <h3>Exercising Your Rights</h3>
      <p>
        To exercise any of these rights, please contact us at{' '}
        <a href="mailto:info@mulligans.uk.com">info@mulligans.uk.com</a>. We will respond to your
        request within one month. In complex cases or where we receive a large number of requests,
        this period may be extended by a further two months, in which case we will inform you within
        the initial one-month period.
      </p>
      <p>
        We may need to verify your identity before processing your request. There is no fee for
        exercising your rights, except where requests are manifestly unfounded or excessive, in which
        case we may charge a reasonable fee or refuse the request.
      </p>

      {/* ------------------------------------------------------------------ */}
      {/* 9. Automated Decision-Making                                        */}
      {/* ------------------------------------------------------------------ */}
      <h2>9. Automated Decision-Making</h2>

      <p>
        The Platform includes Chip AI Caddy, an AI-powered golf equipment assistant provided by
        Anthropic PBC. Chip AI Caddy processes your fitting profile, bag contents and preferences to
        generate personalised equipment recommendations.
      </p>

      <p>
        These recommendations are <strong>assistive only</strong> — they are suggestions to help you
        make informed purchasing decisions. They do not constitute solely automated decision-making
        that produces legal effects or similarly significant effects concerning you within the meaning
        of Article 22 of the UK GDPR.
      </p>

      <h3>Automated Decision-Making — Repeated Cancellations</h3>

      <p>
        When a Seller cancels their second order on the Platform, the system automatically applies a
        one-star (1&star;) review to that Seller&rsquo;s profile. This is an automated process. While
        this action does not have legal effects in the sense of Article 22 of the UK GDPR, it may
        affect the Seller&rsquo;s standing and visibility on the Platform.
      </p>

      <p>Sellers have the right to:</p>
      <ul>
        <li>Be informed that this automation exists (provided in this Privacy Policy and the Terms of Service)</li>
        <li>Appeal the automatic review by contacting <a href="mailto:info@mulligans.uk.com">info@mulligans.uk.com</a></li>
        <li>Request human review of the cancellation circumstances</li>
      </ul>

      <p>
        Mulligans will review appeals within 14 days and may remove the automatic review if the
        cancellation was unavoidable.
      </p>

      <p>
        All other purchase, sale and dispute resolution decisions on the Platform involve human oversight.
      </p>

      {/* ------------------------------------------------------------------ */}
      {/* 10. Cookies and Similar Technologies                                */}
      {/* ------------------------------------------------------------------ */}
      <h2>10. Cookies and Similar Technologies</h2>

      <h3>Web Application</h3>
      <p>
        The Mulligans web application uses <strong>essential cookies only</strong> (Next.js session
        cookies) that are strictly necessary for the Platform to function. These cookies do not
        require consent under the Privacy and Electronic Communications Regulations 2003 (PECR) as
        they are essential for the service you have requested.
      </p>
      <p>
        We do not use analytics cookies, advertising cookies or tracking cookies on any public-facing
        or legal pages.
      </p>

      <h3>Mobile Application</h3>
      <p>
        The Mulligans mobile application does not use browser cookies. Device identifiers (push
        notification tokens) are collected with your consent as described in section 3.8.
      </p>

      <h3>Admin Panel</h3>
      <p>
        The admin panel uses session cookies for administrator authentication. These are essential
        cookies and do not require consent.
      </p>

      {/* ------------------------------------------------------------------ */}
      {/* 11. Data Security                                                   */}
      {/* ------------------------------------------------------------------ */}
      <h2>11. Data Security</h2>

      <p>
        We take the security of your personal data seriously and implement appropriate technical and
        organisational measures to protect it, including:
      </p>

      <ul>
        <li>
          <strong>Encryption in transit:</strong> All data transmitted between your device and our
          servers is encrypted using Transport Layer Security (TLS).
        </li>
        <li>
          <strong>Encryption at rest:</strong> All data stored in our AWS infrastructure (RDS
          PostgreSQL, S3) is encrypted at rest using AWS-managed encryption keys.
        </li>
        <li>
          <strong>Password security:</strong> Passwords are hashed and managed by AWS Cognito. We
          never store, access or transmit plaintext passwords.
        </li>
        <li>
          <strong>Payment security:</strong> All payment card data is handled directly by Stripe,
          which is certified to PCI DSS Level 1. Card details never touch our servers.
        </li>
        <li>
          <strong>Access controls:</strong> Access to personal data is restricted to authorised
          personnel on a need-to-know basis. Administrative access is protected by authentication and
          role-based permissions.
        </li>
        <li>
          <strong>Infrastructure security:</strong> Our application infrastructure is hosted on
          Amazon Web Services in the UK (EU-West-2, London), benefiting from AWS&apos;s comprehensive
          security programme.
        </li>
      </ul>

      <p>
        While we implement robust security measures, no method of transmission over the internet or
        electronic storage is completely secure. We cannot guarantee absolute security but are
        committed to protecting your data to the highest practicable standard.
      </p>

      {/* ------------------------------------------------------------------ */}
      {/* 12. Data Breach Procedures                                          */}
      {/* ------------------------------------------------------------------ */}
      <h2>12. Data Breach Procedures</h2>

      <p>In the event of a personal data breach, we will:</p>

      <ol>
        <li>
          <strong>Assess the breach</strong> promptly to determine the nature, scope and likely
          consequences.
        </li>
        <li>
          <strong>Notify the ICO</strong> without undue delay and, where feasible, within 72 hours of
          becoming aware of the breach, as required by Article 33 of the UK GDPR, unless the breach
          is unlikely to result in a risk to your rights and freedoms.
        </li>
        <li>
          <strong>Notify affected individuals</strong> without undue delay where the breach is likely
          to result in a high risk to your rights and freedoms, as required by Article 34 of the UK
          GDPR.
        </li>
        <li>
          <strong>Document the breach</strong> including its facts, effects and remedial actions
          taken, in our internal breach register.
        </li>
      </ol>

      {/* ------------------------------------------------------------------ */}
      {/* 13. Children's Data                                                 */}
      {/* ------------------------------------------------------------------ */}
      <h2>13. Children&apos;s Data</h2>

      <p>
        The Platform is intended for users aged 18 and over. We do not knowingly collect personal
        data from anyone under the age of 18. If we become aware that we have collected personal data
        from a person under 18, we will take steps to delete that data promptly.
      </p>

      <p>
        If you believe that a person under 18 has provided us with personal data, please contact us
        at <a href="mailto:info@mulligans.uk.com">info@mulligans.uk.com</a>.
      </p>

      {/* ------------------------------------------------------------------ */}
      {/* 14. Changes to This Policy                                          */}
      {/* ------------------------------------------------------------------ */}
      <h2>14. Changes to This Policy</h2>

      <p>
        We may update this Privacy Policy from time to time to reflect changes in our practices,
        legal requirements or for other operational reasons.
      </p>

      <p>Where we make material changes, we will:</p>

      <ul>
        <li>
          Notify you via email (to the address associated with your account) and/or via an in-app
          notification.
        </li>
        <li>
          Provide at least <strong>30 days&apos; notice</strong> before the changes take effect.
        </li>
        <li>Update the &ldquo;Effective date&rdquo; at the top of this policy.</li>
      </ul>

      <p>
        We encourage you to review this policy periodically. Your continued use of the Platform after
        the effective date of any changes constitutes acceptance of the updated policy.
      </p>

      {/* ------------------------------------------------------------------ */}
      {/* 15. Contact Us                                                      */}
      {/* ------------------------------------------------------------------ */}
      <h2>15. Contact Us</h2>

      <p>
        If you have any questions about this Privacy Policy, wish to exercise your data protection
        rights, or have concerns about how we handle your personal data, please contact us:
      </p>

      <p>
        <strong>Mulligans Golf Limited</strong>
        <br />
        Flat 1 Sunrise House, 79J Riddlesdown Road, Purley, England, CR8 1DH
        <br />
        Email: <a href="mailto:info@mulligans.uk.com">info@mulligans.uk.com</a>
        <br />
        ICO Registration: ZC061655
      </p>

      <p>
        <em>This Privacy Policy was last updated on 21 May 2026.</em>
      </p>
    </LegalPageLayout>
  );
}
