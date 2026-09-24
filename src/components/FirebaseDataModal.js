import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Platform,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { firebaseService } from '../services/firebaseService';
import {
  getStoredFirebaseConfig,
  saveStoredFirebaseConfig,
  resetFirebaseConfig,
} from '../config/firebaseConfig';
import { formatDateDisplay } from '../utils/helpers';

export const FirebaseDataModal = ({ visible, onClose, onRefreshStore }) => {
  const [activeTab, setActiveTab] = useState('bookings'); // 'bookings' | 'users' | 'rooms' | 'config'
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    rooms: [],
    users: [],
    bookings: [],
    stats: {},
  });

  // Cấu hình Firebase
  const [config, setConfig] = useState(null);
  const [editingDbUrl, setEditingDbUrl] = useState('');
  const [editingProjectId, setEditingProjectId] = useState('');
  const [connStatus, setConnStatus] = useState(null);

  useEffect(() => {
    if (visible) {
      loadData();
      loadConfig();
    }
  }, [visible]);

  const loadData = async () => {
    setLoading(true);
    try {
      const overview = await firebaseService.getDatabaseOverview();
      setData(overview);
      const conn = await firebaseService.checkConnection();
      setConnStatus(conn);
    } catch (e) {
      console.warn('Lỗi đọc dữ liệu Firebase:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadConfig = async () => {
    const cfg = await getStoredFirebaseConfig();
    setConfig(cfg);
    setEditingDbUrl(cfg.databaseURL || '');
    setEditingProjectId(cfg.projectId || '');
  };

  const handleSaveConfig = async () => {
    if (!editingDbUrl.trim()) return;
    setLoading(true);
    const updated = await saveStoredFirebaseConfig({
      ...config,
      projectId: editingProjectId.trim(),
      databaseURL: editingDbUrl.trim(),
    });
    firebaseService.setConfig(updated);
    setConfig(updated);
    const conn = await firebaseService.checkConnection();
    setConnStatus(conn);
    setLoading(false);

    if (onRefreshStore) onRefreshStore();
    const msg = 'Đã cập nhật cấu hình kết nối Firebase!';
    Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Thành công', msg);
  };

  const handleResetDefaultConfig = async () => {
    setLoading(true);
    const def = await resetFirebaseConfig();
    firebaseService.setConfig(def);
    setConfig(def);
    setEditingDbUrl(def.databaseURL);
    setEditingProjectId(def.projectId);
    const conn = await firebaseService.checkConnection();
    setConnStatus(conn);
    setLoading(false);

    if (onRefreshStore) onRefreshStore();
    const msg = 'Đã khôi phục cấu hình Firebase mặc định!';
    Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Thông báo', msg);
  };

  const handleSyncToFirebase = async () => {
    setLoading(true);
    const res = await firebaseService.syncAllToFirebase();
    await loadData();
    if (onRefreshStore) onRefreshStore();
    setLoading(false);
    Platform.OS === 'web' ? window.alert(res.message) : Alert.alert('Đồng bộ', res.message);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerLeft}>
              <View style={styles.firebaseLogoBadge}>
                <Ionicons name="flame" size={24} color="#F59E0B" />
              </View>
              <View>
                <Text style={styles.modalTitle}>Firebase Cloud Database</Text>
                <Text style={styles.modalSubtitle}>
                  {connStatus?.connected ? '🟢 Trực tuyến' : '🟡 Offline Cache'} • Project: {config?.projectId}
                </Text>
              </View>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Thanh chuyển Tabs */}
          <View style={styles.tabSelector}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'bookings' && styles.tabBtnActive]}
              onPress={() => setActiveTab('bookings')}
            >
              <Ionicons
                name="calendar"
                size={14}
                color={activeTab === 'bookings' ? COLORS.primary : COLORS.textMuted}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'bookings' && styles.tabBtnTextActive,
                ]}
              >
                Đã đặt phòng ({data.totalBookings || 0})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'users' && styles.tabBtnActive]}
              onPress={() => setActiveTab('users')}
            >
              <Ionicons
                name="people"
                size={14}
                color={activeTab === 'users' ? COLORS.primary : COLORS.textMuted}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'users' && styles.tabBtnTextActive,
                ]}
              >
                Tài khoản ({data.totalUsers || 0})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'rooms' && styles.tabBtnActive]}
              onPress={() => setActiveTab('rooms')}
            >
              <Ionicons
                name="business"
                size={14}
                color={activeTab === 'rooms' ? COLORS.primary : COLORS.textMuted}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'rooms' && styles.tabBtnTextActive,
                ]}
              >
                Phòng học ({data.totalRooms || 0})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'config' && styles.tabBtnActive]}
              onPress={() => setActiveTab('config')}
            >
              <Ionicons
                name="settings-outline"
                size={14}
                color={activeTab === 'config' ? COLORS.primary : COLORS.textMuted}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'config' && styles.tabBtnTextActive,
                ]}
              >
                Cấu hình
              </Text>
            </TouchableOpacity>
          </View>

          {/* Nội dung dữ liệu */}
          <ScrollView
            style={styles.modalBody}
            contentContainerStyle={{ paddingBottom: 24 }}
            showsVerticalScrollIndicator={false}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Đang tải dữ liệu từ Firebase...</Text>
              </View>
            ) : (
              <>
                {/* ================= TAB 1: AI ĐÃ ĐẶT PHÒNG HỌC NÀO ================= */}
                {activeTab === 'bookings' && (
                  <View style={styles.listContainer}>
                    <View style={styles.sectionHeaderRow}>
                      <Text style={styles.sectionTitle}>
                        Danh sách tài khoản đã đặt phòng học trên Firebase
                      </Text>
                      <TouchableOpacity
                        style={styles.syncSmallBtn}
                        onPress={handleSyncToFirebase}
                      >
                        <Ionicons name="cloud-upload-outline" size={13} color="#FFFFFF" />
                        <Text style={styles.syncSmallBtnText}>Đồng bộ Firebase</Text>
                      </TouchableOpacity>
                    </View>

                    {data.bookings && data.bookings.length > 0 ? (
                      data.bookings.map((b) => (
                        <View key={b.id} style={styles.bookingItemCard}>
                          <View style={styles.bookingItemHeader}>
                            <View style={styles.roomTag}>
                              <Text style={styles.roomTagText}>{b.roomCode}</Text>
                            </View>
                            <Text style={styles.roomTitle} numberOfLines={1}>
                              {b.roomName}
                            </Text>
                            <View
                              style={[
                                styles.statusBadge,
                                b.status === 'active' && styles.statusBadgeActive,
                                b.status === 'completed' && styles.statusBadgeDone,
                                b.status === 'cancelled' && styles.statusBadgeCancel,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.statusBadgeText,
                                  b.status === 'active' && { color: '#065F46' },
                                  b.status === 'completed' && { color: '#1E40AF' },
                                  b.status === 'cancelled' && { color: '#64748B' },
                                ]}
                              >
                                {b.status === 'active' ? 'Đang hiệu lực' : b.status === 'completed' ? 'Đã check-in' : 'Đã hủy'}
                              </Text>
                            </View>
                          </View>

                          {/* Thông tin tài khoản người đặt trên Firebase */}
                          <View style={styles.userBookingInfo}>
                            <Ionicons name="person-circle-outline" size={16} color={COLORS.primary} />
                            <Text style={styles.userBookingName}>
                              Người đặt:{' '}
                              <Text style={{ fontWeight: '800', color: COLORS.textPrimary }}>
                                {b.userName || b.userEmail}
                              </Text>{' '}
                              {b.userEmail ? `(${b.userEmail})` : ''}
                            </Text>

                            {/* Badge Provider Google / Facebook */}
                            {b.authProvider === 'google' && (
                              <View style={styles.providerBadgeGoogle}>
                                <Ionicons name="logo-google" size={10} color="#EA4335" />
                                <Text style={styles.providerBadgeGoogleText}>Google</Text>
                              </View>
                            )}
                            {b.authProvider === 'facebook' && (
                              <View style={styles.providerBadgeFb}>
                                <Ionicons name="logo-facebook" size={10} color="#1877F2" />
                                <Text style={styles.providerBadgeFbText}>Facebook</Text>
                              </View>
                            )}
                          </View>

                          <View style={styles.itemDetailRow}>
                            <Ionicons name="calendar-outline" size={13} color={COLORS.textSecondary} />
                            <Text style={styles.itemDetailText}>
                              Ngày: {formatDateDisplay(b.dateStr)} ({b.slotTime})
                            </Text>
                          </View>

                          <View style={styles.itemDetailRow}>
                            <Ionicons name="chatbox-ellipses-outline" size={13} color={COLORS.textSecondary} />
                            <Text style={styles.itemDetailText} numberOfLines={1}>
                              Mục đích: {b.purpose} • {b.studentCount} người
                            </Text>
                          </View>

                          <View style={styles.bookingIdRow}>
                            <Text style={styles.bookingCodeText}>Mã đặt: {b.bookingCode}</Text>
                            <Text style={styles.bookingNodeText}>Node: /bookings/{b.id}</Text>
                          </View>
                        </View>
                      ))
                    ) : (
                      <View style={styles.emptyState}>
                        <Ionicons name="calendar-outline" size={40} color={COLORS.textMuted} />
                        <Text style={styles.emptyText}>Chưa có lịch đặt phòng nào trên Firebase</Text>
                      </View>
                    )}
                  </View>
                )}

                {/* ================= TAB 2: TÀI KHOẢN ĐĂNG KÝ ================= */}
                {activeTab === 'users' && (
                  <View style={styles.listContainer}>
                    <Text style={styles.sectionTitle}>
                      Tài khoản người dùng đã đăng ký trên Firebase (/users)
                    </Text>

                    {data.users && data.users.length > 0 ? (
                      data.users.map((u) => (
                        <View key={u.id} style={styles.userCard}>
                          <Image
                            source={{
                              uri:
                                u.avatar ||
                                'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
                            }}
                            style={styles.userAvatar}
                          />
                          <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <Text style={styles.userNameText}>{u.name}</Text>
                              {u.authProvider === 'google' && (
                                <View style={styles.providerBadgeGoogle}>
                                  <Ionicons name="logo-google" size={10} color="#EA4335" />
                                  <Text style={styles.providerBadgeGoogleText}>Google</Text>
                                </View>
                              )}
                              {u.authProvider === 'facebook' && (
                                <View style={styles.providerBadgeFb}>
                                  <Ionicons name="logo-facebook" size={10} color="#1877F2" />
                                  <Text style={styles.providerBadgeFbText}>Facebook</Text>
                                </View>
                              )}
                              {(!u.authProvider || u.authProvider === 'email') && (
                                <View style={styles.providerBadgeEmail}>
                                  <Text style={styles.providerBadgeEmailText}>Email</Text>
                                </View>
                              )}
                            </View>

                            <Text style={styles.userEmailText}>{u.email}</Text>
                            <Text style={styles.userMetaText}>
                              Tài khoản: <Text style={{ fontWeight: '700' }}>{u.authProvider || 'email'}</Text> • ID: {u.id}
                            </Text>
                          </View>
                        </View>
                      ))
                    ) : (
                      <View style={styles.emptyState}>
                        <Ionicons name="people-outline" size={40} color={COLORS.textMuted} />
                        <Text style={styles.emptyText}>Chưa có tài khoản nào trên Firebase</Text>
                      </View>
                    )}
                  </View>
                )}

                {/* ================= TAB 3: PHÒNG HỌC TRÊN FIREBASE ================= */}
                {activeTab === 'rooms' && (
                  <View style={styles.listContainer}>
                    <Text style={styles.sectionTitle}>
                      Cơ sở dữ liệu danh mục phòng học trên Firebase (/rooms)
                    </Text>

                    {data.rooms && data.rooms.length > 0 ? (
                      data.rooms.map((r) => (
                        <View key={r.id} style={styles.roomItemCard}>
                          <Image source={{ uri: r.image }} style={styles.roomThumb} />
                          <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                              <View style={styles.roomCodePill}>
                                <Text style={styles.roomCodePillText}>{r.code}</Text>
                              </View>
                              <Text style={styles.roomCardName} numberOfLines={1}>
                                {r.name}
                              </Text>
                            </View>
                            <Text style={styles.roomCardSub}>
                              Tòa {r.building} • {r.floor} • Sức chứa: {r.capacity} sinh viên
                            </Text>
                            <Text style={styles.roomSpecsText} numberOfLines={1}>
                              {r.specs}
                            </Text>
                          </View>
                        </View>
                      ))
                    ) : (
                      <View style={styles.emptyState}>
                        <Ionicons name="business-outline" size={40} color={COLORS.textMuted} />
                        <Text style={styles.emptyText}>Chưa có danh mục phòng học</Text>
                      </View>
                    )}
                  </View>
                )}

                {/* ================= TAB 4: CẤU HÌNH KẾT NỐI FIREBASE ================= */}
                {activeTab === 'config' && (
                  <View style={styles.configContainer}>
                    <Text style={styles.sectionTitle}>Cấu hình kết nối Firebase Cloud</Text>

                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Firebase Project ID:</Text>
                      <TextInput
                        style={styles.configInput}
                        value={editingProjectId}
                        onChangeText={setEditingProjectId}
                        placeholder="vku-datphonghoc-db"
                        placeholderTextColor={COLORS.textMuted}
                        autoCapitalize="none"
                      />
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Firebase Database REST URL:</Text>
                      <TextInput
                        style={styles.configInput}
                        value={editingDbUrl}
                        onChangeText={setEditingDbUrl}
                        placeholder="https://vku-datphonghoc-db-default-rtdb.firebaseio.com"
                        placeholderTextColor={COLORS.textMuted}
                        autoCapitalize="none"
                      />
                    </View>

                    <View style={styles.configStatusBox}>
                      <Text style={styles.configStatusTitle}>Trạng thái kết nối hiện tại:</Text>
                      <Text style={styles.configStatusText}>
                        {connStatus?.connected ? '✅ Kết nối trực tiếp thành công' : '⚠️ ' + (connStatus?.message || 'Chế độ Local Cache')}
                      </Text>
                    </View>

                    <View style={styles.configBtnRow}>
                      <TouchableOpacity
                        style={styles.saveConfigBtn}
                        onPress={handleSaveConfig}
                      >
                        <Ionicons name="save-outline" size={16} color="#FFFFFF" />
                        <Text style={styles.saveConfigBtnText}>Lưu cấu hình</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.resetConfigBtn}
                        onPress={handleResetDefaultConfig}
                      >
                        <Ionicons name="refresh-outline" size={16} color={COLORS.textSecondary} />
                        <Text style={styles.resetConfigBtnText}>Mặc định</Text>
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                      style={styles.seedAllBtn}
                      onPress={handleSyncToFirebase}
                    >
                      <Ionicons name="cloud-upload" size={18} color="#FFFFFF" />
                      <Text style={styles.seedAllBtnText}>
                        Đồng bộ tất cả dữ liệu mẫu lên Firebase ngay
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 14,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 580,
    maxHeight: '92%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 24,
      },
      android: {
        elevation: 12,
      },
      web: {
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
      },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    backgroundColor: '#FFFBEB',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  firebaseLogoBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FDE68A',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#92400E',
  },
  modalSubtitle: {
    fontSize: 11,
    color: '#B45309',
    marginTop: 2,
    fontWeight: '600',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  tabSelector: {
    flexDirection: 'row',
    backgroundColor: COLORS.tagBg,
    padding: 4,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  tabBtnActive: {
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
      android: { elevation: 1 },
      web: { boxShadow: '0 1px 3px rgba(0,0,0,0.08)' },
    }),
  },
  tabBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  tabBtnTextActive: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  modalBody: {
    padding: 16,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  listContainer: {
    gap: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textPrimary,
    flex: 1,
  },
  syncSmallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  syncSmallBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  bookingItemCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    gap: 6,
  },
  bookingItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roomTag: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  roomTagText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  roomTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textPrimary,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeActive: {
    backgroundColor: '#D1FAE5',
  },
  statusBadgeDone: {
    backgroundColor: '#DBEAFE',
  },
  statusBadgeCancel: {
    backgroundColor: '#F1F5F9',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  userBookingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    padding: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  userBookingName: {
    fontSize: 12,
    color: COLORS.textSecondary,
    flex: 1,
  },
  providerBadgeGoogle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  providerBadgeGoogleText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#DC2626',
  },
  providerBadgeFb: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  providerBadgeFbText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#1D4ED8',
  },
  providerBadgeEmail: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  providerBadgeEmailText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
  },
  itemDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  itemDetailText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  bookingIdRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingTop: 6,
    marginTop: 2,
  },
  bookingCodeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary,
  },
  bookingNodeText: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  userNameText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  userEmailText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  userMetaText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  roomItemCard: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  roomThumb: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  roomCodePill: {
    backgroundColor: COLORS.tagBg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  roomCodePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
  },
  roomCardName: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textPrimary,
    flex: 1,
  },
  roomCardSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  roomSpecsText: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  emptyState: {
    paddingVertical: 30,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  configContainer: {
    gap: 14,
  },
  inputGroup: {
    gap: 4,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  configInput: {
    backgroundColor: COLORS.tagBg,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    fontSize: 12,
    color: COLORS.textPrimary,
    ...Platform.select({
      web: { outlineStyle: 'none' },
    }),
  },
  configStatusBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  configStatusTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  configStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  configBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  saveConfigBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 10,
  },
  saveConfigBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  resetConfigBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: '#FFFFFF',
  },
  resetConfigBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  seedAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#D97706',
    paddingVertical: 13,
    borderRadius: 12,
    marginTop: 4,
  },
  seedAllBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
