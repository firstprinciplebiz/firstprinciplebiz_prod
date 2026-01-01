import { Tabs, useRouter } from "expo-router";
import { View, Text, TouchableOpacity } from "react-native";
import { Home, Search, MessageCircle, User, Bell } from "lucide-react-native";
import { useUnreadMessages } from "@/context/UnreadMessagesContext";
import { useNotificationsContext } from "@/context/NotificationsContext";

function NotificationBell() {
  const router = useRouter();
  const { unreadCount } = useNotificationsContext();

  return (
    <TouchableOpacity
      className="relative p-2 mr-2"
      onPress={() => router.push("/notifications")}
    >
      <Bell color="#64748B" size={24} />
      {unreadCount > 0 && (
        <View
          style={{
            position: "absolute",
            top: 2,
            right: 2,
            backgroundColor: "#EF4444",
            borderRadius: 10,
            minWidth: 18,
            height: 18,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 4,
          }}
        >
          <Text style={{ color: "white", fontSize: 10, fontWeight: "700" }}>
            {unreadCount > 99 ? "99+" : unreadCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function TabsLayout() {
  const { unreadCount: unreadMessages } = useUnreadMessages();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#2563EB",
        tabBarInactiveTintColor: "#94A3B8",
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopColor: "#E2E8F0",
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "500",
        },
        headerStyle: {
          backgroundColor: "#FFFFFF",
        },
        headerTitleStyle: {
          color: "#0F172A",
          fontWeight: "600",
        },
        headerRight: () => <NotificationBell />,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="issues"
        options={{
          title: "Issues",
          tabBarIcon: ({ color, size }) => <Search color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: "Messages",
          tabBarIcon: ({ color, size }) => (
            <View>
              <MessageCircle color={color} size={size} />
              {unreadMessages > 0 && (
                <View
                  style={{
                    position: "absolute",
                    top: -4,
                    right: -8,
                    backgroundColor: "#EF4444",
                    borderRadius: 10,
                    minWidth: 18,
                    height: 18,
                    alignItems: "center",
                    justifyContent: "center",
                    paddingHorizontal: 4,
                  }}
                >
                  <Text style={{ color: "white", fontSize: 10, fontWeight: "700" }}>
                    {unreadMessages > 99 ? "99+" : unreadMessages}
                  </Text>
                </View>
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
