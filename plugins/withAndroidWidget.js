const { withDangerousMod, withAndroidManifest, AndroidConfig } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Copies widget source files to the Android project.
 */
function withWidgetSourceFiles(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const platformRoot = config.modRequest.platformProjectRoot;

      const widgetSrcDir = path.join(projectRoot, 'widget-src', 'android');
      
      const targetJavaDir = path.join(platformRoot, 'app', 'src', 'main', 'java', 'com', 'chinmaykoshe', 'streakly', 'widget');
      const targetResDir = path.join(platformRoot, 'app', 'src', 'main', 'res');

      // Create target directories
      fs.mkdirSync(targetJavaDir, { recursive: true });
      fs.mkdirSync(path.join(targetResDir, 'layout'), { recursive: true });
      fs.mkdirSync(path.join(targetResDir, 'xml'), { recursive: true });
      fs.mkdirSync(path.join(targetResDir, 'drawable'), { recursive: true });

      // Copy Java files
      if (fs.existsSync(path.join(widgetSrcDir, 'java'))) {
        fs.cpSync(path.join(widgetSrcDir, 'java'), targetJavaDir, { recursive: true });
      }
      
      // Copy Resource files
      if (fs.existsSync(path.join(widgetSrcDir, 'res'))) {
        fs.cpSync(path.join(widgetSrcDir, 'res'), targetResDir, { recursive: true });
      }

      return config;
    },
  ]);
}

/**
 * Updates AndroidManifest.xml to include the widget receiver.
 */
function withWidgetManifest(config) {
  return withAndroidManifest(config, (config) => {
    const mainApplication = AndroidConfig.Manifest.getMainApplicationOrThrow(config.modResults);

    // Check if receiver already exists
    const existingReceivers = mainApplication.receiver || [];
    const hasWidgetReceiver = existingReceivers.some(
      (receiver) => receiver.$['android:name'] === '.widget.StreakWidgetProvider'
    );

    if (!hasWidgetReceiver) {
      existingReceivers.push({
        $: {
          'android:name': '.widget.StreakWidgetProvider',
          'android:exported': 'false',
          'android:label': 'Streak Reminder',
        },
        'intent-filter': [
          {
            action: [
              { $: { 'android:name': 'android.appwidget.action.APPWIDGET_UPDATE' } },
              { $: { 'android:name': 'com.chinmaykoshe.streakly.widget.ACTION_MARK_DONE' } }
            ],
          },
        ],
        'meta-data': [
          {
            $: {
              'android:name': 'android.appwidget.provider',
              'android:resource': '@xml/widget_info',
            },
          },
        ],
      });
      mainApplication.receiver = existingReceivers;
    }

    return config;
  });
}

module.exports = function withAndroidWidget(config) {
  config = withWidgetSourceFiles(config);
  config = withWidgetManifest(config);
  return config;
};
