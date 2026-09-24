import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { useBookingStore } from '../store/useBookingStore';
import { requestNotificationPermissions } from '../services/notificationService';
import { FirebaseDataModal } from '../components/FirebaseDataModal';
import * as Notifications from 'expo-notifications';

export const ProfileScreen = () => {
  const {
    currentUser,
    allStudents,
    switchUser,
    bookings,
    logout,
    resetDatabase,
    initApp,
    firebaseStatus,
    firebaseOverview,
    checkFirebaseConnection,
    syncWithFirebase,
  } = useBookingStore();

  const [firebaseModalVisible, setFirebaseModalVisible] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const userBookings = bookings.filter((b) => b.userId === currentUser?.id);
  const activeCount = userBookings.filter((b) => b.status === 'active').length;
  const completedCount = userBookings.filter((b) => b.status === 'completed').length;

  useEffect(() => {
    checkFirebaseConnection();
  }, []);

  const handleSyncFirebase = async () => {
    setSyncing(true);
    const res = await syncWithFirebase();
    setSyncing(false);
    Platform.OS === 'web' ? window.alert(res.message) : Alert.alert('Đồng bộ', res.message);
  };

  const handleLogout = () => {
    const confirmLogout = async () => {
      await logout();
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Bạn có chắc chắn muốn đăng xuất tài khoản?')) {
        confirmLogout();
      }
    } else {
      Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất tài khoản?', [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Đăng xuất', style: 'destructive', onPress: confirmLogout },
      ]);
    }
  };

  const handleResetDb = () => {
    const confirmReset = async () => {
      await resetDatabase();
      const msg = 'Đã khôi phục dữ liệu Database về trạng thái ban đầu!';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Thành công', msg);
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Khôi phục toàn bộ bảng Users, Rooms, Bookings về trạng thái mẫu ban đầu?')) {
        confirmReset();
      }
    } else {
      Alert.alert(
        'Khôi phục Database',
        'Khôi phục toàn bộ bảng Users, Rooms, Bookings về trạng thái mẫu ban đầu?',
        [
          { text: 'Hủy', style: 'cancel' },
          { text: 'Khôi phục', style: 'destructive', onPress: confirmReset },
        ]
      );
    }
  };

  const handleTestNotification = async () => {
    const granted = await requestNotificationPermissions();
    if (!granted && Platform.OS !== 'web') {
      Alert.alert('Chưa cấp quyền', 'Vui lòng cấp quyền thông báo trong cài đặt máy!');
      return;
    }

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '⏰ [VKU Test] Nhắc nhở nhận phòng học!',
          body: `Chào bạn ${currentUser?.name}! Ca học tại phòng V.301 sẽ bắt đầu sau 15 phút. Hãy chuẩn bị mã QR để check-in nhé.`,
          sound: true,
        },
        trigger: {
          seconds: 2,
        },
      });

      if (Platform.OS === 'web') {
        window.alert('🔔 Đã kích hoạt thông báo thử nghiệm thành công! (2s)');
      } else {
        Alert.alert('Thành công', '🔔 Đã kích hoạt thông báo thử nghiệm! Thông báo sẽ xuất hiện sau 2 giây.');
      }
    } catch (e) {
      if (Platform.OS === 'web') {
        window.alert('🔔 [VKU Demo Notification]: Ca học sẽ bắt đầu sau 15 phút!');
      }
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Thẻ thông tin tài khoản người dùng */}
      <View style={styles.profileCard}>
        <View style={styles.avatarRow}>
          <Image source={{ uri: currentUser?.avatar }} style={styles.avatar} />
          <View style={styles.nameArea}>
            <View style={styles.badgeRow}>
              {/* Provider Badge */}
              {currentUser?.authProvider === 'google' && (
                <View style={styles.providerBadgeGoogle}>
                  <Ionicons name="logo-google" size={12} color="#DC2626" />
                  <Text style={styles.providerBadgeGoogleText}>Google Account</Text>
                </View>
              )}
              {currentUser?.authProvider === 'facebook' && (
                <View style={styles.providerBadgeFb}>
                  <Ionicons name="logo-facebook" size={12} color="#1D4ED8" />
                  <Text style={styles.providerBadgeFbText}>Facebook Account</Text>
                </View>
              )}
              {(!currentUser?.authProvider || currentUser?.authProvider === 'email') && (
                <View style={styles.providerBadgeEmail}>
                  <Ionicons name="mail" size={12} color={COLORS.primary} />
                  <Text style={styles.providerBadgeEmailText}>Email Account</Text>
                </View>
              )}
              <View style={styles.activeUserBadge}>
                <View style={styles.activeDot} />
                <Text style={styles.activeUserText}>Đang hoạt động</Text>
              </View>
            </View>

            <Text style={styles.studentName}>{currentUser?.name}</Text>
            <Text style={styles.studentEmail}>{currentUser?.email}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Nút Đăng xuất */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color={COLORS.occupied} />
          <Text style={styles.logoutBtnText}>Đăng xuất tài khoản</Text>
        </TouchableOpacity>
      </View>

      {/* Thống kê hoạt động đặt phòng cá nhân */}
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{activeCount}</Text>
          <Text style={styles.statLabel}>Ca đang đặt</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={[styles.statNumber, { color: COLORS.available }]}>{completedCount}</Text>
          <Text style={styles.statLabel}>Đã check-in</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={[styles.statNumber, { color: COLORS.accent }]}>{userBookings.length}</Text>
          <Text style={styles.statLabel}>Tổng lượt đặt của tôi</Text>
        </View>
      </View>

      {/* THẺ TRẠNG THÁI CƠ SỞ DỮ LIỆU FIREBASE */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <View style={styles.firebaseIconBg}>
            <Ionicons name="flame" size={20} color="#D97706" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>Cơ sở dữ liệu Firebase Cloud</Text>
            <Text style={styles.firebaseSubtitle}>Realtime Database & Identity Services</Text>
          </View>
          <View
            style={[
              styles.fbBadge,
              firebaseStatus?.connected ? styles.fbBadgeOnline : styles.fbBadgeLocal,
            ]}
          >
            <View
              style={[
                styles.fbDot,
                { backgroundColor: firebaseStatus?.connected ? '#10B981' : '#F59E0B' },
              ]}
            />
            <Text
              style={[
                styles.fbBadgeText,
                { color: firebaseStatus?.connected ? '#065F46' : '#B45309' },
              ]}
            >
              {firebaseStatus?.connected ? 'Online' : 'Local Synced'}
            </Text>
          </View>
        </View>

        {/* Số liệu tổng quan trên Firebase */}
        <View style={styles.firebaseStatsRow}>
          <View style={styles.fbStatItem}>
            <Ionicons name="business" size={16} color={COLORS.primary} />
            <Text style={styles.fbStatVal}>{firebaseOverview?.totalRooms || 100}</Text>
            <Text style={styles.fbStatDesc}>Phòng học</Text>
          </View>
          <View style={styles.fbStatItem}>
            <Ionicons name="people" size={16} color={COLORS.accent} />
            <Text style={styles.fbStatVal}>{firebaseOverview?.totalUsers ?? allStudents.length}</Text>
            <Text style={styles.fbStatDesc}>Tài khoản</Text>
          </View>
          <View style={styles.fbStatItem}>
            <Ionicons name="calendar" size={16} color={COLORS.available} />
            <Text style={styles.fbStatVal}>{firebaseOverview?.totalBookings ?? bookings.length}</Text>
            <Text style={styles.fbStatDesc}>Lịch toàn hệ thống</Text>
          </View>
        </View>

        <Text style={styles.firebaseMsgText}>
          {firebaseStatus?.message || 'Đã đồng bộ cơ sở dữ liệu với Firebase'}
        </Text>

        <View style={styles.fbActionsRow}>
          <TouchableOpacity
            style={styles.fbViewBtn}
            onPress={() => setFirebaseModalVisible(true)}
          >
            <Ionicons name="eye-outline" size={16} color={COLORS.primary} />
            <Text style={styles.fbViewBtnText}>Xem Dữ liệu Firebase</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.fbSyncBtn, syncing && { opacity: 0.7 }]}
            onPress={handleSyncFirebase}
            disabled={syncing}
          >
            {syncing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="cloud-upload" size={16} color="#FFFFFF" />
                <Text style={styles.fbSyncBtnText}>Đồng bộ ngay</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Cài đặt thông báo & Thử nghiệm expo-notifications */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Ionicons name="notifications-outline" size={20} color={COLORS.accent} />
          <Text style={styles.sectionTitle}>Thông báo cục bộ (expo-notifications)</Text>
        </View>
        <Text style={styles.sectionDesc}>
          Tự động gửi thông báo nhắc nhở đến thiết bị trước 15 phút ca học bắt đầu.
        </Text>

        <TouchableOpacity
          style={styles.testNotifBtn}
          onPress={handleTestNotification}
        >
          <Ionicons name="notifications" size={18} color="#FFFFFF" />
          <Text style={styles.testNotifBtnText}>Gửi thông báo thử nghiệm (2s)</Text>
        </TouchableOpacity>
      </View>

      {/* Modal Xem dữ liệu Firebase */}
      <FirebaseDataModal
        visible={firebaseModalVisible}
        onClose={() => setFirebaseModalVisible(false)}
        onRefreshStore={initApp}
      />

      {/* Thông tin ứng dụng */}
      <View style={styles.appInfoFooter}>
        <Text style={styles.appInfoText}>Ứng dụng Đặt phòng học trực tuyến VKU</Text>
        <Text style={styles.appVersionText}>
          Tích hợp Firebase Realtime Database • Google & Facebook OAuth 2.0
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 4px 12px rgba(15, 23, 42, 0.05)',
      },
    }),
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  nameArea: {
    flex: 1,
    gap: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  studentIdBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.tagBg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  studentIdText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
  },
  providerBadgeGoogle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  providerBadgeGoogleText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#DC2626',
  },
  providerBadgeFb: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  providerBadgeFbText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1D4ED8',
  },
  providerBadgeEmail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  providerBadgeEmailText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
  },
  activeUserBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  activeUserText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#047857',
  },
  studentName: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  studentEmail: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: 14,
  },
  academicInfo: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  logoutBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.occupied,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.borderLight,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  sectionDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: 14,
  },
  firebaseIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFFBEB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  firebaseSubtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  fbBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  fbBadgeOnline: {
    backgroundColor: '#D1FAE5',
  },
  fbBadgeLocal: {
    backgroundColor: '#FEF3C7',
  },
  fbDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  fbBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  firebaseStatsRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    gap: 8,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  fbStatItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  fbStatVal: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  fbStatDesc: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  firebaseMsgText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  fbActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  fbViewBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.tagBg,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    paddingVertical: 11,
    borderRadius: 12,
  },
  fbViewBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
  },
  fbSyncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#D97706',
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  fbSyncBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  switchUserList: {
    gap: 8,
  },
  switchUserItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 10,
  },
  switchUserItemActive: {
    backgroundColor: '#F0F9FF',
    borderColor: COLORS.primary,
  },
  smallAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  switchUserName: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  switchUserSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  smallProviderBadge: {
    backgroundColor: '#FFFFFF',
    padding: 2,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },
  testNotifBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.accent,
    paddingVertical: 12,
    borderRadius: 12,
  },
  testNotifBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  resetDbBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#FECACA',
    paddingVertical: 12,
    borderRadius: 12,
  },
  resetDbBtnText: {
    color: COLORS.occupied,
    fontSize: 13,
    fontWeight: '800',
  },
  appInfoFooter: {
    alignItems: 'center',
    marginTop: 10,
    paddingVertical: 10,
  },
  appInfoText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  appVersionText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
});
