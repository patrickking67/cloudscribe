f:                             ; int f(int n)   (n in RDI)
        mov     ecx, edi       ; ECX = n
        sar     ecx, 1         ; ECX = n/2  (arithmetic >>)

        test    dil, 1         ; set ZF=1 if n even

        lea     eax, [rdi+rdi*2+1] ; EAX = 3*n + 1  (odd case)

        cmove   eax, ecx       ; if even (ZF==1) -> EAX = n/2

        ret                    ; return in EAX
