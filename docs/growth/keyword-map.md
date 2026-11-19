# Peshawar Rental Keyword Architecture & Target URL Map

## 1. Keyword Taxonomy by Search Intent

| Intent Tier       | Search Query (English & Roman Urdu)             | Target Audience               | Target Canonical URL                                        |
| :---------------- | :---------------------------------------------- | :---------------------------- | :---------------------------------------------------------- |
| **Transactional** | "house for rent in hayatabad peshawar"          | Families                      | `/rentals/peshawar/hayatabad/families`                      |
| **Transactional** | "student hostel in university town peshawar"    | Students                      | `/rentals/peshawar/university-town/students`                |
| **Transactional** | "1 bed apartment for rent peshawar"             | Young professionals / Couples | `/rentals/peshawar/hayatabad/apartments`                    |
| **Commercial**    | "flat for rent in peshawar"                     | General renters               | `/properties`                                               |
| **Commercial**    | "best hostels near uop peshawar"                | University Students           | `/guides/student-accommodation-near-university-of-peshawar` |
| **Informational** | "how much is security deposit in peshawar"      | New renters                   | `/guides/how-much-is-security-deposit-in-peshawar`          |
| **Informational** | "avoid rental scams peshawar cnic verification" | Tenants & Landlords           | `/guides/how-to-avoid-rental-scams-in-peshawar`             |
| **Locality**      | "university town peshawar rent rates"           | Students & Doctors            | `/areas/university-town`                                    |
| **Locality**      | "hayatabad phase 5 house rent"                  | Families                      | `/areas/hayatabad`                                          |

---

## 2. Locality-Specific Keyword Clusters

### A. University Town & Campus Corridor

- _Keywords_: "rooms for rent university town peshawar", "hostels near university of peshawar", "uet peshawar student rooms", "kmc hostel rent university town".
- _Target URL_: `/rentals/peshawar/university-town` & `/rentals/peshawar/university-town/students`
- _Metadata Formula_: `Student Rooms & Hostels in University Town, Peshawar | Rental Peshawar`

### B. Hayatabad (Phases 1–7)

- _Keywords_: "houses for rent in hayatabad peshawar", "upper portion hayatabad phase 4", "family apartment hayatabad phase 2", "luxury bungalow rent hayatabad".
- _Target URL_: `/rentals/peshawar/hayatabad` & `/rentals/peshawar/hayatabad/families`
- _Metadata Formula_: `Houses & Apartments for Families in Hayatabad, Peshawar | Rental Peshawar`

### C. Warsak Road & Northern Corridor

- _Keywords_: "warsak road peshawar houses for rent", "portion for rent warsak road", "family homes near army public school peshawar".
- _Target URL_: `/rentals/peshawar/warsak-road`
- _Metadata Formula_: `Properties for Rent in Warsak Road, Peshawar | Rental Peshawar`

### D. Saddar & Cantt Area

- _Keywords_: "commercial flat for rent saddar peshawar", "apartments near mall road peshawar", "saddar peshawar rental listings".
- _Target URL_: `/rentals/peshawar/saddar`
- _Metadata Formula_: `Flats & Apartments for Rent in Saddar, Peshawar | Rental Peshawar`

---

## 3. Title Tag & Meta Description Generation Rules

```typescript
// Property Title Formula
`${bedrooms > 0 ? `${bedrooms} Bed ` : ''}${propertyTypeFormatted} for ${eligibilityFormatted} in ${localityName}, Peshawar | PKR ${priceFormatted}/month`
// Locality Title Formula
`Rooms, Apartments & Houses for Rent in ${localityName}, Peshawar | Rental Peshawar`
// Student Category Title Formula
`Student Rooms & Hostels in ${localityName}, Peshawar | Rental Peshawar`
// Family Category Title Formula
`Houses & Apartments for Families in ${localityName}, Peshawar | Rental Peshawar`;
```
