import React, { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Home, Calendar, BarChart2, BookOpen, User } from 'lucide-react-native';
import { useColors } from '../../hooks/useTheme';
import { useCycle } from '../../hooks/useCycle';
import { useUserStore } from '../../stores/userStore';
import { getUser } from '../../lib/db/queries';
import { Colors } from '../../constants/colors';

function TabBarIcon({
  Icon,
  color,
  size,
}: {
  Icon: typeof Home;
  color: string;
  size: number;
}) {
  return <Icon color={color} size={size} strokeWidth={2} />;
}

export default function TabsLayout() {
  const colors = useColors();
  const db = useSQLiteContext();
  const { reload } = useCycle();
  const { setProfile } = useUserStore();

  // Load user profile + cycle data on mount
  useEffect(() => {
    const init = async () => {
      const user = await getUser(db);
      if (user) setProfile(user);
      await reload();
    };
    init();
  }, []);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.dustyRose,
        tabBarInactiveTintColor: colors.tabBarInactive,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon Icon={Home} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon Icon={Calendar} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: 'Insights',
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon Icon={BarChart2} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="articles"
        options={{
          title: 'Learn',
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon Icon={BookOpen} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon Icon={User} color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
