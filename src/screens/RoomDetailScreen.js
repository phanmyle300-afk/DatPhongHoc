import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { SlotPicker } from '../components/SlotPicker';
import { BookingModal } from '../components/BookingModal';
import { QRCodeModal } from '../components/QRCodeModal';
import { getNext7Days, formatDateDisplay } from '../utils/helpers';
import { TIME_SLOTS } from '../constants/slots';

export const RoomDetailScreen = ({ room, onBack, onGoToMyBookings }) => {
  const days = getNext7Days();
  const [selectedDate, setSelectedDate] = useState(days[0].dateStr);
  const [selectedSlotId, setSelectedSlotId] = useState(null);

  const [bookingModalVisible, setBookingModalVisible] = useState(false);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [createdBooking, setCreatedBooking] = useState(null);

  if (!room) return null;

  const selectedSlot = TIME_SLOTS.find((s) => s.id === selectedSlotId);

  const handleBookingSuccess = (booking) => {
    setCreatedBooking(booking);
    setQrModalVisible(true);
    setSelectedSlotId(null); // Reset selection
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Ảnh Hero & Header */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: room.image }} style={styles.heroImage} resizeMode="cover" />
          <View style={styles.gradient} />

          {/* Nút Back */}
          <TouchableOpacity style={styles.backBtn} onPress={onBack}>
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Badge Trạng thái */}
          <View
            style={[
              styles.statusBadge,
              room.isAvailableNow ? styles.statusAvailable : styles.statusOccupied,
            ]}
          >
            <Text
              style={[
                styles.statusBadgeText,
                { color: room.isAvailableNow ? '#065F46' : '#991B1B' },
              ]}
            >
              {room.isAvailableNow ? '● Có thể dùng ngay' : '● Hiện đang có lớp'}
            </Text>
          </View>
        </View>

        {/* Thông tin chính của phòng */}
        <View style={styles.roomInfoContainer}>
          <View style={styles.codeRow}>
            <View style={styles.codeBadge}>
              <Text style={styles.codeBadgeText}>{room.code}</Text>
            </View>
            <View style={styles.buildingTag}>
              <Ionicons name="business" size={13} color={COLORS.primary} />
              <Text style={styles.buildingTagText}>
                {room.buildingName} • {room.floor}
              </Text>
            </View>
          </View>

          <Text style={styles.roomName}>{room.name}</Text>

          {/* Thống kê nhanh */}
          <View style={styles.statsCard}>
            <View style={styles.statCol}>
              <Ionicons name="people-outline" size={20} color={COLORS.primary} />
              <Text style={styles.statValue}>{room.capacity} chỗ</Text>
              <Text style={styles.statLabel}>Sức chứa</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCol}>
              <Ionicons name="star" size={20} color="#F59E0B" />
              <Text style={styles.statValue}>{room.rating} / 5.0</Text>
              <Text style={styles.statLabel}>{room.reviewsCount} đánh giá</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCol}>
              <Ionicons name="shield-checkmark-outline" size={20} color={COLORS.available} />
              <Text style={styles.statValue}>Chuẩn VKU</Text>
              <Text style={styles.statLabel}>Phòng Lab IT</Text>
            </View>
          </View>

          {/* Mô tả chi tiết */}
          <Text style={styles.sectionHeading}>Mô tả phòng học:</Text>
          <Text style={styles.descriptionText}>{room.description}</Text>

          {/* Cấu hình & Trang thiết bị chi tiết */}
          <Text style={styles.sectionHeading}>Thông số kỹ thuật & Thiết bị:</Text>
          <View style={styles.specsBox}>
            <Ionicons name="hardware-chip-outline" size={20} color={COLORS.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.specsText}>{room.specs}</Text>
              <Text style={styles.managerText}>Quản lý: {room.manager}</Text>
            </View>
          </View>
        </View>

        {/* Khối chọn khung giờ SlotPicker (Chống xung đột) */}
        <SlotPicker
          roomId={room.id}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          selectedSlotId={selectedSlotId}
          onSelectSlot={setSelectedSlotId}
        />
      </ScrollView>

      {/* Thanh công cụ cố định phía dưới để đặt phòng */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomBarInfo}>
          <Text style={styles.bottomBarLabel}>Khung giờ đã chọn:</Text>
          {selectedSlot ? (
            <Text style={styles.bottomBarValue}>
              {formatDateDisplay(selectedDate)} • {selectedSlot.startTime} - {selectedSlot.endTime}
            </Text>
          ) : (
            <Text style={styles.bottomBarPlaceholder}>Chưa chọn ca học</Text>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.continueBtn,
            !selectedSlotId && styles.continueBtnDisabled,
          ]}
          disabled={!selectedSlotId}
          onPress={() => setBookingModalVisible(true)}
        >
          <Text style={styles.continueBtnText}>Tiếp tục</Text>
          <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Modal xác nhận đặt phòng */}
      <BookingModal
        visible={bookingModalVisible}
        room={room}
        dateStr={selectedDate}
        slotId={selectedSlotId}
        onClose={() => setBookingModalVisible(false)}
        onBookingSuccess={handleBookingSuccess}
      />

      {/* Modal hiển thị QR Code check-in sau khi đặt thành công */}
      <QRCodeModal
        visible={qrModalVisible}
        booking={createdBooking}
        onClose={() => {
          setQrModalVisible(false);
          onGoToMyBookings();
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  imageContainer: {
    width: '100%',
    height: 240,
    position: 'relative',
    backgroundColor: '#334155',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  backBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 44 : 20,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadge: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusAvailable: {
    backgroundColor: COLORS.availableBg,
  },
  statusOccupied: {
    backgroundColor: COLORS.occupiedBg,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  roomInfoContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  codeBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  codeBadgeText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  buildingTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  buildingTagText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  roomName: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 14,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.tagBg,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.border,
    height: '80%',
    alignSelf: 'center',
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 6,
    marginTop: 10,
  },
  descriptionText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  specsBox: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  specsText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
    lineHeight: 18,
  },
  managerText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 30 : 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 10,
      },
      web: {
        boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.08)',
      },
    }),
  },
  bottomBarInfo: {
    flex: 1,
    marginRight: 12,
  },
  bottomBarLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  bottomBarValue: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
    marginTop: 2,
  },
  bottomBarPlaceholder: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontStyle: 'italic',
    marginTop: 2,
  },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  continueBtnDisabled: {
    backgroundColor: '#CBD5E1',
  },
  continueBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
