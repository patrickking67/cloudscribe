function scanPort(port: int): boolean {
  return true;
}

task securityScan {
  let ports = [80, 443, 22];
  let threats = 0;

  print("Starting security scan");

  for port in ports {
    if scanPort(port) {
      print("Port " + port + " is secure");
    } else {
      threats++;
    }
  }
}