import CustomButton from '@/components/shared/CustomButton';
import StarRating from '@/components/StarRating';
import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';
import { useAuthStore } from '@/store/auth.store';
import { useUserStore } from '@/store/user.store';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const Settings = () => {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);
  const authUser = useAuthStore((state) => state.user);
  const { profile, loading, fetchProfile, updateProfile } = useUserStore();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [locationSharingEnabled, setLocationSharingEnabled] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setUsername(profile.username || '');
      setNotificationsEnabled(profile.notificationsEnabled ?? true);
      setLocationSharingEnabled(profile.locationSharingEnabled ?? true);
    }
  }, [profile]);

  const displayName = profile?.name || authUser?.name || 'User';
  const displayUsername = profile?.username || authUser?.username || '';
  const rating = profile?.rating?.averageRating ?? 0;
  const answersCount = profile?.rating?.answersCount ?? profile?.answersCount ?? 0;

  const handleSaveProfile = async () => {
    const updated = await updateProfile({
      name: name.trim(),
      username: username.trim(),
      notificationsEnabled,
      locationSharingEnabled,
    });
    if (updated) {
      setIsEditing(false);
      Alert.alert('Saved', 'Your profile has been updated.');
    } else {
      Alert.alert('Error', 'Could not update your profile.');
    }
  };

  const handleToggleNotifications = async (value: boolean) => {
    setNotificationsEnabled(value);
    if (!isEditing) {
      await updateProfile({ notificationsEnabled: value });
    }
  };

  const handleToggleLocation = async (value: boolean) => {
    setLocationSharingEnabled(value);
    if (!isEditing) {
      await updateProfile({ locationSharingEnabled: value });
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/signin');
  };

  if (loading && !profile) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ActivityIndicator size="large" color={colors.PRIMARY} style={styles.loader} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Settings</Text>

        <View style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            <Ionicons name="person" size={28} color={colors.PRIMARY} />
          </View>
          <Text style={styles.profileName}>{displayName}</Text>
          <Text style={styles.profileUsername}>@{displayUsername}</Text>
          <View style={styles.ratingRow}>
            <StarRating rating={rating} size={18} />
            <Text style={styles.ratingMeta}>
              {rating > 0 ? `${rating.toFixed(1)} · ${answersCount} answered` : 'No ratings yet'}
            </Text>
          </View>
          <TouchableOpacity style={styles.editLink} onPress={() => setIsEditing((v) => !v)}>
            <Ionicons name="pencil" size={16} color={colors.PRIMARY} />
            <Text style={styles.editLinkText}>{isEditing ? 'Cancel edit' : 'Edit profile'}</Text>
          </TouchableOpacity>
        </View>

        {isEditing && (
          <View style={styles.editCard}>
            <Text style={styles.sectionLabel}>Display name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor={colors.MEDIUM_GRAY}
            />
            <Text style={styles.sectionLabel}>Username</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="username"
              placeholderTextColor={colors.MEDIUM_GRAY}
              autoCapitalize="none"
            />
            <CustomButton text="Save changes" onPress={handleSaveProfile} loading={loading} />
          </View>
        )}

        <View style={styles.sectionHeader}>
          <View style={styles.sectionIconCircle}>
            <Ionicons name="notifications-outline" size={20} color={colors.PRIMARY} />
          </View>
          <Text style={styles.sectionTitle}>Preferences</Text>
        </View>

        <View style={styles.toggleCard}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleTextBlock}>
              <Text style={styles.toggleLabel}>Push notifications</Text>
              <Text style={styles.toggleHint}>Get notified when questions are assigned to you</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleToggleNotifications}
              trackColor={{ false: colors.LIGHT_GRAY, true: colors.LIGHT_GREEN }}
              thumbColor={notificationsEnabled ? colors.PRIMARY : colors.BG_WHITE}
            />
          </View>
          <View style={styles.toggleDivider} />
          <View style={styles.toggleRow}>
            <View style={styles.toggleTextBlock}>
              <Text style={styles.toggleLabel}>Location sharing</Text>
              <Text style={styles.toggleHint}>Share your location so others can find you nearby</Text>
            </View>
            <Switch
              value={locationSharingEnabled}
              onValueChange={handleToggleLocation}
              trackColor={{ false: colors.LIGHT_GRAY, true: colors.LIGHT_GREEN }}
              thumbColor={locationSharingEnabled ? colors.PRIMARY : colors.BG_WHITE}
            />
          </View>
        </View>

        <CustomButton text="Sign out" onPress={handleLogout} style={styles.logoutBtn} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default Settings;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.BG_WHITE,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    paddingBottom: 40,
  },
  loader: {
    marginTop: 80,
  },
  pageTitle: {
    fontFamily: 'roboto-bold',
    fontSize: 28,
    color: colors.TEXT_DARK,
    marginBottom: 24,
  },
  profileCard: {
    alignItems: 'center',
    backgroundColor: colors.BG_WHITE,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.CARD_BORDER,
    paddingVertical: 24,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.LIGHT_GREEN,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  profileName: {
    fontFamily: 'roboto-bold',
    fontSize: fonts.FONT_SIZE_XL,
    color: colors.TEXT_DARK,
  },
  profileUsername: {
    fontFamily: 'roboto-light',
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.MEDIUM_GRAY,
    marginTop: 4,
    marginBottom: 12,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  ratingMeta: {
    fontFamily: 'roboto',
    fontSize: fonts.FONT_SIZE_XS,
    color: colors.DARK_GRAY,
  },
  editLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  editLinkText: {
    fontFamily: 'roboto-medium',
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.PRIMARY,
  },
  editCard: {
    backgroundColor: colors.CARD_BG,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.CARD_BORDER,
    padding: 18,
    marginBottom: 24,
    gap: 8,
  },
  sectionLabel: {
    fontFamily: 'roboto-medium',
    fontSize: fonts.FONT_SIZE_XS,
    color: colors.MEDIUM_GRAY,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.LIGHT_GRAY,
    borderRadius: 10,
    padding: 12,
    fontFamily: 'roboto',
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.TEXT_DARK,
    backgroundColor: colors.BG_WHITE,
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.LIGHT_GREEN,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sectionTitle: {
    fontFamily: 'roboto-medium',
    fontSize: fonts.FONT_SIZE_MEDIUM,
    color: colors.TEXT_DARK,
  },
  toggleCard: {
    backgroundColor: colors.BG_WHITE,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.CARD_BORDER,
    marginBottom: 28,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 18,
    gap: 12,
  },
  toggleTextBlock: {
    flex: 1,
  },
  toggleLabel: {
    fontFamily: 'roboto-bold',
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.TEXT_DARK,
    marginBottom: 4,
  },
  toggleHint: {
    fontFamily: 'roboto-light',
    fontSize: fonts.FONT_SIZE_XS,
    color: colors.MEDIUM_GRAY,
    lineHeight: 18,
  },
  toggleDivider: {
    height: 1,
    backgroundColor: colors.CARD_BORDER,
    marginHorizontal: 18,
  },
  logoutBtn: {
    marginTop: 8,
  },
});
