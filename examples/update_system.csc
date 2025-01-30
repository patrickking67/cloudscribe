// Start system update
print "Beginning system update...";

// We can do a conditional check (example only)
if 2 == 3 {
    print "Condition was true (unexpected)!";
} else {
    print "Condition was false, continuing updates...";
}

// Update in range
for step in range(1,2) {
    print "Performing update step: " + step;
    update(step);
}

// All done
print "System update completed!";
