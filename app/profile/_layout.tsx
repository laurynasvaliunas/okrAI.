import { Stack } from "expo-router";
import { theme } from "../../constants/theme";

export default function ProfileLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.bg },
        animation: "slide_from_right",
      }}
    />
  );
}
