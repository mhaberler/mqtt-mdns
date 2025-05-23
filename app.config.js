module.exports = {
  expo: {
    name: "mqtt-mdns",
    slug: "mqtt-mdns",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
    ios: {
      bundleIdentifier: "com.haberlerm.mqttmdns",
      supportsTablet: true,
      infoPlist: {
        NSBonjourServices: [
          "_http._tcp.",
          "_https._tcp.",
          "_mqtt._tcp.",
          "_mqtt-ws._tcp.",
          "_mqtts._tcp.",
          "_mqtt-wss._tcp."
        ],
        NSLocalNetworkUsageDescription: "This app uses the local network to discover MQTT services"
      },
    },
    android: {
      edgeToEdgeEnabled: true,
      package: "com.haberlerm.mqttmdns",
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
      permissions: [
        "android.permission.ACCESS_NETWORK_STATE",
        "android.permission.ACCESS_WIFI_STATE",
        "android.permission.CHANGE_WIFI_MULTICAST_STATE"
      ]
    },
    web: {
      favicon: "./assets/favicon.png",
    },
    plugins: [
      [
        "expo-dev-client",
        {
          "launchMode": "most-recent" // or "launcher"
        }
      ]
    ]
  },
};