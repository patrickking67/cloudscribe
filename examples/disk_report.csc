// Formats a disk usage report with string interpolation.
const LIMIT = 80;

function status(used: int): string {
  return used > LIMIT ? "WARN" : "ok";
}

task diskReport {
  let mounts = ["/", "/var", "/home"];
  let usage = [42, 91, 67];
  let index = 0;
  let warnings = 0;
  print("Disk report (limit ${LIMIT}%)");
  for mount in mounts {
    let used = usage[index];
    print("  ${mount}: ${used}% used [${status(used)}]");
    if used > LIMIT {
      warnings++;
    }
    index++;
  }
  print("${warnings} of ${mounts.length} mounts over the limit");
}
