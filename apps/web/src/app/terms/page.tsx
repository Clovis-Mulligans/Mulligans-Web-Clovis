import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPageLayout } from '@/components/LegalPageLayout';

export const metadata: Metadata = {
  title: 'Terms of Service | Mulligans',
  description: 'Terms of Service for the Mulligans golf equipment marketplace. Effective 21 May 2026.',
  robots: { index: true, follow: true },
};

export default function TermsOfServicePage() {
  return (
    <LegalPageLayout
      title="Terms of Service"
      effectiveDate="21 May 2026"
      lastUpdated="21 May 2026"
      currentPath="/terms"
    >
      <p>
        <strong>Mulligans Golf Limited</strong>
        <br />
        Company Registration Number: 16647100
        <br />
        Registered Office: Flat 1 Sunrise House, 79J Riddlesdown Road, Purley, England, CR8 1DH
        <br />
        Contact: <a href="mailto:info@mulligans.uk.com">info@mulligans.uk.com</a>
      </p>

      <p>
        These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of the Mulligans
        marketplace platform, including our website, mobile applications, and all related services
        (collectively, the &ldquo;Service&rdquo;). By accessing or using the Service, you agree to be
        bound by these Terms in their entirety. If you do not agree, you must not use the Service.
      </p>

      <p>
        Please read these Terms carefully. They contain important information about your rights and
        obligations, including limitations of liability and dispute resolution procedures.
      </p>

      {/* ------------------------------------------------------------------ */}
      {/* 1. Definitions */}
      {/* ------------------------------------------------------------------ */}
      <h2>1. Definitions</h2>

      <p>
        In these Terms, the following words and expressions shall have the following meanings unless
        the context requires otherwise:
      </p>

      <p>
        1.1. <strong>&ldquo;Mulligans&rdquo;</strong>, <strong>&ldquo;we&rdquo;</strong>,{' '}
        <strong>&ldquo;us&rdquo;</strong>, or <strong>&ldquo;our&rdquo;</strong> means Mulligans Golf
        Limited, a company registered in England and Wales under company number 16647100, with its
        registered office at Flat 1 Sunrise House, 79J Riddlesdown Road, Purley, England, CR8 1DH.
      </p>

      <p>
        1.2. <strong>&ldquo;Platform&rdquo;</strong> means the Mulligans online marketplace, including
        the website, mobile applications, APIs, and all associated technology and infrastructure
        through which the Service is provided.
      </p>

      <p>
        1.3. <strong>&ldquo;Service&rdquo;</strong> means all services provided by Mulligans through
        the Platform, including but not limited to listing, buying, selling, payment processing,
        escrow, shipping facilitation, buyer protection, and customer support.
      </p>

      <p>
        1.4. <strong>&ldquo;User&rdquo;</strong> means any individual or legal entity who accesses or
        uses the Platform, whether as a Buyer, Seller, or visitor.
      </p>

      <p>
        1.5. <strong>&ldquo;Buyer&rdquo;</strong> means a User who purchases or seeks to purchase an
        item through the Platform.
      </p>

      <p>
        1.6. <strong>&ldquo;Seller&rdquo;</strong> means a User who lists or sells an item through the
        Platform.
      </p>

      <p>
        1.7. <strong>&ldquo;Pro Seller&rdquo;</strong> (also referred to as a{' '}
        <strong>&ldquo;Pro Store&rdquo;</strong>) means a Seller who subscribes to or is enrolled in
        the Mulligans Pro Store programme, which provides enhanced selling features and visibility on
        the Platform.
      </p>

      <p>
        1.8. <strong>&ldquo;Listing&rdquo;</strong> means an advertisement placed by a Seller on the
        Platform offering an item for sale, including all associated descriptions, photographs,
        pricing, and condition information.
      </p>

      <p>
        1.9. <strong>&ldquo;Buyer Protection Fee&rdquo;</strong> means the fee charged to the Buyer at
        checkout, calculated as 7.5% of the items total plus a fixed fee of &pound;0.99 per item
        purchased, which funds the Mulligans Buyer Protection programme and Platform operations.
      </p>

      <p>
        1.10. <strong>&ldquo;Shipping Protection Fee&rdquo;</strong> means a fee of 1.25% of the items
        total, added to the shipping line at checkout, which contributes to insurance coverage for items
        lost or damaged in transit.
      </p>

      <p>
        1.11. <strong>&ldquo;Working Day&rdquo;</strong> means any day other than a Saturday, Sunday, or
        a public holiday in England.
      </p>

      <p>
        1.12. <strong>&ldquo;Inspection Window&rdquo;</strong> means the period of three (3) calendar
        days following delivery confirmation during which the Buyer may inspect the item received and,
        if applicable, raise a dispute or return request under the Buyer Protection programme.
      </p>

      <p>
        1.13. <strong>&ldquo;Escrow&rdquo;</strong> means the secure holding of transaction funds by
        Mulligans (via Stripe) between the point of Buyer payment and release to the Seller, which
        occurs after the Inspection Window has elapsed or the Buyer has confirmed acceptance of the
        item, whichever is earlier.
      </p>

      <p>
        1.14. <strong>&ldquo;Platform Commission&rdquo;</strong> means the 7.5% commission deducted
        from the item sale price before funds are released to the Seller.
      </p>

      <p>
        1.15. <strong>&ldquo;Stripe Connect&rdquo;</strong> means the third-party payment
        infrastructure provided by Stripe, Inc. used by Mulligans to process payments, hold funds in
        escrow, and disburse funds to Sellers.
      </p>

      <p>
        1.16. <strong>&ldquo;Transaction&rdquo;</strong> means a completed purchase of an item on the
        Platform, encompassing the Buyer&rsquo;s payment, the Seller&rsquo;s dispatch, and the
        conclusion of the Inspection Window.
      </p>

      {/* ------------------------------------------------------------------ */}
      {/* 2. Eligibility */}
      {/* ------------------------------------------------------------------ */}
      <h2>2. Eligibility</h2>

      <p>
        2.1. You must be at least eighteen (18) years of age to create an account or use the Service.
        By using the Service, you represent and warrant that you are at least 18 years old and have
        the legal capacity to enter into a binding contract under the laws of England and Wales.
      </p>

      <p>
        2.2. If you are registering on behalf of a business, organisation, or other legal entity, you
        represent and warrant that you have the authority to bind that entity to these Terms, and
        references to &ldquo;you&rdquo; shall include that entity.
      </p>

      <p>
        2.3. At launch, the Service is available to Users who are resident in the United Kingdom. We
        intend to expand availability to additional jurisdictions in the future and will update these
        Terms accordingly. Users outside the United Kingdom may not create accounts or transact on the
        Platform unless and until we announce availability in their jurisdiction.
      </p>

      <p>
        2.4. You may not use the Service if you have previously been suspended or banned from the
        Platform, unless Mulligans has expressly reinstated your account in writing.
      </p>

      {/* ------------------------------------------------------------------ */}
      {/* 3. Account Creation and Security */}
      {/* ------------------------------------------------------------------ */}
      <h2>3. Account Creation and Security</h2>

      <p>
        3.1. <strong>Registration.</strong> To access certain features of the Service, including buying
        and selling, you must create a User account. You agree to provide accurate, current, and
        complete information during registration and to update such information to keep it accurate,
        current, and complete.
      </p>

      <p>
        3.2. <strong>Seller Verification.</strong> Users who wish to sell items on the Platform must
        complete identity and payment verification through Stripe Connect. This process may require the
        provision of personal identification documents, bank account details, and other information as
        required by Stripe and applicable law. You may not list items for sale until your Stripe
        Connect onboarding is complete and approved.
      </p>

      <p>
        3.3. <strong>Account Security.</strong> You are responsible for maintaining the confidentiality
        of your account credentials, including your password. You agree to notify Mulligans immediately
        at <a href="mailto:info@mulligans.uk.com">info@mulligans.uk.com</a> if you become aware of
        any unauthorised access to or use of your account. You are liable for all activity that occurs
        under your account unless you can demonstrate that such activity was not caused by your act or
        omission.
      </p>

      <p>
        3.4. <strong>One Account Per User.</strong> Each individual or business entity may maintain
        only one active account on the Platform unless expressly authorised by Mulligans. Operating
        multiple accounts may result in suspension or permanent termination of all associated accounts.
      </p>

      <p>
        3.5. <strong>Account Suspension.</strong> Mulligans reserves the right to suspend, restrict, or
        terminate your account at any time if we reasonably believe you have breached these Terms,
        engaged in fraudulent or illegal activity, or pose a risk to other Users or the integrity of
        the Platform. See Section 19 for further details.
      </p>

      {/* ------------------------------------------------------------------ */}
      {/* 4. How the Platform Works */}
      {/* ------------------------------------------------------------------ */}
      <h2>4. How the Platform Works</h2>

      <p>
        4.1. Mulligans operates an online marketplace that enables Users to buy and sell golf
        equipment. Mulligans provides the technology, infrastructure, and services that facilitate
        transactions between Buyers and Sellers.
      </p>

      <p>
        4.2. <strong>Mulligans is not a party to the sale.</strong> When a Buyer purchases an item
        from a Seller, the contract of sale is formed directly between the Buyer and the Seller.
        Mulligans acts solely as an intermediary platform and is not a party to, nor assumes any
        liability arising from, the contract between Buyer and Seller, except as expressly stated in
        these Terms or required by law.
      </p>

      <p>
        4.3. Mulligans does not take ownership of, inspect, or endorse any items listed on the
        Platform. Sellers are solely responsible for the accuracy of their Listings, the quality and
        condition of their items, and compliance with all applicable laws.
      </p>

      {/* ------------------------------------------------------------------ */}
      {/* 5. Listing Rules */}
      {/* ------------------------------------------------------------------ */}
      <h2>5. Listing Rules</h2>

      <p>
        5.1. <strong>Accurate Descriptions.</strong> Sellers must provide truthful, accurate, and
        complete descriptions of all items listed on the Platform. This includes, without limitation,
        the item&rsquo;s brand, model, condition, any defects or damage, and relevant specifications.
      </p>

      <p>
        5.2. <strong>Photographs.</strong> Sellers must upload clear, original photographs that
        accurately represent the item being sold. Stock images or photographs of different items are
        not permitted. Photographs must not contain watermarks, promotional overlays, or contact
        information directing Buyers off-platform.
      </p>

      <p>
        5.3. <strong>Condition Grading.</strong> Sellers must select the appropriate condition grade for
        each item in accordance with the condition grading system provided by Mulligans on the
        Platform. Misrepresenting the condition of an item constitutes a breach of these Terms and may
        result in account suspension.
      </p>

      <p>
        5.4. <strong>Prohibited Items.</strong> Certain items may not be listed or sold on the
        Platform. For a full list of restricted and prohibited items, please refer to our{' '}
        <Link href="/prohibited-items">Prohibited Items Policy</Link>. Sellers are responsible for
        ensuring that their Listings comply with this policy.
      </p>

      <p>
        5.5. <strong>Pricing.</strong> Sellers set their own prices. Prices must be stated in pounds
        sterling (GBP) and must represent the genuine price at which the Seller intends to sell the
        item. Artificially inflating prices, fee avoidance schemes, or misleading pricing practices
        are prohibited.
      </p>

      <p>
        5.6. <strong>Listing Fees.</strong> There are no fees charged to Sellers for creating Listings
        on the Platform. Mulligans charges zero seller listing fees.
      </p>

      {/* ------------------------------------------------------------------ */}
      {/* 6. Buyer-Seller Contract */}
      {/* ------------------------------------------------------------------ */}
      <h2>6. Buyer-Seller Contract</h2>

      <p>
        6.1. A binding contract between Buyer and Seller is formed when the Buyer completes the
        checkout process and payment is successfully processed. At this point, the Seller is obligated
        to dispatch the item in accordance with these Terms, and the Buyer is obligated to pay the
        agreed price (including the Buyer Protection Fee).
      </p>

      <p>6.2. The terms of the contract between Buyer and Seller include:</p>
      <ul>
        <li>(a) the item description and condition as stated in the Listing;</li>
        <li>(b) the agreed sale price;</li>
        <li>
          (c) the shipping method and any delivery timeframes indicated on the Platform; and
        </li>
        <li>(d) these Terms of Service, insofar as they govern the Transaction.</li>
      </ul>

      <p>
        6.3. <strong>Mulligans&rsquo; role.</strong> Mulligans facilitates the Transaction by
        providing the Platform, processing payments via escrow, and, where applicable, arranging
        shipping labels through Shippo. Mulligans is not a party to the contract of sale and does not
        guarantee the performance of either Buyer or Seller, except through the Buyer Protection
        programme as described in Section 9.
      </p>

      <p>
        6.4. <strong>Consumer sales.</strong> Where a Seller is acting in the course of a business
        (including Pro Sellers), the sale to a Buyer who is a consumer is a business-to-consumer (B2C)
        transaction and is subject to the additional consumer rights set out in Section 14.
      </p>

      {/* ------------------------------------------------------------------ */}
      {/* 7. Fees and Payments */}
      {/* ------------------------------------------------------------------ */}
      <h2>7. Fees and Payments</h2>

      <p>
        7.1. <strong>Buyer Protection Fee.</strong> The Buyer will be charged a Buyer Protection Fee of
        7.5% of the items total plus &pound;0.99 per item purchased. This fee is calculated and displayed
        to the Buyer at checkout before payment is confirmed. The Buyer Protection Fee is
        non-refundable except where required by applicable law.
      </p>

      <p>
        7.2. <strong>Platform Commission.</strong> Mulligans deducts a Platform Commission of 7.5%
        from the item sale price before disbursing funds to the Seller. This commission is the sole fee
        payable by the Seller in connection with a Transaction.
      </p>

      <p>
        7.3. <strong>Seller Payouts.</strong> Sellers receive the item sale price minus the 7.5%
        Platform Commission. Shipping label costs, where Mulligans provides a pre-paid label via
        Shippo, are fronted by Mulligans and are not deducted from the Seller&rsquo;s payout.
      </p>

      <p>
        7.4. <strong>Stripe Processing Fees.</strong> Mulligans absorbs all Stripe payment processing
        fees. These fees are not passed on to Buyers or Sellers. Sellers receive the item price minus
        the 7.5% Platform Commission only.
      </p>

      <p>
        7.5. <strong>Seller Listing Fees.</strong> There are no listing fees. Sellers may list items on
        the Platform at no cost.
      </p>

      <p>
        7.6. <strong>Pro Store Subscription.</strong> Mulligans may in the future charge a monthly
        subscription fee of &pound;30 per month for the Pro Store programme. The Pro Store programme is
        free during the launch period. Users enrolled in or eligible for the Pro Store programme will
        be notified at least thirty (30) days before any subscription charges commence. Users may
        cancel their Pro Store subscription at any time before charges begin.
      </p>

      <p>
        7.7. <strong>Fee Changes.</strong> Mulligans reserves the right to modify its fee structure at
        any time. Any changes to fees will be communicated to Users with at least thirty (30)
        days&rsquo; notice and will not apply to Transactions already in progress at the time of the
        change.
      </p>

      <p>
        7.8. <strong>Shipping Protection Fee.</strong> A Shipping Protection Fee of 1.25% of the items
        total is added to the shipping line at checkout. This fee contributes to insurance coverage for
        items lost or damaged in transit. The fee is displayed to the Buyer at checkout before payment
        is confirmed. The Shipping Protection Fee is non-refundable except where required by
        applicable law.
      </p>

      <p>
        7.9. <strong>Fee Calculation Example.</strong> A Buyer purchasing two items from one Seller,
        priced at &pound;40 and &pound;30 respectively, will be charged:
      </p>
      <ul>
        <li>Items total: &pound;70.00</li>
        <li>Buyer Protection Fee (7.5% of &pound;70.00): &pound;5.25</li>
        <li>Service Fee (&pound;0.99 &times; 2 items): &pound;1.98</li>
        <li>Shipping Protection Fee (1.25% of &pound;70.00, added to shipping line): &pound;0.88</li>
        <li>Plus the shipping cost set by the Seller</li>
      </ul>
      <p>All fees are displayed at checkout before the Buyer confirms payment.</p>

      {/* ------------------------------------------------------------------ */}
      {/* 8. Shipping */}
      {/* ------------------------------------------------------------------ */}
      <h2>8. Shipping</h2>

      <p>
        8.1. <strong>Dispatch Obligation.</strong> Once a Transaction is confirmed, the Seller must
        dispatch the item within five (5) Working Days. Working Days mean Monday to Friday, excluding
        UK bank holidays. Failure to dispatch within this period may result in automatic cancellation
        of the Transaction and a full refund to the Buyer.
      </p>

      <p>
        8.2. <strong>Tracked Delivery.</strong> All items sold on the Platform must be shipped using a
        tracked delivery service. Sellers must provide valid tracking information through the Platform.
        Untracked shipments are not covered by Buyer Protection, and the Seller assumes full risk of
        loss in transit.
      </p>

      <p>
        8.3. <strong>Shippo Integration.</strong> Mulligans integrates with Shippo to provide shipping
        label generation and tracking services. Where Mulligans provides a pre-paid shipping label
        through Shippo (&ldquo;auto-ship&rdquo;), the cost of the label is fronted by Mulligans and is
        not charged to the Seller.
      </p>

      <p>
        8.4. <strong>Seller-Arranged Shipping.</strong> Where a Seller elects to arrange their own
        shipping rather than using a Mulligans-provided label, the Seller is responsible for ensuring
        the shipment is tracked and that valid tracking information is uploaded to the Platform
        promptly.
      </p>

      <p>
        8.5. <strong>Delivery Confirmation.</strong> Delivery is deemed confirmed when the tracking
        information provided by the carrier indicates successful delivery to the Buyer&rsquo;s
        specified address. The Inspection Window commences upon delivery confirmation.
      </p>

      <p>
        8.6. <strong>Lost or Damaged Items in Transit.</strong> If an item is lost or damaged during
        transit, the Buyer may raise a claim under the Buyer Protection programme. See Section 9 for
        details.
      </p>

      {/* ------------------------------------------------------------------ */}
      {/* 9. Buyer Protection Summary */}
      {/* ------------------------------------------------------------------ */}
      <h2>9. Buyer Protection Summary</h2>

      <p>
        9.1. Mulligans offers a Buyer Protection programme designed to give Buyers confidence when
        purchasing on the Platform. For full details, please refer to our{' '}
        <Link href="/buyer-protection">Buyer Protection Policy</Link>.
      </p>

      <p>9.2. <strong>Coverage.</strong> The Buyer Protection programme covers the following situations:</p>
      <ul>
        <li>
          (a) <strong>Item Not Received:</strong> The item does not arrive at the Buyer&rsquo;s
          specified delivery address.
        </li>
        <li>
          (b) <strong>Significantly Not As Described (SNAD):</strong> The item received is materially
          different from the Listing description, including significant undisclosed defects, incorrect
          items, or substantial discrepancies in condition.
        </li>
        <li>
          (c) <strong>Damaged in Transit:</strong> The item arrives damaged due to inadequate
          packaging or carrier mishandling.
        </li>
      </ul>

      <p>
        9.3. <strong>Inspection Window.</strong> Upon delivery confirmation, the Buyer has a three (3)
        calendar day Inspection Window to examine the item and, if necessary, open a dispute. If no
        dispute is raised within the Inspection Window, the Transaction is deemed complete and funds
        are released to the Seller.
      </p>

      <p>
        9.4. <strong>Claiming Buyer Protection.</strong> To make a claim under the Buyer Protection
        programme, the Buyer must initiate a dispute through the Platform within the Inspection Window.
        Claims raised after the Inspection Window has elapsed may not be eligible for Buyer Protection.
      </p>

      <p>
        9.5. <strong>Refunds.</strong> Where a Buyer Protection claim is upheld, the Buyer will receive
        a full refund of the item price. The Buyer Protection Fee, Service Fee, and Shipping Protection
        Fee are non-refundable except where required by law. Refunds are processed via the original
        payment method through Stripe.
      </p>

      {/* ------------------------------------------------------------------ */}
      {/* 10. Escrow */}
      {/* ------------------------------------------------------------------ */}
      <h2>10. Escrow</h2>

      <p>
        10.1. <strong>How Escrow Works.</strong> When a Buyer completes a purchase, the payment
        (comprising the item price and the Buyer Protection Fee) is collected by Mulligans via Stripe
        and held securely in escrow. Funds are not released to the Seller immediately upon payment.
      </p>

      <p>
        10.2. <strong>Release of Funds.</strong> Escrowed funds are released to the Seller (minus the
        7.5% Platform Commission) upon the earliest of:
      </p>
      <ul>
        <li>
          (a) the expiry of the three (3) calendar day Inspection Window following delivery
          confirmation, provided no dispute has been raised; or
        </li>
        <li>
          (b) the Buyer confirming acceptance of the item through the Platform before the Inspection
          Window expires.
        </li>
      </ul>

      <p>
        10.3. <strong>Disputes.</strong> If the Buyer raises a dispute within the Inspection Window,
        the escrowed funds will continue to be held until the dispute is resolved in accordance with
        the dispute resolution process set out in Section 18.
      </p>

      <p>
        10.4. <strong>Stripe.</strong> All payment processing and escrow services are provided through
        Stripe. By using the Service, you agree to Stripe&rsquo;s terms of service and privacy policy
        as applicable to your use of the payment functionality.
      </p>

      {/* ------------------------------------------------------------------ */}
      {/* 11. Offers and Negotiation */}
      {/* ------------------------------------------------------------------ */}
      <h2>11. Offers and Negotiation</h2>

      <p>
        11.1. <strong>Making Offers.</strong> Buyers may submit offers to Sellers on listed items
        through the Platform&rsquo;s offer system. Offers must be between 50% and 100% (inclusive) of
        the listed price. Offers below 50% of the listed price will not be permitted by the Platform.
      </p>

      <p>
        11.2. <strong>Offer Limits.</strong> Each Buyer is limited to a maximum of three (3) offers per
        Listing over the lifetime of that Listing. This limit applies regardless of whether previous
        offers were accepted, declined, or expired.
      </p>

      <p>
        11.3. <strong>Seller Response Window.</strong> Sellers have twenty-four (24) hours from the
        time an offer is submitted to accept, decline, or counter the offer. If the Seller does not
        respond within the 24-hour window, the offer will automatically expire.
      </p>

      <p>
        11.4. <strong>Binding Acceptance.</strong> When a Seller accepts a Buyer&rsquo;s offer, or a
        Buyer accepts a Seller&rsquo;s counter-offer, a binding agreement to transact at the agreed
        price is formed. The Buyer must complete payment promptly to finalise the Transaction.
      </p>

      <p>
        11.5. <strong>Price Changes.</strong> If a Seller changes the listed price of an item, all
        active (pending) offers on that Listing are automatically voided. Buyers who had active offers
        will be notified and may submit new offers at their discretion, subject to the lifetime offer
        limit.
      </p>

      {/* ------------------------------------------------------------------ */}
      {/* 12. Reviews and Ratings */}
      {/* ------------------------------------------------------------------ */}
      <h2>12. Reviews and Ratings</h2>

      <p>
        12.1. <strong>Eligibility.</strong> Reviews may only be left after a Transaction has been
        completed (i.e., the Inspection Window has expired or the Buyer has confirmed acceptance, and
        no unresolved dispute exists). Both Buyers and Sellers may leave reviews for one another.
      </p>

      <p>
        12.2. <strong>Content Standards.</strong> Reviews must be honest, fair, and based on the
        User&rsquo;s genuine experience with the Transaction. Reviews must not contain defamatory,
        abusive, discriminatory, or misleading content. Mulligans reserves the right to remove reviews
        that violate these standards or our{' '}
        <Link href="/acceptable-use">Acceptable Use Policy</Link>.
      </p>

      <p>
        12.3. <strong>Automatic Reviews on Cancellation.</strong> Mulligans automatically applies a
        one-star (1&star;) review to a Seller&rsquo;s profile when the Seller cancels their second order
        on the Platform (cumulative across all of that Seller&rsquo;s Transactions). This automatic
        action is applied to encourage reliable Seller behaviour and protect Buyer experience. The first
        cancellation does not trigger an automatic review.
      </p>
      <p>
        Sellers may appeal an automatic review by contacting{' '}
        <a href="mailto:info@mulligans.uk.com">info@mulligans.uk.com</a> if they believe the
        cancellation was unavoidable (e.g. carrier issues, fraud prevention, item damaged in storage).
        Mulligans will review appeals within 14 days and may remove the automatic review if the
        cancellation was unavoidable.
      </p>

      <p>
        12.4. <strong>Review Integrity.</strong> Manipulating the review system, including but not
        limited to offering incentives for positive reviews, submitting fraudulent reviews, or
        retaliating against Users who leave negative reviews, is strictly prohibited and may result in
        account suspension or termination.
      </p>

      {/* ------------------------------------------------------------------ */}
      {/* 13. Cancellations */}
      {/* ------------------------------------------------------------------ */}
      <h2>13. Cancellations</h2>

      <p>
        13.1. <strong>Buyer Cancellation Window.</strong> Buyers may cancel a Transaction within five
        (5) minutes of completing payment. Cancellations within this window will result in a full
        refund, including the Buyer Protection Fee.
      </p>

      <p>
        13.2. <strong>Seller Pre-Label Cancellation.</strong> Sellers may cancel a Transaction before a
        shipping label has been generated or before the item has been dispatched, whichever occurs
        first. Sellers who cancel will not incur any fee for that cancellation, but repeated
        cancellations may result in the consequences described in Section 12.3 and potential account
        restrictions.
      </p>

      <p>
        13.3. <strong>Automatic Cancellation for Non-Dispatch.</strong> If a Seller fails to dispatch
        the item within five (5) Working Days of the Transaction being confirmed, the Transaction
        will be automatically cancelled and the Buyer will receive a full refund.
      </p>

      <p>
        13.4. <strong>Effect of Price Changes on Offers.</strong> When a Seller changes the listed
        price of an item, all active offers on that Listing are voided. This is not treated as a
        cancellation by either party.
      </p>

      <p>
        13.5. <strong>Automatic One-Star Review.</strong> As set out in Section 12.3, a Seller&rsquo;s
        second cancellation (cumulative across all Transactions) will trigger an automatic one-star
        (1&star;) review on the Seller&rsquo;s profile. Sellers may appeal this automatic review by
        contacting{' '}
        <a href="mailto:info@mulligans.uk.com">info@mulligans.uk.com</a>. See Section 12.3 for full
        details of the appeal process.
      </p>

      <p>
        13.6. <strong>Refund Processing.</strong> All refunds arising from cancellations will be
        processed to the Buyer&rsquo;s original payment method via Stripe. Refund processing times may
        vary depending on the Buyer&rsquo;s payment provider but are typically completed within five to
        ten (5-10) Working Days.
      </p>

      {/* ------------------------------------------------------------------ */}
      {/* 14. B2C Consumer Rights */}
      {/* ------------------------------------------------------------------ */}
      <h2>14. B2C Consumer Rights</h2>

      <p>
        14.1. <strong>Application.</strong> This section applies where a Seller is acting in the course
        of a business (including, without limitation, Pro Sellers and any other Seller who meets the
        legal definition of a &ldquo;trader&rdquo;) and the Buyer is a consumer. In such cases, the
        Transaction constitutes a business-to-consumer (B2C) sale and is subject to the Consumer
        Contracts (Information, Cancellation and Additional Charges) Regulations 2013 (the
        &ldquo;Consumer Contracts Regulations&rdquo;) and the Consumer Rights Act 2015.
      </p>

      <p>
        14.2. <strong>Right of Cancellation.</strong> Under the Consumer Contracts Regulations,
        consumers purchasing from business Sellers have a statutory right to cancel the contract within
        fourteen (14) calendar days from the day after the Buyer receives the item (the
        &ldquo;Cooling-Off Period&rdquo;), without giving any reason. Business Sellers must honour this
        right and accept returns within the Cooling-Off Period.
      </p>

      <p>
        14.3. <strong>Exercising the Right.</strong> To exercise the right of cancellation, the Buyer
        must inform the Seller (via the Platform&rsquo;s messaging or dispute system) of the decision
        to cancel by a clear statement before the expiry of the Cooling-Off Period. The Buyer must
        return the item to the Seller within fourteen (14) calendar days of communicating the
        cancellation. The item must be returned in the condition in which it was received, subject to
        reasonable inspection.
      </p>

      <p>
        14.4. <strong>Refunds for B2C Cancellations.</strong> Where a Buyer exercises the right of
        cancellation under this section, the business Seller must refund the full item price to the
        Buyer without undue delay and in any event within fourteen (14) calendar days of receiving the
        returned item (or evidence that it has been sent back). The refund will be processed through
        the Platform.
      </p>

      <p>
        14.5. <strong>Private Sellers.</strong> Where the Seller is a private individual (not acting in
        the course of a business), the Consumer Contracts Regulations do not apply. Private Sellers are
        not required to accept returns unless the item is significantly not as described (SNAD), in
        which case the Buyer may claim under the Buyer Protection programme (see Section 9).
      </p>

      <p>
        14.6. <strong>Seller Responsibility.</strong> It is the Seller&rsquo;s responsibility to
        determine whether they are acting as a trader or a private individual and to comply with all
        applicable consumer protection legislation accordingly. Mulligans does not make this
        determination on behalf of Sellers and is not liable for a Seller&rsquo;s failure to comply
        with their legal obligations.
      </p>

      <p>
        14.7. <strong>Non-Excludable Rights.</strong> Nothing in these Terms shall affect, limit, or
        exclude any statutory rights that a consumer may have under the Consumer Rights Act 2015, the
        Consumer Contracts Regulations, or any other applicable legislation which cannot be excluded or
        limited by contract.
      </p>

      {/* ------------------------------------------------------------------ */}
      {/* 15. Intellectual Property */}
      {/* ------------------------------------------------------------------ */}
      <h2>15. Intellectual Property</h2>

      <p>
        15.1. <strong>Mulligans IP.</strong> The Platform, including its design, software, code, text,
        graphics, logos, trademarks, trade names, and all other intellectual property embodied in or
        associated with the Service, is owned by or licensed to Mulligans Golf Limited. All rights are
        reserved. You may not copy, reproduce, modify, distribute, display, or create derivative works
        from any part of the Platform without our prior written consent.
      </p>

      <p>
        15.2. <strong>User Content Licence.</strong> By uploading, posting, or otherwise submitting
        content to the Platform (including Listing descriptions, photographs, reviews, and messages)
        (&ldquo;User Content&rdquo;), you grant Mulligans a non-exclusive, worldwide, royalty-free,
        transferable, sub-licensable licence to use, reproduce, modify, adapt, publish, translate,
        distribute, and display such User Content in connection with operating, promoting, and
        improving the Service. This licence continues even if you cease to use the Platform, to the
        extent necessary for Mulligans to operate the Service (for example, to display completed
        Transaction records and reviews).
      </p>

      <p>
        15.3. <strong>Your Representations.</strong> You represent and warrant that you own or have the
        necessary rights, licences, and permissions to submit your User Content and to grant the
        licence described in Section 15.2, and that your User Content does not infringe or violate the
        intellectual property rights, privacy rights, or any other rights of any third party.
      </p>

      <p>
        15.4. <strong>Infringement Claims.</strong> If you believe that any content on the Platform
        infringes your intellectual property rights, please contact us at{' '}
        <a href="mailto:info@mulligans.uk.com">info@mulligans.uk.com</a> with details of the alleged
        infringement. Mulligans will investigate and, where appropriate, remove infringing content in
        accordance with applicable law.
      </p>

      {/* ------------------------------------------------------------------ */}
      {/* 16. Acceptable Use */}
      {/* ------------------------------------------------------------------ */}
      <h2>16. Acceptable Use</h2>

      <p>
        16.1. You agree to use the Platform in accordance with these Terms and all applicable laws and
        regulations. You must not use the Platform for any unlawful, fraudulent, or harmful purpose.
      </p>

      <p>
        16.2. For a full description of prohibited conduct and content, please refer to our{' '}
        <Link href="/acceptable-use">Acceptable Use Policy</Link>. The Acceptable Use Policy forms
        part of these Terms and is incorporated herein by reference.
      </p>

      <p>
        16.3. Without limiting the generality of the Acceptable Use Policy, you must not:
      </p>
      <ul>
        <li>
          (a) use the Platform to facilitate transactions outside the Platform in order to avoid fees
          or protections;
        </li>
        <li>(b) create false, misleading, or fraudulent Listings;</li>
        <li>(c) harass, threaten, or abuse other Users;</li>
        <li>
          (d) manipulate prices, reviews, search results, or any other Platform feature;
        </li>
        <li>
          (e) attempt to gain unauthorised access to the Platform, other Users&rsquo; accounts, or any
          systems or networks connected to the Service;
        </li>
        <li>
          (f) use automated means (bots, scrapers, crawlers) to access or collect data from the
          Platform without our prior written consent; or
        </li>
        <li>(g) interfere with or disrupt the integrity or performance of the Platform.</li>
      </ul>

      <p>
        16.4. Mulligans reserves the right to investigate and take appropriate action against any User
        who violates the Acceptable Use Policy or this section, including account suspension,
        termination, and reporting to law enforcement authorities.
      </p>

      {/* ------------------------------------------------------------------ */}
      {/* 17. Liability and Indemnity */}
      {/* ------------------------------------------------------------------ */}
      <h2>17. Liability and Indemnity</h2>

      <p>
        17.1. <strong>Marketplace Disclaimer.</strong> Mulligans is a marketplace platform that
        facilitates transactions between Buyers and Sellers. Mulligans does not own, inspect, verify,
        endorse, or take possession of any items listed on the Platform. To the fullest extent
        permitted by law, Mulligans makes no representations or warranties regarding the quality,
        safety, legality, accuracy of description, or fitness for purpose of any item listed or sold
        on the Platform.
      </p>

      <p>17.2. <strong>No Guarantee.</strong> Mulligans does not guarantee that:</p>
      <ul>
        <li>(a) the Service will be uninterrupted, timely, secure, or error-free;</li>
        <li>
          (b) the information provided on the Platform will be accurate, reliable, or complete;
        </li>
        <li>(c) any Transaction will be completed satisfactorily; or</li>
        <li>(d) defects in the Service will be corrected.</li>
      </ul>

      <p>
        17.3. <strong>Limitation of Liability.</strong> To the maximum extent permitted by applicable
        law:
      </p>
      <ul>
        <li>
          (a) Mulligans&rsquo; total aggregate liability to you for all claims arising out of or in
          connection with these Terms or your use of the Service shall not exceed the total fees paid
          by you to Mulligans in the twelve (12) months immediately preceding the event giving rise to
          the claim.
        </li>
        <li>
          (b) Mulligans shall not be liable for any indirect, incidental, special, consequential, or
          punitive damages, or any loss of profits, revenue, data, goodwill, or business opportunity,
          whether arising in contract, tort (including negligence), strict liability, or otherwise,
          even if Mulligans has been advised of the possibility of such damages.
        </li>
      </ul>

      <p>17.4. <strong>Non-Excludable Liability.</strong> Nothing in these Terms shall exclude or limit Mulligans&rsquo; liability for:</p>
      <ul>
        <li>(a) death or personal injury caused by Mulligans&rsquo; negligence;</li>
        <li>(b) fraud or fraudulent misrepresentation by Mulligans;</li>
        <li>
          (c) any liability that cannot be excluded or limited under applicable law, including the
          Consumer Rights Act 2015.
        </li>
      </ul>

      <p>
        17.5. <strong>Indemnity.</strong> You agree to indemnify, defend, and hold harmless Mulligans
        Golf Limited, its directors, officers, employees, agents, and affiliates from and against any
        and all claims, liabilities, damages, losses, costs, and expenses (including reasonable legal
        fees) arising out of or in connection with:
      </p>
      <ul>
        <li>(a) your use of the Service;</li>
        <li>(b) your breach of these Terms;</li>
        <li>(c) your violation of any applicable law or regulation;</li>
        <li>(d) any Listing you create or Transaction you enter into;</li>
        <li>(e) any dispute between you and another User; or</li>
        <li>(f) your User Content.</li>
      </ul>

      <p>
        17.6. <strong>Seller Liability.</strong> Sellers are solely responsible for the items they list
        and sell, including compliance with all applicable product safety, trading standards, and
        consumer protection legislation. Mulligans accepts no liability for any claim arising from the
        sale of an item on the Platform.
      </p>

      {/* ------------------------------------------------------------------ */}
      {/* 18. Dispute Resolution */}
      {/* ------------------------------------------------------------------ */}
      <h2>18. Dispute Resolution</h2>

      <p>
        18.1. Mulligans provides a structured dispute resolution process to help Buyers and Sellers
        resolve disagreements fairly and efficiently. Disputes should be raised through the
        Platform&rsquo;s dispute resolution system.
      </p>

      <p>
        18.2. <strong>Step 1: Bilateral Resolution (72-Hour Seller Response).</strong> When a Buyer
        raises a dispute, the Seller is notified and given seventy-two (72) hours to respond and
        attempt to resolve the matter directly with the Buyer through the Platform&rsquo;s messaging
        system. Both parties are encouraged to communicate openly and in good faith to reach a
        mutually acceptable resolution.
      </p>

      <p>
        18.3. <strong>Step 2: Automatic Escalation.</strong> If the Seller fails to respond within
        seventy-two (72) hours, or if the parties are unable to reach a resolution within the
        bilateral resolution period, the dispute is automatically escalated to Mulligans for review.
      </p>

      <p>
        18.4. <strong>Step 3: Admin Final Decision.</strong> Upon escalation, Mulligans will review the
        dispute, including all communications, Listing details, photographs, tracking information, and
        any other relevant evidence submitted by either party. Mulligans will make a final decision on
        the dispute, which may include issuing a full or partial refund to the Buyer, releasing funds
        to the Seller, or any other resolution deemed appropriate. The decision of Mulligans is final
        and binding on both parties within the context of the Platform, without prejudice to either
        party&rsquo;s legal rights.
      </p>

      <p>
        18.5. <strong>Buyer Protection Claims.</strong> Disputes involving claims under the Buyer
        Protection programme will be handled in accordance with our{' '}
        <Link href="/buyer-protection">Buyer Protection Policy</Link> in addition to this Section 18.
      </p>

      <p>
        18.6. <strong>Good Faith.</strong> Both parties must participate in the dispute resolution
        process in good faith. Providing false or misleading information during a dispute may result in
        the dispute being decided against the offending party and may lead to account suspension or
        termination.
      </p>

      {/* ------------------------------------------------------------------ */}
      {/* 19. Suspension and Termination */}
      {/* ------------------------------------------------------------------ */}
      <h2>19. Suspension and Termination</h2>

      <p>
        19.1. <strong>Suspension by Mulligans.</strong> Mulligans may, at its sole discretion, suspend,
        restrict, or terminate your account and access to the Service, with or without notice, for any
        of the following reasons:
      </p>
      <ul>
        <li>
          (a) breach of these Terms, the Acceptable Use Policy, the Prohibited Items Policy, or any
          other policies referenced herein;
        </li>
        <li>
          (b) suspected or confirmed fraudulent activity, including but not limited to shill bidding,
          fake Listings, or payment fraud;
        </li>
        <li>
          (c) illegal activity or conduct that may expose Mulligans or other Users to legal liability;
        </li>
        <li>
          (d) repeated cancellations, disputes, or poor Seller performance that materially impacts the
          integrity of the Platform;
        </li>
        <li>(e) failure to complete Stripe Connect verification when required; or</li>
        <li>
          (f) any other conduct that Mulligans reasonably determines is harmful to the Platform, its
          Users, or its reputation.
        </li>
      </ul>

      <p>
        19.2. <strong>Effect of Suspension.</strong> During a suspension, you may not access your
        account, create Listings, complete Transactions, or withdraw funds. Escrowed funds relating to
        pending Transactions will be handled in accordance with these Terms and the applicable dispute
        resolution process.
      </p>

      <p>
        19.3. <strong>Termination by Mulligans.</strong> In cases of serious or repeated breaches,
        Mulligans may permanently terminate your account. Upon termination, all Listings will be
        removed, pending Transactions may be cancelled, and any funds owed to you will be disbursed in
        accordance with these Terms, subject to any holds required for pending disputes or
        investigations.
      </p>

      <p>
        19.4. <strong>Account Closure by User.</strong> You may close your account at any time by
        contacting Mulligans at <a href="mailto:info@mulligans.uk.com">info@mulligans.uk.com</a> or
        through the account settings on the Platform. Before closing your account, you must ensure that
        all pending Transactions, disputes, and obligations are resolved. Account closure does not
        extinguish any outstanding liabilities.
      </p>

      <p>
        19.5. <strong>Data Retention.</strong> Following account closure or termination, Mulligans will
        retain your personal data in accordance with our <Link href="/privacy">Privacy Policy</Link>{' '}
        and applicable data protection legislation, including the UK General Data Protection Regulation
        (UK GDPR) and the Data Protection Act 2018.
      </p>

      {/* ------------------------------------------------------------------ */}
      {/* 20. Changes to These Terms */}
      {/* ------------------------------------------------------------------ */}
      <h2>20. Changes to These Terms</h2>

      <p>
        20.1. Mulligans reserves the right to amend, update, or replace these Terms at any time. Where
        changes are material, we will provide at least thirty (30) days&rsquo; notice before the
        changes take effect. Notice will be given by email to the address associated with your account
        and/or by prominent in-app notification on the Platform.
      </p>

      <p>
        20.2. The updated Terms will be posted on the Platform with a revised effective date. Your
        continued use of the Service after the effective date of the updated Terms constitutes your
        acceptance of the changes.
      </p>

      <p>
        20.3. If you do not agree to the updated Terms, you must stop using the Service and close your
        account before the changes take effect. Transactions already in progress at the time of a
        change will be governed by the Terms in effect at the time the Transaction was initiated.
      </p>

      {/* ------------------------------------------------------------------ */}
      {/* 21. General Provisions */}
      {/* ------------------------------------------------------------------ */}
      <h2>21. General Provisions</h2>

      <p>
        21.1. <strong>Entire Agreement.</strong> These Terms, together with the{' '}
        <Link href="/privacy">Privacy Policy</Link>,{' '}
        <Link href="/buyer-protection">Buyer Protection Policy</Link>,{' '}
        <Link href="/prohibited-items">Prohibited Items Policy</Link>, and{' '}
        <Link href="/acceptable-use">Acceptable Use Policy</Link>, constitute the entire agreement
        between you and Mulligans with respect to your use of the Service and supersede all prior or
        contemporaneous communications, representations, or agreements, whether oral or written.
      </p>

      <p>
        21.2. <strong>Severability.</strong> If any provision of these Terms is held to be invalid,
        illegal, or unenforceable by a court of competent jurisdiction, the remaining provisions shall
        continue in full force and effect. The invalid provision shall be modified to the minimum
        extent necessary to make it valid and enforceable while preserving its original intent.
      </p>

      <p>
        21.3. <strong>Waiver.</strong> The failure of Mulligans to enforce any right or provision of
        these Terms shall not constitute a waiver of that right or provision. Any waiver must be in
        writing and signed by an authorised representative of Mulligans.
      </p>

      <p>
        21.4. <strong>Assignment.</strong> You may not assign or transfer your rights or obligations
        under these Terms without the prior written consent of Mulligans. Mulligans may assign or
        transfer its rights and obligations under these Terms without restriction, including in
        connection with a merger, acquisition, sale of assets, or by operation of law.
      </p>

      <p>
        21.5. <strong>Third-Party Rights.</strong> These Terms do not confer any rights on any person
        or party (other than the parties to these Terms) pursuant to the Contracts (Rights of Third
        Parties) Act 1999.
      </p>

      <p>
        21.6. <strong>Force Majeure.</strong> Mulligans shall not be liable for any failure or delay in
        performing its obligations under these Terms where such failure or delay results from
        circumstances beyond its reasonable control, including but not limited to acts of God, natural
        disasters, pandemics, government actions, strikes, power failures, internet or
        telecommunications failures, or cyberattacks.
      </p>

      <p>
        21.7. <strong>Notices.</strong> Mulligans may send you notices via email, in-app notification,
        or by posting on the Platform. Notices to Mulligans should be sent to{' '}
        <a href="mailto:info@mulligans.uk.com">info@mulligans.uk.com</a> or to our registered office
        address.
      </p>

      {/* ------------------------------------------------------------------ */}
      {/* 22. Governing Law and Jurisdiction */}
      {/* ------------------------------------------------------------------ */}
      <h2>22. Governing Law and Jurisdiction</h2>

      <p>
        22.1. These Terms shall be governed by and construed in accordance with the laws of England
        and Wales.
      </p>

      <p>
        22.2. Any disputes arising out of or in connection with these Terms shall be subject to the
        exclusive jurisdiction of the courts of England and Wales, subject to Sections 22.3 and 22.4.
      </p>

      <p>
        22.3. <strong>EU and EEA Consumers.</strong> If you are a consumer habitually resident in the
        European Union or European Economic Area, you shall retain the benefit of any mandatory
        consumer protection provisions of the law of your country of residence. Nothing in these Terms
        shall deprive you of the protection afforded by provisions that cannot be derogated from by
        agreement under the law of your habitual residence.
      </p>

      <p>
        22.4. <strong>Online Dispute Resolution.</strong> If you are a consumer in the European Union,
        you may also be able to submit a complaint through the European Commission&rsquo;s Online
        Dispute Resolution (ODR) platform, available at{' '}
        <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer">
          https://ec.europa.eu/consumers/odr
        </a>.
      </p>

      {/* ------------------------------------------------------------------ */}
      {/* 23. Contact Us */}
      {/* ------------------------------------------------------------------ */}
      <h2>23. Contact Us</h2>

      <p>
        If you have any questions, concerns, or complaints about these Terms or the Service, please
        contact us:
      </p>

      <p>
        <strong>Mulligans Golf Limited</strong>
        <br />
        Flat 1 Sunrise House, 79J Riddlesdown Road, Purley, England, CR8 1DH
        <br />
        Email: <a href="mailto:info@mulligans.uk.com">info@mulligans.uk.com</a>
      </p>

      <p>
        <em>These Terms of Service were last updated on 21 May 2026.</em>
      </p>
    </LegalPageLayout>
  );
}
