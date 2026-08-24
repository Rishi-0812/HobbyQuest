import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

// Shared photo-selection flow: lets the user choose camera or library,
// both paths go through the same crop step, returns a local URI or null.
export async function pickOrCaptureImage() {
  return new Promise((resolve) => {
    Alert.alert(
      'Add a photo',
      undefined,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(null) },
        { text: 'Choose from Library', onPress: async () => resolve(await fromLibrary()) },
        { text: 'Take Photo', onPress: async () => resolve(await fromCamera()) },
      ]
    );
  });
}

async function fromLibrary() {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    Alert.alert('Permission needed', 'Allow photo access to add an image.');
    return null;
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.7,
    allowsEditing: true,
    aspect: [4, 3],
  });
  return !result.canceled && result.assets?.[0]?.uri ? result.assets[0].uri : null;
}

async function fromCamera() {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    Alert.alert('Permission needed', 'Allow camera access to take a photo.');
    return null;
  }
  const result = await ImagePicker.launchCameraAsync({
    quality: 0.7,
    allowsEditing: true,
    aspect: [4, 3],
  });
  return !result.canceled && result.assets?.[0]?.uri ? result.assets[0].uri : null;
}