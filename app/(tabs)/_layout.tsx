import { Tabs } from "expo-router";
import React from "react";

import { CustomTabBar } from "@/components/CustomTabBar";
import { HapticTab } from "@/components/haptic-tab";

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen name="index" options={{ title: "Steps" }} />
    </Tabs>
  );
}
