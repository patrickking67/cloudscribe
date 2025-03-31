# CloudScribe

![CloudScribe Logo](docs/logo.svg)

## Overview

CloudScribe is a statically typed scripting language designed for IT professionals and system administrators. Inspired by Python's simplicity and PowerShell's utility, CloudScribe enables users to automate infrastructure operations with clean, readable syntax and compile-time safety.

The language supports a task-based scripting paradigm with powerful control structures, strong type checking, and first-class functions. With rich support for expressions and semantic-level validation, CloudScribe is ideal for writing scripts that are both reliable and maintainable.

CloudScribe was built out of the desire to streamline real-world IT workflows without sacrificing expressiveness or safety.

---

## Website Link
(View CloudScribe Language Website Here!)[[https://example.com](https://patrickking67.github.io/cloudscribe/)]

---

## Features

- Task-first design with `task` blocks for defining automation workflows
- Static type system with support for `int`, `string`, `boolean`, arrays, optionals, and functions
- Full control flow including `if`, `else`, `while`, `for in`, `break`, and `return`
- Rich expression language: arithmetic, boolean logic, power, ternary, null-coalescence, subscripting, and member access
- Scoped variable declarations with `let` and `const`
- Function definitions with typed parameters and return types
- Robust static analyzer with contextual error detection
— Detects undeclared variables, type mismatches, invalid control flow (e.g., `break` outside loops), and incorrect function usage at compile time

---

## Example Programs

### Data Backup

```csc
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
```

### Generate Report

```csc
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
```

### **Install Software**

```csc
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
```

### **Network Monitoring**

```csc
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
```

### **Restart System**

```csc
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
```

### Security Scan

```csc
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
```

### Update System
```csc
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
```

---

## Installation & Usage

### **1. Clone the Repository**

```sh
git clone https://github.com/patrickking67/cloudscribe.git
```

### **2. Install Dependencies**

```sh
npm install
```

### **3. Test CloudScribe**

```sh
npm test
```

## Class Information

- **University:** Loyola Marymount University
- **Course:** CMSI 3802 – Languages & Automata II
- **Semester:** Spring 2025
- **Instructor:** Professor Ray Toal
- **Development Team:** Patrick King and Thomas Powell
