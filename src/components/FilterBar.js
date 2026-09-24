import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { BUILDINGS, AMENITIES_LIST } from '../constants/slots';
import { useBookingStore } from '../store/useBookingStore';

const CAPACITY_OPTIONS = [
  { label: 'Sức chứa', value: 0 },
  { label: '≥ 4 người', value: 4 },
  { label: '≥ 8 người', value: 8 },
  { label: '≥ 15 người', value: 15 },
  { label: '≥ 20 người', value: 20 },
];

export const FilterBar = () => {
  const {
    filters,
    setSearchQuery,
    setSelectedBuilding,
    setMinCapacity,
    toggleAmenity,
    setOnlyAvailableNow,
    resetFilters,
  } = useBookingStore();

  const [isAdvancedExpanded, setIsAdvancedExpanded] = useState(false);

  const activeFiltersCount =
    (filters.selectedBuilding !== 'ALL' ? 1 : 0) +
    (filters.minCapacity > 0 ? 1 : 0) +
    filters.selectedAmenities.length +
    (filters.onlyAvailableNow ? 1 : 0) +
    (filters.searchQuery.trim() ? 1 : 0);

  return (
    <View style={styles.container}>
      {/* Khung tìm kiếm từ khóa */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm tên phòng, mã phòng, thiết bị..."
            placeholderTextColor={COLORS.textMuted}
            value={filters.searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
          {filters.searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Nút mở rộng bộ lọc nâng cao */}
        <TouchableOpacity
          style={[
            styles.filterToggleBtn,
            activeFiltersCount > 0 && styles.filterToggleBtnActive,
          ]}
          onPress={() => setIsAdvancedExpanded(!isAdvancedExpanded)}
        >
          <Ionicons
            name="options-outline"
            size={20}
            color={activeFiltersCount > 0 ? '#FFFFFF' : COLORS.textSecondary}
          />
          {activeFiltersCount > 0 && (
            <View style={styles.badgeCount}>
              <Text style={styles.badgeCountText}>{activeFiltersCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Thanh trượt chọn tòa nhà A, B, C, V */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.buildingsScroll}
      >
        {BUILDINGS.map((building) => {
          const isSelected = filters.selectedBuilding === building.id;
          return (
            <TouchableOpacity
              key={building.id}
              style={[
                styles.buildingPill,
                isSelected && styles.buildingPillActive,
              ]}
              onPress={() => setSelectedBuilding(building.id)}
            >
              <Text
                style={[
                  styles.buildingPillText,
                  isSelected && styles.buildingPillTextActive,
                ]}
              >
                {building.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Khu vực bộ lọc mở rộng (Sức chứa, tiện ích thiết bị, phòng trống) */}
      {isAdvancedExpanded && (
        <View style={styles.advancedFiltersPanel}>
          {/* Lọc sức chứa */}
          <Text style={styles.sectionTitle}>Sức chứa sinh viên:</Text>
          <View style={styles.chipsRow}>
            {CAPACITY_OPTIONS.map((cap) => {
              const isSelected = filters.minCapacity === cap.value;
              return (
                <TouchableOpacity
                  key={cap.value}
                  style={[
                    styles.filterChip,
                    isSelected && styles.filterChipActive,
                  ]}
                  onPress={() => setMinCapacity(cap.value)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      isSelected && styles.filterChipTextActive,
                    ]}
                  >
                    {cap.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Lọc trang thiết bị (Máy chiếu, Bảng trắng, PC cấu hình cao, Điều hòa) */}
          <Text style={styles.sectionTitle}>Trang thiết bị cần có:</Text>
          <View style={styles.chipsRow}>
            {AMENITIES_LIST.map((item) => {
              const isSelected = filters.selectedAmenities.includes(item.name);
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.amenityFilterChip,
                    isSelected && styles.amenityFilterChipActive,
                  ]}
                  onPress={() => toggleAmenity(item.name)}
                >
                  <Ionicons
                    name={isSelected ? 'checkbox' : 'square-outline'}
                    size={16}
                    color={isSelected ? COLORS.primary : COLORS.textMuted}
                  />
                  <Text
                    style={[
                      styles.amenityFilterText,
                      isSelected && styles.amenityFilterTextActive,
                    ]}
                  >
                    {item.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Tùy chọn chỉ hiện phòng trống ngay */}
          <View style={styles.footerRow}>
            <TouchableOpacity
              style={[
                styles.availableToggle,
                filters.onlyAvailableNow && styles.availableToggleActive,
              ]}
              onPress={() => setOnlyAvailableNow(!filters.onlyAvailableNow)}
            >
              <View
                style={[
                  styles.dotIndicator,
                  {
                    backgroundColor: filters.onlyAvailableNow
                      ? COLORS.available
                      : COLORS.textMuted,
                  },
                ]}
              />
              <Text
                style={[
                  styles.availableToggleText,
                  filters.onlyAvailableNow && styles.availableToggleTextActive,
                ]}
              >
                Chỉ phòng trống ngay
              </Text>
            </TouchableOpacity>

            {activeFiltersCount > 0 && (
              <TouchableOpacity onPress={resetFilters} style={styles.resetBtn}>
                <Ionicons name="refresh" size={14} color={COLORS.occupied} />
                <Text style={styles.resetBtnText}>Đặt lại bộ lọc</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.cardBg,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 12,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.tagBg,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
    ...Platform.select({
      web: { outlineStyle: 'none' },
    }),
  },
  filterToggleBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.tagBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  filterToggleBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  badgeCount: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: COLORS.occupied,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeCountText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  buildingsScroll: {
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 6,
  },
  buildingPill: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: COLORS.tagBg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  buildingPillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  buildingPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  buildingPillTextActive: {
    color: '#FFFFFF',
  },
  advancedFiltersPanel: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    marginTop: 6,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 8,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: COLORS.tagBg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  amenityFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: COLORS.tagBg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  amenityFilterChipActive: {
    backgroundColor: '#EFF6FF',
    borderColor: COLORS.accent,
  },
  amenityFilterText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  amenityFilterTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    marginBottom: 6,
  },
  availableToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  availableToggleActive: {},
  dotIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  availableToggleText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  availableToggleTextActive: {
    color: '#065F46',
    fontWeight: '700',
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  resetBtnText: {
    fontSize: 12,
    color: COLORS.occupied,
    fontWeight: '600',
  },
});
