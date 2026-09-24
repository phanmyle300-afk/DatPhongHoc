import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar as RNStatusBar,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from './src/constants/colors';
import { RoomListScreen } from './src/screens/RoomListScreen';
import { RoomDetailScreen } from './src/screens/RoomDetailScreen';
import { MyBookingsScreen } from './src/screens/MyBookingsScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { useBookingStore } from './src/store/useBookingStore';
import { requestNotificationPermissions } from './src/services/notificationService';

export default function App() {
  const [currentTab, setCurrentTab] = useState('discovery'); // 'discovery' | 'bookings' | 'profile'
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [isGuest, setIsGuest] = useState(false);

  const {
    currentUser,
    isAuthenticated,
    isDbLoaded,
    initApp,
    bookings,
  } = useBookingStore();

  useEffect(() => {
    // 1. Khởi tạo Cơ sở dữ liệu và nạp phiên đăng nhập
    initApp();

    // 2. Yêu cầu quyền thông báo
    requestNotificationPermissions();
  }, []);

  // Đếm số lịch đặt đang có hiệu lực của người dùng hiện tại
  const activeBookingsCount = bookings.filter(
    (b) => b.userId === currentUser?.id && b.status === 'active'
  ).length;

  const handleSelectRoom = (room) => {
    setSelectedRoom(room);
  };

  const handleBackToDiscovery = () => {
    setSelectedRoom(null);
  };

  const handleGoToMyBookings = () => {
    setSelectedRoom(null);
    setCurrentTab('bookings');
  };

  // Màn hình chờ nạp dữ liệu Database
  if (!isDbLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar style="light" backgroundColor={COLORS.primaryDark} />
        <View style={styles.loadingBox}>
          <Ionicons name="school" size={48} color="#FFFFFF" />
          <Text style={styles.loadingTitle}>VKU ROOM BOOKING</Text>
          <ActivityIndicator size="large" color="#38BDF8" style={{ marginTop: 14 }} />
          <Text style={styles.loadingSub}>Đang kết nối Cơ sở dữ liệu...</Text>
        </View>
      </View>
    );
  }

  // Màn hình Đăng nhập (nếu chưa đăng nhập và không chọn chế độ khách)
  if (!isAuthenticated && !isGuest) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" backgroundColor={COLORS.primaryDark} />
        <LoginScreen onContinueAsGuest={() => setIsGuest(true)} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" backgroundColor={COLORS.primaryDark} />

      {/* Header thương hiệu VKU */}
      <View style={styles.topNavHeader}>
        <View style={styles.brandRow}>
          <View style={styles.logoIconBg}>
            <Ionicons name="school" size={20} color="#FFFFFF" />
          </View>
          <View>
            <Text style={styles.brandTitle}>VKU ROOM BOOKING</Text>
            <Text style={styles.brandSubtitle}>
              Hệ thống Đặt phòng học trực tuyến VKU
            </Text>
          </View>
        </View>

        {/* Thông tin đăng nhập trên Header */}
        {isAuthenticated ? (
          <TouchableOpacity
            style={styles.headerProfileBtn}
            onPress={() => {
              setSelectedRoom(null);
              setCurrentTab('profile');
            }}
          >
            <View style={[styles.studentIdBadge, { flexDirection: 'row', alignItems: 'center' }]}>
              {currentUser?.authProvider === 'google' && (
                <Ionicons name="logo-google" size={11} color="#EA4335" style={{ marginRight: 4 }} />
              )}
              {currentUser?.authProvider === 'facebook' && (
                <Ionicons name="logo-facebook" size={11} color="#1877F2" style={{ marginRight: 4 }} />
              )}
              {(!currentUser?.authProvider || currentUser?.authProvider === 'email') && (
                <Ionicons name="person" size={11} color={COLORS.primary} style={{ marginRight: 4 }} />
              )}
              <Text style={styles.studentIdBadgeText} numberOfLines={1}>
                {currentUser?.name || currentUser?.email}
              </Text>
            </View>
            <Ionicons name="person-circle" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.guestLoginPromptBtn}
            onPress={() => setIsGuest(false)}
          >
            <Ionicons name="log-in-outline" size={16} color="#FFFFFF" />
            <Text style={styles.guestLoginPromptText}>Đăng nhập</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Nội dung Màn hình chính */}
      <View style={styles.contentArea}>
        {selectedRoom ? (
          <RoomDetailScreen
            room={selectedRoom}
            onBack={handleBackToDiscovery}
            onGoToMyBookings={handleGoToMyBookings}
          />
        ) : (
          <>
            {currentTab === 'discovery' && (
              <RoomListScreen onSelectRoom={handleSelectRoom} />
            )}
            {currentTab === 'bookings' && (
              <MyBookingsScreen onGoToDiscovery={() => setCurrentTab('discovery')} />
            )}
            {currentTab === 'profile' && (
              isAuthenticated ? (
                <ProfileScreen />
              ) : (
                <LoginScreen onContinueAsGuest={() => setCurrentTab('discovery')} />
              )
            )}
          </>
        )}
      </View>

      {/* Bottom Navigation Tab Bar (Chỉ hiển thị khi không mở màn hình chi tiết phòng) */}
      {!selectedRoom && (
        <View style={styles.bottomTabBar}>
          {/* Tab 1: Khám phá phòng */}
          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => setCurrentTab('discovery')}
          >
            <Ionicons
              name={currentTab === 'discovery' ? 'compass' : 'compass-outline'}
              size={24}
              color={currentTab === 'discovery' ? COLORS.primary : COLORS.inactiveTab}
            />
            <Text
              style={[
                styles.tabItemText,
                currentTab === 'discovery' && styles.tabItemTextActive,
              ]}
            >
              Khám phá
            </Text>
          </TouchableOpacity>

          {/* Tab 2: Lịch đặt của tôi */}
          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => setCurrentTab('bookings')}
          >
            <View style={styles.tabIconWrapper}>
              <Ionicons
                name={currentTab === 'bookings' ? 'calendar' : 'calendar-outline'}
                size={24}
                color={currentTab === 'bookings' ? COLORS.primary : COLORS.inactiveTab}
              />
              {activeBookingsCount > 0 && (
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>{activeBookingsCount}</Text>
                </View>
              )}
            </View>
            <Text
              style={[
                styles.tabItemText,
                currentTab === 'bookings' && styles.tabItemTextActive,
              ]}
            >
              Lịch đặt
            </Text>
          </TouchableOpacity>

          {/* Tab 3: Sinh viên / Tài khoản */}
          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => setCurrentTab('profile')}
          >
            <Ionicons
              name={currentTab === 'profile' ? 'person' : 'person-outline'}
              size={24}
              color={currentTab === 'profile' ? COLORS.primary : COLORS.inactiveTab}
            />
            <Text
              style={[
                styles.tabItemText,
                currentTab === 'profile' && styles.tabItemTextActive,
              ]}
            >
              {isAuthenticated ? 'Cá nhân' : 'Đăng nhập'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingBox: {
    alignItems: 'center',
  },
  loadingTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 12,
    letterSpacing: 1,
  },
  loadingSub: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 8,
  },
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.primaryDark,
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
  },
  topNavHeader: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
  brandSubtitle: {
    fontSize: 11,
    color: '#BAE6FD',
    marginTop: 1,
  },
  headerProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingLeft: 8,
    paddingRight: 4,
    paddingVertical: 4,
    borderRadius: 20,
  },
  studentIdBadge: {
    paddingHorizontal: 4,
  },
  studentIdBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  guestLoginPromptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  guestLoginPromptText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  contentArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  bottomTabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingVertical: 8,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 -3px 10px rgba(0, 0, 0, 0.05)',
      },
    }),
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  tabIconWrapper: {
    position: 'relative',
  },
  tabBadge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: COLORS.occupied,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  tabBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  tabItemText: {
    fontSize: 11,
    color: COLORS.inactiveTab,
    fontWeight: '600',
  },
  tabItemTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
});
