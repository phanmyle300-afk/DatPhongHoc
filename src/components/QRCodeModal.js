import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { COLORS } from '../constants/colors';
import { formatDateDisplay } from '../utils/helpers';
import { useBookingStore } from '../store/useBookingStore';

export const QRCodeModal = ({ visible, booking, onClose }) => {
  const { checkInBooking } = useBookingStore();
  const [copied, setCopied] = useState(false);

  if (!booking) return null;

  const qrData = JSON.stringify({
    code: booking.bookingCode,
    room: booking.roomCode,
    date: booking.dateStr,
    slot: booking.slotTime,
    user: booking.userEmail || booking.userName,
  });

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    if (Platform.OS !== 'web') {
      Alert.alert('Đã sao chép', `Mã đặt phòng: ${booking.bookingCode}`);
    }
  };

  const handleCheckInNow = () => {
    checkInBooking(booking.id);
    if (Platform.OS === 'web') {
      window.alert('✅ Check-in nhận phòng thành công! Chúc bạn có buổi học hiệu quả.');
    } else {
      Alert.alert('Thành công', '✅ Check-in nhận phòng thành công! Chúc bạn có buổi học hiệu quả.');
    }
  };

  const isCompleted = booking.status === 'completed';

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoRow}>
              <Ionicons name="qr-code" size={24} color={COLORS.primary} />
              <Text style={styles.title}>Mã Check-in VKU</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Vùng QR Code */}
          <View style={styles.qrWrapper}>
            <View style={styles.qrInner}>
              <QRCode
                value={qrData}
                size={180}
                color={COLORS.primaryDark}
                backgroundColor="#FFFFFF"
              />
            </View>

            {/* Trạng thái check-in */}
            <View
              style={[
                styles.statusPill,
                isCompleted ? styles.statusCompleted : styles.statusPending,
              ]}
            >
              <Ionicons
                name={isCompleted ? 'checkmark-circle' : 'time'}
                size={16}
                color={isCompleted ? '#065F46' : '#B45309'}
              />
              <Text
                style={[
                  styles.statusPillText,
                  { color: isCompleted ? '#065F46' : '#B45309' },
                ]}
              >
                {isCompleted ? 'ĐÃ CHECK-IN TẠI CỬA' : 'CHỜ CHECK-IN KHI ĐẾN PHÒNG'}
              </Text>
            </View>
          </View>

          {/* Mã đặt chỗ độc nhất */}
          <View style={styles.codeContainer}>
            <Text style={styles.codeLabel}>MÃ ĐẶT CHỖ ĐỘC NHẤT</Text>
            <View style={styles.codeRow}>
              <Text style={styles.bookingCodeText}>{booking.bookingCode}</Text>
              <TouchableOpacity onPress={handleCopy} style={styles.copyBtn}>
                <Ionicons
                  name={copied ? 'checkmark' : 'copy-outline'}
                  size={16}
                  color={COLORS.primary}
                />
                <Text style={styles.copyBtnText}>
                  {copied ? 'Đã chép' : 'Sao chép'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Chi tiết ca học */}
          <View style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Phòng học:</Text>
              <Text style={styles.detailValue}>
                {booking.roomCode} ({booking.roomName})
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Thời gian:</Text>
              <Text style={styles.detailValue}>
                {formatDateDisplay(booking.dateStr)} | {booking.slotTime}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Người đặt:</Text>
              <Text style={styles.detailValue}>
                {booking.userName} {booking.userEmail ? `(${booking.userEmail})` : ''}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Mục đích:</Text>
              <Text style={styles.detailValue} numberOfLines={1}>
                {booking.purpose} ({booking.studentCount} người)
              </Text>
            </View>
          </View>

          {/* Nút hành động check-in mô phỏng */}
          <View style={styles.footerActions}>
            {!isCompleted ? (
              <TouchableOpacity
                style={styles.checkInActionBtn}
                onPress={handleCheckInNow}
              >
                <Ionicons name="scan" size={18} color="#FFFFFF" />
                <Text style={styles.checkInActionText}>
                  Xác nhận Check-in ngay
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.doneMessage}>
                <Ionicons name="shield-checkmark" size={18} color={COLORS.available} />
                <Text style={styles.doneMessageText}>
                  Bạn đã check-in thành công phòng này.
                </Text>
              </View>
            )}
            <TouchableOpacity style={styles.doneBtn} onPress={onClose}>
              <Text style={styles.doneBtnText}>Đóng</Text>
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
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
      },
    }),
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.primary,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: COLORS.tagBg,
  },
  qrWrapper: {
    alignItems: 'center',
    marginBottom: 16,
  },
  qrInner: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusPending: {
    backgroundColor: COLORS.pendingBg,
  },
  statusCompleted: {
    backgroundColor: COLORS.availableBg,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  codeContainer: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    marginBottom: 14,
  },
  codeLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bookingCodeText: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  copyBtnText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '700',
  },
  detailsCard: {
    width: '100%',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 12,
    gap: 6,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 12,
    color: COLORS.textPrimary,
    fontWeight: '700',
    maxWidth: '65%',
    textAlign: 'right',
  },
  footerActions: {
    width: '100%',
    gap: 8,
  },
  checkInActionBtn: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.available,
    paddingVertical: 12,
    borderRadius: 12,
  },
  checkInActionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  doneMessage: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  doneMessageText: {
    fontSize: 13,
    color: '#065F46',
    fontWeight: '600',
  },
  doneBtn: {
    width: '100%',
    paddingVertical: 10,
    backgroundColor: COLORS.tagBg,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  doneBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
});
