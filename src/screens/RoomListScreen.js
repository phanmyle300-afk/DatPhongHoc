import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { RoomCard } from '../components/RoomCard';
import { FilterBar } from '../components/FilterBar';
import { useBookingStore } from '../store/useBookingStore';

export const RoomListScreen = ({ onSelectRoom }) => {
  const { rooms, filters, resetFilters } = useBookingStore();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 600);
  }, []);

  // Lọc phòng theo đa thông số (Tòa nhà, Sức chứa, Tiện ích thiết bị, Từ khóa, Trạng thái)
  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      // 1. Lọc theo từ khóa tìm kiếm
      if (filters.searchQuery.trim()) {
        const query = filters.searchQuery.toLowerCase().trim();
        const matchName = room.name.toLowerCase().includes(query);
        const matchCode = room.code.toLowerCase().includes(query);
        const matchSpecs = room.specs.toLowerCase().includes(query);
        const matchAmenities = room.amenities.some((a) =>
          a.toLowerCase().includes(query)
        );
        if (!matchName && !matchCode && !matchSpecs && !matchAmenities) {
          return false;
        }
      }

      // 2. Lọc theo Tòa nhà (A, B, C, V)
      if (filters.selectedBuilding !== 'ALL' && room.building !== filters.selectedBuilding) {
        return false;
      }

      // 3. Lọc theo Sức chứa tối thiểu
      if (filters.minCapacity > 0 && room.capacity < filters.minCapacity) {
        return false;
      }

      // 4. Lọc theo Trang thiết bị đã chọn (phải có tất cả các tiện ích được chọn)
      if (filters.selectedAmenities.length > 0) {
        const hasAllAmenities = filters.selectedAmenities.every((amenity) =>
          room.amenities.includes(amenity)
        );
        if (!hasAllAmenities) return false;
      }

      // 5. Lọc chỉ phòng đang trống (Available Now)
      if (filters.onlyAvailableNow && !room.isAvailableNow) {
        return false;
      }

      return true;
    });
  }, [rooms, filters]);

  const handleRoomPress = useCallback(
    (room) => {
      onSelectRoom(room);
    },
    [onSelectRoom]
  );

  const renderRoomItem = useCallback(
    ({ item }) => <RoomCard room={item} onPress={handleRoomPress} />,
    [handleRoomPress]
  );

  const keyExtractor = useCallback((item) => item.id, []);

  // Header của danh sách: FilterBar + Thống kê kết quả
  const renderListHeader = useMemo(() => {
    return (
      <View>
        <FilterBar />
        <View style={styles.resultsBar}>
          <Text style={styles.resultsCountText}>
            Tìm thấy <Text style={styles.highlightCount}>{filteredRooms.length}</Text> phòng học & lab
          </Text>
          <View style={styles.liveIndicator}>
            <View style={styles.pulseDot} />
            <Text style={styles.liveText}>Thời gian thực</Text>
          </View>
        </View>
      </View>
    );
  }, [filteredRooms.length]);

  // Giao diện khi không có phòng nào thỏa mãn bộ lọc
  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="search-outline" size={56} color={COLORS.textMuted} />
      <Text style={styles.emptyTitle}>Không tìm thấy phòng phù hợp</Text>
      <Text style={styles.emptySubtitle}>
        Hãy thử giảm bớt tiêu chí lọc tiện ích hoặc chuyển sang tòa nhà khác.
      </Text>
      <TouchableOpacity style={styles.resetFilterBtn} onPress={resetFilters}>
        <Ionicons name="refresh" size={16} color="#FFFFFF" />
        <Text style={styles.resetFilterText}>Đặt lại toàn bộ bộ lọc</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.screenContainer}>
      <FlatList
        data={filteredRooms}
        renderItem={renderRoomItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={renderListHeader}
        ListEmptyComponent={renderEmptyComponent}
        // Tối ưu hiệu năng danh sách 60 FPS
        initialNumToRender={5}
        maxToRenderPerBatch={6}
        windowSize={5}
        removeClippedSubviews={Platform.OS !== 'web'}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  listContent: {
    paddingBottom: 30,
  },
  resultsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  resultsCountText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  highlightCount: {
    fontWeight: '800',
    color: COLORS.primary,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.available,
  },
  liveText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065F46',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 16,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  resetFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  resetFilterText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
