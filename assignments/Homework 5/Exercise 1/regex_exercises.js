const regexes = {
    canadianPostalCode:
      /^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTVXY] \d[ABCEGHJ-NPRSTVXY]\d$/,

    visa: /^4\d{12}(\d{3})?$/,
  
    masterCard: /^(?:5[1-5]\d{14}|(?:222[1-9]|22[3-9]\d|2[3-6]\d{2}|27[01]\d|2720)\d{12})$/,

    notThreeEndingInOO: /^(?!^[A-Za-z][oO]{2}$)[A-Za-z]*$/,

    divisibleBy16: /^(?:0+|[01]+0000)$/,

    eightThroughThirtyTwo: /^(?:8|9|[12]\d|3[0-2])$/,

    notPythonPycharmPyc: /^(?!(?:python|pycharm|pyc)$)\p{L}*$/u,
  
    restrictedFloats: /^\d+(?:\.\d*)?[eE][+\-]?\d{1,3}$/,
  
    palindromes2358:
      /^(?:([abc])\1|([abc])[abc]\2|([abc])([abc])[abc]\4\3|([abc])([abc])([abc])([abc])\8\7\6\5)$/,
  
    pythonStringLiterals:
      /^(?:[rRuUfF]|[rR][fF]|[fF][rR]|[uU][rR]|[rR][uU])?(?:'''(?:[^\\']|\\[\s\S]|'(?!''))*?'''|"""(?:[^\\"]|\\[\s\S]|"(?!""))*?"""|'(?:[^\\'\n]|\\[\s\S])*?'|"(?:[^\\"\n]|\\[\s\S])*?")$/u,
  };
  
  // Helper
  export function matches(name, string) {
    return regexes[name].test(string);
  }