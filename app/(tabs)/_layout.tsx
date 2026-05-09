import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
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
  focused,
}: {
  Icon: typeof Home;
  color: string;
  size: number;
  focused: boolean;
}) {
  return (
    <View style={styles.iconWrap}>
      {focused && (
        <View style={[styles.activeIndicator, { backgroundColor: Colors.dustyRose + '22' }]} />
      )}
      <Icon
        color={color}
        size={size}
        strokeWidth={focused ? 2.4 : 1.8}
      />
      {focused && (
        <View style={[styles.activeDot, { backgroundColor: Colors.dustyRose }]} />
      )}
    </View>
  );
}

export default function TabsLayout() {
  const colors = useColors();
  const db = useSQLiteContext();
  const { reload } = useCycle();
  const { setProfile } = useUserStore();

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
          borderTopColor: Colors.dustyRose + '20',
          borderTopWidth: 1,
          height: 70,
          paddingBottom: 10,
          paddingTop: 6,
          shadowColor: Colors.dustyRose,
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.08,
          shadowRadius: 16,
          elevation: 16,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: 2,
        },
        tabBarItemStyle: {
          paddingTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size, focused }) => (
            <TabBarIcon Icon={Home} color={color} size={size} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ color, size, focused }) => (
            <TabBarIcon Icon={Calendar} color={color} size={size} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: 'Insights',
          tabBarIcon: ({ color, size, focused }) => (
            <TabBarIcon Icon={BarChart2} color={color} size={size} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="articles"
        options={{
          title: 'Learn',
          tabBarIcon: ({ color, size, focused }) => (
            <TabBarIcon Icon={BookOpen} color={color} size={size} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size, focused }) => (
            <TabBarIcon Icon={User} color={color} size={size} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
    height: 32,
    position: 'relative',
  },
  activeIndicator: {
    position: 'absolute',
    width: 44,
    height: 30,
    borderRadius: 15,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    position: 'absolute',
    bottom: -6,
  },
});
