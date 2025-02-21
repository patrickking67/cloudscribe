# CloudScribe

![CloudScribe Logo](docs/logo.svg)

## Overview

CloudScribe is a lightweight, IT-focused scripting language inspired by Python and PowerShell. Designed for IT professionals and system administrators, it simplifies common automation tasks like software installation, system updates, and security scans. 

I work in IT and wanted to create a language that blends the simplicity of Python with the power of PowerShell. CloudScribe is designed to be readable, efficient, and accessible to everyone, from beginners to advanced users.

## Features

- **Simple and Readable Syntax** – Easy-to-understand scripting style, combining Python and PowerShell principles.
- **IT Automation** – Automate tasks like software installation, system updates, and security scans.
- **Flow Control** – Supports loops (`for`, `while`) and conditional statements (`if`, `else`).
- **String & Number Operations** – Handle variables, arithmetic, and concatenation effortlessly.
- **List Handling** – Define and iterate over lists with built-in syntax.
- **Print Function** - Built-in print functionality for output and debugging.
- **Cross-Platform** – Works on Windows, macOS, and Linux.

## Example Programs

### **Generating a System Report**

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

### **Installing Software**

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

### **Restarting System**

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

### **Security Scanning**

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

### **Updating System**

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



## Installation & Usage

### **1. Clone the Repository**

```sh
git clone https://github.com/patrickking/cloudscribe.git
cd cloudscribe
```

### **2. Install Dependencies**

```sh
npm install
```

### **3. Test CloudScibre**

```sh
npm test
```

## Class Information

- **University:** Loyola Marymount University
- **Course:** CMSI 3802 – Languages & Automata II
- **Semester:** Spring 2025
- **Instructor:** Professor Ray Toal
- **Development Team:** Patrick King and Thomas Powell
