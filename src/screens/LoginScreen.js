import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { useBookingStore } from '../store/useBookingStore';
import { SocialLoginModal } from '../components/SocialLoginModal';
import { FirebaseDataModal } from '../components/FirebaseDataModal';

export const LoginScreen = ({ onContinueAsGuest }) => {
  const {
    login,
    register,
    loginWithGoogle,
    loginWithFacebook,
    initApp,
  } = useBookingStore();

  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'
  const [loading, setLoading] = useState(false);

  // Modal Đăng nhập Mạng xã hội
  const [socialModalVisible, setSocialModalVisible] = useState(false);
  const [socialProvider, setSocialProvider] = useState('google');

  // Modal Cơ sở dữ liệu Firebase
  const [firebaseModalVisible, setFirebaseModalVisible] = useState(false);

  // Form Đăng nhập
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Form Đăng ký
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  // Xử lý mở Modal Social Login
  const handleOpenSocial = (provider) => {
    setSocialProvider(provider);
    setSocialModalVisible(true);
  };

  // Xác thực OAuth Google / Facebook
  const handleSocialAuth = async (accountPayload) => {
    if (socialProvider === 'google') {
      const res = await loginWithGoogle(accountPayload);
      if (res.success) {
        const msg = `Xin chào ${res.user.name}! Bạn đã đăng nhập thành công bằng Google và đồng bộ tài khoản lên Firebase Database.`;
        Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Thành công', msg);
      }
      return res;
    } else {
      const res = await loginWithFacebook(accountPayload);
      if (res.success) {
        const msg = `Xin chào ${res.user.name}! Bạn đã đăng nhập thành công bằng Facebook và đồng bộ tài khoản lên Firebase Database.`;
        Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Thành công', msg);
      }
      return res;
    }
  };

  // Xử lý đăng nhập thường
  const handleLogin = async (identifier = loginIdentifier, password = loginPassword) => {
    if (!identifier.trim() || !password.trim()) {
      const msg = 'Vui lòng nhập đầy đủ Email và Mật khẩu!';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Thông báo', msg);
      return;
    }

    setLoading(true);
    const result = await login({ identifier, password });
    setLoading(false);

    if (!result.success) {
      Platform.OS === 'web'
        ? window.alert(result.error)
        : Alert.alert('Đăng nhập thất bại', result.error);
    }
  };

  // Xử lý đăng ký thường
  const handleRegister = async () => {
    if (!regName.trim() || !regEmail.trim() || !regPassword.trim()) {
      const msg = 'Vui lòng điền đầy đủ Họ và tên, Email và Mật khẩu!';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Thông báo', msg);
      return;
    }

    if (regConfirmPassword && regPassword !== regConfirmPassword) {
      const msg = 'Mật khẩu xác nhận không khớp!';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Thông báo', msg);
      return;
    }

    setLoading(true);
    const result = await register({
      name: regName.trim(),
      email: regEmail.trim(),
      password: regPassword.trim(),
    });
    setLoading(false);

    if (result.success) {
      const msg = `Chúc mừng ${result.user.name}! Tài khoản của bạn đã được tạo thành công trên hệ thống.`;
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Thành công', msg);
    } else {
      Platform.OS === 'web'
        ? window.alert(result.error)
        : Alert.alert('Đăng ký thất bại', result.error);
    }
  };

  // Đăng nhập nhanh tài khoản mẫu
  const handleQuickLogin = (mssv) => {
    setLoginIdentifier(mssv);
    setLoginPassword('123');
    handleLogin(mssv, '123');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner Hero VKU */}
        <View style={styles.heroHeader}>
          <View style={styles.logoBadge}>
            <Ionicons name="school" size={36} color="#FFFFFF" />
          </View>
          <Text style={styles.univName}>ĐẠI HỌC CÔNG NGHỆ THÔNG TIN & TRUYỀN THÔNG VIỆT - HÀN</Text>
          <Text style={styles.appTitle}>Hệ thống Đặt phòng học VKU</Text>
          <Text style={styles.appSubtitle}>
            Cổng xác thực sinh viên & Cơ sở dữ liệu phòng học trên Firebase
          </Text>
        </View>

        {/* Khung Auth Card */}
        <View style={styles.authCard}>
          {/* NÚT ĐĂNG NHẬP NHANH GOOGLE & FACEBOOK */}
          <View style={styles.socialAuthContainer}>
            <Text style={styles.socialHeaderTitle}>Đăng ký & Đăng nhập 1-chạm:</Text>

            <View style={styles.socialBtnRow}>
              {/* Nút Google */}
              <TouchableOpacity
                style={styles.googleBtn}
                onPress={() => handleOpenSocial('google')}
                activeOpacity={0.8}
              >
                <View style={styles.socialIconCircle}>
                  <Ionicons name="logo-google" size={18} color="#EA4335" />
                </View>
                <Text style={styles.googleBtnText}>Google</Text>
              </TouchableOpacity>

              {/* Nút Facebook */}
              <TouchableOpacity
                style={styles.facebookBtn}
                onPress={() => handleOpenSocial('facebook')}
                activeOpacity={0.8}
              >
                <View style={[styles.socialIconCircle, { backgroundColor: '#1877F2' }]}>
                  <Ionicons name="logo-facebook" size={18} color="#FFFFFF" />
                </View>
                <Text style={styles.facebookBtnText}>Facebook</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.firebaseBadgeInfo}>
              <Ionicons name="flame" size={14} color="#D97706" />
              <Text style={styles.firebaseBadgeInfoText}>
                Hỗ trợ đăng ký & đồng bộ tự động với Firebase Cloud Database
              </Text>
            </View>
          </View>

          {/* Phân cách */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>HOẶC QUA TÀI KHOẢN EMAIL</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Tabs chuyển đổi Đăng nhập / Đăng ký */}
          <View style={styles.tabSelector}>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'login' && styles.tabButtonActive]}
              onPress={() => setActiveTab('login')}
            >
              <Text
                style={[
                  styles.tabButtonText,
                  activeTab === 'login' && styles.tabButtonTextActive,
                ]}
              >
                Đăng nhập
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'register' && styles.tabButtonActive]}
              onPress={() => setActiveTab('register')}
            >
              <Text
                style={[
                  styles.tabButtonText,
                  activeTab === 'register' && styles.tabButtonTextActive,
                ]}
              >
                Đăng ký tài khoản
              </Text>
            </TouchableOpacity>
          </View>

          {/* ================= FORM ĐĂNG NHẬP ================= */}
          {activeTab === 'login' && (
            <View style={styles.formBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email tài khoản:</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="mail-outline" size={18} color={COLORS.primary} />
                  <TextInput
                    style={styles.input}
                    placeholder="VD: nguyenvana@gmail.com"
                    placeholderTextColor={COLORS.textMuted}
                    value={loginIdentifier}
                    onChangeText={setLoginIdentifier}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Mật khẩu:</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="lock-closed-outline" size={18} color={COLORS.primary} />
                  <TextInput
                    style={styles.input}
                    placeholder="Nhập mật khẩu"
                    placeholderTextColor={COLORS.textMuted}
                    secureTextEntry={!showPassword}
                    value={loginPassword}
                    onChangeText={setLoginPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color={COLORS.textMuted}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Nút đăng nhập */}
              <TouchableOpacity
                style={[styles.primaryBtn, loading && { opacity: 0.7 }]}
                onPress={() => handleLogin()}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.primaryBtnText}>Đăng nhập tài khoản</Text>
                    <Ionicons name="log-in-outline" size={18} color="#FFFFFF" />
                  </>
                )}
              </TouchableOpacity>

              <View style={styles.registerPromptRow}>
                <Text style={styles.registerPromptText}>Chưa có tài khoản? </Text>
                <TouchableOpacity onPress={() => setActiveTab('register')}>
                  <Text style={styles.registerPromptLink}>Đăng ký ngay</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ================= FORM ĐĂNG KÝ ================= */}
          {activeTab === 'register' && (
            <View style={styles.formBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Họ và tên của bạn: *</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="person-outline" size={18} color={COLORS.primary} />
                  <TextInput
                    style={styles.input}
                    placeholder="VD: Phan Thị Mỹ Lệ"
                    placeholderTextColor={COLORS.textMuted}
                    value={regName}
                    onChangeText={setRegName}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email: *</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="mail-outline" size={18} color={COLORS.primary} />
                  <TextInput
                    style={styles.input}
                    placeholder="VD: phanmyle300@gmail.com"
                    placeholderTextColor={COLORS.textMuted}
                    value={regEmail}
                    onChangeText={setRegEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Mật khẩu: *</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="lock-closed-outline" size={18} color={COLORS.primary} />
                  <TextInput
                    style={styles.input}
                    placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)"
                    placeholderTextColor={COLORS.textMuted}
                    secureTextEntry={!showPassword}
                    value={regPassword}
                    onChangeText={setRegPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color={COLORS.textMuted}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Xác nhận lại mật khẩu: *</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="shield-checkmark-outline" size={18} color={COLORS.primary} />
                  <TextInput
                    style={styles.input}
                    placeholder="Nhập lại mật khẩu để xác nhận"
                    placeholderTextColor={COLORS.textMuted}
                    secureTextEntry={!showPassword}
                    value={regConfirmPassword}
                    onChangeText={setRegConfirmPassword}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[styles.primaryBtn, loading && { opacity: 0.7 }]}
                onPress={handleRegister}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.primaryBtnText}>Tạo tài khoản & Lưu vào Firebase</Text>
                    <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Nút Xem Cơ sở dữ liệu Firebase trực tiếp */}
          <TouchableOpacity
            style={styles.viewFirebaseBtn}
            onPress={() => setFirebaseModalVisible(true)}
          >
            <Ionicons name="flame" size={16} color="#D97706" />
            <Text style={styles.viewFirebaseBtnText}>
              Kiểm tra Cơ sở dữ liệu phòng học & lịch đặt trên Firebase
            </Text>
            <Ionicons name="chevron-forward" size={14} color="#D97706" />
          </TouchableOpacity>

          {/* Xem dưới tư cách Khách */}
          {onContinueAsGuest && (
            <TouchableOpacity
              style={styles.guestBtn}
              onPress={onContinueAsGuest}
            >
              <Text style={styles.guestBtnText}>Xem danh sách phòng (Dành cho Khách)</Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Thông tin chân trang */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Hệ thống quản lý phòng học VKU kết nối Firebase Realtime Database & OAuth 2.0 Identity
          </Text>
        </View>
      </ScrollView>

      {/* Modal đăng nhập Google / Facebook */}
      <SocialLoginModal
        visible={socialModalVisible}
        provider={socialProvider}
        onClose={() => setSocialModalVisible(false)}
        onAuthenticate={handleSocialAuth}
      />

      {/* Modal kiểm tra dữ liệu Firebase */}
      <FirebaseDataModal
        visible={firebaseModalVisible}
        onClose={() => setFirebaseModalVisible(false)}
        onRefreshStore={initApp}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primaryDark,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 36,
    paddingBottom: 40,
    alignItems: 'center',
  },
  heroHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoBadge: {
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  univName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#BAE6FD',
    letterSpacing: 0.8,
    textAlign: 'center',
    marginBottom: 6,
  },
  appTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  appSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
    textAlign: 'center',
  },
  authCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      },
      web: {
        boxShadow: '0 12px 30px rgba(0, 0, 0, 0.25)',
      },
    }),
  },
  socialAuthContainer: {
    marginBottom: 16,
    gap: 8,
  },
  socialHeaderTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  socialBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  googleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    ...Platform.select({
      web: { boxShadow: '0 1px 3px rgba(0,0,0,0.06)' },
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
      android: { elevation: 1 },
    }),
  },
  googleBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
  },
  facebookBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1877F2',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  facebookBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  socialIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  firebaseBadgeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  firebaseBadgeInfoText: {
    fontSize: 11,
    color: '#92400E',
    fontWeight: '600',
    flex: 1,
  },
  tabSelector: {
    flexDirection: 'row',
    backgroundColor: COLORS.tagBg,
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
      },
    }),
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  tabButtonTextActive: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  formBody: {
    gap: 12,
  },
  inputGroup: {
    gap: 5,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.tagBg,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
  },
  input: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textPrimary,
    ...Platform.select({
      web: { outlineStyle: 'none' },
    }),
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingVertical: 13,
    borderRadius: 12,
    marginTop: 4,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.borderLight,
  },
  dividerText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },
  registerPromptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  registerPromptText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  registerPromptLink: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primary,
  },
  viewFirebaseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFBEB',
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    borderRadius: 12,
    padding: 10,
    marginTop: 14,
  },
  viewFirebaseBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
    flex: 1,
    marginLeft: 6,
  },
  guestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  guestBtnText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  footer: {
    marginTop: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    maxWidth: 340,
    lineHeight: 16,
  },
});
