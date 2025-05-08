(module
  (func $f (param $n i32) (result i32)
    ;; if (n & 1) == 0 → even branch, else odd branch
    local.get $n
    i32.const 1
    i32.and
    i32.eqz
    if (result i32)          ;; ---------- even ----------
      ;; (n + (n>>31)) >> 1   == n / 2  (truncate toward 0)
      local.get $n
      i32.const 31
      i32.shr_s              ;; sign bit → 0 / 1
      i32.add
      i32.const 1
      i32.shr_s
    else                     ;; ---------- odd -----------
      local.get $n
      i32.const 3
      i32.mul
      i32.const 1
      i32.add
    end)
  (export "f" (func $f)))