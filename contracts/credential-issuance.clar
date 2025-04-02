;; Credential Issuance Contract
;; This contract issues verifiable government attestations

(define-data-var admin principal tx-sender)

;; Define credential types
(define-constant CREDENTIAL_TYPE_ID u1)
(define-constant CREDENTIAL_TYPE_DRIVER_LICENSE u2)
(define-constant CREDENTIAL_TYPE_PASSPORT u3)
(define-constant CREDENTIAL_TYPE_TAX_ID u4)

;; Data structure for credentials
(define-map credentials
  {
    citizen-id: (string-ascii 20),
    credential-type: uint
  }
  {
    issued: bool,
    issue-date: uint,
    expiry-date: uint,
    issuer: principal
  }
)

;; Issue a credential to a citizen
(define-public (issue-credential
    (citizen-id (string-ascii 20))
    (credential-type uint)
    (expiry-date uint))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err u100))
    (ok (map-set credentials
      {
        citizen-id: citizen-id,
        credential-type: credential-type
      }
      {
        issued: true,
        issue-date: block-height,
        expiry-date: expiry-date,
        issuer: tx-sender
      }
    ))
  )
)

;; Check if a credential is valid
(define-read-only (is-credential-valid
    (citizen-id (string-ascii 20))
    (credential-type uint))
  (let ((credential (map-get? credentials
          {
            citizen-id: citizen-id,
            credential-type: credential-type
          })))
    (if (is-some credential)
      (let ((cred (unwrap-panic credential)))
        (and
          (get issued cred)
          (<= block-height (get expiry-date cred))
        )
      )
      false
    )
  )
)

;; Revoke a credential
(define-public (revoke-credential
    (citizen-id (string-ascii 20))
    (credential-type uint))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err u100))
    (ok (map-set credentials
      {
        citizen-id: citizen-id,
        credential-type: credential-type
      }
      {
        issued: false,
        issue-date: (get issue-date (default-to
                      { issued: false, issue-date: u0, expiry-date: u0, issuer: tx-sender }
                      (map-get? credentials { citizen-id: citizen-id, credential-type: credential-type }))),
        expiry-date: block-height,
        issuer: tx-sender
      }
    ))
  )
)
