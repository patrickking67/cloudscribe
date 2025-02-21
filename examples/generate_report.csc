task generateReport {
  let output = "System Status Report";
  
  function formatHeader(text: string): string {
    return "--" + text + "--";
  }
  
  print(formatHeader(output));
  print("Memory: 85%");
  print("CPU: 45%");
  print("Disk: 60%");
}