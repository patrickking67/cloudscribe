# CloudScribe

![CloudScribe Logo](docs/logo.svg)

## Overview

CloudScribe is a lightweight, IT-focused scripting language inspired by Python and PowerShell. Designed for IT professionals and system administrators, it simplifies common automation tasks like software installation, system updates, and security scans. 

I work in IT and wanted to create a language that blends the simplicity of Python with the power of PowerShell. CloudScribe is designed to be readable, efficient, and accessible to everyone, from beginners to advanced users.

## Features

- **Simple and Readable Syntax** – Easy-to-understand scripting style, combining Python and PowerShell principles.
- **IT Automation** – Automate tasks like software installation, system updates, and security scans.
- **Built-in Commands** – Perform operations like `install()`, `scan()`, and `restart()`.
- **Flow Control** – Supports loops (`for`) and conditional statements (`if`, `else`).
- **String & Number Operations** – Handle variables, arithmetic, and concatenation effortlessly.
- **List Handling** – Define and iterate over lists with built-in syntax.
- **Cross-Platform** – Works on Windows, macOS, and Linux.

## Example Programs

### **Generating a System Report**

```csc
print "Generating system report...";

for section in range(1,5) {
    print "Processing report section: " + section;
}

print "Report generation complete!";
```

### **Installing Software**

```csc
print "Starting software installation...";

packages = ["app1","app2","app3"];

for pkg in packages {
    install(pkg);
}

print "All software installed successfully!";
```

### **Restarting System**

```csc
print "Attempting system restart...";

restart("immediate");

print "System restart requested.";
```

### **Security Scanning**

```csc
print "Starting security scan...";

ports = [80,443,8080];

for port in ports {
    print "Scanning port: " + port;
    scan(port);
}

print "Security scan completed!";
```

### **Updating System**

```csc
print "Beginning system update...";

if 2 == 3 {
    print "Condition was true (unexpected)!";
} else {
    print "Condition was false, continuing updates...";
}

for step in range(1,2) {
    print "Performing update step: " + step;
    update(step);
}

print "System update completed!";
```



## Installation & Usage

### **1. Clone the Repository**

```sh
git clone https://github.com/patrickking/cloudscribe.git
cd cloudscribe
```

### **2. Install Dependencies**

Ensure you have Python and Node.js installed, then run:

```sh
pip install -r requirements.txt
npm install
```

### **3. Run a CloudScribe Program**

To execute a `.csc` script:

```sh
node src/cloudscribe.js examples/generate_report.csc
```
```sh
node src/cloudscribe.js examples/install_software.csc
```
```sh
node src/cloudscribe.js examples/restart_system.csc
```
```sh
node src/cloudscribe.js examples/security_scan.csc
```
```sh
node src/cloudscribe.js examples/update_system.csc
```

## Class Information

- **University:** Loyola Marymount University
- **Course:** CMSI 3802 – Languages & Automata II
- **Semester:** Spring 2025
- **Instructor:** Professor Ray Toal
- **Student and Creator:** Patrick King