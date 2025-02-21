task updateSystem {
  let components = ["OS", "Drivers", "Apps"];
  let updateCount = 0;

  print("System Update Starting");
  
  for component in components {
    print("Updating: " + component);
    updateCount++;
  }
  
  print("Updated " + updateCount + " components");
}