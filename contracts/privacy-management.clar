;; Privacy Management Contract
;; This contract controls what information is shared with agencies

(define-data-var admin principal tx-sender)

;; Define data fields that can be controlled
(define-constant DATA_FIELD_NAME u1)
(define-constant DATA_FIELD_ADDRESS u2)
(define-constant DATA_FIELD_DOB u3)
(define-constant DATA_FIELD_INCOME u4)
(define-constant DATA_FIELD_HEALTH u5)

;; Define agencies
(define-constant AGENCY_TAX u1)
(define-constant AGENCY_HEALTHCARE u2)
(define-constant AGENCY_VOTING u3)
(define-constant AGENCY_PROPERTY u4)

;; Data structure for privacy settings
(define-map privacy-settings
  {
    citizen-id: (string-ascii 20),
    data-field: uint,
    agency: uint
  }
  {
    is-shared: bool,
    last-updated: uint
  }
)

;; Allow a citizen to update their privacy settings
(define-public (set-privacy-setting
    (citizen-id (string-ascii 20))
    (data-field uint)
    (agency uint)
    (is-shared bool))
  (begin
    ;; Only the citizen or admin can update privacy settings
    (asserts! (or
                (is-eq tx-sender (var-get admin))
                (is-authorized-citizen tx-sender citizen-id)
              )
              (err u100))
    (ok (map-set privacy-settings
      {
        citizen-id: citizen-id,
        data-field: data-field,
        agency: agency
      }
      {
        is-shared: is-shared,
        last-updated: block-height
      }
    ))
  )
)

;; Check if data field is shared with an agency
(define-read-only (is-data-shared
    (citizen-id (string-ascii 20))
    (data-field uint)
    (agency uint))
  (default-to
    false
    (get is-shared (map-get? privacy-settings
      {
        citizen-id: citizen-id,
        data-field: data-field,
        agency: agency
      }
    ))
  )
)

;; Function to check if a principal is authorized for a citizen
;; In a real implementation, this would connect to the verification contract
(define-read-only (is-authorized-citizen (caller principal) (citizen-id (string-ascii 20)))
  ;; Simplified implementation - in production this would validate the relationship
  ;; between the principal and the citizen ID
  true
)

;; Utility function to get all privacy settings for a citizen
(define-read-only (get-citizen-privacy-summary (citizen-id (string-ascii 20)))
  ;; This is a simplified implementation
  ;; In a real contract, you might need multiple functions to retrieve different aspects
  {
    has-privacy-settings: (is-data-shared citizen-id DATA_FIELD_NAME AGENCY_TAX)
  }
)
