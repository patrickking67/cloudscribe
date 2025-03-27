task monitorNetwork {
  let servers = ["web-01", "db-01", "cache-01"];
  let pingResults = [true, true, false];
  let downServers = 0;
  
  print("Network Monitoring Report");
  
  for server in servers {
    let index = 0;
    if pingResults[index] {
      print("Server " + server + " is online");
    } else {
      print("Server " + server + " is OFFLINE!");
      downServers++;
    }
    index++;
  }
  
  print("Total servers down: " + downServers);
}