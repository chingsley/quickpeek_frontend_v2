import CustomButton from '@/components/shared/CustomButton';
import StarRating from '@/components/StarRating';
import UserAvatar from '@/components/UserAvatar';
import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';
import { useAuthStore } from '@/store/auth.store';
import { useUserStore } from '@/store/user.store';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
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

type Props = {
  showTitle?: boolean;
};

const SettingsPanel = ({ showTitle = true }: Props) => {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);
  const updateAuthUser = useAuthStore((state) => state.updateUser);
  const authUser = useAuthStore((state) => state.user);
  const { profile, loading, fetchProfile, updateProfile, uploadProfileImage: uploadProfileImageAction } =
    useUserStore();

  const [isEditing, setIsEditing] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [locationSharingEnabled, setLocationSharingEnabled] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

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
  const displayEmail = profile?.email || authUser?.email || '';
  const profileImageUrl = profile?.profileImageUrl ?? authUser?.profileImageUrl ?? null;
  const rating = profile?.asResponder?.averageRating ?? authUser?.asResponder?.averageRating ?? 0;
  const questionsAnsweredCount = profile?.asResponder?.reviewsCount ?? authUser?.asResponder?.reviewsCount ?? 0;

  const handlePickProfileImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission needed', 'Allow photo library access to update your profile picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

      if (result.canceled || !result.assets[0]) return;

      setUploadingImage(true);
      const updated = await uploadProfileImageAction(result.assets[0].uri);
      if (updated) {
        updateAuthUser({ profileImageUrl: updated.profileImageUrl ?? null });
        Alert.alert('Updated', 'Your profile picture has been updated.');
      } else {
        Alert.alert('Error', 'Could not update your profile picture.');
      }
    } catch {
      Alert.alert('Error', 'Could not update your profile picture.');
    } finally {
      setUploadingImage(false);
    }
  };

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
      <View style={styles.loaderWrap}>
        <ActivityIndicator size="large" color={colors.PRIMARY} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {showTitle && <Text style={styles.pageTitle}>Settings</Text>}

      <Text style={styles.groupLabel}>Profile</Text>
      <View style={styles.groupCard}>
        <TouchableOpacity style={styles.rowItem} onPress={() => setIsEditing((v) => !v)} activeOpacity={0.8}>
          <View style={styles.rowIconCircle}>
            <Ionicons name="person-outline" size={18} color={colors.PRIMARY} />
          </View>
          <View style={styles.rowTextBlock}>
            <Text style={styles.rowTitle}>Account settings</Text>
            <Text style={styles.rowSubtitle} numberOfLines={1}>
              {displayEmail}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.MEDIUM_GRAY} />
        </TouchableOpacity>

        <View style={styles.rowDivider} />

        <View style={styles.profileSummary}>
          <TouchableOpacity onPress={handlePickProfileImage} disabled={uploadingImage} activeOpacity={0.8}>
            <UserAvatar imageUrl={profileImageUrl} size={56} />
          </TouchableOpacity>
          <View style={styles.profileMeta}>
            <Text style={styles.profileName}>{displayName}</Text>
            <Text style={styles.profileUsername}>@{displayUsername}</Text>
            <View style={styles.ratingRow}>
              <StarRating rating={rating} size={14} />
              <Text style={styles.ratingMeta}>
                {rating > 0 ? `${rating.toFixed(1)} · ${questionsAnsweredCount} reviews` : 'No ratings yet'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {isEditing && (
        <View style={styles.editCard}>
          <Text style={styles.fieldLabel}>Display name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor={colors.MEDIUM_GRAY}
          />
          <Text style={styles.fieldLabel}>Username</Text>
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

      <Text style={styles.groupLabel}>Preferences</Text>
      <View style={styles.groupCard}>
        <View style={styles.toggleRow}>
          <View style={styles.rowIconCircle}>
            <Ionicons name="notifications-outline" size={18} color={colors.PRIMARY} />
          </View>
          <View style={styles.rowTextBlock}>
            <Text style={styles.rowTitle}>Push notifications</Text>
            <Text style={styles.rowSubtitle}>Get notified about requests and messages</Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={handleToggleNotifications}
            trackColor={{ false: colors.LIGHT_GRAY, true: colors.LIGHT_GREEN }}
            thumbColor={notificationsEnabled ? colors.PRIMARY : colors.BG_WHITE}
          />
        </View>

        <View style={styles.rowDivider} />

        <View style={styles.toggleRow}>
          <View style={styles.rowIconCircle}>
            <Ionicons name="location-outline" size={18} color={colors.PRIMARY} />
          </View>
          <View style={styles.rowTextBlock}>
            <Text style={styles.rowTitle}>Location sharing</Text>
            <Text style={styles.rowSubtitle}>Show nearby questions in your feed</Text>
          </View>
          <Switch
            value={locationSharingEnabled}
            onValueChange={handleToggleLocation}
            trackColor={{ false: colors.LIGHT_GRAY, true: colors.LIGHT_GREEN }}
            thumbColor={locationSharingEnabled ? colors.PRIMARY : colors.BG_WHITE}
          />
        </View>
      </View>

      <View style={styles.groupCard}>
        <TouchableOpacity style={styles.signOutRow} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={20} color={colors.TEXT_DARK} />
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default SettingsPanel;

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  loaderWrap: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTitle: {
    fontFamily: 'roboto-bold',
    fontSize: 28,
    color: colors.TEXT_DARK,
    marginBottom: 20,
    textAlign: 'center',
  },
  groupLabel: {
    fontFamily: 'roboto-medium',
    fontSize: fonts.FONT_SIZE_XS,
    color: colors.MEDIUM_GRAY,
    marginBottom: 8,
    marginTop: 4,
  },
  groupCard: {
    backgroundColor: colors.BG_WHITE,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.CARD_BORDER,
    marginBottom: 16,
    overflow: 'hidden',
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  rowIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.LIGHT_GREEN,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTextBlock: {
    flex: 1,
  },
  rowTitle: {
    fontFamily: 'roboto-medium',
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.TEXT_DARK,
  },
  rowSubtitle: {
    fontFamily: 'roboto-light',
    fontSize: fonts.FONT_SIZE_XS,
    color: colors.MEDIUM_GRAY,
    marginTop: 2,
  },
  rowDivider: {
    height: 1,
    backgroundColor: colors.CARD_BORDER,
    marginHorizontal: 16,
  },
  profileSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  profileMeta: {
    flex: 1,
  },
  profileName: {
    fontFamily: 'roboto-bold',
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.TEXT_DARK,
  },
  profileUsername: {
    fontFamily: 'roboto-light',
    fontSize: fonts.FONT_SIZE_XS,
    color: colors.MEDIUM_GRAY,
    marginTop: 2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  ratingMeta: {
    fontFamily: 'roboto-light',
    fontSize: 11,
    color: colors.DARK_GRAY,
  },
  editCard: {
    backgroundColor: colors.CARD_BG,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.CARD_BORDER,
    padding: 16,
    marginBottom: 16,
    gap: 6,
  },
  fieldLabel: {
    fontFamily: 'roboto-medium',
    fontSize: fonts.FONT_SIZE_XS,
    color: colors.MEDIUM_GRAY,
    marginTop: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.LIGHT_GRAY,
    borderRadius: 100,
    padding: 12,
    fontFamily: 'roboto',
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.TEXT_DARK,
    backgroundColor: colors.BG_WHITE,
    marginBottom: 4,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  signOutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  signOutText: {
    fontFamily: 'roboto-medium',
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.TEXT_DARK,
  },
});
