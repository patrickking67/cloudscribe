task restartSystem {
  let services = ["web", "database", "cache"];
  let success = true;

  print("Starting system restart");
  
  for service in services {
    if success {
      print("Restarting: " + service);
    } else {
      break;
    }
  }
}