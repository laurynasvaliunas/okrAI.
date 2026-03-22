const { withPodfile, withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

function withSwiftConcurrencyFix(config) {
  return withPodfile(config, (podfileConfig) => {
    const contents = podfileConfig.modResults.contents;

    const injection = `

    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |bc|
        if bc.build_settings['SWIFT_VERSION'] == '6.0'
          bc.build_settings['SWIFT_VERSION'] = '5.0'
        end
      end
    end
`;

    podfileConfig.modResults.contents = contents.replace(
      /(react_native_post_install\([\s\S]*?\)\n)/m,
      "$1" + injection
    );

    return podfileConfig;
  });
}

function withBundleScriptFix(config) {
  return withDangerousMod(config, [
    "ios",
    (config) => {
      const pbxprojPath = path.join(
        config.modRequest.platformProjectRoot,
        "okraipersonal.xcodeproj",
        "project.pbxproj"
      );
      let contents = fs.readFileSync(pbxprojPath, "utf-8");

      const oldStr =
        '`\\"$NODE_BINARY\\" --print \\"require(\'path\').dirname(require.resolve(\'react-native/package.json\')) + \'/scripts/react-native-xcode.sh\'\\"`';
      const newStr =
        '. \\"$(\\"$NODE_BINARY\\" --print \\"require(\'path\').dirname(require.resolve(\'react-native/package.json\')) + \'/scripts/react-native-xcode.sh\'\\")\\"';

      contents = contents.split(oldStr).join(newStr);

      fs.writeFileSync(pbxprojPath, contents);
      return config;
    },
  ]);
}

module.exports = function fixSwiftConcurrency(config) {
  config = withSwiftConcurrencyFix(config);
  config = withBundleScriptFix(config);
  return config;
};
