import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPageLayout } from '@/components/LegalPageLayout';

export const metadata: Metadata = {
  title: 'Buyer Protection Policy | Mulligans',
  description: 'How Mulligans Buyer Protection works. Covers items not received, items not as described, and transit damage.',
  robots: { index: true, follow: true },
};

export default function BuyerProtectionPage() {
  return (
    <LegalPageLayout
      title="Buyer Protection Policy"
      effectiveDate="21 May 2026"
      lastUpdated="21 May 2026"
      currentPath="/buyer-protection"
    >
      <h2>1. Introduction</h2>
      <p>
        This Buyer Protection Policy (&ldquo;Policy&rdquo;) sets out the protections available to buyers who purchase
        goods through the Mulligans platform operated by Mulligans Golf Limited. It should be read alongside our{' '}
        <Link href="/terms">Terms of Service</Link> and <Link href="/privacy">Privacy Policy</Link>.
      </p>

      <h2>2. What Is Buyer Protection?</h2>
      <p>
        Every purchase completed through the Mulligans checkout is automatically covered by Buyer Protection. This
        programme is funded by the <strong>Buyer Protection Fee (7.5% of the items total plus &pound;0.99 per
        item)</strong> and the <strong>Shipping Protection Fee (1.25% of the items total)</strong> charged at checkout.
        The Shipping Protection Fee specifically contributes to coverage for items lost or damaged in transit. No
        additional sign-up or action is required — protection applies to every qualifying transaction from the moment
        payment is confirmed.
      </p>
      <p>
        Buyer Protection is designed to give you confidence that, if something goes wrong with your order, you have a
        clear route to resolution and, where appropriate, a refund.
      </p>

      <h2>3. What Is Covered</h2>
      <p>Buyer Protection covers the following situations:</p>

      <h3>3.1 Item Not Received</h3>
      <p>
        The item you purchased has not been delivered by the estimated delivery date and the seller cannot provide proof
        of delivery.
      </p>

      <h3>3.2 Item Significantly Not as Described (SNAD)</h3>
      <p>
        The item you received is materially different from the listing description. This includes, but is not limited
        to:
      </p>
      <ul>
        <li>Wrong item sent entirely</li>
        <li>Significant undisclosed damage, defects, or wear</li>
        <li>Incorrect brand, model, or specification</li>
        <li>Key features or components missing that were described in the listing</li>
        <li>
          Condition materially worse than stated (e.g. listed as &ldquo;excellent&rdquo; but arrived with significant
          cosmetic damage)
        </li>
      </ul>

      <h3>3.3 Item Damaged in Transit</h3>
      <p>
        The item arrived in a damaged condition that was not present when the seller dispatched it, as evidenced by
        packaging damage or photographic evidence.
      </p>

      <h2>4. What Is NOT Covered</h2>
      <p>
        Buyer Protection does <strong>not</strong> cover the following:
      </p>

      <h3>4.1 Buyer&rsquo;s Remorse or Change of Mind (Private Sellers)</h3>
      <p>
        If you simply change your mind about a purchase from a private (non-business) seller, this is not covered under
        Buyer Protection. Note that purchases from business sellers may carry separate cancellation rights — see Section
        14 below.
      </p>

      <h3>4.2 Minor Discrepancies</h3>
      <p>
        Minor variations that do not materially affect the use, value, or enjoyment of the item are not covered. For
        example, slight colour variation due to photography or monitor differences, or minor cosmetic marks consistent
        with the listed condition grade.
      </p>

      <h3>4.3 Items Purchased Outside the Mulligans Platform</h3>
      <p>
        Only transactions completed through the Mulligans checkout are eligible. If you arrange payment outside the
        platform, Buyer Protection does not apply.
      </p>

      <h3>4.4 Damage Caused by the Buyer After Delivery</h3>
      <p>
        Any damage that occurs after the item has been delivered and received by the buyer is not covered. This includes
        damage resulting from use, modification, improper storage, or negligence.
      </p>

      <h2>5. The 3-Day Inspection Window</h2>

      <h3>5.1 How It Works</h3>
      <p>
        Once delivery of your order has been confirmed, you have <strong>3 calendar days</strong> to inspect the item
        and raise any issues. This is your inspection window.
      </p>

      <h3>5.2 What You Should Do</h3>
      <p>During the inspection window:</p>
      <ul>
        <li>Carefully inspect the item against the listing description</li>
        <li>Check for any damage, defects, or discrepancies</li>
        <li>Test functionality where applicable</li>
        <li>Take photographs if you identify any issues</li>
      </ul>

      <h3>5.3 If No Dispute Is Raised</h3>
      <p>
        If no dispute is raised within the 3-day inspection window, funds are{' '}
        <strong>automatically released to the seller</strong>. Once funds have been released, Buyer Protection for that
        transaction is closed.
      </p>

      <h3>5.4 Early Release</h3>
      <p>
        You may confirm receipt and satisfaction at any time during the inspection window. Doing so will release funds to
        the seller immediately. Early release is voluntary and cannot be reversed once confirmed.
      </p>

      <h2>6. How to Raise a Claim</h2>

      <h3>6.1 In-App Dispute Flow</h3>
      <p>
        All claims must be raised through the in-app dispute flow within the applicable time limits set out in Section 8.
        To raise a claim:
      </p>
      <ol>
        <li>Navigate to the relevant order in your account</li>
        <li>Select &ldquo;Raise a Dispute&rdquo;</li>
        <li>Choose the reason for your dispute from the available options</li>
        <li>Provide a written description of the issue</li>
        <li>Upload supporting evidence (photographs are strongly recommended)</li>
      </ol>

      <h3>6.2 Evidence</h3>
      <p>
        The more evidence you provide, the faster and more effectively your claim can be assessed. Photographic evidence
        is particularly important for claims relating to item condition or transit damage.
      </p>

      <h2>7. Escrow Mechanism</h2>
      <p>
        All funds from Mulligans transactions are held in escrow by our payment partner, Stripe. This means:
      </p>
      <ul>
        <li>Payment is collected from the buyer at checkout</li>
        <li>
          Funds are held securely by Stripe and are not released to the seller during the inspection window
        </li>
        <li>
          Funds are only released to the seller when: (a) the 3-day inspection window closes without a dispute being
          raised; (b) the buyer confirms receipt early; or (c) a dispute is resolved in the seller&rsquo;s favour
        </li>
        <li>
          If a dispute is raised, the escrow hold remains in place until the dispute is fully resolved
        </li>
      </ul>
      <p>This mechanism ensures that both buyers and sellers are protected throughout the transaction.</p>

      <h2>8. Claim Timelines</h2>
      <p>The following time limits apply to raising a Buyer Protection claim:</p>
      <table>
        <thead>
          <tr>
            <th>Claim Type</th>
            <th>Time Limit</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Item not received</strong></td>
            <td>3 working days after the estimated delivery date</td>
          </tr>
          <tr>
            <td><strong>Item significantly not as described</strong></td>
            <td>Within 3 calendar days of delivery confirmation</td>
          </tr>
          <tr>
            <td><strong>Item damaged in transit</strong></td>
            <td>Within 3 calendar days of delivery confirmation</td>
          </tr>
        </tbody>
      </table>
      <p>
        Claims raised outside these time limits may not be eligible for Buyer Protection. We encourage all buyers to
        inspect items promptly upon receipt.
      </p>

      <h2>9. Resolution Process</h2>
      <p>Once a dispute is raised, the following resolution process applies:</p>

      <h3>Step 1 — Buyer Raises Dispute</h3>
      <p>
        The buyer raises a dispute through the in-app dispute flow, selecting the relevant reason and providing
        supporting evidence including photographs where applicable.
      </p>

      <h3>Step 2 — Seller Response (72 Hours)</h3>
      <p>
        The seller is notified immediately and has <strong>72 hours</strong> to respond. The seller may:
      </p>
      <ul>
        <li><strong>Accept</strong> the claim (agreeing to a full refund)</li>
        <li><strong>Make a counter-offer</strong> (e.g. proposing a partial refund or replacement)</li>
        <li>
          <strong>Reject</strong> the claim (disputing the buyer&rsquo;s account and providing their own evidence)
        </li>
      </ul>

      <h3>Step 3 — Auto-Escalation on No Response</h3>
      <p>
        If the seller does not respond within 72 hours, the dispute is{' '}
        <strong>automatically escalated to Mulligans administration</strong> for review and decision.
      </p>

      <h3>Step 4 — Buyer Review of Counter-Offer</h3>
      <p>
        If the seller makes a counter-offer, the buyer may accept or reject it. If the buyer{' '}
        <strong>rejects the counter-offer</strong>, the dispute is escalated to Mulligans administration.
      </p>

      <h3>Step 5 — Admin Decision</h3>
      <p>
        A member of the Mulligans administration team will review all evidence submitted by both parties and make a{' '}
        <strong>final, binding decision</strong>. The admin may:
      </p>
      <ul>
        <li>Issue a full refund to the buyer</li>
        <li>Issue a partial refund to the buyer</li>
        <li>Find in the seller&rsquo;s favour and release funds to the seller</li>
        <li>Request additional evidence from either party before making a decision</li>
      </ul>

      <h2>10. Refund Mechanics</h2>

      <h3>10.1 Full Refund</h3>
      <p>
        Where a full refund is awarded, <strong>100% of the item price</strong> is returned to the buyer&rsquo;s
        original payment method. <strong>Platform fees (the buyer protection fee) and shipping costs are not refunded</strong>,
        as these funded the protection service and delivery respectively.
      </p>

      <h3>10.2 Partial Refund</h3>
      <p>
        Where a partial refund is awarded, a proportional amount of the item price is returned to the buyer based on the
        resolution agreed or determined by Mulligans administration.
      </p>

      <h3>10.3 Seller-Fault Disputes</h3>
      <p>
        Where a dispute is resolved against the seller, the platform commission is retained from the seller&rsquo;s
        payout in accordance with the standard fee structure set out in our{' '}
        <Link href="/terms">Terms of Service</Link>. The seller receives the remaining balance (if any) after the
        refund and commission have been deducted.
      </p>

      <h3>10.4 Refund Processing Time</h3>
      <p>
        Refunds are processed promptly following resolution. The time taken for the refund to appear in the buyer&rsquo;s
        account depends on the buyer&rsquo;s payment provider and is typically 5–10 working days.
      </p>

      <h2>11. Payment Hold During Disputes</h2>
      <p>
        When a dispute is raised, the escrowed funds held by Stripe are <strong>frozen indefinitely</strong> until the
        dispute is fully resolved. Neither the buyer nor the seller can access the disputed funds during this period.
        This ensures that funds remain available to honour whatever outcome the resolution process produces.
      </p>

      <h2>12. Early Release of Funds</h2>
      <p>
        Buyers may confirm receipt and satisfaction at any point during the 3-day inspection window by using the
        &ldquo;Confirm Receipt&rdquo; function within the app. This immediately releases the escrowed funds to the
        seller and closes the Buyer Protection window for that transaction. Once early release is confirmed, it cannot be
        reversed.
      </p>

      <h2>13. Appeals</h2>

      <h3>13.1 Finality of Admin Decisions</h3>
      <p>
        Decisions made by Mulligans administration under this Policy are <strong>final and binding</strong> within the
        platform. Mulligans administration will review all available evidence carefully before reaching a decision.
      </p>

      <h3>13.2 External Remedies</h3>
      <p>
        If you are not satisfied with the outcome of a dispute and have exhausted the resolution process set out in this
        Policy, you may:
      </p>
      <ul>
        <li>
          Contact your <strong>local Trading Standards office</strong> for advice and assistance
        </li>
        <li>
          Use the <strong>Online Dispute Resolution (ODR) platform</strong> provided by the European Commission (where
          applicable) or equivalent UK dispute resolution services
        </li>
        <li>Seek independent legal advice regarding any rights you may have under applicable law</li>
      </ul>
      <p>Nothing in this Policy affects your statutory rights as a consumer.</p>

      <h2>14. Business-to-Consumer (B2C) Sellers</h2>
      <p>
        Sellers who are acting in the course of a business (&ldquo;B2C sellers&rdquo;) are subject to additional legal
        obligations under the{' '}
        <strong>Consumer Contracts (Information, Cancellation and Additional Charges) Regulations 2013</strong>. In
        particular:
      </p>
      <ul>
        <li>
          B2C sellers must provide buyers with a <strong>14-day cancellation right</strong> (commonly known as a
          &ldquo;cooling-off period&rdquo;) from the date of delivery, during which the buyer may cancel the contract
          for any reason and receive a refund.
        </li>
        <li>
          This 14-day cancellation right is <strong>separate from and in addition to</strong> the Buyer Protection
          provided under this Policy.
        </li>
        <li>
          B2C sellers are responsible for ensuring they comply with all applicable consumer protection legislation,
          including providing required pre-contractual information.
        </li>
      </ul>
      <p>
        If you are a buyer purchasing from a B2C seller and wish to exercise your statutory cancellation right, please
        contact the seller directly through the Mulligans messaging system.
      </p>

      <h2>15. Changes to This Policy</h2>
      <p>
        Mulligans Golf Limited reserves the right to update or amend this Policy from time to time. Material changes
        will be communicated to users via email or in-app notification. The effective date at the top of this document
        indicates when the current version came into force.
      </p>

      <h2>16. Contact</h2>
      <p>If you have any questions about this Buyer Protection Policy, please contact us at:</p>
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
          <Link href="/privacy">Privacy Policy</Link>.
        </em>
      </p>
    </LegalPageLayout>
  );
}
