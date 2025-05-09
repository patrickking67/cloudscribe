;; n  ->  (n/2)  if even     |   3*n + 1  if odd
;; param 0 = n   -> result i32
f:
    local.get 0        ;; push n                    (odd result value)
    i32.const 3
    i32.mul            ;; 3*n
    i32.const 1
    i32.add            ;; 3*n + 1

    local.get 0        ;; push n                    (even result value)
    i32.const 1
    i32.shr_s          ;; arithmetic shift: n >> 1  = n/2

    local.get 0        ;; push n                    (condition)
    i32.const 1
    i32.and            ;; (n & 1)  ->  1 = odd, 0 = even

    i32.select         ;; choose odd‑value if cond==1, else even‑value
    end_function       ;; return top‑of‑stack
