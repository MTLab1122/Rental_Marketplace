# User Privacy Policy & Data Subject Rights

## 1. Information Collection & Legal Basis

Rental Peshawar collects only the minimum personal data required to deliver reliable, fraud-resistant rental matchmaking in Peshawar:

| Data Type                | Specific Information                                    | Purpose                                                  | Legal Basis / Consent               |
| :----------------------- | :------------------------------------------------------ | :------------------------------------------------------- | :---------------------------------- |
| **Identity Information** | Full Name, CNIC Number, CNIC Front/Back Photos, Selfie  | Landlord & Tenant identity verification, scam prevention | Explicit Consent & Legal Obligation |
| **Contact Information**  | Pakistani Mobile Phone Number (`+92...`), Email Address | Account authentication, inquiry notifications, OTP       | Contractual Necessity               |
| **Locality & Location**  | Peshawar locality, latitude/longitude coordinates       | Property search, municipal boundary verification         | Contractual Necessity               |
| **Financial Data**       | Transaction IDs, Escrow deposit receipts                | Security deposit escrow and rent booking payments        | Contractual Necessity & Tax Law     |

---

## 2. Third-Party Data Processors

| Third-Party Sub-Processor    | Function                | Data Disclosed                           | Location       |
| :--------------------------- | :---------------------- | :--------------------------------------- | :------------- |
| **AWS / MinIO**              | Secure Object Storage   | Encrypted images & documents             | Primary Region |
| **Firebase Cloud Messaging** | Mobile Push Alerts      | Ephemeral push token, notification title | Global / Cloud |
| **Google Maps / OSM**        | Geocoding & Map Display | Locality coordinates (No PII)            | Global / Cloud |
| **SendGrid / AWS SES**       | Transactional Email     | User email, transaction summary          | Global / Cloud |

---

## 3. Data Subject Rights & Fulfillment SLAs

Users can exercise their statutory privacy rights directly through the mobile app or web portal:

1. **Right of Access & Export**: Users can download a full JSON archive of their profile, inquiries, listings, and messages via `GET /api/v1/users/me/export` within **72 hours**.
2. **Right to Rectification**: Users can update inaccurate phone numbers, profile descriptions, and institution details via `PATCH /api/v1/users/me`.
3. **Right to Erasure (Deletion)**: Users can request complete account closure via `DELETE /api/v1/users/me`. Account data is purged or pseudonymized within **30 days** (except where retention is legally mandated).
4. **Consent Withdrawal**: Users can toggle off optional marketing and promotional push notifications at any time in user notification preferences.
