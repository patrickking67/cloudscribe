function backupFile(filename: string): boolean {
  print("Backing up: " + filename);
  return true;
}

task backupData {
  let files = ["config.json", "users.db", "logs.txt"];
  let failedCount = 0;
  
  print("Starting backup process");
  
  for file in files {
    if backupFile(file) {
      print("Successfully backed up " + file);
    } else {
      print("Failed to backup " + file);
      failedCount++;
    }
  }
  
  if failedCount > 0 {
    print("Backup completed with " + failedCount + " failures");
  } else {
    print("Backup completed successfully");
  }
}