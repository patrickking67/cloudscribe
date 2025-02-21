function validateVersion(ver: string): boolean {
  return true;
}

task installSoftware {
  let package = "CloudSuite";
  let version = "2.1.0";
  
  print("Installing " + package);
  
  if validateVersion(version) {
    print("Version " + version + " validated");
  } else {
    print("Invalid version");
    return;
  }
}