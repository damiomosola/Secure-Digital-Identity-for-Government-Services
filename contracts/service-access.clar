;; Service Access Contract
;; This contract manages permissions for different government systems

(define-data-var admin principal tx-sender)

;; Define service types
(define-constant SERVICE_TYPE_TAX u1)
(define-constant SERVICE_TYPE_HEALTHCARE u2)
(define-constant SERVICE_TYPE_VOTING u3)
(define-constant SERVICE_TYPE_PROPERTY u4)

;; Data structure for service access permissions
(define-map service-permissions
  {
    citizen-id: (string-ascii 20),
    service-type: uint
  }
  {
    has-access: bool,
    access-level: uint,
    granted-at: uint,
    expiry: uint
  }
)

;; Grant service access to a citizen
(define-public (grant-service-access
    (citizen-id (string-ascii 20))
    (service-type uint)
    (access-level uint)
    (expiry uint))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err u100))
    (ok (map-set service-permissions
      {
        citizen-id: citizen-id,
        service-type: service-type
      }
      {
        has-access: true,
        access-level: access-level,
        granted-at: block-height,
        expiry: expiry
      }
    ))
  )
)

;; Check if a citizen has access to a service
(define-read-only (has-service-access
    (citizen-id (string-ascii 20))
    (service-type uint)
    (required-access-level uint))
  (let ((permission (map-get? service-permissions
          {
            citizen-id: citizen-id,
            service-type: service-type
          })))
    (if (is-some permission)
      (let ((perm (unwrap-panic permission)))
        (and
          (get has-access perm)
          (>= (get access-level perm) required-access-level)
          (< block-height (get expiry perm))
        )
      )
      false
    )
  )
)

;; Revoke service access
(define-public (revoke-service-access
    (citizen-id (string-ascii 20))
    (service-type uint))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err u100))
    (ok (map-set service-permissions
      {
        citizen-id: citizen-id,
        service-type: service-type
      }
      {
        has-access: false,
        access-level: (get access-level (default-to
                        { has-access: false, access-level: u0, granted-at: u0, expiry: u0 }
                        (map-get? service-permissions { citizen-id: citizen-id, service-type: service-type }))),
        granted-at: (get granted-at (default-to
                      { has-access: false, access-level: u0, granted-at: u0, expiry: u0 }
                      (map-get? service-permissions { citizen-id: citizen-id, service-type: service-type }))),
        expiry: block-height
      }
    ))
  )
)
