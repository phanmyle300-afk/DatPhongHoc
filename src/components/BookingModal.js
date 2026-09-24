import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { TIME_SLOTS } from '../constants/slots';
import { formatDateDisplay } from '../utils/helpers';
import { useBookingStore } from '../store/useBookingStore';

const PURPOSE_SUGGESTIONS = [
  'Học nhóm môn học',
  'Làm đồ án tốt nghiệp',
  'Nghiên cứu khoa học VKU',
  'Luyện code Hackathon',
  'Thuyết trình báo cáo bài tập lớn',
];

export const BookingModal = ({
  visible,
  room,
  dateStr,
  slotId,
  onClose,
  onBookingSuccess,
}) => {
  const { currentUser, bookRoom } = useBookingStore();
  const [purpose, setPurpose] = useState('Học nhóm môn học');
  const [studentCount, setStudentCount] = useState(4);
  const [loading, setLoading] = useState(false);

  if (!room || !slotId) return null;

  const slot = TIME_SLOTS.find((s) => s.id === slotId);

  const handleConfirm = async () => {
    if (!purpose.trim()) {
      if (Platform.OS === 'web') {
        window.alert('Vui lòng nhập mục đích đặt phòng!');
      } else {
        Alert.alert('Thông báo', 'Vui lòng nhập mục đích sử dụng phòng học!');
      }
      return;
    }

    setLoading(true);
    const result = await bookRoom({
      roomId: room.id,
      dateStr,
      slotId,
      purpose: purpose.trim(),
      studentCount,
    });
    setLoading(false);

    if (result.success) {
      onClose();
      onBookingSuccess(result.booking);
    } else {
      if (Platform.OS === 'web') {
        window.alert(result.error);
      } else {
        Alert.alert('Không thể đặt phòng', result.error);
      }
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Xác nhận đặt phòng học</Text>
              <Text style={styles.subtitle}>Đại học CNTT & Truyền thông Việt - Hàn</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
            {/* Tóm tắt phòng & khung giờ đã chọn */}
            <View style={styles.summaryCard}>
              <View style={styles.roomHeaderRow}>
                <View style={styles.roomCodeBadge}>
                  <Text style={styles.roomCodeText}>{room.code}</Text>
                </View>
                <Text style={styles.roomNameText} numberOfLines={1}>
                  {room.name}
                </Text>
              </View>

              <View style={styles.infoDivider} />

              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={16} color={COLORS.primary} />
                <Text style={styles.infoText}>
                  {room.buildingName} • {room.floor}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="calendar-outline" size={16} color={COLORS.primary} />
                <Text style={styles.infoText}>
                  Ngày học: <Text style={styles.boldText}>{formatDateDisplay(dateStr)}</Text>
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="time-outline" size={16} color={COLORS.primary} />
                <Text style={styles.infoText}>
                  Khung giờ: <Text style={styles.boldText}>{slot?.startTime} - {slot?.endTime}</Text> ({slot?.name})
                </Text>
              </View>
            </View>

            {/* Thông tin người đại diện đặt phòng */}
            <View style={styles.studentCard}>
              <View style={styles.studentHeader}>
                <Ionicons name="person-circle-outline" size={20} color={COLORS.accent} />
                <Text style={styles.studentTitle}>Người đại diện đặt phòng:</Text>
                {currentUser?.authProvider === 'google' && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#FEE2E2', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                    <Ionicons name="logo-google" size={10} color="#DC2626" />
                    <Text style={{ fontSize: 10, fontWeight: '800', color: '#DC2626' }}>Google</Text>
                  </View>
                )}
                {currentUser?.authProvider === 'facebook' && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#DBEAFE', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                    <Ionicons name="logo-facebook" size={10} color="#1877F2" />
                    <Text style={{ fontSize: 10, fontWeight: '800', color: '#1D4ED8' }}>Facebook</Text>
                  </View>
                )}
                {(!currentUser?.authProvider || currentUser?.authProvider === 'email') && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#F0F9FF', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                    <Ionicons name="mail" size={10} color={COLORS.primary} />
                    <Text style={{ fontSize: 10, fontWeight: '800', color: COLORS.primary }}>Email</Text>
                  </View>
                )}
              </View>
              <Text style={styles.studentName}>{currentUser?.name}</Text>
              <Text style={styles.studentMajor}>{currentUser?.email}</Text>
            </View>

            {/* Chọn số lượng thành viên tham gia */}
            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>
                Số người tham gia: <Text style={styles.countNumber}>{studentCount} người</Text>
              </Text>
              <View style={styles.counterRow}>
                <TouchableOpacity
                  style={[styles.counterBtn, studentCount <= 2 && styles.counterBtnDisabled]}
                  disabled={studentCount <= 2}
                  onPress={() => setStudentCount((prev) => Math.max(2, prev - 1))}
                >
                  <Ionicons name="remove" size={18} color={studentCount <= 2 ? COLORS.textMuted : COLORS.primary} />
                </TouchableOpacity>
                <View style={styles.counterDisplay}>
                  <Text style={styles.counterDisplayText}>{studentCount}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.counterBtn, studentCount >= room.capacity && styles.counterBtnDisabled]}
                  disabled={studentCount >= room.capacity}
                  onPress={() => setStudentCount((prev) => Math.min(room.capacity, prev + 1))}
                >
                  <Ionicons name="add" size={18} color={studentCount >= room.capacity ? COLORS.textMuted : COLORS.primary} />
                </TouchableOpacity>
                <Text style={styles.maxCapNote}>(Tối đa: {room.capacity} chỗ)</Text>
              </View>
            </View>

            {/* Nhập mục đích sử dụng */}
            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Mục đích sử dụng phòng:</Text>
              <TextInput
                style={styles.textInput}
                placeholder="VD: Họp nhóm chuẩn bị báo cáo môn học..."
                placeholderTextColor={COLORS.textMuted}
                value={purpose}
                onChangeText={setPurpose}
              />

              {/* Gợi ý nhanh */}
              <View style={styles.suggestionsContainer}>
                {PURPOSE_SUGGESTIONS.map((item, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.suggestionChip, purpose === item && styles.suggestionChipActive]}
                    onPress={() => setPurpose(item)}
                  >
                    <Text
                      style={[
                        styles.suggestionChipText,
                        purpose === item && styles.suggestionChipTextActive,
                      ]}
                    >
                      {item}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Thông báo nhắc nhở trước 15 phút */}
            <View style={styles.notificationAlert}>
              <Ionicons name="notifications-circle" size={22} color={COLORS.accent} />
              <View style={{ flex: 1 }}>
                <Text style={styles.notifTitle}>Thông báo nhắc nhở tự động</Text>
                <Text style={styles.notifBody}>
                  Hệ thống sẽ gửi thông báo đến điện thoại trước 15 phút khi ca học bắt đầu kèm mã QR để bạn check-in nhanh tại cửa.
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* Footer nút hành động */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Quay lại</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitBtn, loading && { opacity: 0.7 }]}
              onPress={handleConfirm}
              disabled={loading}
            >
              <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
              <Text style={styles.submitBtnText}>
                {loading ? 'Đang xử lý...' : 'Xác nhận Đặt phòng'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.cardBg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: COLORS.tagBg,
  },
  scrollBody: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  summaryCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 14,
  },
  roomHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roomCodeBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  roomCodeText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  roomNameText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    flex: 1,
  },
  infoDivider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  infoText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  boldText: {
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  studentCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: 16,
  },
  studentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  studentTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  studentName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  studentMajor: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  formGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  countNumber: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  counterBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: COLORS.tagBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterBtnDisabled: {
    opacity: 0.4,
  },
  counterDisplay: {
    minWidth: 40,
    alignItems: 'center',
  },
  counterDisplayText: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  maxCapNote: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  textInput: {
    backgroundColor: COLORS.tagBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.textPrimary,
    marginBottom: 8,
    ...Platform.select({
      web: { outlineStyle: 'none' },
    }),
  },
  suggestionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  suggestionChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: COLORS.tagBg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  suggestionChipActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  suggestionChipText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  suggestionChipTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  notificationAlert: {
    flexDirection: 'row',
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    gap: 10,
    marginBottom: 10,
  },
  notifTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#166534',
    marginBottom: 2,
  },
  notifBody: {
    fontSize: 11,
    color: '#15803D',
    lineHeight: 16,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.tagBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  submitBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
