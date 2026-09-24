import React, { memo } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';

const getAmenityIcon = (name) => {
  switch (name) {
    case 'Máy chiếu':
      return <Ionicons name="videocam-outline" size={14} color={COLORS.textSecondary} />;
    case 'Bảng trắng':
      return <MaterialCommunityIcons name="presentation" size={14} color={COLORS.textSecondary} />;
    case 'Máy tính cấu hình cao':
      return <Ionicons name="desktop-outline" size={14} color={COLORS.textSecondary} />;
    case 'Điều hòa':
      return <Ionicons name="snow-outline" size={14} color={COLORS.textSecondary} />;
    default:
      return <Ionicons name="checkmark-circle-outline" size={14} color={COLORS.textSecondary} />;
  }
};

const RoomCardComponent = ({ room, onPress }) => {
  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={() => onPress(room)}
      style={styles.cardContainer}
    >
      {/* Ảnh phòng & Badges nổi */}
      <View style={styles.imageWrapper}>
        <Image
          source={{ uri: room.image }}
          style={styles.roomImage}
          resizeMode="cover"
        />
        <View style={styles.gradientOverlay} />

        {/* Badge Tòa nhà & Tầng */}
        <View style={styles.buildingBadge}>
          <Ionicons name="business" size={13} color="#FFFFFF" />
          <Text style={styles.buildingBadgeText}>
            {room.buildingName.split(' - ')[0]} • {room.floor}
          </Text>
        </View>

        {/* Badge Trạng thái thời gian thực: Available Now vs Occupied */}
        <View
          style={[
            styles.statusBadge,
            room.isAvailableNow ? styles.statusAvailable : styles.statusOccupied,
          ]}
        >
          <View
            style={[
              styles.statusDot,
              { backgroundColor: room.isAvailableNow ? COLORS.available : COLORS.occupied },
            ]}
          />
          <Text
            style={[
              styles.statusText,
              { color: room.isAvailableNow ? '#065F46' : '#991B1B' },
            ]}
          >
            {room.isAvailableNow ? 'Available Now' : 'Occupied'}
          </Text>
        </View>
      </View>

      {/* Thông tin phòng */}
      <View style={styles.contentContainer}>
        <View style={styles.headerRow}>
          <View style={styles.titleArea}>
            <View style={styles.codeTag}>
              <Text style={styles.codeTagText}>{room.code}</Text>
            </View>
            <Text style={styles.roomName} numberOfLines={1}>
              {room.name}
            </Text>
          </View>
        </View>

        {/* Dòng sức chứa và đánh giá */}
        <View style={styles.metaRow}>
          <View style={styles.capacityBadge}>
            <Ionicons name="people" size={15} color={COLORS.primary} />
            <Text style={styles.capacityText}>Sức chứa: {room.capacity} sinh viên</Text>
          </View>
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={14} color="#F59E0B" />
            <Text style={styles.ratingText}>{room.rating}</Text>
          </View>
        </View>

        {/* Danh sách trang thiết bị / tiện ích dạng Chips */}
        <View style={styles.amenitiesContainer}>
          {room.amenities.map((amenity, index) => (
            <View key={index} style={styles.amenityChip}>
              {getAmenityIcon(amenity)}
              <Text style={styles.amenityText}>{amenity}</Text>
            </View>
          ))}
        </View>

        {/* Nút hành động xem lịch đặt */}
        <View style={styles.actionRow}>
          <Text style={styles.actionHint}>Chạm để xem lịch 7 ngày & đặt ca</Text>
          <View style={styles.bookButton}>
            <Text style={styles.bookButtonText}>Đặt phòng</Text>
            <Ionicons name="arrow-forward" size={15} color="#FFFFFF" />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Ghi nhớ (memoize) thành phần thẻ để FlatList cuộn đạt 60 FPS
export const RoomCard = memo(RoomCardComponent, (prevProps, nextProps) => {
  return (
    prevProps.room.id === nextProps.room.id &&
    prevProps.room.isAvailableNow === nextProps.room.isAvailableNow &&
    prevProps.room.name === nextProps.room.name
  );
});

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 18,
    marginBottom: 16,
    marginHorizontal: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.shadowColor,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 4px 12px rgba(15, 23, 42, 0.07)',
      },
    }),
  },
  imageWrapper: {
    width: '100%',
    height: 170,
    position: 'relative',
    backgroundColor: '#E2E8F0',
  },
  roomImage: {
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  buildingBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(0, 45, 98, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  buildingBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusAvailable: {
    backgroundColor: COLORS.availableBg,
    borderColor: '#A7F3D0',
    borderWidth: 1,
  },
  statusOccupied: {
    backgroundColor: COLORS.occupiedBg,
    borderColor: '#FECACA',
    borderWidth: 1,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  contentContainer: {
    padding: 16,
  },
  headerRow: {
    marginBottom: 8,
  },
  titleArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  codeTag: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  codeTagText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  roomName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  capacityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  capacityText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#B45309',
  },
  amenitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  amenityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.tagBg,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  amenityText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  actionHint: {
    fontSize: 12,
    color: COLORS.textMuted,
    flex: 1,
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
