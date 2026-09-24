import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { useBookingStore } from '../store/useBookingStore';
import { QRCodeModal } from '../components/QRCodeModal';
import { FirebaseDataModal } from '../components/FirebaseDataModal';
import { formatDateDisplay } from '../utils/helpers';

export const MyBookingsScreen = ({ onGoToDiscovery }) => {
  const { bookings, cancelBooking, currentUser, initApp } = useBookingStore();
  const [scopeFilter, setScopeFilter] = useState('MINE'); // Mặc định hiển thị phòng của tài khoản hiện tại
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
  const [selectedBookingForQR, setSelectedBookingForQR] = useState(null);
  const [firebaseModalVisible, setFirebaseModalVisible] = useState(false);

  // Lọc các lịch đặt theo phạm vi người dùng và trạng thái
  const filteredBookings = bookings.filter((b) => {
    // 1. Lọc theo phạm vi: của tôi hay toàn bộ trên Firebase
    if (scopeFilter === 'MINE') {
      const isMine =
        b.userId === currentUser?.id ||
        (currentUser?.email && b.userEmail && b.userEmail.toLowerCase() === currentUser.email.toLowerCase());
      if (!isMine) {
        return false;
      }
    }

    // 2. Lọc theo trạng thái
    if (activeTab === 'ACTIVE') return b.status === 'active';
    if (activeTab === 'COMPLETED') return b.status === 'completed';
    if (activeTab === 'CANCELLED') return b.status === 'cancelled';
    return true;
  });

  const handleCancel = (booking) => {
    const confirmCancel = async () => {
      await cancelBooking(booking.id);
      if (Platform.OS === 'web') {
        window.alert(`Đã hủy đặt phòng ${booking.roomCode}. Khung giờ đã được giải phóng trên Firebase.`);
      } else {
        Alert.alert('Đã hủy', `Đã hủy đặt phòng ${booking.roomCode}. Khung giờ đã được giải phóng trên Firebase.`);
      }
    };

    if (Platform.OS === 'web') {
      if (
        window.confirm(
          `Bạn có chắc chắn muốn hủy ca đặt phòng ${booking.roomCode} vào ngày ${formatDateDisplay(
            booking.dateStr
          )} không?`
        )
      ) {
        confirmCancel();
      }
    } else {
      Alert.alert(
        'Xác nhận hủy đặt phòng',
        `Bạn có chắc chắn muốn hủy ca đặt phòng ${booking.roomCode} (${booking.slotTime}) không?`,
        [
          { text: 'Giữ lại', style: 'cancel' },
          { text: 'Hủy phòng', style: 'destructive', onPress: confirmCancel },
        ]
      );
    }
  };

  const renderBookingItem = ({ item }) => {
    const isActive = item.status === 'active';
    const isCompleted = item.status === 'completed';
    const isCancelled = item.status === 'cancelled';
    const isMyBooking =
      item.userId === currentUser?.id ||
      (currentUser?.email && item.userEmail && item.userEmail.toLowerCase() === currentUser.email.toLowerCase());

    return (
      <View style={styles.bookingCard}>
        {/* Header Card */}
        <View style={styles.cardHeader}>
          <View style={styles.roomBadgeRow}>
            <View style={styles.codeTag}>
              <Text style={styles.codeTagText}>{item.roomCode}</Text>
            </View>
            <Text style={styles.roomNameText} numberOfLines={1}>
              {item.roomName}
            </Text>
          </View>

          {/* Badge Trạng thái */}
          <View
            style={[
              styles.statusPill,
              isActive && styles.statusActive,
              isCompleted && styles.statusCompleted,
              isCancelled && styles.statusCancelled,
            ]}
          >
            <Text
              style={[
                styles.statusPillText,
                isActive && { color: '#065F46' },
                isCompleted && { color: '#1E40AF' },
                isCancelled && { color: '#64748B' },
              ]}
            >
              {isActive ? 'Đang hiệu lực' : isCompleted ? 'Đã check-in' : 'Đã hủy'}
            </Text>
          </View>
        </View>

        {/* Thông tin tài khoản đã đặt phòng trên Firebase */}
        <View style={styles.accountBookingBox}>
          <Ionicons name="person-circle" size={18} color={COLORS.primary} />
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <Text style={styles.accountBookingName}>
                {item.userName || item.userEmail || 'Người dùng'}
              </Text>
              {item.userEmail ? (
                <Text style={styles.accountBookingId}>({item.userEmail})</Text>
              ) : null}

              {/* Tag nguồn xác thực */}
              {item.authProvider === 'google' && (
                <View style={styles.tagGoogle}>
                  <Ionicons name="logo-google" size={10} color="#EA4335" />
                  <Text style={styles.tagGoogleText}>Google</Text>
                </View>
              )}
              {item.authProvider === 'facebook' && (
                <View style={styles.tagFb}>
                  <Ionicons name="logo-facebook" size={10} color="#1877F2" />
                  <Text style={styles.tagFbText}>Facebook</Text>
                </View>
              )}
              {isMyBooking && (
                <View style={styles.tagMyBooking}>
                  <Text style={styles.tagMyBookingText}>Của tôi</Text>
                </View>
              )}
            </View>
          </View>
          <View style={styles.firebaseTagBadge}>
            <Ionicons name="flame" size={12} color="#D97706" />
            <Text style={styles.firebaseTagBadgeText}>Firebase</Text>
          </View>
        </View>

        {/* Nội dung chi tiết */}
        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={15} color={COLORS.primary} />
            <Text style={styles.infoText}>
              Ngày:{' '}
              <Text style={styles.infoHighlight}>{formatDateDisplay(item.dateStr)}</Text>
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={15} color={COLORS.primary} />
            <Text style={styles.infoText}>
              Khung giờ: <Text style={styles.infoHighlight}>{item.slotTime}</Text>
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={15} color={COLORS.primary} />
            <Text style={styles.infoText}>
              Vị trí: Tòa {item.building} • {item.floor}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="flag-outline" size={15} color={COLORS.primary} />
            <Text style={styles.infoText} numberOfLines={1}>
              Mục đích: {item.purpose} ({item.studentCount} người)
            </Text>
          </View>

          {/* Mã đặt phòng */}
          <View style={styles.codeBox}>
            <Text style={styles.codeBoxLabel}>Mã đặt phòng:</Text>
            <Text style={styles.codeBoxValue}>{item.bookingCode}</Text>
          </View>
        </View>

        {/* Nút hành động */}
        <View style={styles.cardFooter}>
          {isActive && (
            <>
              {isMyBooking && (
                <TouchableOpacity
                  style={styles.cancelActionBtn}
                  onPress={() => handleCancel(item)}
                >
                  <Ionicons name="close-circle-outline" size={16} color={COLORS.occupied} />
                  <Text style={styles.cancelActionText}>Hủy đặt phòng</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.qrActionBtn, !isMyBooking && { flex: 1 }]}
                onPress={() => setSelectedBookingForQR(item)}
              >
                <Ionicons name="qr-code" size={16} color="#FFFFFF" />
                <Text style={styles.qrActionText}>Mã QR Check-in</Text>
              </TouchableOpacity>
            </>
          )}

          {isCompleted && (
            <TouchableOpacity
              style={[styles.qrActionBtn, { backgroundColor: '#1E40AF', flex: 1 }]}
              onPress={() => setSelectedBookingForQR(item)}
            >
              <Ionicons name="checkmark-done" size={16} color="#FFFFFF" />
              <Text style={styles.qrActionText}>Xem thông tin Check-in</Text>
            </TouchableOpacity>
          )}

          {isCancelled && (
            <View style={styles.cancelledNote}>
              <Ionicons name="information-circle-outline" size={16} color="#94A3B8" />
              <Text style={styles.cancelledNoteText}>
                Lịch đặt này đã bị hủy trên Firebase
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Banner: Thống kê & Nút mở Cơ sở dữ liệu Firebase */}
      <View style={styles.topControlBanner}>
        <View style={styles.scopeSelector}>
          <TouchableOpacity
            style={[styles.scopeBtn, scopeFilter === 'ALL' && styles.scopeBtnActive]}
            onPress={() => setScopeFilter('ALL')}
          >
            <Ionicons
              name="globe-outline"
              size={14}
              color={scopeFilter === 'ALL' ? '#FFFFFF' : COLORS.textSecondary}
            />
            <Text
              style={[
                styles.scopeBtnText,
                scopeFilter === 'ALL' && styles.scopeBtnTextActive,
              ]}
            >
              Toàn trường ({bookings.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.scopeBtn, scopeFilter === 'MINE' && styles.scopeBtnActive]}
            onPress={() => setScopeFilter('MINE')}
          >
            <Ionicons
              name="person-outline"
              size={14}
              color={scopeFilter === 'MINE' ? '#FFFFFF' : COLORS.textSecondary}
            />
            <Text
              style={[
                styles.scopeBtnText,
                scopeFilter === 'MINE' && styles.scopeBtnTextActive,
              ]}
            >
              Của tôi (
              {
                bookings.filter(
                  (b) =>
                    b.userId === currentUser?.id ||
                    (currentUser?.email && b.userEmail && b.userEmail.toLowerCase() === currentUser.email.toLowerCase())
                ).length
              }
              )
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.firebaseQuickBtn}
          onPress={() => setFirebaseModalVisible(true)}
        >
          <Ionicons name="flame" size={15} color="#D97706" />
          <Text style={styles.firebaseQuickBtnText}>Dữ liệu Firebase</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs lọc trạng thái */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'ALL' && styles.tabBtnActive]}
          onPress={() => setActiveTab('ALL')}
        >
          <Text
            style={[styles.tabBtnText, activeTab === 'ALL' && styles.tabBtnTextActive]}
          >
            Tất cả
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'ACTIVE' && styles.tabBtnActive]}
          onPress={() => setActiveTab('ACTIVE')}
        >
          <Text
            style={[
              styles.tabBtnText,
              activeTab === 'ACTIVE' && styles.tabBtnTextActive,
            ]}
          >
            Đang hiệu lực
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'COMPLETED' && styles.tabBtnActive]}
          onPress={() => setActiveTab('COMPLETED')}
        >
          <Text
            style={[
              styles.tabBtnText,
              activeTab === 'COMPLETED' && styles.tabBtnTextActive,
            ]}
          >
            Đã check-in
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'CANCELLED' && styles.tabBtnActive]}
          onPress={() => setActiveTab('CANCELLED')}
        >
          <Text
            style={[
              styles.tabBtnText,
              activeTab === 'CANCELLED' && styles.tabBtnTextActive,
            ]}
          >
            Đã hủy
          </Text>
        </TouchableOpacity>
      </View>

      {/* Danh sách các ca đặt phòng */}
      <FlatList
        data={filteredBookings}
        keyExtractor={(item) => item.id}
        renderItem={renderBookingItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconBg}>
              <Ionicons name="calendar-clear-outline" size={48} color={COLORS.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>Chưa có lịch đặt phòng nào</Text>
            <Text style={styles.emptySub}>
              {scopeFilter === 'MINE'
                ? 'Bạn chưa đăng ký đặt phòng học nào. Hãy khám phá và giữ chỗ phòng học ngay!'
                : 'Chưa có lượt đặt phòng nào trong danh mục này trên Firebase.'}
            </Text>
            <TouchableOpacity style={styles.discoverBtn} onPress={onGoToDiscovery}>
              <Ionicons name="search" size={16} color="#FFFFFF" />
              <Text style={styles.discoverBtnText}>Khám phá phòng học ngay</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Modal QR Code */}
      <QRCodeModal
        visible={!!selectedBookingForQR}
        booking={selectedBookingForQR}
        onClose={() => setSelectedBookingForQR(null)}
      />

      {/* Modal Cơ sở dữ liệu Firebase */}
      <FirebaseDataModal
        visible={firebaseModalVisible}
        onClose={() => setFirebaseModalVisible(false)}
        onRefreshStore={initApp}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  topControlBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    gap: 8,
  },
  scopeSelector: {
    flexDirection: 'row',
    backgroundColor: COLORS.tagBg,
    borderRadius: 10,
    padding: 3,
    gap: 4,
  },
  scopeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  scopeBtnActive: {
    backgroundColor: COLORS.primary,
  },
  scopeBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  scopeBtnTextActive: {
    color: '#FFFFFF',
  },
  firebaseQuickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  firebaseQuickBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#92400E',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    gap: 8,
  },
  tabBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: COLORS.tagBg,
  },
  tabBtnActive: {
    backgroundColor: COLORS.primary,
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  tabBtnTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  bookingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 8px rgba(15, 23, 42, 0.05)',
      },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  roomBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 8,
  },
  codeTag: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  codeTagText: {
    color: COLORS.primary,
    fontWeight: '800',
    fontSize: 13,
  },
  roomNameText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    flex: 1,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusActive: {
    backgroundColor: '#D1FAE5',
  },
  statusCompleted: {
    backgroundColor: '#DBEAFE',
  },
  statusCancelled: {
    backgroundColor: '#F1F5F9',
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  accountBookingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginBottom: 10,
  },
  accountBookingName: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  accountBookingId: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  tagGoogle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagGoogleText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#DC2626',
  },
  tagFb: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagFbText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#1D4ED8',
  },
  tagMyBooking: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagMyBookingText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#059669',
  },
  firebaseTagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  firebaseTagBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#92400E',
  },
  cardBody: {
    gap: 6,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  infoHighlight: {
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  codeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.tagBg,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 4,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  codeBoxLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  codeBoxValue: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  cardFooter: {
    flexDirection: 'row',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingTop: 12,
  },
  cancelActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
  },
  cancelActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.occupied,
  },
  qrActionBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
  },
  qrActionText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  cancelledNote: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  cancelledNoteText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontStyle: 'italic',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    paddingHorizontal: 24,
  },
  emptyIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.tagBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
    maxWidth: 300,
  },
  discoverBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  discoverBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
