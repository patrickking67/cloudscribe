// Shows what the optimizer does before any JavaScript is written.
// Compare the typed AST with the optimized AST in the playground.
const TIMEOUT = 5 * 60;

task patchHosts {
  let hosts = ["web-01", "db-01"];
  for host in hosts {
    print("${host}: timeout ${TIMEOUT}s, attempt ${1} of ${1 + 2}");
  }
  if 2 ** 10 < 1000 {
    print("unreachable");
  }
}
