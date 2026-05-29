import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPageLayout } from '@/components/LegalPageLayout';

export const metadata: Metadata = {
  title: 'Prohibited Items Policy | Mulligans',
  description: 'Items prohibited from sale on the Mulligans golf marketplace, including counterfeits, stolen goods, and hazardous materials.',
  robots: { index: true, follow: true },
};

export default function ProhibitedItemsPage() {
  return (
    <LegalPageLayout
      title="Prohibited Items Policy"
      effectiveDate="21 May 2026"
      lastUpdated="21 May 2026"
      currentPath="/prohibited-items"
    >
      <h2>1. Introduction</h2>
      <p>
        Mulligans is committed to maintaining a safe, lawful, and trustworthy marketplace for the golf community. All
        items listed on the Mulligans platform must comply with the laws of England and Wales, all applicable UK
        legislation, and this Prohibited Items Policy (&ldquo;Policy&rdquo;).
      </p>
      <p>
        This Policy sets out the categories of items that are prohibited from sale on Mulligans, items that are
        permitted subject to conditions, and the enforcement measures we apply when violations are identified. It should
        be read alongside our <Link href="/terms">Terms of Service</Link> and{' '}
        <Link href="/acceptable-use">Acceptable Use Policy</Link>.
      </p>
      <p>
        Sellers are responsible for ensuring that every item they list complies with this Policy. If you are unsure
        whether an item is permitted, please contact us at{' '}
        <a href="mailto:info@mulligans.uk.com">info@mulligans.uk.com</a> before listing.
      </p>

      <h2>2. Prohibited Categories</h2>
      <p>
        The following categories of items are strictly prohibited from listing or sale on the Mulligans platform:
      </p>

      <h3>2.1 Counterfeit or Replica Goods</h3>
      <p>
        Any item that is a counterfeit, imitation, or unauthorised replica of a genuine product is prohibited. This
        includes, but is not limited to:
      </p>
      <ul>
        <li>Counterfeit golf clubs bearing the branding of legitimate manufacturers</li>
        <li>Replica golf balls marketed as or resembling branded products</li>
        <li>Fake branded apparel, footwear, headwear, or accessories</li>
        <li>Items bearing counterfeit brand labels, logos, or packaging</li>
        <li>
          &ldquo;Super clone&rdquo; or &ldquo;tour issue&rdquo; items that are not genuinely sourced from the
          manufacturer
        </li>
      </ul>
      <p>
        Sellers must be able to demonstrate the authenticity of branded goods if requested by Mulligans.
      </p>

      <h3>2.2 Stolen Goods</h3>
      <p>
        Any item that has been stolen or that the seller does not legally own or have the legal right to sell is
        prohibited. Listing stolen goods is a criminal offence. Mulligans will cooperate fully with law enforcement in
        any investigation involving stolen goods.
      </p>

      <h3>2.3 Items the Seller Cannot Legally Sell</h3>
      <p>
        Any item that the seller is not legally entitled to sell, including items subject to legal restrictions, court
        orders, finance agreements, or other encumbrances that prevent lawful sale.
      </p>

      <h3>2.4 Hazardous Materials</h3>
      <p>Items containing or consisting of hazardous materials are prohibited, including but not limited to:</p>
      <ul>
        <li>Chemicals, solvents, and flammable substances</li>
        <li>
          Loose or uninstalled batteries (batteries contained within equipment, such as rangefinders or GPS devices, are
          permitted provided the listing complies with shipping regulations)
        </li>
        <li>Compressed gases</li>
        <li>Any item classified as dangerous goods under applicable UK transport and safety regulations</li>
      </ul>

      <h3>2.5 Items Requiring Age Verification Beyond 18+</h3>
      <p>
        Items that would constitute a sale requiring age verification beyond the platform&rsquo;s standard 18+ minimum
        age requirement. This includes alcohol-branded items where the listing effectively constitutes a sale of alcohol
        rather than a collectible or branded item.
      </p>

      <h3>2.6 Personal Data of Third Parties</h3>
      <p>
        Items that contain or expose the personal data of third parties without their consent. In particular:
      </p>
      <ul>
        <li>
          Golf clubs or equipment bearing engravings, monograms, or other personalisation featuring a third
          party&rsquo;s name or personal details <strong>must not be listed unless</strong> the seller has obtained the
          consent of the individual concerned <strong>or</strong> has removed or obscured the personalisation before
          listing.
        </li>
        <li>Sellers should disclose any remaining personalisation in the listing description.</li>
      </ul>
      <p>
        This provision exists to protect individual privacy in accordance with UK data protection law.
      </p>

      <h3>2.7 Items Infringing Intellectual Property</h3>
      <p>Any item that infringes the intellectual property rights of a third party, including:</p>
      <ul>
        <li>Unauthorised use of manufacturer branding, trademarks, or logos in listings</li>
        <li>Unlicensed replicas or reproductions of patented designs</li>
        <li>
          Use of copyrighted images, text, or content belonging to third parties in listing descriptions or photographs
          (unless the seller holds the necessary rights or permissions)
        </li>
      </ul>

      <h3>2.8 Items Failing UK Consumer Safety Standards</h3>
      <p>
        Any item that does not meet applicable UK consumer safety standards, including requirements under the{' '}
        <strong>Product Safety and Metrology etc. Act 2024</strong> and associated regulations. This includes items
        that:
      </p>
      <ul>
        <li>Have been found to be unsafe by a competent authority</li>
        <li>Lack required safety markings or compliance documentation where applicable</li>
        <li>Have been subject to a safety recall (see also Section 2.10)</li>
      </ul>

      <h3>2.9 Weapons and Offensive Weapons</h3>
      <p>
        Any item that is classified as a weapon or offensive weapon under UK law, or that could reasonably be classified
        as such. This includes:
      </p>
      <ul>
        <li>Golf equipment that has been modified in a way that could render it an offensive weapon</li>
        <li>Any item designed, adapted, or intended to cause injury</li>
        <li>
          Items that, whilst originally golf equipment, have been altered to the extent that they are no longer primarily
          sporting goods
        </li>
      </ul>
      <p>
        Standard, unmodified golf equipment sold for its intended sporting purpose is, of course, permitted.
      </p>

      <h3>2.10 Recalled Products</h3>
      <p>
        Any item that is subject to an active product safety recall issued by the manufacturer or a regulatory
        authority. Sellers must check whether their items have been recalled before listing. Mulligans may remove
        listings for recalled products without prior notice.
      </p>

      <h3>2.11 Services and Intangible Goods</h3>
      <p>
        Mulligans is a marketplace for <strong>physical golf goods only</strong>. The following are not permitted:
      </p>
      <ul>
        <li>Services (e.g. coaching lessons, club fitting appointments, course memberships)</li>
        <li>Digital goods or downloads</li>
        <li>Gift cards or vouchers (unless issued by Mulligans itself)</li>
        <li>Pre-orders or items not yet in the seller&rsquo;s physical possession</li>
        <li>Any other intangible item</li>
      </ul>

      <h2>3. Items Permitted with Conditions</h2>
      <p>
        The following categories of items are permitted on Mulligans provided the stated conditions are met:
      </p>

      <h3>3.1 Customised or Refurbished Clubs</h3>
      <p>
        Golf clubs that have been customised, modified, or refurbished by the seller or a third party are permitted,
        subject to the following conditions:
      </p>
      <ul>
        <li>
          The listing <strong>must clearly state</strong> all modifications, customisations, or refurbishment work
          carried out
        </li>
        <li>
          The listing must specify whether the work was performed by a certified professional or by the seller
        </li>
        <li>
          Any aftermarket components (e.g. replacement shafts, grips, or heads) must be accurately described
        </li>
        <li>The listing must not misrepresent a customised item as an original, unmodified product</li>
      </ul>

      <h3>3.2 Vintage and Collectible Items</h3>
      <p>
        Vintage, antique, or collectible golf equipment and memorabilia are permitted, subject to the following
        conditions:
      </p>
      <ul>
        <li>
          The listing must <strong>accurately describe the age and condition</strong> of the item
        </li>
        <li>
          Where the exact age is unknown, the seller should provide their best estimate and state that it is an estimate
        </li>
        <li>
          Any known defects, damage, or signs of age must be disclosed in the listing description and shown in
          photographs
        </li>
        <li>
          Claims of provenance (e.g. &ldquo;tournament-used&rdquo; or &ldquo;owned by a professional golfer&rdquo;)
          must be substantiated with evidence where possible
        </li>
      </ul>

      <h3>3.3 Items with Personalisation</h3>
      <p>
        Items bearing engravings, monograms, stamps, or other forms of personalisation are permitted, subject to the
        following conditions:
      </p>
      <ul>
        <li>
          The personalisation must be <strong>fully disclosed</strong> in the listing description
        </li>
        <li>Photographs must clearly show the personalisation</li>
        <li>
          Where the personalisation includes a third party&rsquo;s personal data, see Section 2.6 regarding consent
          requirements
        </li>
      </ul>

      <h2>4. Enforcement</h2>
      <p>
        Mulligans takes violations of this Policy seriously. The following enforcement measures apply:
      </p>

      <h3>4.1 First Offence</h3>
      <p>
        For a first violation, the listing will be <strong>removed</strong> and the seller will receive a{' '}
        <strong>formal warning</strong> via email and/or in-app notification. The warning will explain the nature of the
        violation and the relevant section of this Policy.
      </p>

      <h3>4.2 Second Offence</h3>
      <p>
        For a second violation, the listing will be <strong>removed</strong> and the seller&rsquo;s account will be{' '}
        <strong>suspended pending review</strong>. The seller will be notified of the suspension and given an opportunity
        to respond before a final decision on account reinstatement is made.
      </p>

      <h3>4.3 Serious or Intentional Violations</h3>
      <p>
        In cases involving serious or intentional violations — including but not limited to the listing of counterfeit
        goods, stolen goods, or weapons — Mulligans reserves the right to:
      </p>
      <ul>
        <li>
          <strong>Immediately and permanently ban</strong> the seller&rsquo;s account without prior warning
        </li>
        <li>
          <strong>Refer the matter to law enforcement</strong> or other relevant authorities
        </li>
        <li>
          <strong>Retain any funds</strong> held in escrow pending the outcome of any investigation
        </li>
      </ul>
      <p>
        Mulligans will determine, at its sole discretion, whether a violation is sufficiently serious to warrant
        immediate action under this section.
      </p>

      <h2>5. Reporting Prohibited Items</h2>
      <p>
        If you believe that an item listed on Mulligans violates this Policy, please report it using one of the
        following methods:
      </p>
      <ul>
        <li>
          <strong>In-app reporting:</strong> Use the &ldquo;Report this listing&rdquo; function available on every
          listing page
        </li>
        <li>
          <strong>Email:</strong> Contact us at <a href="mailto:info@mulligans.uk.com">info@mulligans.uk.com</a> with
          the listing details and the reason for your report
        </li>
      </ul>
      <p>
        All reports are reviewed by the Mulligans team. We aim to review reports within 2 working days. The identity of
        the person making the report will be kept confidential.
      </p>

      <h2>6. Seller Responsibilities</h2>
      <p>By listing an item on Mulligans, the seller represents and warrants that:</p>
      <ul>
        <li>They are the legal owner of the item or are authorised to sell it</li>
        <li>The item complies with this Policy and all applicable UK law</li>
        <li>The listing description is accurate, complete, and not misleading</li>
        <li>They will cooperate with Mulligans in any investigation relating to their listings</li>
      </ul>
      <p>
        Sellers who are unsure whether an item is permitted are encouraged to contact us at{' '}
        <a href="mailto:info@mulligans.uk.com">info@mulligans.uk.com</a> before listing.
      </p>

      <h2>7. Changes to This Policy</h2>
      <p>
        Mulligans Golf Limited reserves the right to update or amend this Policy from time to time, including to add new
        prohibited categories or to adjust enforcement measures. Material changes will be communicated to users via email
        or in-app notification. The effective date at the top of this document indicates when the current version came
        into force.
      </p>

      <h2>8. Contact</h2>
      <p>If you have any questions about this Prohibited Items Policy, please contact us at:</p>
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
          <Link href="/acceptable-use">Acceptable Use Policy</Link>.
        </em>
      </p>
    </LegalPageLayout>
  );
}
