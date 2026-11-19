# Security Performance Metrics & Key Risk Indicators (KRIs)

## 1. Executive Security Metrics Dashboard

Rental Peshawar tracks quantitative security indicators to measure operational resilience, threat detection velocity, and compliance adherence.

---

## 2. Core Security Key Performance Indicators (KPIs)

| Metric                                 | Target Objective                  | Measurement Frequency | Reporting Audience     |
| :------------------------------------- | :-------------------------------- | :-------------------- | :--------------------- |
| **Mean Time to Detect (MTTD)**         | $\le 15\text{ minutes}$           | Monthly               | Security Lead / CTO    |
| **Mean Time to Respond (MTTR)**        | $\le 30\text{ minutes}$           | Monthly               | Security Lead / CTO    |
| **Mean Time to Recover (MTTRc)**       | $\le 2\text{ hours}$              | Monthly               | Board / Executive Team |
| **Open Critical Vulnerabilities**      | **0**                             | Continuous            | Engineering Leads      |
| **Patch SLA Compliance Rate**          | $\ge 98\%$                        | Monthly               | CISO                   |
| **MFA Coverage for Admins**            | **100%** (Non-negotiable)         | Continuous            | CISO                   |
| **Daily Backup Success Rate**          | $\ge 99.9\%$                      | Daily                 | DevOps Lead            |
| **Monthly Restore-Test Success**       | **100%**                          | Monthly               | Infrastructure On-Call |
| **Security Alert False-Positive Rate** | $\le 10\%$                        | Monthly               | SecOps Team            |
| **Fraud Report Resolution Time**       | $\le 4\text{ hours}$              | Weekly                | Trust & Safety Lead    |
| **Privilege Escalation Blocks**        | Continuous tracking (0 tolerance) | Real-Time Alert       | Security Lead          |
| **Refresh Token Reuse Detections**     | Real-Time alert + auto-revocation | Real-Time Alert       | Security Lead          |
| **Account Takeover Attempts Blocked**  | Velocity threshold tracking       | Weekly                | Trust & Safety Lead    |

---

## 3. Metric Calculation Methodologies

1. **MTTD (Mean Time to Detect)**:
   $$\text{MTTD} = \frac{\sum (\text{Detection Timestamp} - \text{Adversary Intrusion Timestamp})}{\text{Total Incident Count}}$$
2. **Patch SLA Compliance**:
   $$\text{SLA Compliance \%} = \frac{\text{Vulnerabilities Remediated Within SLA Target}}{\text{Total Known Vulnerabilities}} \times 100$$
3. **MFA Enforcement Percentage**:
   $$\text{MFA Coverage} = \frac{\text{Admin Accounts with Active TOTP Verified}}{\text{Total Admin Accounts in System}} \times 100$$
