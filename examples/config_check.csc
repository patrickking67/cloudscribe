// Reads settings from the environment and checks a config file before use.
const configPath = env("CONFIG_PATH") ?? "config.json";
const retries = toInt(env("RETRIES") ?? "3") ?? 3;

task checkConfig {
  print("Config: " + configPath);
  print("Retries: " + retries);
  if !fileExists(configPath) {
    print("Missing config, nothing to check");
    return;
  }
  let text = readFile(configPath);
  print("Config size: " + text.length + " characters");
}
