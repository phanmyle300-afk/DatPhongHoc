import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { TIME_SLOTS } from '../constants/slots';
import { getNext7Days } from '../utils/helpers';
import { useBookingStore } from '../store/useBookingStore';

export const SlotPicker = ({
  roomId,
  selectedDate,
  onSelectDate,
  selectedSlotId,
  onSelectSlot,
}) => {
  const days = getNext7Days();
  const { isSlotBooked, getSlotBookingInfo, hasUserConflict, currentUser } = useBookingStore();

  return (
    <View style={styles.container}>
      {/* Tiêu đề & Chọn ngày */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.sectionTitle}>1. Chọn ngày học (7 ngày tới)</Text>
          <Text style={styles.sectionSubtitle}>Chọn một ngày để kiểm tra lịch trống</Text>
        </View>
        <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
      </View>

      {/* Thanh cuộn ngang 7 ngày */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.daysScroll}
      >
        {days.map((item) => {
          const isSelected = selectedDate === item.dateStr;
          return (
            <TouchableOpacity
              key={item.dateStr}
              style={[
                styles.dayCard,
                isSelected && styles.dayCardSelected,
              ]}
              onPress={() => onSelectDate(item.dateStr)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.dayLabel,
                  isSelected && styles.dayLabelSelected,
                ]}
              >
                {item.dayLabel}
              </Text>
              <Text
                style={[
                  styles.dayNumber,
                  isSelected && styles.dayNumberSelected,
                ]}
              >
                {item.dayNumber}
              </Text>
              <Text
                style={[
                  styles.monthText,
                  isSelected && styles.monthTextSelected,
                ]}
              >
                Th{item.monthNumber}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Tiêu đề chọn ca học */}
      <View style={[styles.headerRow, { marginTop: 20 }]}>
        <View>
          <Text style={styles.sectionTitle}>2. Chọn khung giờ (Ca 2 tiếng)</Text>
          <Text style={styles.sectionSubtitle}>
            Hệ thống tự động vô hiệu hóa các ca đã bị trùng lịch
          </Text>
        </View>
        <Ionicons name="time-outline" size={20} color={COLORS.primary} />
      </View>

      {/* Chú thích màu sắc */}
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: COLORS.available }]} />
          <Text style={styles.legendText}>Trống</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: COLORS.primary }]} />
          <Text style={styles.legendText}>Đang chọn</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#CBD5E1' }]} />
          <Text style={styles.legendText}>Đã đặt (Khóa)</Text>
        </View>
      </View>

      {/* Danh sách các ca học 2 tiếng */}
      <View style={styles.slotsGrid}>
        {TIME_SLOTS.map((slot) => {
          const bookedInfo = getSlotBookingInfo(roomId, selectedDate, slot.id);
          const isBooked = !!bookedInfo;
          const isBookedByCurrentUser = bookedInfo?.userId === currentUser?.id;
          const userHasConflictElsewhere =
            !isBooked && hasUserConflict(currentUser?.id, selectedDate, slot.id);

          const isSelected = selectedSlotId === slot.id;
          const isDisabled = isBooked || userHasConflictElsewhere;

          return (
            <TouchableOpacity
              key={slot.id}
              disabled={isDisabled}
              onPress={() => onSelectSlot(slot.id)}
              activeOpacity={0.7}
              style={[
                styles.slotCard,
                isSelected && styles.slotCardSelected,
                isDisabled && styles.slotCardDisabled,
                isBookedByCurrentUser && styles.slotCardBookedByMe,
              ]}
            >
              <View style={styles.slotTopRow}>
                <View style={styles.slotTimeWrapper}>
                  <Ionicons
                    name="time"
                    size={14}
                    color={
                      isSelected
                        ? '#FFFFFF'
                        : isDisabled
                        ? COLORS.textMuted
                        : COLORS.primary
                    }
                  />
                  <Text
                    style={[
                      styles.slotTimeText,
                      isSelected && styles.slotTimeTextSelected,
                      isDisabled && styles.slotTimeTextDisabled,
                    ]}
                  >
                    {slot.startTime} - {slot.endTime}
                  </Text>
                </View>

                {/* Badge trạng thái */}
                {isBooked ? (
                  <View style={styles.slotStatusBadgeOccupied}>
                    <Text style={styles.slotStatusBadgeTextOccupied}>
                      {isBookedByCurrentUser ? 'BẠN ĐÃ ĐẶT' : 'ĐÃ ĐẶT'}
                    </Text>
                  </View>
                ) : userHasConflictElsewhere ? (
                  <View style={styles.slotStatusBadgeConflict}>
                    <Text style={styles.slotStatusBadgeTextConflict}>TRÙNG GIỜ BẠN</Text>
                  </View>
                ) : (
                  <View
                    style={[
                      styles.slotStatusBadgeAvailable,
                      isSelected && styles.slotStatusBadgeAvailableSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.slotStatusBadgeTextAvailable,
                        isSelected && { color: '#FFFFFF' },
                      ]}
                    >
                      {isSelected ? 'ĐÃ CHỌN' : 'CÒN TRỐNG'}
                    </Text>
                  </View>
                )}
              </View>

              {/* Thông tin ca */}
              <View style={styles.slotBottomRow}>
                <Text
                  style={[
                    styles.slotNameText,
                    isSelected && { color: '#E2E8F0' },
                    isDisabled && { color: COLORS.textMuted },
                  ]}
                >
                  {slot.name}
                </Text>

                {/* Hiển thị chi tiết xung đột nếu có */}
                {isBooked && (
                  <Text style={styles.bookedDetailsText}>
                    {isBookedByCurrentUser
                      ? 'Bạn đã giữ chỗ ca này'
                      : `${bookedInfo?.userName || 'Đã có người'} đã giữ chỗ`}
                  </Text>
                )}
                {userHasConflictElsewhere && (
                  <Text style={styles.conflictDetailsText}>
                    Bạn đang có ca ở phòng khác
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.shadowColor,
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  daysScroll: {
    gap: 8,
    paddingVertical: 4,
  },
  dayCard: {
    width: 68,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: COLORS.tagBg,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCardSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  dayLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  dayLabelSelected: {
    color: '#E0F2FE',
  },
  dayNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  dayNumberSelected: {
    color: '#FFFFFF',
  },
  monthText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  monthTextSelected: {
    color: '#BAE6FD',
  },
  legendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 14,
    backgroundColor: COLORS.tagBg,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  slotsGrid: {
    gap: 10,
  },
  slotCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    padding: 12,
  },
  slotCardSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  slotCardDisabled: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
    opacity: 0.7,
  },
  slotCardBookedByMe: {
    backgroundColor: '#EFF6FF',
    borderColor: '#93C5FD',
    opacity: 0.9,
  },
  slotTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  slotTimeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  slotTimeText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  slotTimeTextSelected: {
    color: '#FFFFFF',
  },
  slotTimeTextDisabled: {
    color: COLORS.textMuted,
  },
  slotStatusBadgeAvailable: {
    backgroundColor: COLORS.availableBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  slotStatusBadgeAvailableSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  slotStatusBadgeTextAvailable: {
    fontSize: 10,
    fontWeight: '700',
    color: '#065F46',
  },
  slotStatusBadgeOccupied: {
    backgroundColor: COLORS.occupiedBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  slotStatusBadgeTextOccupied: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.occupied,
  },
  slotStatusBadgeConflict: {
    backgroundColor: COLORS.pendingBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  slotStatusBadgeTextConflict: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B45309',
  },
  slotBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  slotNameText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  bookedDetailsText: {
    fontSize: 11,
    color: COLORS.occupied,
    fontStyle: 'italic',
  },
  conflictDetailsText: {
    fontSize: 11,
    color: '#B45309',
    fontStyle: 'italic',
  },
});
