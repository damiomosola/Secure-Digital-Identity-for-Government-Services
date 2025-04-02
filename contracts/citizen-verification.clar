;; Citizen Verification Contract
;; This contract validates citizen identity through official channels

(define-data-var admin principal tx-sender)

;; Data structure for citizen verification status
(define-map citizens
  { citizen-id: (string-ascii 20) }
  {
    verified: bool,
    verification-date: uint,
    verification-authority: principal
  }
)

;; Only admin can verify citizens
(define-public (verify-citizen (citizen-id (string-ascii 20)))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err u100))
    (ok (map-set citizens
      { citizen-id: citizen-id }
      {
        verified: true,
        verification-date: block-height,
        verification-authority: tx-sender
      }
    ))
  )
)

;; Check if a citizen is verified
(define-read-only (is-verified (citizen-id (string-ascii 20)))
  (default-to
    false
    (get verified (map-get? citizens { citizen-id: citizen-id }))
  )
)

;; Transfer admin rights
(define-public (transfer-admin (new-admin principal))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err u101))
    (ok (var-set admin new-admin))
  )
)
