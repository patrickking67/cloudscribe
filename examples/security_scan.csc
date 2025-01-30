// Start security scan
print "Starting security scan...";

// Define ports as a list of numbers
ports = [80,443,8080];

// Scan each port
for port in ports {
    print "Scanning port: " + port;
    scan(port);
}

// Scan completed
print "Security scan completed!";
