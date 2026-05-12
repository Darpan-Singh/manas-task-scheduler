import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.manas.taskscheduler",
  appName: "Task Scheduler",
  webDir: "www",
  server: {
    // Load from the live Vercel deployment so all API routes work
    url: "https://manastaskscheduler.vercel.app",
    cleartext: false,
    androidScheme: "https",
  },
  android: {
    backgroundColor: "#0A0A0F",
    allowMixedContent: false,
  },
};

export default config;
