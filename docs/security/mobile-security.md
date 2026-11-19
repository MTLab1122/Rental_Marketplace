# Peshawar Rental Marketplace — Mobile Application Security Standards

Phase 16: Security Hardening & Client Protection (Flutter / Android / iOS)

This document establishes mobile application security standards implemented for the Flutter cross-platform client.

---

## 1. Cryptographic Storage & Token Management

- **Flutter Secure Storage:**
  - On Android: Utilizes Android KeyStore with EncryptedSharedPreferences (AES-256 GCM).
  - On iOS: Utilizes Keychain with `kSecAccessControlBiometryAny` access control policies.
- **Zero Plaintext Persistence:** Authentication JWTs, refresh tokens, and biometric session keys are NEVER stored in standard `SharedPreferences`, `NSUserDefaults`, or unencrypted SQLite databases.
- **Memory Hygiene:** Sensitive strings (passwords, PINs, OTP codes) are discarded from memory immediately after transmission.

---

## 2. Network Security & Transport Protection

- **TLS 1.3 Strict Enforcement:** Mobile client will refuse connections over plain HTTP or deprecated TLS 1.0/1.1 protocols.
- **Certificate Transparency & Pinning:** Validates server public key fingerprints against known Peshawar municipal API certificates to prevent corporate interception and proxy MITM attacks.
- **Zero Tokens in URL Query Strings:** Access tokens are strictly passed in the `Authorization: Bearer <token>` HTTP header.

---

## 3. Runtime Protection & Anti-Tampering

- **Root & Jailbreak Detection:** Detects modified binary signatures, Magisk su binaries, Substrate, and Cydia substrates to alert users of compromised device trust.
- **Screen Obfuscation:** Conceals mobile screen contents in the OS application switcher when switching tasks to prevent sensitive CNIC or financial leakages.
