# Privacy Policy

**Mulligans Golf Limited**
**Effective date: 21 May 2026**

---

## 1. Introduction

This Privacy Policy explains how Mulligans Golf Limited ("we", "us", "our") collects, uses, stores, shares and protects your personal data when you use the Mulligans marketplace platform, including our mobile application, website and admin services (together, the "Platform").

We are committed to protecting your privacy in accordance with the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018. This policy is provided pursuant to Articles 13 and 14 of the UK GDPR.

Please read this policy carefully. By using the Platform you acknowledge that you have read and understood how we process your personal data as described below.

**Cross-references:**

- [Terms of Service](/terms)
- [Buyer Protection Policy](/buyer-protection)

---

## 2. Data Controller

The data controller responsible for your personal data is:

**Mulligans Golf Limited**
Company registration number: 16647100
Registered office: Flat 1 Sunrise House, 79J Riddlesdown Road, Purley, England, CR8 1DH
Email: info@mulligans.uk.com
ICO Registration: ZC061655
Jurisdiction: England & Wales

---

## 3. Personal Data We Collect

We collect the following categories of personal data, set out by purpose and origin.

### 3.1 Account Data

Data you provide when creating an account:

- Email address
- Cognito ID (system-generated unique identifier)
- Password (hashed and managed by AWS Cognito — we never store or have access to plaintext passwords)

### 3.2 Profile Data

Data you provide to personalise your account and improve buyer/seller matching:

- Display name
- Phone number
- Location
- Bio (free-text description)
- Avatar URL (profile picture)
- Postcode area
- Handicap
- Clothing size(s)
- Glove size(s)
- Shoe size(s)
- Sizing preference

### 3.3 Listing Data

Data you provide when creating a product listing:

- Title, description, category, brand and model
- Price, original price and currency
- Condition grades (head, shaft, grip, overall)
- Ball condition type
- Specifications (structured data in JSON format, e.g. loft, flex, length)
- Parcel size, shipping cost
- Quantity
- Images: image URL, S3 storage key and alt text for each uploaded photograph

### 3.4 Transaction Data

Data generated when you buy or sell on the Platform:

- Order amounts
- Payment intent IDs and payment method IDs (processed by Stripe)
- Shipping addresses (structured JSON)
- Tracking numbers and carriers
- Seller payout amounts
- Shipping label costs
- Insurance premiums
- Dispute data and refund data

### 3.5 Offer and Negotiation Data

Data generated through the make-an-offer feature:

- Offer amounts
- Counter-offer amounts
- Offer statuses
- Timestamps for each offer event

### 3.6 Shipping Data

Data required to fulfil deliveries:

- Delivery addresses
- Tracking numbers
- Carrier names (e.g. Royal Mail, Evri, DPD)
- Shipping label URLs
- Shippo shipment IDs and transaction IDs

### 3.7 Communication Data

Data you generate through Platform messaging and support:

- Messages between users (content, message type, offer amounts referenced in messages)
- Support tickets
- Feedback submissions
- User reports (e.g. reporting a listing or another user)

### 3.8 Device and Technical Data

Data collected automatically from your device:

- Push notification token
- Push notification token platform (e.g. iOS, Android)
- Server logs: IP address, request paths, timestamps

### 3.9 Usage Data

Data about how you interact with the Platform:

- Favourited listings
- Cart items
- Listing views (aggregated counts)
- Notification read statuses
- Preference settings: email notifications, marketing emails, order notifications

### 3.10 Review Data

Data you provide when leaving a review:

- Rating (numerical score)
- Review text
- Review type (e.g. buyer review, seller review)

### 3.11 Seller Verification Data

Data related to verified seller status:

- Stripe Connect ID
- Stripe Connect onboarding status
- Verified seller flag and verification date
- Shipping strikes count
- Cancellation counts

### 3.12 Dispute and Return Data

Data generated during dispute or return processes:

- Dispute reasons
- Evidence images
- Resolution details
- Return tracking information

### 3.13 Email Suppression Data

Data maintained to ensure email deliverability:

- Email address
- Suppression reason
- Bounce type (e.g. hard bounce, soft bounce)
- Suppression source

---

## 4. How We Use Your Data and Lawful Bases

We process your personal data only where we have a lawful basis under Article 6(1) of the UK GDPR. The table below summarises each data category, its purpose and the lawful basis relied upon.

| Data Category | Purpose | Lawful Basis |
|---|---|---|
| Account data | Account creation, authentication, platform access | Contract 6(1)(b) |
| Profile data | Personalisation, buyer/seller matching, sizing recommendations | Contract 6(1)(b) |
| Listing data | Publishing and managing product listings | Contract 6(1)(b) |
| Transaction data | Processing purchases, payments, refunds and payouts | Contract 6(1)(b) |
| Offer and negotiation data | Facilitating price negotiations between buyers and sellers | Contract 6(1)(b) |
| Shipping data | Generating shipping labels, tracking deliveries, fulfilling orders | Contract 6(1)(b) |
| Communication data | Enabling buyer-seller messaging, handling support requests and user reports | Contract 6(1)(b) |
| Device and technical data (push tokens) | Delivering push notifications | Consent 6(1)(a) |
| Device and technical data (server logs) | Platform security, debugging, abuse prevention | Legitimate interest 6(1)(f) |
| Usage data (favourites, cart, views, notification reads) | Platform functionality and user experience | Contract 6(1)(b) |
| Usage data (marketing email preference) | Sending marketing communications | Consent 6(1)(a) |
| Usage data (order/email notification preferences) | Delivering transactional notifications | Contract 6(1)(b) |
| Review data | Enabling trust and transparency between buyers and sellers | Contract 6(1)(b) and Legitimate interest 6(1)(f) |
| Seller verification data | Verifying seller identity, maintaining marketplace trust and safety | Contract 6(1)(b) and Legitimate interest 6(1)(f) |
| Dispute and return data | Resolving disputes, processing returns, enforcing buyer protection | Contract 6(1)(b) and Legal obligation 6(1)(c) |
| Email suppression data | Preventing emails to invalid/bounced addresses, maintaining sender reputation | Legitimate interest 6(1)(f) |
| Crash reports (via Crashlytics) | Identifying and fixing application errors | Legitimate interest 6(1)(f) |
| Chip AI Caddy interactions | Providing personalised golf equipment recommendations and fitting advice | Contract 6(1)(b) |

**Legitimate interest assessments:** Where we rely on legitimate interest, we have conducted balancing tests to ensure our interests do not override your fundamental rights and freedoms. You may request details of these assessments by contacting us at info@mulligans.uk.com.

---

## 5. Third-Party Processors

We share personal data with the following third-party processors, each of whom processes data on our behalf under a written data processing agreement.

### 5.1 Stripe, Inc.

- **Purpose:** Payment processing, seller identity verification (KYC) via Stripe Connect, payout management.
- **Data shared:** Name, email address, bank account details (entered directly into Stripe-hosted forms — we do not see or store these), transaction amounts, identity documents (submitted via Stripe's hosted onboarding).
- **Jurisdiction:** United States. Transfers are protected by the UK-US Data Bridge under the EU-US Data Privacy Framework (DPF).
- **Lawful basis:** Contract 6(1)(b).

### 5.2 Shippo, Inc. (including XCover insurance)

- **Purpose:** Shipping label generation, carrier rate comparison, shipment tracking, shipment insurance.
- **Data shared:** Buyer name, delivery address, phone number, parcel dimensions, item value.
- **Carriers used:** Royal Mail, Evri, DPD.
- **Jurisdiction:** United States. Transfers are protected by Standard Contractual Clauses (SCCs).
- **Lawful basis:** Contract 6(1)(b).

### 5.3 Resend, Inc.

- **Purpose:** Transactional email delivery (e.g. order confirmations, shipping updates, account notifications).
- **Data shared:** Email addresses, email content.
- **Jurisdiction:** United States. Transfers are protected by Standard Contractual Clauses (SCCs).
- **Lawful basis:** Contract 6(1)(b).

### 5.4 Amazon Web Services (AWS)

- **Purpose:** Core infrastructure — authentication (Cognito), image storage and delivery (S3 + CloudFront CDN), database hosting (RDS PostgreSQL), application hosting (EC2), email bounce handling (SES).
- **Data shared:** All platform data (encrypted in transit via TLS and at rest via AWS encryption).
- **Jurisdiction:** EU-West-2 (London, United Kingdom). Data remains within the UK.
- **Lawful basis:** Contract 6(1)(b), Legitimate interest 6(1)(f).

### 5.5 Expo / Software Mansion S.A.

- **Purpose:** Push notification delivery to mobile devices.
- **Data shared:** Device push tokens, notification content.
- **Jurisdiction:** United States / European Union. Transfers are protected by Standard Contractual Clauses (SCCs).
- **Lawful basis:** Consent 6(1)(a).

### 5.6 Firebase / Google LLC (Crashlytics)

- **Purpose:** Mobile application crash reporting and stability monitoring.
- **Data shared:** Crash reports, device information, application state at time of crash. Auto-collection is enabled.
- **Jurisdiction:** United States. Transfers are protected by the UK-US Data Bridge under the EU-US Data Privacy Framework (DPF).
- **Lawful basis:** Legitimate interest 6(1)(f).

### 5.7 Anthropic PBC

- **Purpose:** Chip AI Caddy — an AI-powered golf equipment assistant that provides personalised recommendations and fitting advice.
- **Data shared:** User messages (sanitised to remove unnecessary personal identifiers), fitting profile data, bag contents, listing data for equipment recommendations. All processing is performed server-side via API; the API key is secured on our backend.
- **Jurisdiction:** United States. Transfers are protected by Standard Contractual Clauses (SCCs).
- **Lawful basis:** Contract 6(1)(b).

---

## 6. International Data Transfers

Your personal data is primarily stored in the United Kingdom (AWS EU-West-2, London). However, certain third-party processors operate in the United States. We ensure that all international transfers of personal data are protected by appropriate safeguards as required by Chapter V of the UK GDPR:

| Processor | Jurisdiction | Transfer Mechanism |
|---|---|---|
| Stripe, Inc. | USA | UK-US Data Bridge / Data Privacy Framework |
| Shippo, Inc. | USA | Standard Contractual Clauses (SCCs) |
| Resend, Inc. | USA | Standard Contractual Clauses (SCCs) |
| Amazon Web Services | UK (London) | No transfer — data remains in UK |
| Expo / Software Mansion S.A. | USA / EU | Standard Contractual Clauses (SCCs) |
| Firebase / Google LLC | USA | UK-US Data Bridge / Data Privacy Framework |
| Anthropic PBC | USA | Standard Contractual Clauses (SCCs) |

You may request a copy of the relevant transfer safeguards by contacting us at info@mulligans.uk.com.

---

## 7. Data Retention

We retain your personal data only for as long as necessary to fulfil the purposes for which it was collected, or as required by law. The specific retention periods are:

| Data Category | Retention Period | Reason |
|---|---|---|
| Account data | Duration of active account + 6 years after closure | UK tax and accounting obligations |
| Transaction and order data | 6 years from transaction date | UK tax requirement, Companies Act 2006 |
| Identity verification (Stripe Connect KYC) | Retained per Stripe's own retention policy + 5 years | Anti-fraud obligations |
| Messages between users | Duration of active account (deleted upon account deletion) | Subject to legal retention requirements where applicable |
| Marketing preferences | Until consent is withdrawn or 3 years of inactivity | Consent management |
| Crash reports (Crashlytics) | 90 days | Debugging and stability monitoring |
| Push notification tokens | Until revoked by the user or account deleted | Notification delivery |
| Server logs | 90 days | Security and debugging |
| Email suppression records | Indefinite | To prevent re-sending to bounced or invalid addresses |
| Dispute and return data | 6 years from resolution date | Legal claims limitation window |
| Reviews | Duration of reviewed user's active account + 2 years | Marketplace trust and transparency |
| Support tickets | 3 years from resolution date | Service quality and legal compliance |

When data reaches the end of its retention period, it is securely deleted or anonymised.

---

## 8. Your Rights

Under the UK GDPR, you have the following rights in relation to your personal data:

### 8.1 Right of Access (Article 15)

You have the right to obtain confirmation as to whether we process your personal data and, if so, to request a copy of that data together with supplementary information about how it is processed.

### 8.2 Right to Rectification (Article 16)

You have the right to have inaccurate personal data corrected and incomplete data completed. You can update most of your profile data directly within the Platform.

### 8.3 Right to Erasure (Article 17)

You have the right to request deletion of your personal data where it is no longer necessary for the purpose for which it was collected, where you withdraw consent, or where there is no overriding legitimate ground for processing. Certain data may be retained where we have a legal obligation to do so (e.g. transaction records for tax purposes).

### 8.4 Right to Restriction of Processing (Article 18)

You have the right to request that we restrict the processing of your personal data in certain circumstances, for example while we verify the accuracy of data you have contested.

### 8.5 Right to Data Portability (Article 20)

You have the right to receive the personal data you provided to us in a structured, commonly used and machine-readable format, and to transmit that data to another controller without hindrance.

### 8.6 Right to Object (Article 21)

You have the right to object to processing based on legitimate interest. We will cease processing unless we can demonstrate compelling legitimate grounds that override your interests, rights and freedoms.

### 8.7 Right to Withdraw Consent (Article 7(3))

Where processing is based on consent (e.g. push notifications, marketing emails), you have the right to withdraw consent at any time. Withdrawal does not affect the lawfulness of processing carried out before withdrawal. You can manage your notification and marketing preferences within the Platform settings.

### 8.8 Right to Lodge a Complaint

You have the right to lodge a complaint with the Information Commissioner's Office (ICO) if you believe your data protection rights have been infringed:

**Information Commissioner's Office**
Website: [https://ico.org.uk/make-a-complaint/](https://ico.org.uk/make-a-complaint/)
Telephone: 0303 123 1113

### Exercising Your Rights

To exercise any of these rights, please contact us at info@mulligans.uk.com. We will respond to your request within one month. In complex cases or where we receive a large number of requests, this period may be extended by a further two months, in which case we will inform you within the initial one-month period.

We may need to verify your identity before processing your request. There is no fee for exercising your rights, except where requests are manifestly unfounded or excessive, in which case we may charge a reasonable fee or refuse the request.

---

## 9. Automated Decision-Making

The Platform includes Chip AI Caddy, an AI-powered golf equipment assistant provided by Anthropic PBC. Chip AI Caddy processes your fitting profile, bag contents and preferences to generate personalised equipment recommendations.

These recommendations are **assistive only** — they are suggestions to help you make informed purchasing decisions. They do not constitute solely automated decision-making that produces legal effects or similarly significant effects concerning you within the meaning of Article 22 of the UK GDPR.

### Automated Decision-Making — Repeated Cancellations

When a Seller cancels their second order on the Platform, the system automatically applies a one-star (1★) review to that Seller's profile. This is an automated process. While this action does not have legal effects in the sense of Article 22 of the UK GDPR, it may affect the Seller's standing and visibility on the Platform.

Sellers have the right to:
- Be informed that this automation exists (provided in this Privacy Policy and the Terms of Service)
- Appeal the automatic review by contacting info@mulligans.uk.com
- Request human review of the cancellation circumstances

Mulligans will review appeals within 14 days and may remove the automatic review if the cancellation was unavoidable.

All other purchase, sale and dispute resolution decisions on the Platform involve human oversight.

---

## 10. Cookies and Similar Technologies

### Web Application

The Mulligans web application uses **essential cookies only** (Next.js session cookies) that are strictly necessary for the Platform to function. These cookies do not require consent under the Privacy and Electronic Communications Regulations 2003 (PECR) as they are essential for the service you have requested.

We do not use analytics cookies, advertising cookies or tracking cookies on any public-facing or legal pages.

### Mobile Application

The Mulligans mobile application does not use browser cookies. Device identifiers (push notification tokens) are collected with your consent as described in section 3.8.

### Admin Panel

The admin panel uses session cookies for administrator authentication. These are essential cookies and do not require consent.

---

## 11. Data Security

We take the security of your personal data seriously and implement appropriate technical and organisational measures to protect it, including:

- **Encryption in transit:** All data transmitted between your device and our servers is encrypted using Transport Layer Security (TLS).
- **Encryption at rest:** All data stored in our AWS infrastructure (RDS PostgreSQL, S3) is encrypted at rest using AWS-managed encryption keys.
- **Password security:** Passwords are hashed and managed by AWS Cognito. We never store, access or transmit plaintext passwords.
- **Payment security:** All payment card data is handled directly by Stripe, which is certified to PCI DSS Level 1. Card details never touch our servers.
- **Access controls:** Access to personal data is restricted to authorised personnel on a need-to-know basis. Administrative access is protected by authentication and role-based permissions.
- **Infrastructure security:** Our application infrastructure is hosted on Amazon Web Services in the UK (EU-West-2, London), benefiting from AWS's comprehensive security programme.

While we implement robust security measures, no method of transmission over the internet or electronic storage is completely secure. We cannot guarantee absolute security but are committed to protecting your data to the highest practicable standard.

---

## 12. Data Breach Procedures

In the event of a personal data breach, we will:

1. **Assess the breach** promptly to determine the nature, scope and likely consequences.
2. **Notify the ICO** without undue delay and, where feasible, within 72 hours of becoming aware of the breach, as required by Article 33 of the UK GDPR, unless the breach is unlikely to result in a risk to your rights and freedoms.
3. **Notify affected individuals** without undue delay where the breach is likely to result in a high risk to your rights and freedoms, as required by Article 34 of the UK GDPR.
4. **Document the breach** including its facts, effects and remedial actions taken, in our internal breach register.

---

## 13. Children's Data

The Platform is intended for users aged 18 and over. We do not knowingly collect personal data from anyone under the age of 18. If we become aware that we have collected personal data from a person under 18, we will take steps to delete that data promptly.

If you believe that a person under 18 has provided us with personal data, please contact us at info@mulligans.uk.com.

---

## 14. Changes to This Policy

We may update this Privacy Policy from time to time to reflect changes in our practices, legal requirements or for other operational reasons.

Where we make material changes, we will:

- Notify you via email (to the address associated with your account) and/or via an in-app notification.
- Provide at least **30 days' notice** before the changes take effect.
- Update the "Effective date" at the top of this policy.

We encourage you to review this policy periodically. Your continued use of the Platform after the effective date of any changes constitutes acceptance of the updated policy.

---

## 15. Contact Us

If you have any questions about this Privacy Policy, wish to exercise your data protection rights, or have concerns about how we handle your personal data, please contact us:

**Mulligans Golf Limited**
Flat 1 Sunrise House, 79J Riddlesdown Road, Purley, England, CR8 1DH
Email: info@mulligans.uk.com
ICO Registration: ZC061655

---

*This Privacy Policy was last updated on 21 May 2026.*
