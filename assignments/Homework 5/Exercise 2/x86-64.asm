        .globl  f
f:                                      ; int f(int n)
                                        ; System‑V AMD64:  n arrives in RDI
        test    dil, 1                  ; ZF=1  ⇔  even (n & 1 == 0)
        jne     .Lodd                   ; jump to odd branch if bit 0 is 1

        ; -------- even branch: result = n / 2 ------------------------------
        mov     eax, edi                ; EAX = n
        shr     eax, 31                 ; 0 or 1  ← signBit(n)
        add     eax, edi                ; n + signBit
        sar     eax, 1                  ; arithmetic >>1  ⇒  truncate‑toward‑0
        ret

.Lodd:  ; -------- odd branch: result = 3*n + 1 -----------------------------
        lea     eax, [rdi + rdi*2 + 1]  ; EAX = 3*n + 1   (LEA = free MADD)
        ret
