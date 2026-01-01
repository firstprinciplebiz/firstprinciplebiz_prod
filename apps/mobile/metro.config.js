const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Watch all files in the monorepo
config.watchFolders = [monorepoRoot];

// Let Metro know where to resolve packages - order matters
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];

// Extra node_modules for symlinked packages
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  "shared": path.resolve(monorepoRoot, "packages/shared"),
  "core": path.resolve(monorepoRoot, "packages/core"),
};

module.exports = withNativeWind(config, { input: "./global.css" });
